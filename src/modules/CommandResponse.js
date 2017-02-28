'use strict';

const Promise = require('bluebird');


/**
 * Represents a command response.
 */
class CommandResponse {
    /**
     * Constructs a new CommandResponse.
     * @param {CommandRequest} request - The original request.
     */
    constructor(request) {
        this._request = request;

        this.targetChannel = request.message.channel;
        this.targetUsers = [request.message.author];

        this.error = undefined;
        this.replyText = undefined;
    }

    /**
     * Gets the associated request.
     * @return {CommandRequest} The request.
     */
    get request() {
        return this._request;
    }

    /**
     * Calls the command.
     * @return {string|Promise.<string>} The command result.
     */
    callCommand() {
        return this.request.command.onCommand(this);
    }

    /**
     * Calls all middleware on command request.
     * @return {Promise.<CommandResponse>}
     */
    callMiddlewareOnCommand() {
        return this._callMiddleware('onCommand');
    }

    /**
     * Calls all middleware upon command response.
     * @return {Promise.<CommandResponse>}
     */
    callMiddlewareOnResponse() {
        return this._callMiddleware('onResponse');
    }

    /**
     * Calls all middleware after sending the reply.
     * @param {Message} message - The reply message.
     * @return {Promise.<CommandResponse>}
     */
    callMiddlewareOnReply(message) {
        return this._callMiddleware('onReply', message);
    }

    /**
     * Calls all middleware with a specific function name.
     * @param {string} funcName - The function name.
     * @param {*} params - The additional parameters to send.
     * @return {Promise.<CommandResponse>} The promise with this CommandResponse.
     * @private
     */
    _callMiddleware(funcName, ...params) {
        let responsePromise = Promise.resolve(this);
        if (this.request.command.allMiddleware.length === 0) {
            return responsePromise;
        }

        for (let middleware of this.request.command.allMiddleware) {
            responsePromise = responsePromise.then(response => Promise.try(() => middleware[funcName](response, ...params)).catch(err => {
                // Capture error
                if (!response.error) {
                    response.error = err;
                }
                if (err.logger) {
                    console[err.logger](`Middleware threw ${err.name} in ${funcName}: ${err.message}`);
                }
                return response;
            }));
        }
        return responsePromise;
    }
}

module.exports = CommandResponse;
