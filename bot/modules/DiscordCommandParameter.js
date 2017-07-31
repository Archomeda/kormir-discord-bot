'use strict';

const Discord = require('discord.js');

const momentNlp = require('../utils/MomentNlp');


/**
 * A Discord command parameter.
 */
class DiscordCommandParameter {
    /**
     * Creates a new Discord command parameter.
     * @param {Bot} bot - The bot instance.
     * @param {string} parameter - The parameter.
     * @param {Object|undefined} [context = undefined] - The parameter context.
     */
    constructor(bot, parameter, context) {
        this._bot = bot;
        this._parameter = parameter;
        this._context = context;

        const split = parameter.split(':');
        this._optional = split[1].endsWith('?');
        this._id = this._optional ? split[1].substr(0, split[1].length - 1) : split[1];
        if (split.length > 2) {
            this._type = split[2];
        }
    }

    /**
     * Gets the bot instance.
     * @returns {Bot} The bot instance.
     */
    getBot() {
        return this._bot;
    }

    /**
     * Gets the raw parameter.
     * @returns {string} The raw parameter.
     */
    getRawParameter() {
        return this._parameter;
    }

    /**
     * Gets the parameter context.
     * @returns {Object} The parameter context.
     */
    getContext() {
        return typeof this._context === 'function' ? this._context() : this._context;
    }


    /**
     * Gets the parameter id.
     * @returns {string} The parameter id.
     */
    getId() {
        return this._id;
    }

    /**
     * Gets the parameter type.
     * @returns {string|undefined} The parameter type if defined.
     */
    getType() {
        return this._type;
    }

    /**
     * Gets whether the parameter is optional or not.
     * @returns {boolean} True if the parameter is optional, false otherwise.
     */
    isOptional() {
        return this._optional;
    }


    /**
     * Parses a parameter.
     * @param {Message} message - The Discord message.
     * @param {string} parameter - The parameter string.
     * @returns {*} The parsed parameter.
     */
    parse(message, parameter) {
        if (!parameter) {
            return;
        }

        const client = this.getBot().getClient();

        switch (this.getType()) {
            case 'date':
                return momentNlp(parameter);

            case 'channels': {
                const channels = client.channels;
                return parameter.match(/\d+|<#\d+>|[a-zA-Z0-9-_]+/g).map(m => {
                    const match = m.match(/(\d+)|<#(\d+)>|([a-zA-Z0-9-_]+)/);
                    if (match[1] || match[2]) {
                        return channels.get(match[1] || match[2]);
                    } else if (match[3]) {
                        return channels.find('name', match[3]);
                    }
                    return undefined;
                }).filter(m => m);
            }

            case 'mentions': {
                const users = client.users;
                const roles = client.guilds.map(g => g.roles).reduce((a, b) => a.concat(b), new Discord.Collection());

                const usersMatch = parameter.match(/\d+|<@\d+>|<@!\d+>|\s*[^#]+#\d{4}/g);
                const rolesMatch = parameter.match(/\d+|<@&\d+>|\s*.+/g);
                const result = {
                    users: [],
                    roles: []
                };

                if (usersMatch) {
                    result.users = parameter.match(/\d+|<@\d+>|<@!\d+>|\s*[^#]+#\d{4}/g).map(m => {
                        const match = m.match(/(\d+)|<@(\d+)>|<@!(\d+)>|\s*([^#]+#\d{4})/);
                        if (match[1] || match[2] || match[3]) {
                            return users.get(match[1] || match[2] || match[3]);
                        } else if (match[4]) {
                            return users.find('tag', match[4]);
                        }
                        return undefined;
                    }).filter(m => m);
                }
                if (rolesMatch) {
                    result.roles = parameter.match(/\d+|<@&\d+>|\s*.+/g).map(m => {
                        const match = m.match(/(\d+)|<@&(\d+)>|\s*(.*)/);
                        if (match[1] || match[2]) {
                            return [users.get(match[1] || match[2])];
                        } else if (match[3]) {
                            // This is special, since all characters are allowed in role names and we don't have a good separator
                            // We have to check every existing role and try to match it
                            const result = roles.filterArray(r => match[3].includes(r.name));
                            if (match[3].includes('everyone') && !match[3].includes('@everyone')) {
                                result.push(message.guild.defaultRole);
                            }
                            return result;
                        }
                        return undefined;
                    }).reduce((a, b) => a.concat(b), []).filter(m => m);
                }

                return result;
            }

            default:
                return parameter;
        }
    }
}

module.exports = DiscordCommandParameter;
