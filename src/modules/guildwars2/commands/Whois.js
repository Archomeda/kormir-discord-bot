'use strict';

const DiscordCommand = require('../../../../bot/modules/DiscordCommand');

const models = require('../../../models');


class CommandWhois extends DiscordCommand {
    constructor(bot) {
        super(bot, 'whois', ['whois :users:mentions']);
        this._localizerNamespaces = 'module.guildwars2';
    }

    async onCommand(message, parameters) {
        const l = this.getBot().getLocalizer();

        const users = new Map(parameters.users.users.map(u => [u.id, u]));
        const userIds = parameters.user.users.map(u => u.id);

        const accounts = await models.Gw2Account.find({ discordId: { $in: userIds } });
        if (accounts.length === 0) {
            return l.t('module.guildwars2:whois.response-empty');
        }

        const knownUsers = accounts.map(a => {
            let user = users.get(a.discordId);
            user = user.nickname || (user.user && user.user.tag) || user.tag;
            return l.t('module.guildwars2:whois.response-user', { user, account_name: a.accountName })
        });
        return l.t('module.guildwars2:whois.response', { users: knownUsers.join('\n') });
    }
}

module.exports = CommandWhois;
