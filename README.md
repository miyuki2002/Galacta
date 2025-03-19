# Galacta Discord Bot

Galacta is a Discord bot designed to help manage team-finding requests in voice channels. It allows users to create team requests with their rank and a custom message, and provides an easy way for other users to join these teams.

## Features

- Create team-finding requests with custom ranks and messages
- Automatically update team information when users join or leave voice channels
- Easy-to-use button for joining voice channels
- Rank-based thumbnails for visual appeal

## Commands

- `/gal [rank] [message]`: Create a team-finding request
  - `rank`: Your current rank (Bronze, Silver, Gold, etc.)
  - `message`: Optional custom message for your team request

## Setup

1. Clone this repository
2. Install dependencies: `npm install`
3. Create a `.env` file in the root directory and add your Discord bot token: `TOKEN=your_discord_bot_token_here`
4. Run the bot: `npm start`

## Requirements

- Node.js v16.9.0 or higher
- Discord.js v14

## Permissions

The bot requires the following permissions:
- Read Messages/View Channels
- Send Messages
- Embed Links
- Use External Emojis
- Add Reactions
- Manage Messages
- Connect
- Move Members

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to the Discord.js team for their excellent library

## Support

If you need help or have any questions, please open an issue in this repository.
