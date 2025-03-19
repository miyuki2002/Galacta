const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// Cache for rank thumbnails
const rankThumbnails = {
    'BRONZE': 'https://i.imgur.com/ubB6IuL.png',
    'SILVER': 'https://i.imgur.com/YVsXLXC.png',
    'GOLD': 'https://i.imgur.com/pE989Hf.png',
    'PLATINUM': 'https://i.imgur.com/7rOqQ2b.png',
    'DIAMOND': 'https://i.imgur.com/wh6EnSq.png',
    'GRANDMASTER': 'https://i.imgur.com/heig93V.png',
    'CELESTIAL': 'https://i.imgur.com/P3K40ug.png',
    'ETERNITY': 'https://i.imgur.com/9deeyEX.png',
    'ONE ABOVE ALL': 'https://i.imgur.com/fpub71E.png',
    'NORMAL': 'https://i.imgur.com/wIz6lNc.png'
};

// Store active team messages
const activeTeamMessages = new Map();

function createTeamEmbed(voiceChannel, rank, user) {
    const teamName = voiceChannel.name || `TEAM #${voiceChannel.id.slice(-4)}`;
    const membersInChannel = voiceChannel.members.size;
    const maxSlots = voiceChannel.userLimit || '∞';
    const slots = `${membersInChannel}/${maxSlots}`;

    return new EmbedBuilder()
        .setColor(0x00FFFF)
        .setAuthor({ 
            name: user.username, 
            iconURL: user.displayAvatarURL() 
        })
        .addFields(
            { name: '> [Room]', value: `> ${teamName}`, inline: true },
            { name: '> [Slot]', value: `> ${slots}`, inline: true },
            { name: '> [Rank]', value: `> ${rank}`, inline: true }
        )
        .setThumbnail(rankThumbnails[rank] || rankThumbnails['NORMAL'])
        .setFooter({ text: 'Cách sử dụng: /gal [rank] [Message]' });
}

function createJoinButton(voiceChannel) {
    return {
        type: 1,
        components: [
            {
                type: 2,
                style: 2,
                label: `Tham Gia: ${voiceChannel.name || `TEAM #${voiceChannel.id.slice(-4)}`}`,
                custom_id: `join_team_${voiceChannel.id}`,
                emoji: { name: '🔊' }
            }
        ]
    };
}

async function updateTeamMessage(voiceChannelId, client) {
    const teamMessage = activeTeamMessages.get(voiceChannelId);
    if (!teamMessage) return;

    try {
        const channel = await client.channels.fetch(teamMessage.channelId);
        const message = await channel.messages.fetch(teamMessage.messageId);
        const voiceChannel = await client.channels.fetch(voiceChannelId);
        const user = await client.users.fetch(teamMessage.userId);

        const updatedEmbed = createTeamEmbed(voiceChannel, teamMessage.rank, user);

        await message.edit({
            content: teamMessage.message,
            embeds: [updatedEmbed],
            components: [createJoinButton(voiceChannel)]
        });
    } catch (error) {
        console.error('Error updating team message:', error);
        activeTeamMessages.delete(voiceChannelId);
    }
}
module.exports = {
    data: new SlashCommandBuilder()
        .setName('gal')
        .setDescription('Create a team finding request')
        .addStringOption(option =>
            option.setName('rank')
                .setDescription('Your current rank')
                .setRequired(true)
                .addChoices(
                    { name: 'Bronze', value: 'BRONZE' },
                    { name: 'Silver', value: 'SILVER' },
                    { name: 'Gold', value: 'GOLD' },
                    { name: 'Platinum', value: 'PLATINUM' },
                    { name: 'Diamond', value: 'DIAMOND' },
                    { name: 'Grandmaster', value: 'GRANDMASTER' },
                    { name: 'Celestial', value: 'CELESTIAL' },
                    { name: 'Eternity', value: 'ETERNITY' },
                    { name: 'One Above All', value: 'ONE ABOVE ALL' },
                    { name: 'Normal', value: 'NORMAL' },
                ))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Your message to potential teammates')
                .setRequired(true)),

    async execute(interaction) {
        const rank = interaction.options.getString('rank');
        const message = interaction.options.getString('message');
        const member = interaction.member;

        if (!member.voice?.channel) {
            return interaction.reply({ 
                content: 'You need to be in a voice channel to use this command!', 
                ephemeral: true 
            });
        }

        const voiceChannel = member.voice.channel;
        const teamEmbed = createTeamEmbed(voiceChannel, rank, interaction.user);

        const reply = await interaction.reply({
            content: message,
            embeds: [teamEmbed],
            components: [createJoinButton(voiceChannel)],
            fetchReply: true
        });

        // Store the message details for updating
        activeTeamMessages.set(voiceChannel.id, {
            messageId: reply.id,
            channelId: reply.channel.id,
            rank: rank,
            message: message,
            userId: interaction.user.id
        });
    },
    activeTeamMessages,
    updateTeamMessage
};

