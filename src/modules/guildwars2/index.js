'use strict';

const _ = require('lodash');
const Discord = require('discord.js');
const Promise = require('bluebird');
const i18next = Promise.promisifyAll(require('i18next'));

const convertHtmlToMarkdown = require('../../utils/text').convertHtmlToMarkdown;
const groupByNumberOfCharacters = require('../../utils/array').groupByNumberOfCharacters;

const bot = require('../../bot');
const Module = require('../Module');
const CommandRegister = require('./CommandRegister');
const CommandForceRegister = require('./CommandForceRegister');
const CommandWiki = require('./CommandWiki');
const CommandCats = require('./CommandCats');
const CommandRaids = require('./CommandRaids');
const CommandQuaggan = require('./CommandQuaggan');
const HookMemberRole = require('./HookMemberRole');
const HookWorldRole = require('./HookWorldRole');

const ReleaseChecker = require('./workers/ReleaseChecker');
const GuildLogChecker = require('./workers/GuildLogChecker');


const emojis = {
    copperConfig: bot.config.get('discord.emojis.copper'),
    silverConfig: bot.config.get('discord.emojis.silver'),
    goldConfig: bot.config.get('discord.emojis.gold')
};

class ModuleGuildWars2 extends Module {
    constructor() {
        super({
            name: 'Guild Wars 2',
            id: 'guildwars2'
        });
        i18next.loadNamespacesAsync('guildwars2');

        this.registerCommand(new CommandRegister(this));
        this.registerCommand(new CommandForceRegister(this));
        this.registerCommand(new CommandWiki(this));
        this.registerCommand(new CommandCats(this));
        this.registerCommand(new CommandRaids(this));
        this.registerCommand(new CommandQuaggan(this));
        this.registerHook(new HookMemberRole(this));
        this.registerHook(new HookWorldRole(this));

        if (this.config.has('release_checker.enabled') && this.config.get('release_checker.enabled')) {
            bot.client.once('ready', () => {
                const timeout = ((this.config.has('release_checker.timeout') && this.config.get('release_checker.timeout')) || 5) * 60 * 1000;
                ReleaseChecker.start(timeout, 5000, { cache: bot.cache, gw2Api: bot.gw2Api });

                ReleaseChecker.on('debug', message => console.log(message));
                ReleaseChecker.on('error', err => {
                    console.warn(err.message);
                    console.warn(err.stack);
                });
                ReleaseChecker.on('new build', this.onNewBuild.bind(this));
                ReleaseChecker.on('new release notes', this.onNewReleaseNotes.bind(this));
            });
        }
        if (this.config.has('guild_log_checker.enabled') && this.config.get('guild_log_checker.enabled')) {
            bot.client.once('ready', () => {
                const timeout = ((this.config.has('guild_log_checker.timeout') && this.config.get('guild_log_checker.timeout')) || 10) * 60 * 1000;
                GuildLogChecker.start(timeout, 5000, {
                    cache: bot.cache,
                    gw2Api: bot.gw2Api,
                    guildId: this.config.get('guild_id'),
                    apiKey: this.config.get('guild_leader_api_key'),
                    types: this.config.get('guild_log_checker.types')
                });

                GuildLogChecker.on('debug', message => console.log(message));
                GuildLogChecker.on('error', err => {
                    console.warn(err.message);
                    console.warn(err.stack);
                });
                GuildLogChecker.on('motd update', this.onUpdateMotd.bind(this));
                GuildLogChecker.on('roster update', this.onUpdateRoster.bind(this));
                GuildLogChecker.on('stash update', this.onUpdateStash.bind(this));
                GuildLogChecker.on('treasury update', this.onUpdateTreasury.bind(this));
                GuildLogChecker.on('upgrade update', this.onUpdateUpgrade.bind(this));
            });
        }
    }


    ensureGuildMembership(user, gw2Account) {
        const role = this.config.get('guild_member_role');
        if (!role) {
            return;
        }

        const key = this.config.get('guild_leader_api_key');
        const guildId = this.config.guild_id;
        const Gw2Account = bot.database.Gw2Account;

        const doEnsure = account => bot.gw2Api.authenticate(key).guild(guildId).members().get().then(members => {
            const member = _.find(members, ['name', account.accountName]);
            if (user.guild) {
                // Guild member instance
                return member ? this.addToGuildRole(user) : this.removeFromGuildRole(user);
            } else {
                // Just a generic user, convert it to all known guild users
                const exec = bot.client.guilds
                    .map(s => s.member(user))
                    .filter(su => su)
                    .map(su => member ? this.addToGuildRole(su) : this.removeFromGuildRole(su));
                return Promise.all(exec);
            }
        });

        if (!gw2Account) {
            return Gw2Account.findOne({ discordId: user.id }).then(account => {
                if (account) {
                    return doEnsure(account);
                }
            });
        }
        return doEnsure(gw2Account);
    }

    addToGuildRole(user) {
        const role = this.config.has('guild_member_role') && this.config.get('guild_member_role');
        if (role && !user.roles.has(role)) {
            return user.addRole(role);
        }
    }

    removeFromGuildRole(user) {
        const role = this.config.has('guild_member_role') && this.config.get('guild_member_role');
        if (role && user.roles.has(role)) {
            return user.removeRole(role);
        }
    }

    ensureWorldMembership(user, gw2Account) {
        const roles = this.config.has('world_member_roles') && this.config.get('world_member_roles');
        if (!roles || roles.length === 0) {
            return;
        }

        const Gw2Account = bot.database.Gw2Account;

        const doEnsure = account => bot.gw2Api.authenticate(account.apiKey).account().get()
            .then(accountInfo => this.applyWorldRoles(user, accountInfo.world));

        if (!gw2Account) {
            return Gw2Account.findOne({ discordId: user.id }).then(account => {
                if (account) {
                    return doEnsure(account);
                }
            });
        }
        return doEnsure(gw2Account);
    }

    applyWorldRoles(user, world) {
        if (!this.config.has('world_member_roles')) {
            return;
        }

        const worldRoles = this.config.get('world_member_roles');
        const exec = [];
        if (worldRoles[world] && !user.roles.has(worldRoles[world])) {
            console.log(`Adding role ${worldRoles[world]}`);
            exec.push(user.addRole(worldRoles[world]));
        }
        const excluded = Object.values(_.pickBy(worldRoles, (roleId, worldId) => {
            worldId = parseInt(worldId, 10);
            return worldId !== world && user.roles.has(worldRoles[worldId]);
        }));
        if (excluded.length > 0) {
            console.log(`Removing roles ${excluded}`);
            exec.push(user.removeRoles(excluded));
        }
        return Promise.all(exec);
    }


    onNewBuild(build, date) {
        const channelId = this.config.has('release_checker.target_channel') && this.config.get('release_checker.target_channel');
        let channel;
        if (channelId && (channel = bot.client.channels.get(channelId)) && channel.type === 'text') {
            channel.sendEmbed(new Discord.RichEmbed()
                .setColor([0, 200, 0])
                .setThumbnail('https://dviw3bl0enbyw.cloudfront.net/sprites/0000/0041/Frm_ICON_Announcements.jpg')
                .setTitle(i18next.t('guildwars2:release-checker.build-update-title'))
                .setDescription(i18next.t('guildwars2:release-checker.build-update-description', { build: build.toLocaleString() }))
                .setTimestamp(date)
            );
        }
    }

    onNewReleaseNotes(releaseNotes, date) {
        const channelId = this.config.has('release_checker.target_channel') && this.config.get('release_checker.target_channel');
        let channel;
        if (channelId && (channel = bot.client.channels.get(channelId)) && channel.type === 'text') {
            let text = convertHtmlToMarkdown(releaseNotes.description, 'feed');
            text = text.replace(/^([a-zA-Z0-9 ]+.\d{4})[^:]+: /, '');
            channel.sendEmbed(new Discord.RichEmbed()
                .setColor([200, 200, 0])
                .setThumbnail('https://dviw3bl0enbyw.cloudfront.net/sprites/0000/0041/Frm_ICON_Announcements.jpg')
                .setURL(releaseNotes.link)
                .setTitle(releaseNotes.title)
                .setDescription(text)
                .setTimestamp(date)
            );
        }
    }


    onUpdateMotd(motd, date) {
        const channelId = this.config.has('guild_log_checker.target_channel') && this.config.get('guild_log_checker.target_channel');
        let channel;
        if (channelId && (channel = bot.client.channels.get(channelId)) && channel.type === 'text') {
            // Try replacing the author's GW2 account name with their known Discord account
            const Gw2Account = bot.database.Gw2Account;
            Gw2Account.findOne({ accountName: motd.user }).then(account => {
                let discordUser = account ? channel.guild.members.get(account.discordId) : undefined;

                channel.sendEmbed(new Discord.RichEmbed()
                    .setColor([150, 100, 250])
                    .setTitle(i18next.t('guildwars2:guild-log-checker.motd-title'))
                    .setDescription(i18next.t('guildwars2:guild-log-checker.motd-description', motd))
                    .setTimestamp(date)
                    .setFooter(i18next.t('guildwars2:guild-log-checker.motd-footer', motd), discordUser ? discordUser.user.avatarURL : undefined)
                );
            });
        }
    }

    onUpdateRoster(roster, date) {
        this.sendGuildLogMessage('roster', roster, date);
    }

    onUpdateStash(stash, date) {
        const channelId = this.config.has('guild_log_checker.target_channel') && this.config.get('guild_log_checker.target_channel');
        let channel;
        if (channelId && (channel = bot.client.channels.get(channelId)) && channel.type === 'text') {
            for (let i = 0; i < stash.length; i++) {
                if (stash[i].coins) {
                    stash[i].coins = this.convertCoinsToText(channel.guild, stash[i].coins);
                }
            }
            this.sendGuildLogMessage('stash', stash, date);
        }
    }

    onUpdateTreasury(treasury, date) {
        this.sendGuildLogMessage('treasury', treasury, date);
    }

    onUpdateUpgrade(upgrade, date) {
        this.sendGuildLogMessage('upgrade', upgrade, date);
    }

    sendGuildLogMessage(type, items, date) {
        const channelId = this.config.has('guild_log_checker.target_channel') && this.config.get('guild_log_checker.target_channel');
        let channel;
        if (channelId && (channel = bot.client.channels.get(channelId)) && channel.type === 'text') {
            // Get all GW2 account names
            const Gw2Account = bot.database.Gw2Account;
            const users = new Set();
            for (let i = 0; i < items.length; i++) {
                for (let userType of ['user', 'invited_by', 'kicked_by', 'changed_by']) {
                    if (items[i][userType]) {
                        users.add(items[i][userType]);
                    }
                }
            }

            // Replace GW2 account names with their known Discord accounts
            Gw2Account.find({ accountName: { $in: [...users] } }).then(accounts => {
                const map = new Map(accounts.map(account => [account.accountName, channel.guild.members.get(account.discordId) || account.accountName]));

                for (let i = 0; i < items.length; i++) {
                    for (let userType of ['user', 'invited_by', 'kicked_by', 'changed_by']) {
                        let discordName;
                        if (items[i][userType] && (discordName = map.get(items[i][userType]))) {
                            items[i][userType] = discordName;
                        }
                    }
                }

                const embed = this.makeBigEmbedMessage(
                    new Discord.RichEmbed()
                        .setColor([150, 100, 250])
                        .setTitle(i18next.t(`guildwars2:guild-log-checker.${type}-title`))
                        .setTimestamp(date),
                    items.map(item => i18next.t(`guildwars2:guild-log-checker.${item.type}-description`, item))
                );
                channel.sendEmbed(embed);
            });
        }
    }


    makeBigEmbedMessage(embed, description) {
        if (typeof description === 'string') {
            description = description.split('\n');
        }
        const messages = groupByNumberOfCharacters(description, [2048, 1024], '\n');

        for (let j = 0; j < messages.length; j++) {
            if (j === 0) {
                embed.setDescription(messages[j]);
            } else {
                embed.addField('\u200B', messages[j]);
            }
        }
        return embed;
    }

    convertCoinsToText(guild, coins) {
        const copper = coins % 100;
        const silver = ((coins / 100) | 0) % 100;
        const gold = (coins / 10000) | 0;
        let text;
        if (copper > 0) {
            text = `${copper}${this.getEmoji(guild, 'copper') || 'c'}`;
        }
        if (silver > 0) {
            text = `${silver}${this.getEmoji(guild, 'silver') || 's'}${text ? ' ' + text : ''}`;
        }
        if (gold > 0) {
            text = `${gold}${this.getEmoji(guild, 'gold') || 'g'}${text ? ' ' + text : ''}`;
        }
        return text;
    }

    getEmoji(guild, name) {
        if (emojis[name]) {
            return emojis[name];
        }
        emojis[name] = guild.emojis.find('name', emojis[`${name}Config`]);
        return emojis[name];
    }
}

module.exports = ModuleGuildWars2;
