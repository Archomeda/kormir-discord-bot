'use strict';

const Discord = require('discord.js');

const CacheMiddleware = require('../../../../bot/middleware/Cache');

const DiscordReplyMessage = require('../../../../bot/modules/DiscordReplyMessage');

const ApiBase = require('./ApiBase');


// Hardcoded zones, upgrades and songs
const availableUpgrades = [1, 3, 6, 7, 9, 10, 12, 13, 15, 18, 19, 21, 24, 25, 27, 28, 31, 32, 34];
const availableSongs = [1, 2, 3];


class CommandRaids extends ApiBase {
    constructor(bot) {
        super(bot, 'sab', ['sab :character']);

        this.setMiddleware(new CacheMiddleware(bot, this, { uniqueUser: true }));
    }

    async onApiCommand(message, gw2Api, parameters) {
        const bot = this.getBot();
        const l = bot.getLocalizer();
        const apiKey = await this.getApiKey(message);
        const sab = await gw2Api.authenticate(apiKey).characters(parameters.character).sab().get();

        const embed = new Discord.RichEmbed()
            .setTitle(l.t('module.guildwars2:sab.response-title', { character: parameters.character }));

        const completedZones = this._getCompletedZones(sab.zones);
        const completedZonesBody = [
            l.t('module.guildwars2:sab.response-information-zone'),
            ''
        ];
        Object.keys(completedZones).forEach(zoneId => {
            const completion = completedZones[zoneId].map(m => l.t(`module.guildwars2:sab.zone-${m}-completed`)).join('');
            if (completion) {
                completedZonesBody.push(l.t(`module.guildwars2:sab.zone-${zoneId}`, { completion }));
            }
        });
        embed.addField(l.t('module.guildwars2:sab.response-title-zone'), completedZonesBody.join('\n'), true);

        const unlockedUpgrades = new Set(sab.unlocks.map(u => u.id));
        const unlockedUpgradesBody = [];
        for (const upgrade of availableUpgrades) {
            if (unlockedUpgrades.has(upgrade)) {
                unlockedUpgradesBody.push(l.t('module.guildwars2:sab.upgrade-unlocked', { upgrade: l.t(`module.guildwars2:sab.upgrade-${upgrade}`) }));
            } else {
                unlockedUpgradesBody.push(l.t('module.guildwars2:sab.upgrade-locked', { upgrade: l.t(`module.guildwars2:sab.upgrade-${upgrade}`) }));
            }
        }
        embed.addField(l.t('module.guildwars2:sab.response-title-upgrades'), unlockedUpgradesBody.join('\n'), true);

        const unlockedSongs = new Set(sab.songs.map(s => s.id));
        const unlockedSongsBody = [];
        for (const song of availableSongs) {
            if (unlockedSongs.has(song)) {
                unlockedSongsBody.push(l.t('module.guildwars2:sab.song-unlocked', { song: l.t(`module.guildwars2:sab.song-${song}`) }));
            } else {
                unlockedSongsBody.push(l.t('module.guildwars2:sab.song-locked', { song: l.t(`module.guildwars2:sab.song-${song}`) }));
            }
        }

        embed.addField(l.t('module.guildwars2:sab.response-title-songs'), unlockedSongsBody.join('\n'), true)
            .addField('\u200B', l.t('module.guildwars2:sab.response-more-information'));

        return new DiscordReplyMessage('', { embed });
    }

    _getCompletedZones(zones) {
        const completedZones = {
            101: [],
            102: [],
            103: [],
            201: [],
            202: [],
            203: []
        };
        for (const zone of zones) {
            const id = `${zone.world}0${zone.zone}`;
            if (id in completedZones) {
                completedZones[id].push(zone.mode);
            }
        }
        Object.keys(completedZones).forEach(zoneId => {
            completedZones[zoneId].sort((a, b) => {
                const map = {
                    infantile: 0,
                    normal: 1,
                    tribulation: 2
                };
                return map[a] - map[b];
            });
        });
        return completedZones;
    }
}

module.exports = CommandRaids;
