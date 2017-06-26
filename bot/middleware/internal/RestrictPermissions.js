'use strict';

const Promise = require('bluebird');

const Middleware = require('../Middleware');
const PermissionError = require('./PermissionError');


/**
 * A middleware that restricts commands by permissions.
 */
class RestrictPermissionsMiddleware extends Middleware {
    /**
     * Creates a new middleware that restricts commands by permissions.
     * @param {Bot} bot - The bot instance.
     * @param {DiscordCommand} command - The Discord command.
     * @param {Object.<string,*>} [options] - Additional options for the middleware.
     */
    constructor(bot, command, options) {
        super(bot, 'restrictPermissions', command, options);

        this._defaultOptions = {
            order: -1000,
            removeDelay: 60
        };
    }

    onCommand(response) {
        const request = response.getRequest();
        const message = request.getMessage();
        if (!this.getCommand().isCommandAllowed(request.getMessage().author)) {
            if (message.deletable) {
                return Promise.resolve(message.delete()).finally(() => {
                    throw new PermissionError(request);
                });
            }
            throw new PermissionError(request);
        }
        return response;
    }

    onReplyPosted(response, message) {
        if (!(response.getError() instanceof PermissionError)) {
            return response;
        }

        const options = this.getOptions();
        if (!options.removeDelay || !message.deletable) {
            return response;
        }

        message.delete(options.removeDelay * 1000);
        return response;
    }
}

module.exports = RestrictPermissionsMiddleware;
