'use strict';

const Discord = require('discord.js');

const DiscordCommand = require('../../../modules/DiscordCommand');
const DiscordReplyMessage = require('../../../modules/DiscordReplyMessage');


class CommandInfo extends DiscordCommand {
    constructor(bot) {
        super(bot, 'info', ['info']);
        this._localizerNamespaces = ['bot.general', 'module.general'];
    }

    async onCommand(request) { // eslint-disable-line no-unused-vars
        const bot = this.getBot();
        const client = bot.getClient();
        const l = bot.getLocalizer();
        const embed = new Discord.RichEmbed()
            .setTitle(l.t('module.general:info.response-title', { name: client.user.username }))
            .setDescription(l.t('bot.general:description'))
            .setThumbnail(client.user.avatarURL)
            .addField(
                l.t('module.general:info.response-memory-usage'),
                l.t('module.general:info.response-memory-usage-value', { memory: process.memoryUsage().rss }),
                true
            ).addField(
                l.t('module.general:info.response-version'),
                l.t('module.general:info.response-version-value', { version: process.version }),
                true
            ).addField(
                l.t('module.general:info.response-uptime'),
                l.t('module.general:info.response-uptime-value', { uptime: process.uptime() * 1000 }),
                true
            ).addField(
                l.t('module.general:info.response-source-code'),
                l.t('bot.general:source-code'),
                true
            );
        return new DiscordReplyMessage('', { embed });
    }
}

module.exports = CommandInfo;
