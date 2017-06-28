'use strict';

const DiscordReplyMessage = require('../../DiscordReplyMessage');

const AutoRemoveMessage = require('../../../../bot/middleware/AutoRemoveMessage');

const DiscordCommand = require('../../../../bot/modules/DiscordCommand');


class CommandExportIds extends DiscordCommand {
    constructor(bot) {
        super(bot, 'export-ids', ['exportids']);
        this._localizerNamespaces = 'module.admin';

        this.setMiddleware(new AutoRemoveMessage(bot, this, { defaultRequest: 60, defaultResponse: 60 })); // Auto remove messages after 1 minute
    }

    async onCommand(request) {
        const bot = this.getBot();
        const client = bot.getClient();
        const l = bot.getLocalizer();
        const message = request.getMessage();

        let result = [];
        for (const guild of client.guilds.array()) {
            result.push(`=== ${guild.name}: ${guild.id} ===`);
            result.push(l.t('module.admin:export-ids.export-roles'));
            for (const role of guild.roles.array().sort((a, b) => b.position - a.position)) {
                result.push(`${role.name}: ${role.id}`);
            }
            const textChannels = [];
            const voiceChannels = [];
            for (const channel of guild.channels.array().sort((a, b) => a.position - b.position)) {
                if (channel.type === 'text') {
                    textChannels.push(`${channel.name}: ${channel.id}`);
                } else if (channel.type === 'voice') {
                    voiceChannels.push(`${channel.name}: ${channel.id}`);
                }
            }
            result.push(`\n${l.t('module.admin:export-ids.export-text-channels')}`);
            result = result.concat(textChannels);
            result.push(`\n${l.t('module.admin:export-ids.export-voice-channels')}`);
            result = result.concat(voiceChannels);
            result.push(`\n${l.t('module.admin:export-ids.export-members')}`);
            for (const member of guild.members.array()) {
                result.push(`${member.user.tag}: ${member.id}`);
            }
            result.push('\n');
        }

        if (message.channel.type !== 'dm') {
            // Send the file by DM instead
            await message.author.dmChannel.send('', { file: { attachment: Buffer.from(result.join('\n')), name: 'ids.txt' } });
            return l.t('module.admin:export-ids.response-see-dm');
        }

        return new DiscordReplyMessage('', { file: { attachment: Buffer.from(result.join('\n')), name: 'ids.txt' } });
    }
}

module.exports = CommandExportIds;
