require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { setupProcessHandlers } = require('./utils/processHandlers');
const initSystem = require('./services/initSystem');
const logger = require('./utils/logger');

// Create the client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ]
});

// Initialize collections
client.commands = new Collection();
client.guildProfiles = new Map();

// Set up process event handlers
setupProcessHandlers(client);

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

// Database is ready
initSystem.complete('database');

// Login to Discord
client.login(process.env.TOKEN || process.env.DISCORD_TOKEN)
    .then(() => {
        logger.info('SYSTEM', 'Bot login successful');
    })
    .catch(error => {
        logger.error('SYSTEM', 'Failed to login:', error);
        process.exit(1);
    });