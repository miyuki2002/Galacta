const { EventEmitter } = require('events');
const logger = require('../utils/logger');

/**
 * Initialization system that manages application startup
 * and ensures dependencies are loaded in the correct order
 */
class InitSystem extends EventEmitter {
    constructor() {
        super();
        this.status = {
            database: false,
            commands: false,
            events: false,
            initialized: false
        };
        
        this.dependencies = new Set();
        logger.info('INIT', 'Initialization system created');
    }
    
    /**
     * Get the current initialization status
     * @returns {Object} The current status
     */
    getStatus() {
        return { ...this.status };
    }
    
    /**
     * Register a dependency as completed
     * @param {string} dependency - The name of the dependency
     */
    complete(dependency) {
        if (this.status[dependency] !== undefined) {
            this.status[dependency] = true;
            logger.info('INIT', `Dependency "${dependency}" initialized`);
            
            // Check if all dependencies are complete
            this.checkReady();
        } else {
            this.dependencies.add(dependency);
            logger.info('INIT', `Custom dependency "${dependency}" initialized`);
            
            // Check if this was the last pending dependency
            this.checkReady();
        }
    }
    
    /**
     * Mark a dependency as pending
     * @param {string} dependency - The name of the dependency
     */
    addDependency(dependency) {
        this.dependencies.add(dependency);
        logger.info('INIT', `Added dependency "${dependency}" to track`);
    }
    
    /**
     * Check if all dependencies are complete and system is ready
     */
    checkReady() {
        // Check core dependencies
        const coreReady = Object.values(this.status).every(value => 
            value === true || typeof value !== 'boolean'
        );
        
        // If custom dependencies exist, make sure they're all completed
        const customDependencies = this.dependencies.size === 0;
        
        if (coreReady && customDependencies && !this.status.initialized) {
            this.status.initialized = true;
            logger.info('INIT', 'Application fully initialized and ready');
            this.emit('ready');
        }
    }
    
    /**
     * Force the system to ready state (use carefully)
     */
    forceReady() {
        Object.keys(this.status).forEach(key => {
            this.status[key] = true;
        });
        
        this.dependencies.clear();
        this.status.initialized = true;
        
        logger.warn('INIT', 'System forced to ready state');
        this.emit('ready');
    }
}

// Export a singleton instance
const initSystem = new InitSystem();
module.exports = initSystem; 