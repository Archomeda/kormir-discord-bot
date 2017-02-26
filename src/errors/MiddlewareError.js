'use strict';

class MiddlewareError extends Error {
    constructor(message, logger, userMessage) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.logger = logger;
        this.userMessage = userMessage;
    }
}

module.exports = MiddlewareError;
