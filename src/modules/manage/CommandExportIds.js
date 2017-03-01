'use strict';

const Promise = require('bluebird');
const i18next = Promise.promisifyAll(require('i18next'));

const Command = require('../Command');
const ReplyMethodMiddleware = require('../../middleware/ReplyMethodMiddleware');
const bot = require('../../bot');


class CommandExportIds extends Command {
    constructor(module) {
        super(module, {
            defaultTrigger: 'exportids'
        });

        i18next.loadNamespacesAsync('manage').then(() => {
            this.helpText = i18next.t('manage:export-ids.help');
        });

        this.middleware = new ReplyMethodMiddleware({ method: 'dm' });
    }

    onCommand(response) {
        let result = [];
        for (let server of bot.client.guilds.array()) {
            result.push(`=== ${server.name}: ${server.id} ===`);
            result.push(i18next.t('manage:export-ids.export-roles'));
            for (let role of server.roles.array().sort((a, b) => b.position - a.position)) {
                result.push(`${role.name}: ${role.id}`);
            }
            let textChannels = [];
            let voiceChannels = [];
            for (let channel of server.channels.array().sort((a, b) => a.position - b.position)) {
                if (channel.type === 'text') {
                    textChannels.push(`${channel.name}: ${channel.id}`);
                } else if (channel.type === 'voice') {
                    voiceChannels.push(`${channel.name}: ${channel.id}`);
                }
            }
            result.push(`\n${i18next.t('manage:export-ids.export-text-channels')}`);
            result = result.concat(textChannels);
            result.push(`\n${i18next.t('manage:export-ids.export-voice-channels')}`);
            result = result.concat(voiceChannels);
            result.push(`\n${i18next.t('manage:export-ids.export-members')}`);
            for (let member of server.members.array()) {
                result.push(`${member.user.username}#${member.user.discriminator}: ${member.id}`);
            }
            result.push('\n');
        }
        response.request.message.author.sendFile(Buffer.from(result.join('\n')), 'ids.txt');
    }
}

module.exports = CommandExportIds;
