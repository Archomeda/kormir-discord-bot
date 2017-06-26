'use strict';

const Promise = require('bluebird');

const AutoRemoveMessage = require('../../../../bot/middleware/AutoRemoveMessage');

const DiscordCommand = require('../../../../bot/modules/DiscordCommand');
const DiscordCommandError = require('../../../../bot/modules/DiscordCommandError');
const DiscordCommandParameter = require('../../../../bot/modules/DiscordCommandParameter');

const models = require('../../../models');

const gw2Api = require('../api');


class CommandForceRegister extends DiscordCommand {
    constructor(bot) {
        super(bot, 'force-register', ['forceregister']);
        this._localizerNamespaces = 'module.guildwars2';

        this.setMiddleware(new AutoRemoveMessage(bot, this, { defaultRequest: 60, defaultResponse: 60 })); // Auto remove messages after 1 minute
    }

    initializeParameters() {
        return [
            new DiscordCommandParameter('id'),
            new DiscordCommandParameter('key')
        ];
    }

    onCommand(request) {
        const bot = this.getBot();
        const l = bot.getLocalizer();
        const client = bot.getClient();
        const module = this.getModule();
        const message = request.getMessage();
        const params = request.getParams();
        const key = params.key;
        const discordId = params.id;

        if (module.isApiOnFire()) {
            throw new DiscordCommandError(l.t('module.guildwars2:api.response-fire'));
        }

        return models.Gw2Account.find({ discordId }).then(accounts => {
            let account = accounts.length > 0 ? accounts[0] : undefined;

            if (message.channel.type === 'text' && (key || discordId)) {
                // Delete the message with the API key immediately since it's public
                return message.delete().then(() => {
                    return l.t('module.guildwars2:force-register.response-message-removed-see-dm');
                });
            } else if (message.channel.type !== 'dm') {
                return l.t('module.guildwars2:force-register.response-see-dm');
            }

            return Promise.all([
                gw2Api.authenticate(key).tokeninfo().get(),
                gw2Api.authenticate(key).account().get()
            ]).then(([tokenInfo, accountInfo]) => {
                // This doesn't check optional permissions since we don't need to, change this once it's required
                if (!account) {
                    account = new models.Gw2Account({ discordId, accountName: accountInfo.name, apiKey: key });
                } else {
                    account.apiKey = key;
                }

                const user = client.users.get(discordId);
                return account.save().then(() => this.emit('new-registration', user, account))
                    .return(l.t('module.guildwars2:force-register.response-registered', { account_name: accountInfo.name, key_name: tokenInfo.name })); // eslint-disable-line camelcase
            }).catch(err => {
                throw new DiscordCommandError(module.parseApiError(err));
            });
        });
    }
}

module.exports = CommandForceRegister;
