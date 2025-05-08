const { Events } = require('discord.js');
const { loadTeamMessages } = require('../commands/gal');
const { setupGuildHandlers } = require('../handlers/guildHandler');
const initSystem = require('../services/initSystem');
const logger = require('../utils/logger');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    logger.info('SYSTEM', `Logged in as ${client.user.tag}!`);
    
    // Load active team messages from database
    loadTeamMessages();
    
    // Set up guild handlers to deploy commands
    setupGuildHandlers(client);
    
    // Mark initialization as complete
    initSystem.complete('events');
    
    logger.info('SYSTEM', 'Bot is fully ready and operational');
  },
};