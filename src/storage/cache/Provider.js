'use strict';

/**
 * The base provider for caching.
 */
class Provider {
    /**
     * Constructs the cache provider.
     */
    constructor() {
        if (new.target === Provider) {
            throw new TypeError('Cannot construct Provider instances directly');
        }
    }

    /**
     * Connects to the cache provider back-end.
     */
    connect() {
        throw new TypeError('Derivative should implement connect');
    }

    /**
     * Disconnects from the cache provider back-end.
     */
    disconnect() {
        throw new TypeError('Derivative should implement disconnect');
    }

    /**
     * Gets a value that's stored in the cache.
     * @param {string} table - The table.
     * @param {string} id - The id.
     * @return {*} The value.
     */
    get(table, id) {
        throw new TypeError('Derivative should implement get');
    }

    /**
     * Sets a value to store in the cache.
     * @param {string} table - The table.
     * @param {string} id - The id.
     * @param {number} ttl - The time-to-live in seconds.
     * @param {*} value - The value.
     * @return {boolean} True if successful, false otherwise.
     */
    set(table, id, ttl, value) {
        throw new TypeError('"Derivative should implement set');
    }

    /**
     * Removes an item from the cache, if it exists.
     * @param {string} table - The table.
     * @param {string} id - The id.
     * @return {boolean} True if successfully removed or the item didn't exist, false otherwise.
     */
    remove(table, id) {
        throw new TypeError('Derivative should implement remove');
    }

    /**
     * Gets a cached value if it exists, otherwise renews it by calling renewer.
     * @param {string} table - The table.
     * @param {string} id - The id.
     * @param {number} ttl - The Time-to-Live in seconds.
     * @param {function} renewer - The renewer function that gets called when the cache has expired.
     * @return {boolean} The value.
     */
    cache(table, id, ttl, renewer) {
        return this.get(table, id)
            .then(value => {
                if (value) {
                    return value;
                }
                return this.set(table, id, ttl, renewer());
            });
    }
}

module.exports = Provider;
