'use strict';

const Promise = require('bluebird');
const i18next = Promise.promisifyAll(require('i18next'));

const CommandParam = require('../CommandParam');
const ReplyToMentionsMiddleware = require('../../middleware/ReplyToMentionsMiddleware');
const RestrictChannelsMiddleware = require('../../middleware/RestrictChannelsMiddleware');
const CommandDatabaseSchedule = require('./CommandDatabaseSchedule');


class CommandEvent extends CommandDatabaseSchedule {
    constructor(module) {
        super(module, 'view');

        i18next.loadNamespacesAsync('schedule').then(() => {
            this.helpText = i18next.t('schedule:event.help');
            this.shortHelpText = i18next.t('schedule:event.short-help');
            this.params = new CommandParam('id', i18next.t('schedule:common.param-id'));
        });

        this.middleware = [
            new RestrictChannelsMiddleware({ types: 'text' }),
            new ReplyToMentionsMiddleware()
        ];
    }

    formatResult(response, result) {
        if (!result) {
            return i18next.t('schedule:common.response-missing-event');
        }

        const channels = result.channels.map(channel => response.request.message.guild.channels.get(channel)).filter(channel => channel);
        let mentions = [];
        if (result.mentions) {
            const users = result.mentions.users.map(user => response.request.message.guild.members.get(user)).filter(member => member).map(member => member.user.fullUsername);
            const roles = result.mentions.roles.map(role => response.request.message.guild.roles.get(role)).filter(role => role).map(role => role.name);
            mentions = users.concat(roles);
            if (result.mentions.everyone) {
                mentions.push('everyone');
            }
        }

        return i18next.t('schedule:event.response', {
            title: result.title,
            start: result.start,
            end: result.end,
            description: result.description,
            reminders: result.reminders.map(reminder => `${reminder}m`).join(', '),
            channels: channels.join(', '),
            mentions: mentions.map(mention => `\`@${mention}\``).join(', ')
        });
    }
}

module.exports = CommandEvent;
