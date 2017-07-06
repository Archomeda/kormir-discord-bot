'use strict';

const MiddlewareError = require('./MiddlewareError');


/**
 * A throttle error.
 */
class ThrottleError extends MiddlewareError {
    /**
     * Creates a new throttle error.
     * @param {DiscordCommandRequest} request - The request.
     * @param {boolean} [showError = false] - Value that indicates whether to show the error to the user or not.
     */
    constructor(request, showError = false) {
        const command = request.getCommand().getId();
        super(`Throttled '${command}' (user: ${request.getMessage().author.tag})`, showError);
        this.name = 'ThrottleError';
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = ThrottleError;
