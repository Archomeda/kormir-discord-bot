'use strict';


/**
 * A throttle error.
 */
class BotError extends Error {
    /**
     * Creates a new bot error.
     * @param {number} errno - The process error number.
     * @param {string} message - The error message.
     * @param {Error} [base] - The base error.
     */
    constructor(errno, message, base) {
        super(message);
        this.name = 'BotError';
        Error.captureStackTrace(this, this.constructor);
        this.errno = errno;
        if (base) {
            this.stack = base.stack;
        }
    }
}

module.exports = BotError;
