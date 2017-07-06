'use strict';

const random = require('random-js')();

const AutoRemoveMessage = require('../../../../bot/middleware/AutoRemoveMessage');

const DiscordCommandError = require('../../../../bot/modules/DiscordCommandError');
const DiscordCommandParameter = require('../../../../bot/modules/DiscordCommandParameter');

const { deleteIgnoreErrors } = require('../../../../bot/utils/DiscordMessage');

const models = require('../../../models');

const ApiBase = require('./ApiBase');


const codeCacheTable = 'register-code';


class CommandRegister extends ApiBase {
    constructor(bot) {
        super(bot, 'register', ['register']);

        this.setMiddleware(new AutoRemoveMessage(bot, this, { defaultRequest: 60, defaultResponse: 60 })); // Auto remove messages after 1 minute
    }

    initializeParameters() {
        return new DiscordCommandParameter('key', { optional: true });
    }

    async onApiCommand(request, gw2Api) {
        const bot = this.getBot();
        const l = bot.getLocalizer();
        const config = this.getModule().getConfig().root(this.getId());
        const cache = bot.getCache();
        const message = request.getMessage();
        const params = request.getParams();
        const key = params.key;
        const user = request.getMessage().author;
        const discordId = user.id;

        const accounts = await models.Gw2Account.find({ discordId });
        let account = accounts.length > 0 ? accounts[0] : undefined;
        const register = this.getCommandRoute();

        // Option 1: No key included
        if (!key) {
            const code = random.hex(5).toUpperCase();
            const time = config.get('timeout');

            const result = await cache.set(codeCacheTable, discordId, time * 60, code);
            if (!result) {
                throw new DiscordCommandError(l.t('module.guildwars2:register.response-generation-failed'));
            }

            let reply;
            if (account) {
                reply = `${l.t('module.guildwars2:register.response-reregister', { key: account.apiKey })}${l.t('module.guildwars2:register.response-register-steps', { code, register, time })}`;
            } else {
                reply = `${l.t('module.guildwars2:register.response-info')}${l.t('module.guildwars2:register.response-register-steps', { code, register, time })}`;
            }

            if (message.channel.type !== 'dm') {
                user.dmChannel.send(reply);
                return l.t('module.guildwars2:register.response-see-dm');
            }
            return reply;
        }

        // Option 2: No DM channel
        if (message.channel.type !== 'dm') {
            // Delete the message with the API key immediately since it's no a DM channel
            await deleteIgnoreErrors(message);
            return l.t('module.guildwars2:register.response-message-removed-see-dm');
        }

        // Option 3: No code prepared
        const code = await cache.get(codeCacheTable, discordId);
        if (!code) {
            return l.t('module.guildwars2:register.response-no-code', { register });
        }

        // Option 4: Prerequisites complete
        const [tokenInfo, accountInfo] = await Promise.all([
            gw2Api.authenticate(key).tokeninfo().get(),
            gw2Api.authenticate(key).account().get()
        ]);

        // This doesn't check optional permissions since we don't need to, change this once it's required
        if (tokenInfo.name.includes(code)) {
            await cache.remove(codeCacheTable, discordId);

            if (!account) {
                account = new models.Gw2Account({ discordId, accountName: accountInfo.name, apiKey: key });
            } else {
                account.apiKey = key;
            }

            await account.save();
            this.emit('new-registration', user, account);
            return l.t('module.guildwars2:register.response-registered', { account_name: accountInfo.name, key_name: tokenInfo.name }); // eslint-disable-line camelcase
        }

        // Option 5: Wrong code
        return l.t('module.guildwars2:register.response-wrong-name', { name: tokenInfo.name, code });
    }
}

module.exports = CommandRegister;
