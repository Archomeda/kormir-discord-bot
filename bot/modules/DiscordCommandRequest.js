'use strict';


/**
 * A Discord command request.
 */
class DiscordCommandRequest {
    /**
     * Creates a new Discord command request.
     * @param {Bot} bot - The bot instance.
     * @param {Message} message - The Discord message.
     * @param {DiscordCommandRoute} route - The command route.
     * @param {Object} parameters - The command parameters.
     */
    constructor(bot, message, route, parameters) {
        this._bot = bot;
        this._message = message;
        this._route = route;
        this._parameters = parameters;
    }

    /**
     * Gets the bot instance.
     * @returns {Bot}
     */
    getBot() {
        return this._bot;
    }

    /**
     * Gets the original Discord message.
     * @returns {Message} The Discord message.
     */
    getMessage() {
        return this._message;
    }

    /**
     * Gets the command.
     * @returns {DiscordCommandRoute} The command route.
     */
    getRoute() {
        return this._route;
    }

    /**
     * Gets the command parameters.
     * @returns {Object} The parameters.
     */
    getParameters() {
        return this._parameters;
    }
}

module.exports = DiscordCommandRequest;
