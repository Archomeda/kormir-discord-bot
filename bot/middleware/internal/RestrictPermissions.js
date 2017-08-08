'use strict';

const { deleteIgnoreErrors } = require('../../utils/DiscordMessage');

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
     * @param {Object<string, *>} [options] - Additional options for the middleware.
     */
    constructor(bot, command, options) {
        super(bot, 'restrictPermissions', command, options);

        this._defaultOptions = {
            order: -1000,
            removeDelay: 60
        };
    }

    async onCommand(response) {
        const request = response.getRequest();
        const message = request.getMessage();
        if (!this.getCommand().isCommandAllowed(message.member || message.author)) {
            await deleteIgnoreErrors(message);
            throw new PermissionError(request);
        }
        return response;
    }

    async onReplyPosted(response, message) {
        if (!(response.getError() instanceof PermissionError)) {
            return response;
        }

        const options = this.getOptions();
        if (!options.removeDelay) {
            return response;
        }

        await deleteIgnoreErrors(message, options.removeDelay * 1000);
        return response;
    }
}

module.exports = RestrictPermissionsMiddleware;
