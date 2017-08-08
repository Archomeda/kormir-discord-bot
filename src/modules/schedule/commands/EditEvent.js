'use strict';

const DiscordCommandError = require('../../../../bot/modules/DiscordCommandError');
const DiscordReplyMessage = require('../../../../bot/modules/DiscordReplyMessage');

const DatabaseScheduleBase = require('./DatabaseScheduleBase');


class CommandEditEvent extends DatabaseScheduleBase {
    constructor(bot) {
        super(bot, 'edit-event', [
            'events edit :id :title :start:date :end:date :description :reminders :channels:channels :mentions?:mentions :recurring?',
            'editevent :id :title :start:date :end:date :description :reminders :channels:channels :mentions?:mentions :recurring?'
        ], 'edit');
    }

    async formatResult(message, result) {
        const l = this.getBot().getLocalizer();

        if (!result) {
            throw new DiscordCommandError(l.t('module.schedule:common.response-missing-event'));
        }

        this.getModule().getScheduler().scheduleEventReminders(result);

        const embed = this.getModule().createEventEmbed(message, result);
        return new DiscordReplyMessage(l.t('module.schedule:edit-event.response', { title: result.title }), { embed });
    }
}

module.exports = CommandEditEvent;
