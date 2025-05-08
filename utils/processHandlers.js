const { closeDatabase } = require('../database/db');
const logger = require('./logger');

/**
 * Set up process termination handlers
 * @param {Discord.Client} client - The Discord client
 */
function setupProcessHandlers(client) {
    // Process termination handler
    process.on('SIGINT', () => {
        logger.info('SYSTEM', 'Application shutting down...');
        closeDatabase();
        client.destroy();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        logger.info('SYSTEM', 'Application terminating...');
        closeDatabase();
        client.destroy();
        process.exit(0);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (error) => {
        logger.error('SYSTEM', 'Unhandled promise rejection:', error);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        logger.error('SYSTEM', 'Uncaught exception:', error);
        
        // In production, you might want to restart the application
        // or perform other recovery actions here
    });

    logger.info('SYSTEM', 'Process handlers have been set up');
}

module.exports = { setupProcessHandlers };
