'use strict';

/**
 * The base provider for caching.
 */
class BaseCache {
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
     * Connects to the cache provider backend.
     * @returns {Promise} The promise.
     */
    connect() {
        throw new TypeError('Derivative should implement connect');
    }

    /**
     * Disconnects from the cache provider backend.
     * @returns {Promise} The promise.
     */
    disconnect() {
        throw new TypeError('Derivative should implement disconnect');
    }

    /**
     * Determines whether a value has been stored in the cache.
     * @param {string} table - The table.
     * @param {string} id - The id.
     * @returns {Promise.<boolean>} The promise, with true if it exists; or false if it doesn't.
     */
    has(table, id) {
        return this.get(table, id).then(result => Boolean(result));
    }

    /**
     * Gets a value that's stored in the cache.
     * @param {string} table - The table.
     * @param {string} id - The id.
     * @returns {Promise<*>} The promise, with the cached value; or undefined if nothing has been cached.
     */
    get(table, id) { // eslint-disable-line no-unused-vars
        throw new TypeError('Derivative should implement get');
    }

    /**
     * Sets a value to store in the cache.
     * @param {string} table - The table.
     * @param {string} id - The id.
     * @param {number|undefined} ttl - The time-to-live in seconds; or undefined if no ttl.
     * @param {*} value - The value.
     * @returns {Promise<boolean>} The promise, with true if successful; false otherwise.
     */
    set(table, id, ttl, value) { // eslint-disable-line no-unused-vars
        throw new TypeError('Derivative should implement set');
    }

    /**
     * Removes an item from the cache, if it exists.
     * @param {string} table - The table.
     * @param {string} id - The id.
     * @returns {Promise<boolean>} The promise, with true if it has been successfully removed or the item didn't exist; false otherwise.
     */
    remove(table, id) { // eslint-disable-line no-unused-vars
        throw new TypeError('Derivative should implement remove');
    }

    /**
     * Gets a cached value if it exists, otherwise renews it by calling renewer.
     * @param {string} table - The table.
     * @param {string} id - The id.
     * @param {number} ttl - The Time-to-Live in seconds.
     * @param {function()} renewer - The renewer function that gets called when the cache has expired.
     * @returns {Promise<*>} The promise, with the value.
     */
    cache(table, id, ttl, renewer) {
        return this.get(table, id).then(value => {
            if (value) {
                return value;
            }
            value = renewer();
            return this.set(table, id, ttl, value).then(() => value);
        });
    }
}

module.exports = BaseCache;
