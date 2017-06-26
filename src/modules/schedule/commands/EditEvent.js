'use strict';

const DiscordCommandError = require('../../../../bot/modules/DiscordCommandError');
const DiscordCommandParameter = require('../../../../bot/modules/DiscordCommandParameter');
const DiscordReplyMessage = require('../../../../bot/modules/DiscordReplyMessage');

const DatabaseScheduleBase = require('./DatabaseScheduleBase');


class CommandEditEvent extends DatabaseScheduleBase {
    constructor(bot) {
        super(bot, 'edit-event', ['editevent'], 'edit');
    }

    initializeParameters() {
        return [
            new DiscordCommandParameter('id'),
            new DiscordCommandParameter('title'),
            new DiscordCommandParameter('start'),
            new DiscordCommandParameter('end'),
            new DiscordCommandParameter('description'),
            new DiscordCommandParameter('reminders'),
            new DiscordCommandParameter('channels', { type: 'channels' }),
            new DiscordCommandParameter('mentions', { optional: true, type: 'mentions' }),
            new DiscordCommandParameter('recurring', { optional: true })
        ];
    }

    formatResult(request, result) {
        const l = this.getBot().getLocalizer();

        if (!result) {
            throw new DiscordCommandError(l.t('module.schedule:common.response-missing-event'));
        }

        this.getModule().getScheduler().scheduleEventReminders(result);

        const embed = this.getModule().createEventEmbed(request.getMessage(), result);
        return new DiscordReplyMessage(l.t('module.schedule:edit-event.response', { title: result.title }), { embed });
    }
}

module.exports = CommandEditEvent;
