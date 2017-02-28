'use strict';

const
    _ = require('lodash'),
    config = require('config'),
    Discord = require('discord.js'),
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),

    convertHtmlToMarkdown = require('../../utils/text').convertHtmlToMarkdown,

    Module = require('../Module'),
    CommandRegister = require('./CommandRegister'),
    CommandForceRegister = require('./CommandForceRegister'),
    CommandWiki = require('./CommandWiki'),
    HookMemberRole = require('./HookMemberRole'),
    HookWorldRole = require('./HookWorldRole'),

    ReleaseChecker = require('./workers/ReleaseChecker'),
    GuildLogChecker = require('./workers/GuildLogChecker'),
    groupByNumberOfCharacters = require('../../utils/array').groupByNumberOfCharacters;

const emojis = {
    copperConfig: config.get('discord.emojis.copper'),
    silverConfig: config.get('discord.emojis.silver'),
    goldConfig: config.get('discord.emojis.gold'),
};

class ModuleGuildWars2 extends Module {
    constructor(bot, moduleConfig) {
        super(bot, moduleConfig);
        i18next.loadNamespacesAsync('guildwars2');

        this.id = 'guildwars2';
        this.name = 'Guild Wars 2';
        this.registerCommand(new CommandRegister(this));
        this.registerCommand(new CommandForceRegister(this));
        this.registerCommand(new CommandWiki(this));
        this.registerHook(new HookMemberRole(this));
        this.registerHook(new HookWorldRole(this));

        if (this.config.release_checker.enabled) {
            this.bot.client.once('ready', () => {
                const timeout = (this.config.release_checker.timeout || 5) * 60 * 1000;
                ReleaseChecker.start(timeout, 5000, { cache: this.bot.cache, gw2Api: this.bot.gw2Api });

                ReleaseChecker.on('debug', message => console.log(message));
                ReleaseChecker.on('error', err => {
                    console.warn(err.message);
                    console.warn(err.stack);
                });
                ReleaseChecker.on('new build', this.onNewBuild.bind(this));
                ReleaseChecker.on('new release notes', this.onNewReleaseNotes.bind(this));
            });
        }
        if (this.config.guild_log_checker.enabled) {
            this.bot.client.once('ready', () => {
                const timeout = (this.config.guild_log_checker.timeout || 10) * 60 * 1000;
                GuildLogChecker.start(timeout, 5000, {
                    cache: this.bot.cache,
                    gw2Api: this.bot.gw2Api,
                    guildId: this.config.guild_id,
                    apiKey: this.config.guild_leader_api_key,
                    types: this.config.guild_log_checker.types
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
        const role = this.config.guild_member_role;
        if (!role) {
            return;
        }

        const gw2Api = this.bot.gw2Api;
        const key = this.config.guild_leader_api_key;
        const guildId = this.config.guild_id;
        const Gw2Account = this.bot.database.Gw2Account;

        const doEnsure = account => gw2Api.authenticate(key).guild(guildId).members().get().then(members => {
            const member = _.find(members, ['name', account.accountName]);
            if (member) {
                // The user is a member of the guild
                return this.addToGuildRole(user);
            } else {
                // The user is not a member of the guild
                return this.removeFromGuildRole(user);
            }
        });

        if (gw2Account) {
            return doEnsure(gw2Account);
        } else {
            return Gw2Account.findOne({ discordId: user.id }).then(account => {
                if (account) {
                    return doEnsure(account);
                }
            });
        }
    }

    addToGuildRole(user) {
        const role = this.config.guild_member_role;
        if (role && !user.roles.has(role)) {
            return user.addRole(role);
        }
    }

    removeFromGuildRole(user) {
        const role = this.config.guild_member_role;
        if (role && user.roles.has(role)) {
            return user.removeRole(role);
        }
    }

    ensureWorldMembership(user, gw2Account) {
        const roles = this.config.world_member_roles;
        if (!roles || roles.length === 0) {
            return;
        }

        const gw2Api = this.bot.gw2Api;
        const Gw2Account = this.bot.database.Gw2Account;

        const doEnsure = account => gw2Api.authenticate(account.apiKey).account().get()
            .then(accountInfo => this.applyWorldRoles(user, accountInfo.world));

        if (gw2Account) {
            return doEnsure(gw2Account);
        } else {
            return Gw2Account.findOne({ discordId: user.id }).then(account => {
                if (account) {
                    return doEnsure(account);
                }
            });
        }
    }

    applyWorldRoles(user, world) {
        const worldRoles = this.config.world_member_roles;
        const exec = [];
        if (worldRoles[world] && !user.roles.has(worldRoles[world])) {
            console.log(`Adding role ${worldRoles[world]}`);
            exec.push(user.addRole(worldRoles[world]));
        }
        const excluded = Object.values(_.pickBy(worldRoles, (roleId, worldId) => {
            worldId = parseInt(worldId);
            return worldId !== world && user.roles.has(worldRoles[worldId]);
        }));
        if (excluded.length > 0) {
            console.log(`Removing roles ${excluded}`);
            exec.push(user.removeRoles(excluded));
        }
        return Promise.all(exec);
    }


    onNewBuild(build, date) {
        const channelId = this.config.release_checker.target_channel;
        let channel;
        if ((channel = this.bot.client.channels.get(channelId)) && channel.type === 'text') {
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
        const channelId = this.config.release_checker.target_channel;
        let channel;
        if ((channel = this.bot.client.channels.get(channelId)) && channel.type === 'text') {
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
        const channelId = this.config.guild_log_checker.target_channel;
        let channel;
        if ((channel = this.bot.client.channels.get(channelId)) && channel.type === 'text') {
            // Try replacing the author's GW2 account name with their known Discord account
            const Gw2Account = this.bot.database.Gw2Account;
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
        const channelId = this.config.guild_log_checker.target_channel;
        let channel;
        if ((channel = this.bot.client.channels.get(channelId)) && channel.type === 'text') {
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
        const channelId = this.config.guild_log_checker.target_channel;
        let channel;
        if ((channel = this.bot.client.channels.get(channelId)) && channel.type === 'text') {
            // Get all GW2 account names
            const Gw2Account = this.bot.database.Gw2Account;
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
                embed.addField('\u200B', messages[j], true);
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
