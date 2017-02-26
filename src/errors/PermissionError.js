'use strict';

const
    MiddlewareError = require('./MiddlewareError');

class PermissionError extends MiddlewareError {
    constructor(message, logger, userMessage) {
        super(message, logger, userMessage);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
    }
}

module.exports = PermissionError;
