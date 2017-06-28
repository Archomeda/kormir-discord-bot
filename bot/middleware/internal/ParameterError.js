'use strict';

const MiddlewareError = require('../MiddlewareError');


/**
 * A parameter error.
 */
class ParameterError extends MiddlewareError {
    /**
     * Creates a new parameter error.
     * @param {DiscordCommandRequest} request - The request.
     */
    constructor(request) {
        const command = request.getRawCommand();
        super(`Missing required parameters for command '${command}' (user: ${request.getMessage().author.tag})`, request);
        this.name = 'ParameterError';
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = ParameterError;
