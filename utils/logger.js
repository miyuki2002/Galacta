/**
 * Simple logger utility for Galacta bot
 * Logs messages with timestamps and categories
 */

// ANSI color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m'
};

// Log levels
const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

// Current log level (can be changed at runtime)
let currentLogLevel = LOG_LEVELS.DEBUG;

/**
 * Set the current log level
 * @param {string} level - The log level to set (DEBUG, INFO, WARN, ERROR)
 */
function setLogLevel(level) {
    if (LOG_LEVELS[level] !== undefined) {
        currentLogLevel = LOG_LEVELS[level];
        console.log(`${colors.cyan}[LOGGER]${colors.reset} Log level set to ${colors.bright}${level}${colors.reset}`);
    } else {
        console.log(`${colors.red}[LOGGER]${colors.reset} Invalid log level: ${level}`);
    }
}

/**
 * Format timestamp for logs
 * @returns {string} Formatted timestamp
 */
function getTimestamp() {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Debug log - for detailed troubleshooting information
 * @param {string} category - The log category
 * @param {string} message - The log message
 * @param {*} data - Optional data to log
 */
function debug(category, message, data) {
    if (currentLogLevel <= LOG_LEVELS.DEBUG) {
        console.log(`${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.cyan}[${category}]${colors.reset} ${message}`);
        if (data) console.log(data);
    }
}

/**
 * Info log - for general operational information
 * @param {string} category - The log category
 * @param {string} message - The log message
 * @param {*} data - Optional data to log
 */
function info(category, message, data) {
    if (currentLogLevel <= LOG_LEVELS.INFO) {
        console.log(`${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.green}[${category}]${colors.reset} ${message}`);
        if (data) console.log(data);
    }
}

/**
 * Warning log - for potential issues that don't prevent operation
 * @param {string} category - The log category
 * @param {string} message - The log message
 * @param {*} data - Optional data to log
 */
function warn(category, message, data) {
    if (currentLogLevel <= LOG_LEVELS.WARN) {
        console.log(`${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.yellow}[${category}]${colors.reset} ${message}`);
        if (data) console.log(data);
    }
}

/**
 * Error log - for errors that prevent normal operation
 * @param {string} category - The log category
 * @param {string} message - The log message
 * @param {*} error - Optional error object or data to log
 */
function error(category, message, error) {
    if (currentLogLevel <= LOG_LEVELS.ERROR) {
        console.log(`${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.red}[${category}]${colors.reset} ${message}`);
        if (error) {
            if (error instanceof Error) {
                console.error(`${colors.red}${error.stack || error}${colors.reset}`);
            } else {
                console.error(error);
            }
        }
    }
}

module.exports = {
    debug,
    info,
    warn,
    error,
    setLogLevel,
    LOG_LEVELS
}; 