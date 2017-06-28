'use strict';

const AutoRemoveMessage = require('../../../../bot/middleware/AutoRemoveMessage');

const DiscordCommandParameter = require('../../../../bot/modules/DiscordCommandParameter');

const { deleteIgnoreErrors } = require('../../../../bot/utils/DiscordMessage');

const models = require('../../../models');

const ApiBase = require('./ApiBase');


class CommandForceRegister extends ApiBase {
    constructor(bot) {
        super(bot, 'force-register', ['forceregister']);

        this.setMiddleware(new AutoRemoveMessage(bot, this, { defaultRequest: 60, defaultResponse: 60 })); // Auto remove messages after 1 minute
    }

    initializeParameters() {
        return [
            new DiscordCommandParameter('id'),
            new DiscordCommandParameter('key')
        ];
    }

    async onApiCommand(request, gw2Api) {
        const bot = this.getBot();
        const l = bot.getLocalizer();
        const client = bot.getClient();
        const message = request.getMessage();
        const params = request.getParams();
        const key = params.key;
        const discordId = params.id;

        const accounts = await models.Gw2Account.find({ discordId });
        let account = accounts.length > 0 ? accounts[0] : undefined;

        if (message.channel.type === 'text' && (key || discordId)) {
            // Delete the message with the API key immediately since it's public
            await deleteIgnoreErrors(message);
            return l.t('module.guildwars2:force-register.response-message-removed-see-dm');
        } else if (message.channel.type !== 'dm') {
            return l.t('module.guildwars2:force-register.response-see-dm');
        }

        const [tokenInfo, accountInfo] = await Promise.all([
            gw2Api.authenticate(key).tokeninfo().get(),
            gw2Api.authenticate(key).account().get()
        ]);

        // This doesn't check optional permissions since we don't need to, change this once it's required
        if (!account) {
            account = new models.Gw2Account({ discordId, accountName: accountInfo.name, apiKey: key });
        } else {
            account.apiKey = key;
        }

        const user = client.users.get(discordId);
        await account.save();
        this.emit('new-registration', user, account);

        return l.t('module.guildwars2:force-register.response-registered', { account_name: accountInfo.name, key_name: tokenInfo.name }); // eslint-disable-line camelcase
    }
}

module.exports = CommandForceRegister;
