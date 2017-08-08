'use strict';


/**
 * A Discord command error.
 */
class DiscordCommandError extends Error {
    /**
     * Creates a new Discord command error.
     * @param {string} message - The error message.
     */
    constructor(message) {
        super(message);
        this.name = 'DiscordCommandError';
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = DiscordCommandError;
