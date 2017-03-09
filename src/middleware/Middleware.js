'use strict';


/**
 * A base middleware.
 */
class Middleware {
    constructor(options) {
        if (new.target === Middleware) {
            throw new TypeError('Cannot construct Middleware instances directly');
        }
        this.name = this.constructor.name;
        this.options = Object.assign({}, this.defaultOptions, options);
        this.order = 0;
    }

    /**
     * Gets the default options used for the middleware.
     * @return {Object.<string,*>} The default options mapped as an object.
     */
    get defaultOptions() {
        return {};
    }

    /**
     * Gets called whenever a command is called.
     * @param {CommandResponse} response - The command response object.
     * @return {(CommandResponse|Promise<CommandResponse>)} The command response object.
     */
    onCommand(response) {
        return response;
    }

    /**
     * Gets called whenever the command reply has been constructed.
     * @param {CommandResponse} response - The command response object.
     * @return {(CommandResponse|Promise<CommandResponse>)} The command response object.
     */
    onReplyConstructed(response) {
        return response;
    }

    /**
     * Gets called whenever the command reply has been posted.
     * @param {CommandResponse} response - The command response object.
     * @param {Message} message - The reply message.
     * @return {(CommandResponse|Promise<CommandResponse>)} The command response object.
     */
    onReplyPosted(response, message) {
        return response;
    }
}

module.exports = Middleware;
