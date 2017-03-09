'use strict';

const _ = require('lodash');
const Discord = require('discord.js');
const Promise = require('bluebird');
const i18next = Promise.promisifyAll(require('i18next'));

const Command = require('../Command');
const CommandParam = require('../CommandParam');
const CommandError = require('../../errors/CommandError');
const bot = require('../../bot');


class CommandRaids extends Command {
    constructor(module) {
        super(module, {
            defaultTrigger: 'raids'
        });

        i18next.loadNamespacesAsync('guildwars2').then(() => {
            this.helpText = i18next.t('guildwars2:raids.help');
            this.shortHelpText = i18next.t('guildwars2:raids.short-help');
        });

        // TODO: Need to find a way to implement caching for non-text responses in the middleware and add it to this command
    }

    onCommand(response) {
        const request = response.request;
        const Gw2Account = bot.database.Gw2Account;
        const discordId = response.request.message.author.id;

        return Gw2Account.findOne({ discordId }).then(account => {
            if (!account) {
                return;
            }

            return Promise.all([
                bot.gw2Api.raids().all(),
                bot.gw2Api.authenticate(account.apiKey).account().raids().get()
            ]).then(([raids, accountRaids]) => {
                const user = (request.message.member && request.message.member.nickname) || request.message.author.username;

                const message = new Discord.RichEmbed().setTitle(i18next.t('guildwars2:raids.response-title', { user }));
                for (let r = 0; r < raids.length; r++) {
                    const raid = raids[r];
                    for (let w = 0; w < raid.wings.length; w++) {
                        const wing = raid.wings[w];
                        const raidTitle = i18next.t([`guildwars2:raids.raid-${raid.id}`, 'guildwars2:raids.raid-unknown'], { id: raid.id });
                        const wingTitle = i18next.t([`guildwars2:raids.wing-${wing.id}`, 'guildwars2:raids.wing-unknown'], { id: wing.id });
                        let fieldTitle;
                        if (raidTitle !== wingTitle) {
                            fieldTitle = i18next.t('guildwars2:raids.response-raid-wing-field', { raid: raidTitle, wing: wingTitle });
                        } else {
                            fieldTitle = i18next.t('guildwars2:raids.response-wing-field', { wing: wingTitle });
                        }
                        const fieldText = [];
                        for (let e = 0; e < wing.events.length; e++) {
                            const encounter = wing.events[e];
                            const key = accountRaids.includes(encounter.id) ? 'guildwars2:raids.response-encounter-done' : 'guildwars2:raids.response-encounter-not-done';
                            fieldText.push(i18next.t(key, {
                                encounter: i18next.t([`guildwars2:raids.encounter-${encounter.id}`, 'guildwars2:raids.encounter-unknown'], { id: encounter.id })
                            }));
                        }
                        // TODO: This might overflow to more than 1024 characters, need to create an auto-wrapper
                        message.addField(fieldTitle, fieldText.join('\n'), true);
                    }
                }

                return {
                    content: request.message.author.toString(),
                    options: {
                        embed: message
                    }
                };
            }).catch(err => {
                throw new CommandError(i18next.t('guildwars2:api.response-error', { error: err.content.text }));
            });
        });
    }
}

module.exports = CommandRaids;
