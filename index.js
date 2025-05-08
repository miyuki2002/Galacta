require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { loadTeamMessages, updateTeamMessage, handleJoinButton, handleRepeatButton } = require('./commands/gal');
const { closeDatabase } = require('./src/database/db');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ]
});

// Load active team messages from database
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    loadTeamMessages();
});

// Process termination handler
process.on('SIGINT', () => {
    console.log('Application shutting down...');
    closeDatabase();
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Application terminating...');
    closeDatabase();
    client.destroy();
    process.exit(0);
});

client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

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

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
        }
    } else if (interaction.isButton()) {
        if (interaction.customId.startsWith('join_voice_')) {
            await handleJoinButton(interaction);
        } else if (interaction.customId.startsWith('repeat_gal_')) {
            await handleRepeatButton(interaction);
        }
    }
});

// Login to Discord
client.login(process.env.TOKEN);