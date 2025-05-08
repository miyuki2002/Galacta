require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { loadTeamMessages, updateTeamMessage, handleJoinButton, handleRepeatButton } = require('./commands/gal');
const { closeDatabase } = require('./src/database/db');
const initSystem = require('./src/services/initSystem');
const { handleCommand } = require('./src/handlers/commandHandler');
const { setupGuildHandlers } = require('./src/handlers/guildHandler');
const logger = require('./src/utils/logger');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ]
});

// Initialize commands collection
client.commands = new Collection();
client.guildProfiles = new Map();

// Process termination handler
process.on('SIGINT', () => {
    logger.info('SYSTEM', 'Application shutting down...');
    closeDatabase();
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('SYSTEM', 'Application terminating...');
    closeDatabase();
    client.destroy();
    process.exit(0);
});

// Bot ready event
client.once('ready', () => {
    logger.info('SYSTEM', `Logged in as ${client.user.tag}!`);
    
    // Load active team messages from database
    loadTeamMessages();
    
    // Set up guild handlers to deploy commands
    setupGuildHandlers(client);
    
    // Mark initialization as complete
    initSystem.complete('events');
});

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    logger.warn('COMMAND', `The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// Mark commands as loaded
initSystem.complete('commands');

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// Team voice channel updates
client.on('voiceStateUpdate', async (oldState, newState) => {
    if (oldState.channelId !== newState.channelId) {
        if (oldState.channelId) {
            await updateTeamMessage(oldState.channelId, client);
        }
        if (newState.channelId) {
            await updateTeamMessage(newState.channelId, client);
        }
    }
});

// Handle interactions
client.on('interactionCreate', async interaction => {
    // Handle slash commands
    if (interaction.isCommand()) {
        await handleCommand(interaction, client);
    } 
    // Handle buttons
    else if (interaction.isButton()) {
        if (interaction.customId.startsWith('join_voice_')) {
            await handleJoinButton(interaction);
        } else if (interaction.customId.startsWith('repeat_gal_')) {
            await handleRepeatButton(interaction);
        }
    }
});

// Database is ready
initSystem.complete('database');

// Login to Discord
client.login(process.env.TOKEN || process.env.DISCORD_TOKEN);