'use strict';

const Promise = require('bluebird');
const i18next = Promise.promisifyAll(require('i18next'));
const random = require('random-js')();

const Command = require('../Command');
const CommandParam = require('../CommandParam');
const CommandError = require('../../errors/CommandError');
const RestrictChannelsMiddleware = require('../../middleware/RestrictChannelsMiddleware');
const bot = require('../../bot');


class CommandRegister extends Command {
    constructor(module) {
        super(module, {
            defaultTrigger: 'register'
        });

        i18next.loadNamespacesAsync('guildwars2').then(() => {
            this.helpText = i18next.t('guildwars2:register.help');
            this.shortHelpText = i18next.t('guildwars2:register.short-help');
            this.params = new CommandParam('key', i18next.t('guildwars2:register.param-key'), true);
        });

        this.initializeMiddleware(new RestrictChannelsMiddleware({ types: 'dm' }));
    }

    onCommand(response) {
        const key = response.request.params.key;
        const user = response.request.message.author;
        const discordId = user.id;

        const Gw2Account = bot.database.Gw2Account;
        const table = `${this.name}-code`;

        return Gw2Account.find({ discordId }).then(accounts => {
            let account = accounts.length > 0 ? accounts[0] : undefined;
            const register = this.toString();

            if (!key) {
                const code = random.hex(5).toUpperCase();
                const time = this.config.timeout;

                return bot.cache.set(table, discordId, time * 60, code).then(result => {
                    if (result) {
                        return account ?
                            `${i18next.t('guildwars2:register.response-reregister', { key: account.apiKey })}${i18next.t('guildwars2:register.response-register-steps', { code, register, time })}` :
                            `${i18next.t('guildwars2:register.response-info')}${i18next.t('guildwars2:register.response-register-steps', { code, register, time })}`;
                    }
                    throw new CommandError(i18next.t('guildwars2:register.response-generation-failed'));
                });
            } else {
                return bot.cache.get(table, discordId).then(code => {
                    if (!code) {
                        return i18next.t('guildwars2:register.response-no-code', { register });
                    }
                    return Promise.all([
                        bot.gw2Api.authenticate(key).tokeninfo().get(),
                        bot.gw2Api.authenticate(key).account().get()
                    ]).then(([tokeninfo, accountinfo]) => {
                        // This doesn't check optional permissions since we don't need to, change this once it's required
                        if (tokeninfo.name.includes(code)) {
                            return bot.cache.remove(table, discordId).then(() => {
                                if (!account) {
                                    account = new Gw2Account({ discordId, accountName: accountinfo.name, apiKey: key });
                                } else {
                                    account.apiKey = key;
                                }
                                return account.save().then(() => this.module.ensureGuildMembership(user, account))
                                    .return(i18next.t('guildwars2:register.response-registered', { account_name: accountinfo.name, key_name: tokeninfo.name }));
                            });
                        }
                        return i18next.t('guildwars2:register.response-wrong-name', { name: tokeninfo.name, code });
                    }).catch(err => {
                        if (err.content && err.content.text) {
                            throw new CommandError(i18next.t('guildwars2:register.response-api-error', { error: err.content.text }));
                        } else {
                            console.warn(err);
                            throw new CommandError(i18next.t('guildwars2:register.response-api-error-unknown'));
                        }
                    });
                });
            }
        });
    }
}

module.exports = CommandRegister;
