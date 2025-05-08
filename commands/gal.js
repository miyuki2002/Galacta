const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { teamMessages, userHistory } = require('../database/db');

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

function createButtons(voiceChannel, userId) {
    return {
        type: 1,
        components: [
            {
                type: 2,
                style: 1, // Primary button style (blue)
                label: `Tham Gia: ${voiceChannel.name || `TEAM #${voiceChannel.id.slice(-4)}`}`,
                custom_id: `join_voice_${voiceChannel.id}`,
                emoji: { name: '🔊' }
            },
            {
                type: 2,
                style: 3, // Success button style (green)
                label: "Sử dụng lại",
                custom_id: `repeat_gal_${userId}`,
                emoji: { name: '🔄' }
            }
        ]
    };
}

async function handleJoinButton(interaction) {
    const voiceChannelId = interaction.customId.split('_')[2];
    const voiceChannel = interaction.guild.channels.cache.get(voiceChannelId);

    if (!voiceChannel) {
        return interaction.reply({ content: 'Voice channel not found!', ephemeral: true });
    }

    try {
        if (interaction.member.voice.channel === voiceChannel) {
            return interaction.reply({ content: 'You are already in this voice channel!', ephemeral: true });
        }
        await interaction.member.voice.setChannel(voiceChannel);
        await interaction.reply({ content: `Joined ${voiceChannel.name}!`, ephemeral: true });
    } catch (error) {
        console.error('Error moving member to voice channel:', error);
        if (error.code === 50013) {
            await interaction.reply({ 
                content: 'I don\'t have permission to move you to that voice channel.', 
                ephemeral: true 
            });
        } else {
            await interaction.reply({ 
                content: 'Failed to join the voice channel. Please try joining manually.', 
                ephemeral: true 
            });
        }
    }
}

async function handleRepeatButton(interaction) {
    const userId = interaction.customId.split('_')[2];
    
    // Only allow the original user to repeat
    if (interaction.user.id !== userId) {
        return interaction.reply({ 
            content: 'Only the original user can repeat this command.',
            ephemeral: true 
        });
    }
    
    const member = interaction.member;
    if (!member.voice?.channel) {
        return interaction.reply({ 
            content: 'You need to be in a voice channel to repeat this command!', 
            ephemeral: true 
        });
    }
    
    // Get user's last settings
    const userLastSettings = userHistory.getByUserId.get(userId);
    if (!userLastSettings) {
        return interaction.reply({ 
            content: 'No previous settings found. Please use the /gal command first.', 
            ephemeral: true 
        });
    }
    
    const voiceChannel = member.voice.channel;
    const teamEmbed = createTeamEmbed(voiceChannel, userLastSettings.last_rank, interaction.user);
    
    await interaction.reply({ content: 'Repeating your last team message...', ephemeral: true });
    
    const message = await interaction.channel.send({
        content: userLastSettings.last_message,
        embeds: [teamEmbed],
        components: [createButtons(voiceChannel, userId)]
    });
    
    // Save to database
    teamMessages.save.run(
        voiceChannel.id,
        message.id,
        message.channel.id,
        userLastSettings.last_rank,
        userLastSettings.last_message,
        userId,
        Date.now()
    );
}

async function updateTeamMessage(voiceChannelId, client) {
    const teamMessage = teamMessages.getByVoiceChannel.get(voiceChannelId);
    if (!teamMessage) return;

    try {
        const channel = await client.channels.fetch(teamMessage.channel_id);
        const message = await channel.messages.fetch(teamMessage.message_id);
        const voiceChannel = await client.channels.fetch(voiceChannelId);
        const user = await client.users.fetch(teamMessage.user_id);

        const updatedEmbed = createTeamEmbed(voiceChannel, teamMessage.rank, user);

        await message.edit({
            content: teamMessage.message,
            embeds: [updatedEmbed],
            components: [createButtons(voiceChannel, teamMessage.user_id)]
        });
    } catch (error) {
        console.error('Error updating team message:', error);
        // Remove from database if message no longer exists
        teamMessages.delete.run(voiceChannelId);
    }
}

// Load active team messages from database at startup
function loadTeamMessages() {
    try {
        const messages = teamMessages.getAll.all();
        console.log(`Loaded ${messages.length} active team messages from database`);
        return messages;
    } catch (error) {
        console.error('Error loading team messages:', error);
        return [];
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
                .setRequired(false)),

    async execute(interaction) {
        const rank = interaction.options.getString('rank');
        const message = interaction.options.getString('message') || 'Tìm người chơi'; // Default message if not provided
        const member = interaction.member;
        const userId = interaction.user.id;

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
            components: [createButtons(voiceChannel, userId)],
            fetchReply: true
        });

        // Save to SQLite
        teamMessages.save.run(
            voiceChannel.id,
            reply.id,
            reply.channel.id,
            rank,
            message,
            userId,
            Date.now()
        );
        
        // Save user's last settings
        userHistory.save.run(
            userId,
            rank,
            message,
            Date.now()
        );
    },
    loadTeamMessages,
    updateTeamMessage,
    handleJoinButton,
    handleRepeatButton
};


