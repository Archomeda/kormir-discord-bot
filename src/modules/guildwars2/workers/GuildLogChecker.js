'use strict';

const
    Promise = require('bluebird'),

    BackgroundWorker = require('../../BackgroundWorker');

/**
 * A worker for checking for Guild Wars 2 guild logs.
 */
class GuildLogChecker extends BackgroundWorker {
    run() {
        // Gigantic mess ahead; just don't judge me alright? ;-;

        return this.getLatestGuildLog().then(latestLogId =>
            this.checkLog(this.guildId, this.apiKey, latestLogId).then(log => [latestLogId, log])
        ).then(([latestLogId, log]) => {
            // Process the stored/live logs
            if (log.length === 0 || !log[0].id || latestLogId === log[0].id) {
                return;
            }

            if (!latestLogId) {
                return this.setLatestGuildLog(log[0].id).return(undefined);
            }

            // Parse the log
            const parsedLog = {
                motd: [],
                roster: [],
                treasury: new Map(),
                stash: new Map(),
                upgrade: new Map()
            };
            for (let entry of log) {
                if (entry.type === 'kick' && entry.user === entry.kicked_by) {
                    entry.type = 'leave';
                }
                if (this.types.includes(entry.type)) {
                    let key;
                    let item;
                    switch (entry.type) {
                        case 'motd':
                            parsedLog.motd.unshift({ type: 'motd', user: entry.user, motd: entry.motd, time: entry.time });
                            break;
                        case 'invited':
                            parsedLog.roster.unshift({ type: 'invited', user: entry.user, invited_by: entry.invited_by, time: entry.time });
                            break;
                        case 'joined':
                            parsedLog.roster.unshift({ type: 'joined', user: entry.user, time: entry.time });
                            break;
                        case 'leave':
                            parsedLog.roster.unshift({ type: 'left', user: entry.user, time: entry.time });
                            break;
                        case 'kick':
                            parsedLog.roster.unshift({ type: 'kicked', user: entry.user, kicked_by: entry.kicked_by, time: entry.time });
                            break;
                        case 'rank_change':
                            parsedLog.roster.unshift({ type: 'rank-changed', user: entry.user, old_rank: entry.old_rank, new_rank: entry.new_rank, changed_by: entry.changed_by, time: entry.time });
                            break;
                        case 'treasury':
                            key = `${entry.user}-${entry.item_id}`;
                            item = parsedLog.treasury.get(key);
                            if (item) {
                                parsedLog.treasury.set(key, { type: 'treasury', user: entry.user, item_id: entry.item_id, count: item.count + entry.count, time: entry.time });
                            } else {
                                parsedLog.treasury.set(key, { type: 'treasury', user: entry.user, item_id: entry.item_id, count: entry.count, time: entry.time });
                            }
                            break;
                        case 'stash':
                            if (entry.item_id && entry.operation) {
                                key = `${entry.user}-item-${entry.item_id}`;
                                item = parsedLog.stash.get(key);
                                let count = entry.operation === 'deposit' ? entry.count : entry.operation === 'withdraw' ? -entry.count : 0;
                                if (item) {
                                    parsedLog.stash.set(key, { type: `stash-item`, user: entry.user, item_id: entry.item_id, count: item.count + count, time: entry.time });
                                } else {
                                    parsedLog.stash.set(key, { type:`stash-item`, user: entry.user, item_id: entry.item_id, count: count, time: entry.time });
                                }
                            } else if (entry.coins && entry.operation) {
                                key = `${entry.user}-coins`;
                                item = parsedLog.stash.get(key);
                                let count = entry.operation === 'deposit' ? entry.coins : entry.operation === 'withdraw' ? -entry.coins : 0;
                                if (item) {
                                    parsedLog.stash.set(key, { type: `stash-coins`, user: entry.user, coins: item.coins + count, time: entry.time });
                                } else {
                                    parsedLog.stash.set(key, { type: `stash-coins`, user: entry.user, coins: count, time: entry.time });
                                }
                            }
                            break;
                        case 'upgrade':
                            if (entry.action === 'completed') {
                                key = `${entry.user}-${entry.upgrade_id}`;
                                item = parsedLog.upgrade.get(key);
                                if (item) {
                                    parsedLog.upgrade.set(key, { type: 'upgrade', user: entry.user, upgrade_id: entry.upgrade_id, count: item.count + entry.count, time: entry.time });
                                } else {
                                    parsedLog.upgrade.set(key, { type: 'upgrade', user: entry.user, upgrade_id: entry.upgrade_id, count: entry.count, time: entry.time });
                                }
                            }
                            break;
                    }
                }
            }
            for (let type of ['treasury', 'stash', 'upgrade']) {
                parsedLog[type] = [...parsedLog[type].values()];
                parsedLog[type].sort((a, b) => a.time.localeCompare(b.time));
            }
            parsedLog.stash = parsedLog.stash
                .filter(item => item.count || item.coins)
                .map(item => ({
                    type: `${item.type}-${item.count > 0 || item.coins > 0 ? 'deposit' : 'withdraw'}`,
                    user: item.user,
                    item_id: item.item_id,
                    count: item.count ? item.count > 0 ? item.count : -item.count : undefined,
                    coins: item.coins ? item.coins > 0 ? item.coins : -item.coins : undefined,
                    time: item.time
                }));

            return this.setLatestGuildLog(log[0].id).return(parsedLog);
        }).then(log => {
            if (!log) {
                return;
            }

            // Get the names of the mentioned items
            const items = new Set();
            for (let type of ['treasury', 'stash']) {
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
                this.gw2Api.items().many([...items]).then(items => {
                    const map = new Map(items.map(item => [item.id, item.name || `[${item.id}]`]));

                    for (let type of ['treasury', 'stash']) {
                        for (let i = 0; i < log[type].length; i++) {
                            if (log[type][i].item_id && map.has(log[type][i].item_id)) {
                                log[type][i].item = map.get(log[type][i].item_id);
                            }
                        }
                    }
                }),
                this.gw2Api.guild().upgrades().many([...upgrades]).then(upgrades => {
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
                this.debug(`Emitting motd update of ${motd.time} by ${motd.user}`);
                this.emit('motd update', motd, new Date(motd.time));
            }

            // Check for roster, stash, treasury and upgrade updates
            for (let type of ['roster', 'stash', 'treasury', 'upgrade']) {
                if (log[type].length > 0) {
                    this.debug(`Emitting ${type} update with ${log[type].length} items`);
                    this.emit(`${type} update`, log[type], new Date());
                }
            }
        });
    }


    checkLog(guildId, apiKey, sinceLogId) {
        return this.gw2Api.authenticate(apiKey).guild(guildId).log().get().then(log => {
            this.debug(`Got guild log of ${guildId}`);
            log = log.filter(entry => entry.id > sinceLogId);
            this.debug(`Number of new guild log entries: ${log.length}`);
            return log;
        });
    }


    getLatestGuildLog() {
        return this.cache.get('guildlog', 'latest_entry');
    }

    setLatestGuildLog(id) {
        return this.cache.set('guildlog', 'latest_entry', undefined, id);
    }
}

module.exports = new GuildLogChecker();
