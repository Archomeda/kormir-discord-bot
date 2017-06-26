'use strict';

const Discord = require('discord.js');
const Promise = require('bluebird');

const gw2Api = require('../api');

const Worker = require('../../../../bot/modules/Worker');


const models = require('../../../models');


const { createBigEmbedMessage } = require('../../../utils/message');


class WorkerGuildLogChecker extends Worker {
    constructor(bot) {
        super(bot, 'guild-log-checker');
    }

    check() {
        // Gigantic mess ahead; just don't judge me alright? ;-;
        const config = this.getModule().getConfig();
        const types = config.get(`${this.getId()}.types`);

        return this.getLatestLog().then(latestLogId =>
            this.checkLog(latestLogId).then(log => [latestLogId, log])
        ).then(([latestLogId, log]) => {
            // Process the stored/live logs
            if (log.length === 0 || !log[0].id || latestLogId === log[0].id) {
                return;
            }

            if (!latestLogId) {
                return this.setLatestLog(log[0].id).return(undefined);
            }

            // Parse the log
            const parsedLog = {
                motd: [],
                roster: [],
                treasury: new Map(),
                stash: new Map(),
                upgrade: new Map()
            };
            for (const entry of log) {
                if (entry.type === 'kick' && entry.user === entry.kicked_by) {
                    entry.type = 'leave';
                }
                if (types.includes(entry.type)) {
                    let key;
                    let item;
                    switch (entry.type) {
                        case 'motd':
                            parsedLog.motd.unshift({ type: 'motd', user: entry.user, motd: entry.motd, time: entry.time });
                            break;
                        case 'invited':
                            parsedLog.roster.unshift({ type: 'invited', user: entry.user, invited_by: entry.invited_by, time: entry.time }); // eslint-disable-line camelcase
                            break;
                        case 'joined':
                            parsedLog.roster.unshift({ type: 'joined', user: entry.user, time: entry.time });
                            break;
                        case 'leave':
                            parsedLog.roster.unshift({ type: 'left', user: entry.user, time: entry.time });
                            break;
                        case 'kick':
                            parsedLog.roster.unshift({ type: 'kicked', user: entry.user, kicked_by: entry.kicked_by, time: entry.time }); // eslint-disable-line camelcase
                            break;
                        case 'rank_change':
                            parsedLog.roster.unshift({ type: 'rank-changed', user: entry.user, old_rank: entry.old_rank, new_rank: entry.new_rank, changed_by: entry.changed_by, time: entry.time }); // eslint-disable-line camelcase
                            break;
                        case 'treasury':
                            key = `${entry.user}-${entry.item_id}`;
                            item = parsedLog.treasury.get(key);
                            if (item) {
                                parsedLog.treasury.set(key, { type: 'treasury', user: entry.user, item_id: entry.item_id, count: item.count + entry.count, time: entry.time }); // eslint-disable-line camelcase
                            } else {
                                parsedLog.treasury.set(key, { type: 'treasury', user: entry.user, item_id: entry.item_id, count: entry.count, time: entry.time }); // eslint-disable-line camelcase
                            }
                            break;
                        case 'stash':
                            if (entry.item_id && entry.operation) {
                                key = `${entry.user}-item-${entry.item_id}`;
                                item = parsedLog.stash.get(key);
                                const count = entry.operation === 'deposit' ? entry.count : entry.operation === 'withdraw' ? -entry.count : 0;
                                if (item) {
                                    parsedLog.stash.set(key, { type: 'stash-item', user: entry.user, item_id: entry.item_id, count: item.count + count, time: entry.time }); // eslint-disable-line camelcase
                                } else {
                                    parsedLog.stash.set(key, { type: 'stash-item', user: entry.user, item_id: entry.item_id, count, time: entry.time }); // eslint-disable-line camelcase
                                }
                            } else if (entry.coins && entry.operation) {
                                key = `${entry.user}-coins`;
                                item = parsedLog.stash.get(key);
                                const count = entry.operation === 'deposit' ? entry.coins : entry.operation === 'withdraw' ? -entry.coins : 0;
                                if (item) {
                                    parsedLog.stash.set(key, { type: 'stash-coins', user: entry.user, coins: item.coins + count, time: entry.time });
                                } else {
                                    parsedLog.stash.set(key, { type: 'stash-coins', user: entry.user, coins: count, time: entry.time });
                                }
                            }
                            break;
                        case 'upgrade':
                            if (entry.action === 'completed') {
                                key = `${entry.user}-${entry.upgrade_id}`;
                                item = parsedLog.upgrade.get(key);
                                if (item) {
                                    parsedLog.upgrade.set(key, { type: 'upgrade', user: entry.user, upgrade_id: entry.upgrade_id, count: item.count + entry.count, time: entry.time }); // eslint-disable-line camelcase
                                } else {
                                    parsedLog.upgrade.set(key, { type: 'upgrade', user: entry.user, upgrade_id: entry.upgrade_id, count: entry.count, time: entry.time }); // eslint-disable-line camelcase
                                }
                            }
                            break;
                        default:
                            break; // Make linter happy
                    }
                }
            }
            for (const type of ['treasury', 'stash', 'upgrade']) {
                parsedLog[type] = [...parsedLog[type].values()];
                parsedLog[type].sort((a, b) => a.time.localeCompare(b.time));
            }
            parsedLog.stash = parsedLog.stash
                .filter(item => item.count || item.coins)
                .map(item => ({
                    type: `${item.type}-${item.count > 0 || item.coins > 0 ? 'deposit' : 'withdraw'}`,
                    user: item.user,
                    item_id: item.item_id, // eslint-disable-line camelcase
                    count: item.count ? item.count > 0 ? item.count : -item.count : undefined,
                    coins: item.coins ? item.coins > 0 ? item.coins : -item.coins : undefined,
                    time: item.time
                }));

            return this.setLatestLog(log[0].id).return(parsedLog);
        }).then(log => {
            if (!log) {
                return;
            }

            // Get the names of the mentioned items
            const items = new Set();
            for (const type of ['treasury', 'stash']) {
                for (let i = 0; i < log[type].length; i++) {
                    if (log[type][i].item_id) {
                        items.add(log[type][i].item_id);
                    }
                }
            }

            // Get the names of the mentioned upgrades
            const upgrades = new Set();
            for (let i = 0; i < log.upgrade.length; i++) {
                if (log.upgrade[i].upgrade_id) {
                    upgrades.add(log.upgrade[i].upgrade_id);
                }
            }

            // Convert all the stuff to make it human-readable
            return Promise.all([
                gw2Api.items().many([...items]).then(items => {
                    const map = new Map(items.map(item => [item.id, item.name || `[${item.id}]`]));

                    for (const type of ['treasury', 'stash']) {
                        for (let i = 0; i < log[type].length; i++) {
                            if (log[type][i].item_id && map.has(log[type][i].item_id)) {
                                log[type][i].item = map.get(log[type][i].item_id);
                            }
                        }
                    }
                }),
                gw2Api.guild().upgrades().many([...upgrades]).then(upgrades => {
                    const map = new Map(upgrades.map(upgrade => [upgrade.id, upgrade.name || `[${upgrade.id}]`]));

                    for (let i = 0; i < log.upgrade.length; i++) {
                        if (log.upgrade[i].upgrade_id && map.has(log.upgrade[i].upgrade_id)) {
                            log.upgrade[i].upgrade = map.get(log.upgrade[i].upgrade_id);
                        }
                    }
                })
            ]).return(log);
        }).then(log => {
            if (!log) {
                return;
            }

            if (log.motd.length > 0) {
                // MotD updated
                const motd = log.motd[log.motd.length - 1];
                this.onNewMotd(motd);
            }

            // Check for roster, stash, treasury and upgrade updates
            for (const type of ['roster', 'stash', 'treasury', 'upgrade']) {
                if (log[type].length > 0) {
                    switch (type) {
                        case 'roster':
                            this.onUpdateRoster(log[type]);
                            break;
                        case 'stash':
                            this.onUpdateStash(log[type]);
                            break;
                        case 'treasury':
                            this.onUpdateTreasury(log[type]);
                            break;
                        case 'upgrade':
                            this.onUpdateUpgrades(log[type]);
                            break;
                        default:
                            break; // Make linter happy
                    }
                }
            }
        });
    }

    checkLog(sinceLogId) {
        const config = this.getModule().getConfig();
        const apiKey = config.get('guild-leader-api-key');
        const guildId = config.get('guild-id');

        return gw2Api.authenticate(apiKey).guild(guildId).log().since(sinceLogId).then(log => {
            if (sinceLogId) {
                log = log.filter(entry => entry.id > sinceLogId);
            }
            this.log(`Got ${log.length} new guild log entries`, 'log');
            return log;
        });
    }


    onNewMotd(motd) {
        const bot = this.getBot();
        const client = bot.getClient();
        const config = this.getModule().getConfig().root(this.getId());
        const l = bot.getLocalizer();

        const time = new Date(motd.time);
        this.log(`New guild MotD by ${motd.user}`);
        this.emit('new-motd', { motd, time });

        const channelId = config.get('channel-id');
        let channel;
        if (channelId && (channel = client.channels.get(channelId)) && channel.type === 'text') {
            // Try replacing the author's GW2 account name with their known Discord account
            models.Gw2Account.findOne({ accountName: motd.user }).then(account => {
                const discordUser = account ? channel.guild.members.get(account.discordId) : undefined;

                channel.send('', {
                    embed: new Discord.RichEmbed()
                        .setColor(config.get('richcolor'))
                        .setTitle(l.t('module.guildwars2:guild-log-checker.motd-title'))
                        .setDescription(l.t('module.guildwars2:guild-log-checker.motd-description', motd))
                        .setFooter(l.t('module.guildwars2:guild-log-checker.motd-footer', motd), discordUser ? discordUser.user.avatarURL : undefined)
                        .setTimestamp(time)
                });
            });
        }
    }

    onUpdateRoster(roster) {
        const client = this.getBot().getClient();
        const config = this.getModule().getConfig().root(this.getId());

        const time = new Date();
        this.log(`Roster updated with ${roster.length} entries`);
        this.emit('update-roster', { roster, time });

        const channelId = config.get('channel-id');
        let channel;
        if (channelId && (channel = client.channels.get(channelId)) && channel.type === 'text') {
            this.createLogMessage('roster', roster, time).then(embed => channel.send('', { embed }));
        }
    }

    onUpdateStash(stash) {
        const client = this.getBot().getClient();
        const config = this.getModule().getConfig().root(this.getId());

        const time = new Date();
        this.log(`Stash updated with ${stash.length} entries`);
        this.emit('update-stash', { stash, time });

        const channelId = config.get('channel-id');
        let channel;
        if (channelId && (channel = client.channels.get(channelId)) && channel.type === 'text') {
            for (let i = 0; i < stash.length; i++) {
                if (stash[i].coins) {
                    stash[i].coins = this.convertCoinsToText(channel.guild, stash[i].coins);
                }
            }
            this.createLogMessage('stash', stash, time).then(embed => channel.send('', { embed }));
        }
    }

    onUpdateTreasury(treasury) {
        const client = this.getBot().getClient();
        const config = this.getModule().getConfig().root(this.getId());

        const time = new Date();
        this.log(`Treasury updated with ${treasury.length} entries`);
        this.emit('update-treasury', { treasury, time });

        const channelId = config.get('channel-id');
        let channel;
        if (channelId && (channel = client.channels.get(channelId)) && channel.type === 'text') {
            this.createLogMessage('treasury', treasury, time).then(embed => channel.send('', { embed }));
        }
    }

    onUpdateUpgrades(upgrades) {
        const client = this.getBot().getClient();
        const config = this.getModule().getConfig().root(this.getId());

        const time = new Date();
        this.log(`Upgrades updated with ${upgrades.length} entries`);
        this.emit('update-upgrades', { upgrades, time });

        const channelId = config.get('channel-id');
        let channel;
        if (channelId && (channel = client.channels.get(channelId)) && channel.type === 'text') {
            this.createLogMessage('upgrade', upgrades, time).then(embed => channel.send('', { embed }));
        }
    }

    createLogMessage(type, items, time) {
        const bot = this.getBot();
        const config = this.getModule().getConfig().root(this.getId());
        const client = bot.getClient();
        const l = bot.getLocalizer();

        // Get all GW2 account names
        const users = new Set();
        for (let i = 0; i < items.length; i++) {
            for (const userType of ['user', 'invited_by', 'kicked_by', 'changed_by']) {
                if (items[i][userType]) {
                    users.add(items[i][userType]);
                }
            }
        }

        // Replace GW2 account names with their known Discord accounts
        return models.Gw2Account.find({ accountName: { $in: [...users] } }).then(accounts => {
            const map = new Map(accounts.map(account => [account.accountName, client.users.get(account.discordId).toString() || account.accountName]));

            for (let i = 0; i < items.length; i++) {
                for (const userType of ['user', 'invited_by', 'kicked_by', 'changed_by']) {
                    let discordName;
                    if (items[i][userType] && (discordName = map.get(items[i][userType]))) {
                        items[i][userType] = discordName;
                    }
                }
            }

            return createBigEmbedMessage(items.map(item => l.t(`module.guildwars2:guild-log-checker.${item.type}-description`, item)))
                .setColor(config.get('richcolor'))
                .setTitle(l.t(`module.guildwars2:guild-log-checker.${type}-title`))
                .setTimestamp(time);
        });
    }

    convertCoinsToText(guild, coins) {
        const l = this.getBot().getLocalizer();
        const emojis = this.getEmojis(guild, ['gold', 'silver', 'copper']);
        const copper = coins % 100;
        const silver = ((coins / 100) | 0) % 100;
        const gold = (coins / 10000) | 0;
        const text = [];
        if (gold > 0) {
            text.push(`${gold}${emojis.get('gold') || l.t('module.guildwars2:guild-log-checker.coins-gold')}`);
        }
        if (silver > 0) {
            text.push(`${silver}${emojis.get('silver') || l.t('module.guildwars2:guild-log-checker.coins-silver')}`);
        }
        if (copper > 0) {
            text.push(`${copper}${emojis.get('copper') || l.t('module.guildwars2:guild-log-checker.coins-copper')}`);
        }
        return text.join(' ');
    }

    getEmojis(guild, names) {
        const config = this.getModule().getConfig();
        if (!Array.isArray(names)) {
            names = [names];
        }
        const emojis = new Map(names.map(n => [config.get(`/discord.emojis.${n}`)]));
        guild.emojis.forEach(e => {
            if (names.includes(e.name)) {
                emojis.set(e.name, e);
            }
        });
        return emojis;
    }


    getLatestLog() {
        return this.getBot().getCache().get(this.getId(), 'log');
    }

    setLatestLog(log) {
        return this.getBot().getCache().set(this.getId(), 'log', undefined, log);
    }


    enableWorker() {
        this._intervalId = setInterval(this.check.bind(this), 300000);
        this.check();
    }

    disableWorker() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
        }
    }
}

module.exports = WorkerGuildLogChecker;
