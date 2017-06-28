'use strict';

const { addLazyProperty } = require('../utils/LazyProperty');


/**
 * A Discord command request.
 */
class DiscordCommandRequest {
    /**
     * Creates a new Discord command request.
     * @param {Bot} bot - The bot instance.
     * @param {DiscordCommand} command - The command instance.
     * @param {Message} message - The Discord message.
     */
    constructor(bot, command, message) {
        this._bot = bot;
        this._command = command;
        this._message = message;

        addLazyProperty(this, '_prefixes', () => {
            const prefix = this._bot.getConfig().get('/discord.commands.prefix');
            return prefix ? [prefix] : [];
        });
        addLazyProperty(this, '_parsedMessage', () => {
            const match = this._message.content.match(new RegExp(`^(?:${this.getCommandPrefixes().join('|')})\\s*(\\S*)\\s*([\\s\\S]*)$`, 'i'));
            return match ? [match[1], match[2]] : [];
        });
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
     * Gets the used command prefixes.
     * @returns {string[]} The command prefixes.
     */
    getCommandPrefixes() {
        return this._prefixes;
    }

    /**
     * Gets the command as a string.
     * @returns {string|undefined} The command string; or undefined if it's not a valid command.
     */
    getRawCommand() {
        return this._getParsedMessage()[0];
    }

    /**
     * Gets the command parameters as a string.
     * @returns {string|undefined} The parameters; or undefined if it's not a valid command, and empty if it's valid but there are no parameters.
     */
    getRawParams() {
        return this._getParsedMessage()[1];
    }

    /**
     * Gets the parsed parameters according to the command.
     * @returns {Object} The parsed parameters, indexed by parameter id.
     */
    getParams() {
        if (this._params) {
            return this._params;
        }

        const rawParams = this.getRawParams();
        if (!rawParams) {
            return {};
        }

        const definedParams = this._command.getParameters();

        const params = {};
        const re = /(?:(?!\\)"([^]*?(?:[^\\])*?)"|(?!")([^ ]+))/g;
        for (let i = 0; i < definedParams.length; i++) {
            let paramsMatch;
            do {
                let _paramsMatch = re.exec(rawParams);
                if (!_paramsMatch) {
                    break;
                }
                _paramsMatch = _paramsMatch[1] !== undefined ? _paramsMatch[1] : _paramsMatch[2];
                paramsMatch = paramsMatch ? `${paramsMatch} ${_paramsMatch}` : _paramsMatch;
            } while (definedParams[i].expanded);

            if (paramsMatch !== undefined) {
                // Special cases for special param types
                params[definedParams[i].id] = definedParams[i].parseParam(paramsMatch, this.getMessage());
            } else {
                break;
            }
        }

        this._params = params;
        return this._params;
    }

    _getParsedMessage() {
        return this._parsedMessage;
    }
}

module.exports = DiscordCommandRequest;
