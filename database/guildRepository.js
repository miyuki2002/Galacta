const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// Ensure the data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'galacta.db'));

// Initialize guild table
function initGuildTable() {
    // Create guilds table if it doesn't exist
    db.prepare(`
        CREATE TABLE IF NOT EXISTS guilds (
            guild_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            member_count INTEGER NOT NULL,
            owner_id TEXT NOT NULL,
            icon TEXT,
            joined_at INTEGER NOT NULL,
            settings TEXT NOT NULL,
            xp_settings TEXT NOT NULL
        )
    `).run();
    
    logger.info('GUILD', 'Guild database table initialized');
}

// Guild operations
const guildRepository = {
    // Save or update a guild
    save: db.prepare(`
        INSERT OR REPLACE INTO guilds 
        (guild_id, name, member_count, owner_id, icon, joined_at, settings, xp_settings)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `),
    
    // Get a guild by ID
    getById: db.prepare(`
        SELECT * FROM guilds WHERE guild_id = ?
    `),
    
    // Delete a guild
    delete: db.prepare(`
        DELETE FROM guilds WHERE guild_id = ?
    `),
    
    // Get all guilds
    getAll: db.prepare(`
        SELECT * FROM guilds
    `),
    
    // Update guild settings
    updateSettings: db.prepare(`
        UPDATE guilds SET settings = ? WHERE guild_id = ?
    `)
};

// Initialize the guild table
initGuildTable();

module.exports = guildRepository; 