'use strict';

const Promise = require('bluebird');
const random = require('random-js')();

const AutoRemoveMessage = require('../../../../bot/middleware/AutoRemoveMessage');

const DiscordCommand = require('../../../../bot/modules/DiscordCommand');
const DiscordCommandError = require('../../../../bot/modules/DiscordCommandError');
const DiscordCommandParameter = require('../../../../bot/modules/DiscordCommandParameter');

const models = require('../../../models');

const gw2Api = require('../api');


const codeCacheTable = 'register-code';


class CommandRegister extends DiscordCommand {
    constructor(bot) {
        super(bot, 'register', ['register']);
        this._localizerNamespaces = 'module.guildwars2';

        this.setMiddleware(new AutoRemoveMessage(bot, this, { defaultRequest: 60, defaultResponse: 60 })); // Auto remove messages after 1 minute
    }

    initializeParameters() {
        return new DiscordCommandParameter('key', { optional: true });
    }

    onCommand(request) {
        const bot = this.getBot();
        const l = bot.getLocalizer();
        const module = this.getModule();
        const config = module.getConfig().root(this.getId());
        const cache = bot.getCache();
        const message = request.getMessage();
        const params = request.getParams();
        const key = params.key;
        const user = request.getMessage().author;
        const discordId = user.id;

        if (module.isApiOnFire()) {
            throw new DiscordCommandError(l.t('module.guildwars2:api.response-fire'));
        }

        return models.Gw2Account.find({ discordId }).then(accounts => {
            let account = accounts.length > 0 ? accounts[0] : undefined;
            const register = this.getCommandTrigger();

            if (!key) {
                const code = random.hex(5).toUpperCase();
                const time = config.get('timeout');

                return cache.set(codeCacheTable, discordId, time * 60, code).then(result => {
                    if (result) {
                        if (account) {
                            user.dmChannel.send(`${l.t('module.guildwars2:register.response-reregister', { key: account.apiKey })}${l.t('module.guildwars2:register.response-register-steps', { code, register, time })}`);
                        } else {
                            user.dmChannel.send(`${l.t('module.guildwars2:register.response-info')}${l.t('module.guildwars2:register.response-register-steps', { code, register, time })}`);
                        }
                        if (message.channel.type !== 'dm') {
                            return l.t('module.guildwars2:register.response-see-dm');
                        }
                        return;
                    }
                    throw new DiscordCommandError(l.t('module.guildwars2:register.response-generation-failed'));
                });
            }

            if (message.channel.type === 'text') {
                // Delete the message with the API key immediately since it's public
                return message.delete().then(() => {
                    return l.t('module.guildwars2:register.response-message-removed-see-dm');
                });
            }

            return cache.get(codeCacheTable, discordId).then(code => {
                if (!code) {
                    return l.t('module.guildwars2:register.response-no-code', { register });
                }

                return Promise.all([
                    gw2Api.authenticate(key).tokeninfo().get(),
                    gw2Api.authenticate(key).account().get()
                ]).then(([tokenInfo, accountInfo]) => {
                    // This doesn't check optional permissions since we don't need to, change this once it's required
                    if (tokenInfo.name.includes(code)) {
                        return cache.remove(codeCacheTable, discordId).then(() => {
                            if (!account) {
                                account = new models.Gw2Account({ discordId, accountName: accountInfo.name, apiKey: key });
                            } else {
                                account.apiKey = key;
                            }
                            return account.save().then(() => this.emit('new-registration', user, account))
                                .return(l.t('module.guildwars2:register.response-registered', { account_name: accountInfo.name, key_name: tokenInfo.name })); // eslint-disable-line camelcase
                        });
                    }
                    return l.t('module.guildwars2:register.response-wrong-name', { name: tokenInfo.name, code });
                }).catch(err => {
                    throw new DiscordCommandError(module.parseApiError(err));
                });
            });
        });
    }
}

module.exports = CommandRegister;
