'use strict';

/**
 * The base database provider.
 */
class BaseDatabase {
    /**
     * Creates a base database provider.
     * @param {ConfigItem} [config] - Additional config for the database provider.
     */
    constructor(config) {
        this._config = config || {};
    }

    /**
     * Gets the config.
     * @returns {ConfigItem} The config.
     */
    getConfig() {
        return this._config;
    }

    /**
     * Connects to the database provider backend.
     * @returns {Promise} The promise.
     */
    connect() {
        throw new TypeError('Derivative should implement connect');
    }

    /**
     * Disconnects from the database provider backend.
     * @returns {Promise} The promise.
     */
    disconnect() {
        throw new TypeError('Derivative should implement disconnect');
    }
}

module.exports = BaseDatabase;
