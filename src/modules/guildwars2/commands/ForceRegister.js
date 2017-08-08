'use strict';

const AutoRemoveMessage = require('../../../../bot/middleware/AutoRemoveMessage');

const { deleteIgnoreErrors } = require('../../../../bot/utils/DiscordMessage');

const models = require('../../../models');

const ApiBase = require('./ApiBase');


class CommandForceRegister extends ApiBase {
    constructor(bot) {
        super(bot, 'force-register', ['forceregister :id :key']);

        this.setMiddleware(new AutoRemoveMessage(bot, this, { defaultRequest: 60, defaultResponse: 60 })); // Auto remove messages after 1 minute
    }

    async onApiCommand(message, gw2Api, parameters) {
        const bot = this.getBot();
        const l = bot.getLocalizer();
        const client = bot.getClient();

        const accounts = await models.Gw2Account.find({ discordId: parameters.id });
        let account = accounts.length > 0 ? accounts[0] : undefined;

        if (message.channel.type === 'text' && (parameters.key || parameters.id)) {
            // Delete the message with the API key immediately since it's public
            await deleteIgnoreErrors(message);
            return l.t('module.guildwars2:force-register.response-message-removed-see-dm');
        } else if (message.channel.type !== 'dm') {
            return l.t('module.guildwars2:force-register.response-see-dm');
        }

        const [tokenInfo, accountInfo] = await Promise.all([
            gw2Api.authenticate(parameters.key).tokeninfo().get(),
            gw2Api.authenticate(parameters.key).account().get()
        ]);

        // This doesn't check optional permissions since we don't need to, change this once it's required
        if (!account) {
            account = new models.Gw2Account({ discordId: parameters.id, accountName: accountInfo.name, apiKey: parameters.key });
        } else {
            account.apiKey = parameters.key;
        }

        const user = client.users.get(parameters.id);
        await account.save();
        this.emit('new-registration', user, account);

        return l.t('module.guildwars2:force-register.response-registered', { account_name: accountInfo.name, key_name: tokenInfo.name }); // eslint-disable-line camelcase
    }
}

module.exports = CommandForceRegister;
