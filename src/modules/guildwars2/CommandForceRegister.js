'use strict';

const Promise = require('bluebird');
const i18next = Promise.promisifyAll(require('i18next'));

const Command = require('../Command');
const CommandParam = require('../CommandParam');
const CommandError = require('../../errors/CommandError');

const RestrictChannelsMiddleware = require('../../middleware/RestrictChannelsMiddleware');
const bot = require('../../bot');


class CommandForceRegister extends Command {
    constructor(module) {
        super(module, {
            defaultTrigger: 'forceregister'
        });

        i18next.loadNamespacesAsync('guildwars2').then(() => {
            this.helpText = i18next.t('guildwars2:force-register.help');
            this.shortHelpText = i18next.t('guildwars2:force-register.short-help');
            this.params = [
                new CommandParam('id', i18next.t('guildwars2:force-register.param-id')),
                new CommandParam('key', i18next.t('guildwars2:force-register.param-key'))
            ];
        });

        this.middleware = new RestrictChannelsMiddleware({ types: 'dm' });
    }

    onCommand(response) {
        const discordId = response.request.params.id;
        const key = response.request.params.key;

        const Gw2Account = bot.database.Gw2Account;

        return Gw2Account.find({ discordId }).then(accounts => {
            let account = accounts.length > 0 ? accounts[0] : undefined;

            return Promise.all([
                bot.gw2Api.authenticate(key).tokeninfo().get(),
                bot.gw2Api.authenticate(key).account().get()
            ]).then(([tokeninfo, accountinfo]) => {
                // This doesn't check optional permissions since we don't need to, change this once it's required
                if (!account) {
                    account = new Gw2Account({ discordId, accountName: accountinfo.name, apiKey: key });
                } else {
                    account.apiKey = key;
                }
                return account.save().return(i18next.t('guildwars2:force-register.response-registered', { account_name: accountinfo.name }));
            }).catch(err => {
                if (err.content && err.content.text) {
                    throw new CommandError(i18next.t('guildwars2:force-register.response-api-error', { error: err.content.text }));
                } else {
                    console.warn(err);
                    throw new CommandError(i18next.t('guildwars2:force-register.response-api-error-unknown'));
                }
            });
        });
    }
}

module.exports = CommandForceRegister;
