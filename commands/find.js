const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('find')
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
                    { name: 'One Above All', value: 'ONE ABOVE ALL' }
                ))
        .addStringOption(option =>
            option.setName('msg')
                .setDescription('Your message to potential teammates')
                .setRequired(true)),

    async execute(interaction) {
        // Get the options from the interaction
        const rank = interaction.options.getString('rank');
        const message = interaction.options.getString('msg');

        // Check if user is in a voice channel
        const member = interaction.member;
        if (!member.voice || !member.voice.channel) {
            return interaction.reply({ 
                content: 'You need to be in a voice channel to use this command!', 
                ephemeral: true 
            });
        }

        // Use voice channel ID as team number
        const teamNumber = member.voice.channel.id;
        const teamName = member.voice.channel.name || `TEAM #${teamNumber.slice(-4)}`;

        // Count members in voice channel for slots
        const membersInChannel = member.voice.channel.members.size;
        const maxSlots = 5; // Assuming 5 is the max team size
        const slots = `${membersInChannel}/${maxSlots}`;


        // Get rank thumbnail based on rank
        let rankThumbnail;
        switch(rank) {
            case 'BRONZE':
                rankThumbnail = 'https://example.com/bronze_icon.png';
                break;
            case 'SILVER':
                rankThumbnail = 'https://example.com/silver_icon.png';
                break;
            case 'GOLD':
                rankThumbnail = 'https://example.com/gold_icon.png';
                break;
            case 'PLATINUM':
                rankThumbnail = 'https://example.com/platinum_icon.png';
                break;
            case 'DIAMOND':
                rankThumbnail = 'https://example.com/diamond_icon.png';
                break;
            case 'GRANDMASTER':
                rankThumbnail = 'https://example.com/grandmaster_icon.png';
                break;
            case 'CELESTIAL':
                rankThumbnail = 'https://example.com/celestial_icon.png';
                break;
            case 'ETERNITY':
                rankThumbnail = 'https://example.com/eternity_icon.png';
                break;
            case 'ONE ABOVE ALL':
                rankThumbnail = 'https://example.com/one_above_all_icon.png';
                break;
            default:
                rankThumbnail = 'https://example.com/default_icon.png';
        }

        
        // Create the embed
        const teamEmbed = new EmbedBuilder()
            .setColor(0x00FFFF) // Aqua color - My favorite color
            .setAuthor({ 
                name: interaction.user.username, 
                iconURL: interaction.user.displayAvatarURL() 
            })
            .addFields(
                { name: '> [Room]', value: teamName, inline: true },
                { name: '> [Slot]', value: slots, inline: true },
                { name: '> [Rank]', value: rank, inline: true }
            )
            .setThumbnail(rankThumbnail)
            
            .setFooter({ text: 'Cách sử dụng: /find [rank] [Message]' });

        // Send the embed with a join button and the message
        await interaction.reply({
            content: message,
            embeds: [teamEmbed],
            components: [
                {
                    type: 1, // Action Row
                    components: [
                        {
                            type: 2, // Button
                            style: 2, // Secondary (gray) style
                            label: `Tham Gia: ${teamName}`,
                            custom_id: `join_team_${teamNumber}`,
                            emoji: { name: '🔊' }
                        }
                    ]
                }
            ]
        });

    },
};