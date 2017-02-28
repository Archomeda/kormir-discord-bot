'use strict';

const MiddlewareError = require('./MiddlewareError');

class ThrottleError extends MiddlewareError {
    constructor(message, logger) {
        super(message, logger, undefined);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
    }
}

module.exports = ThrottleError;
