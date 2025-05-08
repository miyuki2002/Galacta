const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure the data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'galacta.db'));

// Initialize user history table
function initUserTable() {
    // Create user history table if it doesn't exist
    db.prepare(`
        CREATE TABLE IF NOT EXISTS user_history (
            user_id TEXT PRIMARY KEY,
            last_rank TEXT NOT NULL,
            last_message TEXT DEFAULT '',
            last_used_at INTEGER NOT NULL
        )
    `).run();
}

// User history operations
const userHistory = {
    // Save user's last used settings
    save: db.prepare(`
        INSERT OR REPLACE INTO user_history 
        (user_id, last_rank, last_message, last_used_at)
        VALUES (?, ?, ?, ?)
    `),
    
    // Get user's history
    getByUserId: db.prepare(`
        SELECT * FROM user_history WHERE user_id = ?
    `)
};

// Initialize the user history table
initUserTable();

module.exports = userHistory; 