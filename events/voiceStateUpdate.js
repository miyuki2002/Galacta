const { Events } = require('discord.js');
const { updateTeamMessage } = require('../commands/gal');
const logger = require('../utils/logger');

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        if (oldState.channelId !== newState.channelId) {
            if (oldState.channelId) {
                await updateTeamMessage(oldState.channelId, oldState.client);
            }
            if (newState.channelId) {
                await updateTeamMessage(newState.channelId, newState.client);
            }
        }
    },
};
