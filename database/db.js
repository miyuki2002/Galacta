const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const teamMessages = require('./teamRepository');
const userHistory = require('./userRepository');

// Ensure the data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'galacta.db'));

// Set database pragmas for optimization
function initDatabase() {
    db.pragma('journal_mode = WAL');
    console.log('Database initialized successfully');
}

// Close database connection gracefully
function closeDatabase() {
    try {
        db.close();
        console.log('Database connection closed successfully');
        return true;
    } catch (error) {
        console.error('Error closing database connection:', error);
        return false;
    }
}

// Initialize the database
initDatabase();

module.exports = {
    teamMessages,
    userHistory,
    db,
    closeDatabase
}; 