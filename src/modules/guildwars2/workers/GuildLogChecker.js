'use strict';

const Discord = require('discord.js');

const gw2Api = require('../api');

const Worker = require('../../../../bot/modules/Worker');


const models = require('../../../models');


const { createBigEmbedMessage } = require('../../../utils/message');


class WorkerGuildLogChecker extends Worker {
    constructor(bot) {
        super(bot, 'guild-log-checker');
    }

    async check() {
        // Gigantic mess ahead; just don't judge me alright? ;-;
        const config = this.getModule().getConfig();
        const types = config.get(`${this.getId()}.types`);

        const latestLogId = await this.getLatestLog();
        const log = await this._checkLog(latestLogId);

        // Process the stored/live logs
        if (log.length === 0 || !log[0].id || latestLogId === log[0].id) {
            return;
        }
        if (!latestLogId) {
            return this.setLatestLog(log[0].id);
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

        await this.setLatestLog(log[0].id);

        // Get the names of the mentioned items
        const items = new Set();
        for (const type of ['treasury', 'stash']) {
            for (let i = 0; i < parsedLog[type].length; i++) {
                if (parsedLog[type][i].item_id) {
                    items.add(parsedLog[type][i].item_id);
                }
            }
        }

        // Get the names of the mentioned upgrades
        const upgrades = new Set();
        for (let i = 0; i < parsedLog.upgrade.length; i++) {
            if (parsedLog.upgrade[i].upgrade_id) {
                upgrades.add(parsedLog.upgrade[i].upgrade_id);
            }
        }

        // Convert all the stuff to make it human-readable
        const [apiItems, apiUpgrades] = await Promise.all([
            gw2Api.items().many([...items]),
            gw2Api.guild().upgrades().many([...upgrades])
        ]);
        const apiItemsMap = new Map(apiItems.map(item => [item.id, item.name || `[${item.id}]`]));
        for (const type of ['treasury', 'stash']) {
            for (let i = 0; i < parsedLog[type].length; i++) {
                if (parsedLog[type][i].item_id && apiItemsMap.has(parsedLog[type][i].item_id)) {
                    parsedLog[type][i].item = apiItemsMap.get(parsedLog[type][i].item_id);
                }
            }
        }
        const apiUpgradesMap = new Map(apiUpgrades.map(upgrade => [upgrade.id, upgrade.name || `[${upgrade.id}]`]));
        for (let i = 0; i < parsedLog.upgrade.length; i++) {
            if (parsedLog.upgrade[i].upgrade_id && apiUpgradesMap.has(parsedLog.upgrade[i].upgrade_id)) {
                parsedLog.upgrade[i].upgrade = apiUpgradesMap.get(parsedLog.upgrade[i].upgrade_id);
            }
        }

        if (parsedLog.motd.length > 0) {
            // MotD updated
            const motd = parsedLog.motd[parsedLog.motd.length - 1];
            await this.onNewMotd(motd);
        }

        // Check for roster, stash, treasury and upgrade updates
        for (const type of ['roster', 'stash', 'treasury', 'upgrade']) {
            if (parsedLog[type].length > 0) {
                switch (type) {
                    case 'roster':
                        await this.onUpdateRoster(parsedLog[type]); // eslint-disable-line no-await-in-loop
                        break;
                    case 'stash':
                        await this.onUpdateStash(parsedLog[type]); // eslint-disable-line no-await-in-loop
                        break;
                    case 'treasury':
                        await this.onUpdateTreasury(parsedLog[type]); // eslint-disable-line no-await-in-loop
                        break;
                    case 'upgrade':
                        await this.onUpdateUpgrades(parsedLog[type]); // eslint-disable-line no-await-in-loop
                        break;
                    default:
                        break; // Make linter happy
                }
            }
        }
    }

    async _checkLog(sinceLogId) {
        const config = this.getModule().getConfig();
        const apiKey = config.get('guild-leader-api-key');
        const guildId = config.get('guild-id');

        const log = await gw2Api.authenticate(apiKey).guild(guildId).log().since(sinceLogId);
        this.log(`Got ${log.length} new guild log entries`, 'log');
        return log;
    }


    async onNewMotd(motd) {
        const bot = this.getBot();
        const client = bot.getClient();
        const config = this.getConfig();
        const l = bot.getLocalizer();

        const time = new Date(motd.time);
        this.log(`New guild MotD by ${motd.user}`);
        this.emit('new-motd', { motd, time });

        const channelId = config.get('channel-id');
        let channel;
        if (channelId && (channel = client.channels.get(channelId)) && channel.type === 'text') {
            // Try replacing the author's GW2 account name with their known Discord account
            const account = await models.Gw2Account.findOne({ accountName: motd.user });
            const discordUser = account ? channel.guild.members.get(account.discordId) : undefined;

            return channel.send('', {
                embed: new Discord.RichEmbed()
                    .setColor(config.get('richcolor'))
                    .setTitle(l.t('module.guildwars2:guild-log-checker.motd-title'))
                    .setDescription(l.t('module.guildwars2:guild-log-checker.motd-description', motd))
                    .setFooter(l.t('module.guildwars2:guild-log-checker.motd-footer', motd), discordUser ? discordUser.user.avatarURL : undefined)
                    .setTimestamp(time)
            });
        }
    }

    async onUpdateRoster(roster) {
        const client = this.getBot().getClient();
        const config = this.getConfig();

        const time = new Date();
        this.log(`Roster updated with ${roster.length} entries`);
        this.emit('update-roster', { roster, time });

        const channelId = config.get('channel-id');
        let channel;
        if (channelId && (channel = client.channels.get(channelId)) && channel.type === 'text') {
            const embed = await this._createLogMessage('roster', roster, time);
            return channel.send('', { embed });
        }
    }

    async onUpdateStash(stash) {
        const client = this.getBot().getClient();
        const config = this.getConfig();

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
            const embed = await this._createLogMessage('stash', stash, time);
            return channel.send('', { embed });
        }
    }

    async onUpdateTreasury(treasury) {
        const client = this.getBot().getClient();
        const config = this.getConfig();

        const time = new Date();
        this.log(`Treasury updated with ${treasury.length} entries`);
        this.emit('update-treasury', { treasury, time });

        const channelId = config.get('channel-id');
        let channel;
        if (channelId && (channel = client.channels.get(channelId)) && channel.type === 'text') {
            const embed = await this._createLogMessage('treasury', treasury, time);
            return channel.send('', { embed });
        }
    }

    async onUpdateUpgrades(upgrades) {
        const client = this.getBot().getClient();
        const config = this.getConfig();

        const time = new Date();
        this.log(`Upgrades updated with ${upgrades.length} entries`);
        this.emit('update-upgrades', { upgrades, time });

        const channelId = config.get('channel-id');
        let channel;
        if (channelId && (channel = client.channels.get(channelId)) && channel.type === 'text') {
            const embed = await this._createLogMessage('upgrade', upgrades, time);
            return channel.send('', { embed });
        }
    }

    async _createLogMessage(type, items, time) {
        const bot = this.getBot();
        const config = this.getConfig();
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
        const accounts = await models.Gw2Account.find({ accountName: { $in: [...users] } });
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
        const config = this.getConfig();
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


    async getLatestLog() {
        return this.getBot().getCache().get(this.getId(), 'log');
    }

    async setLatestLog(log) {
        return this.getBot().getCache().set(this.getId(), 'log', undefined, log);
    }


    async enableWorker() {
        this._intervalId = setInterval(this.check.bind(this), 300000);
        return this.check();
    }

    async disableWorker() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
        }
    }
}

module.exports = WorkerGuildLogChecker;
