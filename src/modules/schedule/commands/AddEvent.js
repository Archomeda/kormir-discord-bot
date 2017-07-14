'use strict';

const DiscordReplyMessage = require('../../../../bot/modules/DiscordReplyMessage');

const DatabaseScheduleBase = require('./DatabaseScheduleBase');


class CommandAddEvent extends DatabaseScheduleBase {
    constructor(bot) {
        super(bot, 'add-event', [
            'events add :title :start:date :end:date :description :reminders :channels:channels :mentions?:mentions :recurring?',
            'addevent :title :start:date :end:date :description :reminders :channels:channels :mentions?:mentions :recurring?'
        ], 'add');
    }

    async formatResult(message, result) {
        const l = this.getBot().getLocalizer();

        this.getModule().getScheduler().scheduleEventReminders(result);

        const embed = this.getModule().createEventEmbed(message, result);
        return new DiscordReplyMessage(l.t('module.schedule:add-event.response'), { embed });
    }
}

module.exports = CommandAddEvent;
