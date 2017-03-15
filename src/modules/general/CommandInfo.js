'use strict';

const Discord = require('discord.js');
const Promise = require('bluebird');
const i18next = Promise.promisifyAll(require('i18next'));

const Command = require('../Command');
const CommandReplyMessage = require('../CommandReplyMessage');
const MentionableCommandMiddleware = require('../../middleware/MentionableCommandMiddleware');
const bot = require('../../bot');


class CommandInfo extends Command {
    constructor(module) {
        super(module, {
            defaultTrigger: 'info'
        });

        i18next.loadNamespacesAsync('general').then(() => {
            this.helpText = i18next.t('general:info.help');
            this.shortHelpText = i18next.t('general:info.short-help');
        });

        this.initializeMiddleware(new MentionableCommandMiddleware());
    }

    onCommand(response) {
        const embed = new Discord.RichEmbed()
            .setTitle(i18next.t('general:info.response-title', { name: bot.client.user.username }))
            .setDescription(i18next.t('general:info.response-description', { creator: 'Archomeda' }))
            .setThumbnail(bot.client.user.avatarURL)
            .addField(
                i18next.t('general:info.response-memory-usage'),
                i18next.t('general:info.response-memory-usage-value', { memory: process.memoryUsage().rss }),
                true
            ).addField(
                i18next.t('general:info.response-uptime'),
                i18next.t('general:info.response-uptime-value', { uptime: process.uptime() * 1000 }),
                true
            ).addField(
                i18next.t('general:info.response-source-code'),
                i18next.t('general:info.response-source-code-value', { site: 'GitHub', url: 'https://github.com/Archomeda/kormir-discord-bot' }),
                true
            );
        return new CommandReplyMessage('', { embed });
    }
}

module.exports = CommandInfo;
