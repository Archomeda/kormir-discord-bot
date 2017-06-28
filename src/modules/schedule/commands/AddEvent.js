'use strict';

const DiscordCommandParameter = require('../../../../bot/modules/DiscordCommandParameter');
const DiscordReplyMessage = require('../../../../bot/modules/DiscordReplyMessage');

const DatabaseScheduleBase = require('./DatabaseScheduleBase');


class CommandAddEvent extends DatabaseScheduleBase {
    constructor(bot) {
        super(bot, 'add-event', ['addevent'], 'add');
    }

    initializeParameters() {
        return [
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

    async formatResult(request, result) {
        const l = this.getBot().getLocalizer();

        this.getModule().getScheduler().scheduleEventReminders(result);

        const embed = this.getModule().createEventEmbed(request.getMessage(), result);
        return new DiscordReplyMessage(l.t('module.schedule:add-event.response'), { embed });
    }
}

module.exports = CommandAddEvent;
