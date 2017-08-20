'use strict';

const { deleteIgnoreErrors } = require('../utils/DiscordMessage');

const Middleware = require('./Middleware');


/**
 * A middleware to automatically remove command messages after a period of time.
 */
class AutoRemoveMessageMiddleware extends Middleware {
    /**
     * Creates a new middleware to automatically remove messages.
     * @param {Bot} bot - The bot instance.
     * @param {DiscordCommand} command - The Discord command.
     * @param {Object<string, *>} [options] - Additional options for the middleware.
     */
    constructor(bot, command, options) {
        super(bot, 'autoRemoveMessage', command, options);

        this._defaultOptions = {
            order: 1000,
            erroredRequest: false,
            erroredResponse: false,
            defaultRequest: false,
            defaultResponse: false,
            types: ['text']
        };
    }

    async onCommand(response) {
        const request = response.getRequest();
        const message = request.getMessage();
        const options = this.getOptions();

        if (!options.types.includes(message.channel.type)) {
            // Not correct channel type, skip
            return response;
        }

        if (message.deletable) {
            const error = response.getError();
            if (error && options.erroredRequest !== false) {
                await deleteIgnoreErrors(message, options.erroredRequest * 1000);
            } else if (options.defaultRequest !== false) {
                await deleteIgnoreErrors(message, options.defaultRequest * 1000);
            }
        }

        return response;
    }

    async onReplyPosted(response, message) {
        const request = response.getRequest();
        const options = this.getOptions();

        if (!options.types.includes(request.getMessage().channel.type)) {
            // Not correct channel type, skip
            return response;
        }

        if (message.deletable) {
            const error = response.getError();
            if (error && options.erroredResponse !== false) {
                await deleteIgnoreErrors(message, options.erroredResponse * 1000);
            } else if (options.defaultResponse !== false) {
                await deleteIgnoreErrors(message, options.defaultResponse * 1000);
            }
        }

        return response;
    }
}

module.exports = AutoRemoveMessageMiddleware;
