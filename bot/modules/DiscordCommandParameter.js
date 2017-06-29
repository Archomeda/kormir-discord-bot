'use strict';


/**
 * A Discord command parameter.
 */
class DiscordCommandParameter {
    /**
     * Creates a new Discord command parameter.
     * @param {string} id - The parameter identifier.
     * @param {Object} [options] - Additional options.
     */
    constructor(id, options) {
        this.id = id;
        this.optional = options && options.optional;
        this.type = options && options.type;
        this.expanded = options && options.expanded;
        this.localizationContext = options && options.localizationContext;
    }

    /**
     * Parses a parameter.
     * @param {string} param - The parameter string.
     * @param {Message} message - The Discord message.
     * @returns {*} The parsed parameter.
     */
    parseParam(param, message) {
        switch (this.type) {
            case 'channels':
                return message.mentions.channels.filter(channel => param.includes(channel));
            case 'mentions':
                return {
                    users: message.mentions.users.filter(user => param.includes(user) || param.includes(`<@!${user.id}>`)), // Explicitly include nicknamed accounts, since they have a different mention format
                    roles: message.mentions.roles.filter(role => param.includes(role)),
                    everyone: param.includes('@everyone')
                };
            default:
                return param;
        }
    }
}

module.exports = DiscordCommandParameter;
