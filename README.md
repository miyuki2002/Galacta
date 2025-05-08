# Galacta Bot

## Overview
Galacta is a Discord.js bot with SQLite storage for guild data and automatic command deployment.

## Features
- SQLite database storage for persistent data
- Automatic slash command deployment to guilds
- Team finding system with voice channel integration
- History tracking for command reuse

## Installation
1. Clone the repository
2. Install dependencies
```bash
npm install
```
3. Create a .env file with your bot token
```
TOKEN=your_discord_token_here
CLIENT_ID=your_client_id_here
```
4. Start the bot
```bash
npm start
```

## Command Structure
Commands are automatically loaded from the `commands` directory. Each command file should follow this structure:

```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('commandname')
    .setDescription('Command description'),
  
  async execute(interaction) {
    // Command logic here
  }
};
```

## Database System
The bot uses SQLite for storage, with database files located in the `data` directory. The database system includes:

- Team message tracking
- User history
- Guild settings and configuration

## Guild Handler
The Guild Handler automatically deploys commands to new guilds when the bot joins. It also:

1. Stores guild information in the database
2. Manages command deployment
3. Provides welcome messages in default channels
4. Tracks guild settings

## Development
To develop new features:

1. Create commands in the `commands` directory
2. Add event handlers in the `events` directory
3. Test locally with a development guild using:
```bash
npm run dev
```

## License
ISC License

## Acknowledgments
Thanks to the Discord.js team for their excellent library

## Support
If you need help or have any questions, please open an issue in this repository.
