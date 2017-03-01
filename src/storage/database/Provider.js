'use strict';

/**
 * The base databsae provider.
 */
class DatabaseProvider {
    /**
     * Constructs the cache provider.
     */
    constructor() {
        if (new.target === DatabaseProvider) {
            throw new TypeError('Cannot construct DatabaseProvider instances directly');
        }
    }

    /**
     * Connects to the database provider back-end.
     */
    connect() {
        throw new TypeError('Derivative should implement connect');
    }

    /**
     * Disconnects from the database provider back-end.
     */
    disconnect() {
        throw new TypeError('Derivative should implement disconnect');
    }

    /**
     * Gets the Guild Wars 2 account table model.
     * @return The table.
     */
    get Gw2Account() {
        throw new TypeError('Derivative should implement Gw2Account');
    }

    /**
     * Gets the events table model.
     * @return The table.
     */
    get Event() {
        throw new TypeError('Derivative should implement Event');
    }
}

module.exports = DatabaseProvider;
