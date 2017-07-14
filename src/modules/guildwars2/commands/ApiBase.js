'use strict';

const DiscordCommand = require('../../../../bot/modules/DiscordCommand');
const DiscordCommandError = require('../../../../bot/modules/DiscordCommandError');

const gw2Api = require('../api');

const models = require('../../../models');


/**
 * The base for all API related commands.
 */
class ApiBase extends DiscordCommand {
    constructor(bot, id, triggers, options) {
        super(bot, id, triggers, options);
        this._localizerNamespaces = 'module.guildwars2';
    }

    /**
     * Gets the API key of a Discord user, if available.
     * @param {Message} message - The Discord message.
     * @returns {Promise<string>} The promise with the API key.
     */
    async getApiKey(message) {
        const l = this.getBot().getLocalizer();
        const account = await models.Gw2Account.findOne({ discordId: message.author.id });
        if (!account || !account.apiKey) {
            throw new DiscordCommandError(l.t('module.guildwars2:api.response-not-registered'));
        }
        return account.apiKey;
    }

    /**
     * Gets called whenever an API command is requested.
     * @param {Message} message - The Discord message.
     * @param {Object} gw2Api - The GW2 API instance.
     * @param {Object} parameters - The request parameters.
     * @returns {Promise<string|DiscordReplyMessage|undefined>} The promise with the reply message, string or undefined if there's no reply.
     */
    async onApiCommand(message, gw2Api, parameters) { // eslint-disable-line no-unused-vars

    }

    async onCommand(message, parameters) {
        const l = this.getBot().getLocalizer();
        const module = this.getModule();

        if (module.isApiOnFire()) {
            throw new DiscordCommandError(l.t('module.guildwars2:api.response-fire'));
        }

        try {
            return this.onApiCommand(message, gw2Api, parameters);
        } catch (err) {
            throw new DiscordCommandError(module.parseApiError(err));
        }
    }
}

module.exports = ApiBase;
