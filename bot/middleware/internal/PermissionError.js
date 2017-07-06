'use strict';

const MiddlewareError = require('../MiddlewareError');


/**
 * A permission error.
 */
class PermissionError extends MiddlewareError {
    /**
     * Creates a new permission error.
     * @param {DiscordCommandRequest} request - The request.
     */
    constructor(request) {
        const command = request.getCommand().getId();
        super(`Missing required permission for command '${command}' (user: ${request.getMessage().author.tag})`, request);
        this.name = 'PermissionError';
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = PermissionError;
