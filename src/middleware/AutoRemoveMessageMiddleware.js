'use strict';

const ensureArray = require('../utils/array').ensureArray;
const Middleware = require('./Middleware');


class AutoRemoveMessageMiddleware extends Middleware {
    constructor(options) {
        super(options);
        this.order = 1000;
        const defaultOptions = {
            disallowed_request: false,
            disallowed_response: false,
            errored_request: false,
            errored_response: false,
            request: false,
            response: false,
            types: ['text']
        };
        this.options = Object.assign({}, defaultOptions, options);
        this.options.types = ensureArray(this.options.types);
    }

    onCommand(response) {
        const request = response.request;
        if (!this.options.types.includes(request.message.channel.type)) {
            // Not correct channel type
            return response;
        }

        if (request.message.deletable) {
            if (response.error) {
                if (this.isDisallowedError(response.error) && this.options.disallowed_request !== false) {
                    request.message.delete(this.options.disallowed_request * 1000);
                } else if (this.options.errored_request !== false) {
                    request.message.delete(this.options.errored_request * 1000);
                }
            } else if (this.options.request !== false) {
                request.message.delete(this.options.request * 1000);
            }
        }

        return response;
    }

    onReply(response, message) {
        if (!this.options.types.includes(response.request.message.channel.type)) {
            // Not correct channel type
            return response;
        }

        if (message.deletable) {
            if (response.error) {
                if (this.isDisallowedError(response.error) && this.options.disallowed_response !== false) {
                    message.delete(this.options.disallowed_response * 1000);
                } else if (this.options.errored_response !== false) {
                    message.delete(this.options.errored_response * 1000);
                }
            } else if (this.options.response !== false) {
                message.delete(this.options.response * 1000);
            }
        }

        return response;
    }

    isDisallowedError(error) {
        switch (error.name) {
            case 'PermissionError':
            case 'ThrottleError':
                return true;
            default:
                return false;
        }
    }
}

module.exports = AutoRemoveMessageMiddleware;
