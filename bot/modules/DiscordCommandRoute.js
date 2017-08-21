'use strict';

const stringArgv = require('string-argv');
const minimist = require('minimist');

const { addLazyProperty } = require('../utils/LazyProperty');

const DiscordCommandParameter = require('./DiscordCommandParameter');


/**
 * A Discord command route.
 */
class DiscordCommandRoute {
    /**
     * Creates a new Discord command route.
     * @param {Bot} bot - The bot instance.
     * @param {DiscordCommand} command - The command.
     * @param {string} route - The route.
     * @param {Object|undefined} [context = undefined] - The route context.
     */
    constructor(bot, command, route, context) {
        this._bot = bot;
        this._command = command;
        this._route = route;
        this._context = context;

        addLazyProperty(this, '_definedParameters', () => {
            const parameters = this.getRoute().match(/:\S+/g);
            return parameters ? parameters.map(p => new DiscordCommandParameter(bot, p, context)) : [];
        });
    }


    /**
     * Gets the bot instance.
     * @returns {Bot} The bot instance.
     */
    getBot() {
        return this._bot;
    }

    /**
     * Gets the command.
     * @returns {DiscordCommand} The command.
     */
    getCommand() {
        return this._command;
    }

    /**
     * Gets the raw route.
     * @returns {string} The raw route.
     */
    getRoute() {
        return this._route;
    }

    /**
     * Gets the route context.
     * @returns {Object} The route context.
     */
    getContext() {
        return typeof this._context === 'function' ? this._context() : this._context;
    }

    /**
     * Gets the used invocation prefixes.
     * @returns {string[]} The invocation prefixes.
     */
    getInvocationPrefixes() {
        const prefix = this.getBot().getConfig().get('/discord.commands.prefix');
        return prefix ? [prefix] : [];
    }

    /**
     * Gets the invocation string without the prefix.
     * @returns {string} The stripped invocation string.
     */
    getStrippedInvocation() {
        return this.getRoute().replace(/:.*/g, '').trim();
    }

    /**
     * Gets the invocation string.
     * @returns {string} The invocation string.
     */
    getInvocation() {
        return `${this.getInvocationPrefixes()[0]}${this.getStrippedInvocation()}`;
    }

    /**
     * Gets the defined parameters.
     * @returns {DiscordCommandParameter[]} The defined parameters.
     */
    getParameters() {
        return this._definedParameters;
    }

    /**
     * Parses the parameters of a message.
     * @param {Message} message - The Discord message.
     * @param {string} invocation - The invocation string.
     * @returns {Object} The parameters, indexed by id.
     */
    parseParameters(message, invocation) {
        const defined = this.getParameters();
        if (!defined) {
            return {};
        }

        const routeInvocation = this.getStrippedInvocation().toLowerCase();
        if (!invocation.toLowerCase().startsWith(routeInvocation)) {
            return {};
        }

        const definedParameters = this.getParameters();
        const rawParameters = invocation.substr(routeInvocation.length).trim();
        const parameters = minimist(stringArgv(rawParameters), { strings: true });
        for (let i = 0, j = 0; i < definedParameters.length; i++) {
            // If the parameter is already defined as an explicit argument, skip it
            const parameter = definedParameters[i];
            const parameterId = parameter.getId();
            if (!parameters[parameterId]) {
                let param;
                if (i < definedParameters.length - 1) {
                    param = parameter.parse(message, parameters._[j]);
                } else {
                    // Last parameter, combine all remaining characters
                    param = parameter.parse(message, parameters._.slice(j).join(' '));
                }
                if (param) {
                    parameters[parameterId] = param;
                }
                j++;
            } else {
                parameters[parameterId] = parameter.parse(message, parameters[parameterId]);
            }
        }

        return parameters;
    }
}

module.exports = DiscordCommandRoute;
