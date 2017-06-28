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

    async getApiKey(request) {
        const l = this.getBot().getLocalizer();
        const account = await models.Gw2Account.findOne({ discordId: request.getMessage().author.id });
        if (!account || !account.apiKey) {
            throw new DiscordCommandError(l.t('module.guildwars2:api.response-not-registered'));
        }
        return account.apiKey;
    }

    async onApiCommand(request, gw2Api) { // eslint-disable-line no-unused-vars

    }

    async onCommand(request) {
        const l = this.getBot().getLocalizer();
        const module = this.getModule();

        if (module.isApiOnFire()) {
            throw new DiscordCommandError(l.t('module.guildwars2:api.response-fire'));
        }

        try {
            return this.onApiCommand(request, gw2Api);
        } catch (err) {
            throw new DiscordCommandError(module.parseApiError(err));
        }
    }
}

module.exports = ApiBase;
