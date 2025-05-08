const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure the data directory exists
const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'galacta.db'));

// Initialize team messages table
function initTeamTable() {
    // Create team messages table if it doesn't exist
    db.prepare(`
        CREATE TABLE IF NOT EXISTS team_messages (
            voice_channel_id TEXT PRIMARY KEY,
            message_id TEXT NOT NULL,
            channel_id TEXT NOT NULL,
            rank TEXT NOT NULL,
            message TEXT NOT NULL,
            user_id TEXT NOT NULL,
            created_at INTEGER NOT NULL
        )
    `).run();
}

// Team messages operations
const teamMessages = {
    // Save a new team message
    save: db.prepare(`
        INSERT OR REPLACE INTO team_messages 
        (voice_channel_id, message_id, channel_id, rank, message, user_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `),
    
    // Get a team message by voice channel ID
    getByVoiceChannel: db.prepare(`
        SELECT * FROM team_messages WHERE voice_channel_id = ?
    `),
    
    // Delete a team message
    delete: db.prepare(`
        DELETE FROM team_messages WHERE voice_channel_id = ?
    `),
    
    // Get all active team messages
    getAll: db.prepare(`
        SELECT * FROM team_messages
    `)
};

// Initialize the team messages table
initTeamTable();

module.exports = teamMessages; 