const { Events } = require('discord.js');
const { handleCommand } = require('../handlers/commandHandler');
const { handleJoinButton, handleRepeatButton } = require('../commands/gal');
const logger = require('../utils/logger');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // Handle slash commands
    if (interaction.isCommand()) {
      await handleCommand(interaction, interaction.client);
    } 
    // Handle buttons
    else if (interaction.isButton()) {
      if (interaction.customId.startsWith('join_voice_')) {
        await handleJoinButton(interaction);
      } else if (interaction.customId.startsWith('repeat_gal_')) {
        await handleRepeatButton(interaction);
      }
    }
  },
};