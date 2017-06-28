'use strict';

const Discord = require('discord.js');

const CacheMiddleware = require('../../../../bot/middleware/Cache');

const DiscordReplyMessage = require('../../../../bot/modules/DiscordReplyMessage');

const ApiBase = require('./ApiBase');


class CommandRaids extends ApiBase {
    constructor(bot) {
        super(bot, 'raids', ['raids']);

        this.setMiddleware(new CacheMiddleware(bot, this, { uniqueUser: true }));
    }

    async onApiCommand(request, gw2Api) {
        const bot = this.getBot();
        const l = bot.getLocalizer();
        const message = request.getMessage();
        const apiKey = await this.getApiKey(request);

        const [raids, accountRaids] = await Promise.all([
            gw2Api.raids().all(),
            gw2Api.authenticate(apiKey).account().raids().get()
        ]);

        const user = (message.member && message.member.nickname) || message.author.username;
        const embed = new Discord.RichEmbed()
            .setTitle(l.t('module.guildwars2:raids.response-title', { user }));

        for (let r = 0; r < raids.length; r++) {
            const raid = raids[r];
            for (let w = 0; w < raid.wings.length; w++) {
                const wing = raid.wings[w];
                const raidTitle = l.t([`module.guildwars2:raids.raid-${raid.id}`, 'module.guildwars2:raids.raid-unknown'], { id: raid.id });
                const wingTitle = l.t([`module.guildwars2:raids.wing-${wing.id}`, 'module.guildwars2:raids.wing-unknown'], { id: wing.id });
                const fieldTitle = l.t(raidTitle !== wingTitle ? 'module.guildwars2:raids.response-raid-wing-field' : 'module.guildwars2:raids.response-wing-field', {
                    raid: raidTitle,
                    wing: wingTitle
                });
                const fieldText = [];
                for (let e = 0; e < wing.events.length; e++) {
                    const encounter = wing.events[e];
                    const key = accountRaids.includes(encounter.id) ? 'module.guildwars2:raids.response-encounter-done' : 'module.guildwars2:raids.response-encounter-missing';
                    fieldText.push(l.t(key, {
                        encounter: l.t([`module.guildwars2:raids.encounter-${encounter.id}`, 'module.guildwars2:raids.encounter-unknown'])
                    }));
                }
                // TODO: This might overflow to more than 1024 characters, need to create an auto-wrapper
                embed.addField(fieldTitle, fieldText.join('\n'), true);
            }
        }

        return new DiscordReplyMessage('', { embed });
    }
}

module.exports = CommandRaids;
