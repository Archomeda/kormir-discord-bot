'use strict';

const _ = require('lodash');
const Discord = require('discord.js');
const Promise = require('bluebird');
const i18next = Promise.promisifyAll(require('i18next'));

const Command = require('../Command');
const CommandParam = require('../CommandParam');
const CommandError = require('../../errors/CommandError');
const CommandReplyMessage = require('../CommandReplyMessage');
const CacheMiddleware = require('../../middleware/CacheMiddleware');
const bot = require('../../bot');


// Hardcoded cats, lye pls
const availableCats = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 32];

class CommandCats extends Command {
    constructor(module) {
        super(module, {
            defaultTrigger: 'cats'
        });

        i18next.loadNamespacesAsync('guildwars2').then(() => {
            this.helpText = i18next.t('guildwars2:cats.help');
            this.shortHelpText = i18next.t('guildwars2:cats.short-help');
        });

        this.initializeMiddleware(new CacheMiddleware({
            unique_user: true
        }));
    }

    onCommand(response) {
        const request = response.request;
        const Gw2Account = bot.database.Gw2Account;
        const discordId = response.request.message.author.id;

        return Gw2Account.findOne({ discordId }).then(account => {
            if (!account) {
                return;
            }

            return bot.gw2Api.authenticate(account.apiKey).account().home().cats().get().then(cats => {
                const user = (request.message.member && request.message.member.nickname) || request.message.author.username;
                const toNames = cats => cats.map(cat => i18next.t([`guildwars2:cats.cat-${cat.id}`, 'guildwars2:cats.cat-unknown'], { hint: cat.hint }));
                const ownedCats = toNames(cats);
                const missingCats = toNames(_.differenceWith(availableCats, cats, (a, b) => a === b.id).map(cat => ({ id: cat, hint: 'no hint' })));

                if (ownedCats.length === 0) {
                    return i18next.t('guildwars2:cats.response-no-cats');
                }

                const message = new Discord.RichEmbed().setTitle(i18next.t('guildwars2:cats.response-title', { user }));
                if (ownedCats.length === availableCats.length) {
                    message.setDescription(i18next.t('guildwars2:cats.response-all-cats'));
                } else {
                    message.setDescription(i18next.t('guildwars2:cats.response-number-cats', { count: ownedCats.length, total: availableCats.length }));
                }

                if (ownedCats.length > 0) {
                    // TODO: This will eventually overflow to more than 1024 characters, need to create an auto-wrapper
                    message.addField(i18next.t('guildwars2:cats.owned-cats'), ownedCats.join(', '));
                }
                if (missingCats.length > 0) {
                    // TODO: Same applies here too
                    message.addField(i18next.t('guildwars2:cats.missing-cats'), missingCats.join(', '));
                }

                message.addField('\u200B', i18next.t('guildwars2:cats.response-more-information'));
                return new CommandReplyMessage('', { embed: message });
            }).catch(err => {
                if (err.response.status !== 404 && err.content) {
                    throw new CommandError(i18next.t('guildwars2:api.response-error', { error: err.content.text || err.content.error }));
                } else {
                    throw new CommandError(i18next.t('guildwars2:api.response-down'));
                }
            });
        });
    }
}

module.exports = CommandCats;
