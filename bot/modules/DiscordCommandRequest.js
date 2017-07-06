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
            const prefix = this.getBot().getConfig().get('/discord.commands.prefix');
            return prefix ? [prefix] : [];
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
     * Gets the command.
     * @returns {DiscordCommand} The command.
     */
    getCommand() {
        return this._command;
    }

    /**
     * Checks if the request matches a given command instance.
     * @returns {string|undefined} The route there's a match, undefined otherwise.
     */
    matchesCommand() {
        const message = this.getMessage().content.trim().toLowerCase();
        // Strip away the command prefix if it exists
        const prefix = this.getCommandPrefixes().map(p => message.startsWith(p) ? p : undefined).find(p => p);
        let strippedMessage = message.substr(prefix.length);

        if (strippedMessage) {
            strippedMessage = strippedMessage.toLowerCase();
            // Include an extra space after the command route, to prevent unwanted matches
            const command = this.getCommand().getRoutes().find(r => strippedMessage.startsWith(`${r.toLowerCase()} `) || strippedMessage === r.toLowerCase());
            if (command) {
                const trigger = `${prefix}${command}`;
                const definedParams = this.getCommand().getParameters();

                if (definedParams.length > 0 || (definedParams.length === 0 && message === trigger)) {
                    return `${prefix}${command}`;
                }
            }
        }
        return undefined;
    }

    /**
     * Gets the command parameters as a string.
     * @returns {string|undefined} The parameters, or undefined if there's no match. Can be an empty string if there's a match, but just no parameters.
     */
    getRawParams() {
        const route = this.matchesCommand();
        if (route) {
            return this.getMessage().content.substr(route.length + 1); // Explicit space
        }
        return undefined;
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

        const definedParams = this.getCommand().getParameters();

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
}

module.exports = DiscordCommandRequest;
