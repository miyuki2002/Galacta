const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { deployCommandsToGuild } = require('./src/handlers/guildHandler');
const logger = require('./src/utils/logger');
require('dotenv').config();

const commands = [];
// Grab all the command files from the commands directory you created earlier
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	if ('data' in command && 'execute' in command) {
		commands.push(command.data.toJSON());
	} else {
		logger.warn('COMMAND', `The command at ${file} is missing a required "data" or "execute" property.`);
	}
}

// Legacy deploy-commands script, now uses the guild handler internally
(async () => {
	try {
		logger.info('DEPLOY', `Started refreshing ${commands.length} application (/) commands.`);

		// Get configuration
		const token = process.env.TOKEN || process.env.DISCORD_TOKEN;
		const clientId = process.env.CLIENT_ID;
		const guildId = process.env.GUILD_ID;

		if (!token) {
			throw new Error('Discord token not found. Set the TOKEN environment variable.');
		}

		if (!clientId) {
			throw new Error('Client ID not found. Set the CLIENT_ID environment variable.');
		}

		// Create and prepare REST instance
		const rest = new REST({ version: '10' }).setToken(token);

		if (guildId) {
			// If guild ID is provided, register commands to a specific guild
			// This is faster for development
			logger.info('DEPLOY', `Deploying commands to guild ID: ${guildId}`);
			
			// Use the guild handler to deploy commands
			const data = await deployCommandsToGuild(guildId, commands);
			
			logger.info('DEPLOY', `Successfully registered ${data.length} application commands for guild.`);
		} else {
			// Otherwise register commands globally
			// This can take up to an hour to propagate
			logger.info('DEPLOY', 'Deploying commands globally');

			const data = await rest.put(
				Routes.applicationCommands(clientId),
				{ body: commands },
			);
			
			logger.info('DEPLOY', `Successfully registered ${data.length} application commands globally.`);
		}
	} catch (error) {
		logger.error('DEPLOY', 'Error during command deployment:', error);
	}
})();