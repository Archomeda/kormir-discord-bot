'use strict';

const { addLazyProperty } = require('../utils/LazyProperty');


/**
 * A base middleware.
 */
class Middleware {
    /**
     * Creates a new middleware.
     * @param {Bot} bot - The bot instance.
     * @param {string} id - The module id.
     * @param {DiscordCommand} command - The command.
     * @param {Object.<string,*>} [options] - Additional options for the middleware.
     */
    constructor(bot, id, command, options) {
        this._bot = bot;
        this._id = id;
        this._command = command;

        this._defaultOptions = {};
        this._additionalOptions = options;
        addLazyProperty(this, '_options', () => Object.assign({}, this.getDefaultOptions(), this._additionalOptions));
    }


    /**
     * Gets the bot instance.
     * @returns {Bot}
     */
    getBot() {
        return this._bot;
    }

    /**
     * Gets the middleware id.
     * @returns {string} The middleware id.
     */
    getId() {
        return this._id;
    }

    /**
     * Gets the order for the middleware.
     * @returns {number} The order.
     */
    getOrder() {
        return this.getOptions() ? this.getOptions().order : 0;
    }

    /**
     * Gets the Discord command.
     * @returns {DiscordCommand} The Discord command.
     */
    getCommand() {
        return this._command;
    }

    /**
     * Gets the default options used for the middleware.
     * @returns {Object.<string,*>} The default options mapped as an object.
     */
    getDefaultOptions() {
        return this._defaultOptions;
    }


    /**
     * Gets the options.
     * @returns {Object.<string,*>} The options.
     */
    getOptions() {
        return this._options;
    }

    /**
     * Gets called whenever a command is called.
     * @param {DiscordCommandResponse} response - The command response object.
     * @returns {DiscordCommandResponse|Promise<DiscordCommandResponse>} The command response object, or a promise containing it.
     */
    onCommand(response) {
        return response;
    }

    /**
     * Gets called whenever the command reply has been constructed.
     * @param {DiscordCommandResponse} response - The command response object.
     * @returns {DiscordCommandResponse|Promise<DiscordCommandResponse>} The command response object, or a promise containing it.
     */
    onReplyConstructed(response) {
        return response;
    }

    /**
     * Gets called whenever the command reply has been posted.
     * @param {DiscordCommandResponse} response - The command response object.
     * @param {DiscordReplyMessage} message - The reply message.
     * @returns {DiscordCommandResponse|Promise<DiscordCommandResponse>} The command response object, or a promise containing it.
     */
    onReplyPosted(response, message) { // eslint-disable-line no-unused-vars
        return response;
    }
}

module.exports = Middleware;
