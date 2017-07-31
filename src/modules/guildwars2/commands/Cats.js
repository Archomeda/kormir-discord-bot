'use strict';

const _ = require('lodash');
const Discord = require('discord.js');

const CacheMiddleware = require('../../../../bot/middleware/Cache');

const DiscordReplyMessage = require('../../../../bot/modules/DiscordReplyMessage');

const ApiBase = require('./ApiBase');


// Hardcoded cats, lye pls
const availableCats = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 32, 33, 35];


class CommandCats extends ApiBase {
    constructor(bot) {
        super(bot, 'cats', ['cats']);

        this.setMiddleware(new CacheMiddleware(bot, this, { uniqueUser: true }));
    }

    async onApiCommand(message, gw2Api) {
        const bot = this.getBot();
        const l = bot.getLocalizer();
        const apiKey = await this.getApiKey(message);

        const toNames = cats => cats.map(cat => l.t([`module.guildwars2:cats.cat-${cat.id}`, 'module.guildwars2:cats.cat-unknown'], { id: cat.id, hint: cat.hint }));
        const cats = await gw2Api.authenticate(apiKey).account().home().cats().get();
        const ownedCats = toNames(cats);
        const missingCats = toNames(_.differenceWith(availableCats, cats, (a, b) => a === b.id).map(cat => ({ id: cat, hint: 'no hint' })));

        if (ownedCats.length === 0) {
            return l.t('module.guildwars2:cats.response-no-cats');
        }

        const user = (message.member && message.member.nickname) || message.author.username;
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
    }
}

module.exports = CommandCats;
