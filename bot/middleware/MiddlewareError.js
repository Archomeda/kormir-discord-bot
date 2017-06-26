'use strict';


/**
 * A middleware error.
 */
class MiddlewareError extends Error {
    /**
     * Creates a new middleware error.
     * @param {string} message - The error message to log.
     * @param {boolean} [showError = true] - Value that indicates whether to show the error to the user or not.
     */
    constructor(message, showError = true) {
        super(message);
        this.name = 'MiddlewareError';
        Error.captureStackTrace(this, this.constructor);
        this.showError = showError;
    }
}

module.exports = MiddlewareError;
