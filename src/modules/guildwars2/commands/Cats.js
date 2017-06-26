'use strict';

const _ = require('lodash');
const Discord = require('discord.js');

const CacheMiddleware = require('../../../../bot/middleware/Cache');

const DiscordCommand = require('../../../../bot/modules/DiscordCommand');
const DiscordCommandError = require('../../../../bot/modules/DiscordCommandError');
const DiscordReplyMessage = require('../../../../bot/modules/DiscordReplyMessage');

const models = require('../../../models');

const gw2Api = require('../api');


// Hardcoded cats, lye pls
const availableCats = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 32, 33];


class CommandCats extends DiscordCommand {
    constructor(bot) {
        super(bot, 'cats', ['cats']);
        this._localizerNamespaces = 'module.guildwars2';

        this.setMiddleware(new CacheMiddleware(bot, this, { uniqueUser: true }));
    }

    onCommand(request) {
        const bot = this.getBot();
        const l = bot.getLocalizer();
        const module = this.getModule();
        const message = request.getMessage();
        const discordId = message.author.id;

        if (module.isApiOnFire()) {
            throw new DiscordCommandError(l.t('module.guildwars2:api.response-fire'));
        }

        return models.Gw2Account.findOne({ discordId }).then(account => {
            if (!account || !account.apiKey) {
                throw new DiscordCommandError(l.t('module.guildwars2:api.response-not-registered'));
            }

            return gw2Api.authenticate(account.apiKey).account().home().cats().get().then(cats => {
                const user = (message.member && message.member.nickname) || message.author.username;
                const toNames = cats => cats.map(cat => l.t([`module.guildwars2:cats.cat-${cat.id}`, 'module.guildwars2:cats.cat-unknown'], { hint: cat.hint }));
                const ownedCats = toNames(cats);
                const missingCats = toNames(_.differenceWith(availableCats, cats, (a, b) => a === b.id).map(cat => ({ id: cat, hint: 'no hint' })));

                if (ownedCats.length === 0) {
                    return l.t('module.guildwars2:cats.response-no-cats');
                }

                const embed = new Discord.RichEmbed().setTitle(l.t('module.guildwars2:cats.response-title', { user }));
                if (ownedCats.length === availableCats.length) {
                    embed.setDescription(l.t('module.guildwars2:cats.response-all-cats'));
                } else {
                    embed.setDescription(l.t('module.guildwars2:cats.response-number-cats', { count: ownedCats.length, total: availableCats.length }));
                }

                if (ownedCats.length > 0) {
                    // TODO: This will eventually overflow to more than 1024 characters, need to create an auto-wrapper
                    embed.addField(l.t('module.guildwars2:cats.owned-cats'), ownedCats.join(', '));
                }
                if (missingCats.length > 0) {
                    // TODO: Same applies here
                    embed.addField(l.t('module.guildwars2:cats.missing-cats'), missingCats.join(', '));
                }

                embed.addField('\u200B', l.t('module.guildwars2:cats.response-more-information'));
                return new DiscordReplyMessage('', { embed });
            }).catch(err => {
                throw new DiscordCommandError(module.parseApiError(err));
            });
        });
    }
}

module.exports = CommandCats;
