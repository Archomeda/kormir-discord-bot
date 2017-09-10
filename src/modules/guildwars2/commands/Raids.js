'use strict';

const Discord = require('discord.js');

const CacheMiddleware = require('../../../../bot/middleware/Cache');

const DiscordReplyMessage = require('../../../../bot/modules/DiscordReplyMessage');
const DiscordReplyPage = require('../../../../bot/modules/DiscordReplyPage');

const ApiBase = require('./ApiBase');


// Whenever there are more than 10 raids, new emojis have to be added (or another way of representing this information)
const raidPageEmojis = {
    0: '1⃣',
    1: '2⃣',
    2: '3⃣',
    3: '4⃣',
    4: '5⃣',
    5: '6⃣',
    6: '7⃣',
    7: '8⃣',
    8: '9⃣',
    9: '🔟'
};


class CommandRaids extends ApiBase {
    constructor(bot) {
        super(bot, 'raids', ['raids']);

        this.setMiddleware(new CacheMiddleware(bot, this, { uniqueUser: true }));
    }

    async onApiCommand(message, gw2Api) {
        const bot = this.getBot();
        const l = bot.getLocalizer();
        const apiKey = await this.getApiKey(message);

        const [raids, accountRaids] = await Promise.all([
            gw2Api.raids().all(),
            gw2Api.authenticate(apiKey).account().raids().get()
        ]);

        const user = (message.member && message.member.nickname) || message.author.username;

        const summaryEmbed = new Discord.RichEmbed().setTitle(l.t('module.guildwars2:raids.response-summary-title', { user }));
        const detailsPages = [];
        const summaryText = [];
        const pagesText = [l.t('module.guildwars2:raids.response-pages-description-summary')];

        for (let i = 0; i < raids.length; i++) {
            const raid = raids[i];
            const raidTitle = l.t([`module.guildwars2:raids.raid-${raid.id}`, 'module.guildwars2:raids.raid-unknown'], { id: raid.id });
            const raidEmbed = new Discord.RichEmbed()
                .setTitle(l.t('module.guildwars2:raids.response-details-title', { user, raid: raidTitle }));

            for (const wing of raid.wings) {
                const wingTitle = l.t([`module.guildwars2:raids.wing-${wing.id}`, 'module.guildwars2:raids.wing-unknown'], { id: wing.id });
                const detailsTitle = l.t('module.guildwars2:raids.response-details-wing-field', { wing: wingTitle });
                const detailsText = [];
                const encountersMissing = [];

                for (const encounter of wing.events) {
                    let key = 'module.guildwars2:raids.response-details-encounter-done';
                    const encounterName = l.t([`module.guildwars2:raids.encounter-${encounter.id}`, 'module.guildwars2:raids.encounter-unknown']);
                    if (!accountRaids.includes(encounter.id)) {
                        key = 'module.guildwars2:raids.response-details-encounter-missing';
                        encountersMissing.push(encounterName);
                    }
                    detailsText.push(l.t(key, { encounter: encounterName }));
                }

                raidEmbed.addField(detailsTitle, detailsText.join('\n'), true);
                if (encountersMissing.length > 0) {
                    summaryText.push(l.t('module.guildwars2:raids.response-summary-wing', { wing: wingTitle, encounters: encountersMissing.join(', ') }));
                }
            }

            detailsPages.push(new DiscordReplyPage('', { embed: raidEmbed, emoji: raidPageEmojis[i] }));
            pagesText.push(l.t('module.guildwars2:raids.response-pages-description-raid', { emoji: raidPageEmojis[i], description: raidTitle }));
        }

        summaryEmbed.setDescription(summaryText.length > 0 ? summaryText.join('\n') : l.t('module.guildwars2:raids.response-summary-done'));
        const summaryPage = new DiscordReplyPage('', { embed: summaryEmbed, emoji: '📖' });
        const pages = [summaryPage, ...detailsPages];

        for (const page of pages) {
            page.embed.addField(l.t('module.guildwars2:raids.response-pages-title'), pagesText.join('\n'));
        }

        return new DiscordReplyMessage(pages);
    }
}

module.exports = CommandRaids;
