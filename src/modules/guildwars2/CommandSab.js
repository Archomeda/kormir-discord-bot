'use strict';

const _ = require('lodash');
const Discord = require('discord.js');
const Promise = require('bluebird');
const i18next = Promise.promisifyAll(require('i18next'));
const titleCase = require('change-case').titleCase;

const Command = require('../Command');
const CommandParam = require('../CommandParam');
const CommandError = require('../../errors/CommandError');
const CommandReplyMessage = require('../CommandReplyMessage');
const CacheMiddleware = require('../../middleware/CacheMiddleware');
const bot = require('../../bot');


// Hardcoded zones, upgrades and songs
const availableUpgrades = [1, 3, 6, 9, 12, 13, 15, 18, 19, 21, 24, 25, 27, 28, 31, 32, 34];
const availableSongs = [1, 2, 3];

class CommandSab extends Command {
    constructor(module) {
        super(module, {
            defaultTrigger: 'sab'
        });

        i18next.loadNamespacesAsync('guildwars2').then(() => {
            this.helpText = i18next.t('guildwars2:sab.help');
            this.shortHelpText = i18next.t('guildwars2:sab.short-help');
            this.params = new CommandParam('character-name', i18next.t('guildwars2:sab.param-character'), false, undefined, true);
        });

        this.initializeMiddleware(new CacheMiddleware({
            unique_user: true
        }));
    }

    onCommand(response) {
        const character = titleCase(response.request.params['character-name']);
        const Gw2Account = bot.database.Gw2Account;
        const discordId = response.request.message.author.id;

        return Gw2Account.findOne({ discordId }).then(account => {
            if (!account) {
                return;
            }

            return bot.gw2Api.authenticate(account.apiKey).characters(character).sab().get().then(sab => {
                const message = new Discord.RichEmbed().setTitle(i18next.t('guildwars2:sab.response-title', { character }));

                const completedZones = this.getCompletedZones(sab.zones);
                const completedZonesBody = [
                    i18next.t('guildwars2:sab.response-information-zone'),
                    ''
                ];
                Object.keys(completedZones).forEach(zoneId => {
                    const completion = completedZones[zoneId].map(m => i18next.t(`guildwars2:sab.zone-${m}-completed`)).join('');
                    if (completion) {
                        completedZonesBody.push(i18next.t(`guildwars2:sab.zone-${zoneId}`, { completion }));
                    }
                });
                message.addField(i18next.t('guildwars2:sab.response-title-zone'), completedZonesBody.join('\n'), true);

                const unlockedUpgrades = new Set(sab.unlocks.map(u => u.id));
                const unlockedUpgradesBody = [];
                for (let upgrade of availableUpgrades) {
                    if (unlockedUpgrades.has(upgrade)) {
                        unlockedUpgradesBody.push(i18next.t('guildwars2:sab.upgrade-unlocked', { upgrade: i18next.t(`guildwars2:sab.upgrade-${upgrade}`) }));
                    } else {
                        unlockedUpgradesBody.push(i18next.t('guildwars2:sab.upgrade-locked', { upgrade: i18next.t(`guildwars2:sab.upgrade-${upgrade}`) }));
                    }
                }
                message.addField(i18next.t('guildwars2:sab.response-title-upgrades'), unlockedUpgradesBody.join('\n'), true);

                const unlockedSongs = new Set(sab.songs.map(s => s.id));
                const unlockedSongsBody = [];
                for (let song of availableSongs) {
                    if (unlockedSongs.has(song)) {
                        unlockedSongsBody.push(i18next.t('guildwars2:sab.song-unlocked', { song: i18next.t(`guildwars2:sab.song-${song}`) }));
                    } else {
                        unlockedSongsBody.push(i18next.t('guildwars2:sab.song-locked', { song: i18next.t(`guildwars2:sab.song-${song}`) }));
                    }
                }
                message.addField(i18next.t('guildwars2:sab.response-title-songs'), unlockedSongsBody.join('\n'), true);

                message.addField('\u200B', i18next.t('guildwars2:sab.response-more-information'));
                return new CommandReplyMessage('', { embed: message });
            }).catch(err => {
                if (err.response.status !== 404 || err.content) {
                    throw new CommandError(i18next.t('guildwars2:api.response-error', { error: err.content.text || err.content.error }));
                } else {
                    throw new CommandError(i18next.t('guildwars2:api.response-down'));
                }
            });
        });
    }

    getCompletedZones(zones) {
        const completedZones = {
            101: [],
            102: [],
            103: [],
            201: [],
            202: [],
            203: []
        };
        for (let zone of zones) {
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

module.exports = CommandSab;
