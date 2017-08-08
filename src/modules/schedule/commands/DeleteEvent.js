'use strict';

const DiscordCommandError = require('../../../../bot/modules/DiscordCommandError');

const DatabaseScheduleBase = require('./DatabaseScheduleBase');


class CommandDeleteEvent extends DatabaseScheduleBase {
    constructor(bot) {
        super(bot, 'delete-event', [
            'events delete :id',
            'deleteevent :id'
        ], 'delete');
    }

    async formatResult(message, result) {
        const l = this.getBot().getLocalizer();

        if (!result) {
            throw new DiscordCommandError(l.t('module.schedule:common.response-missing-event'));
        }

        this.getModule().getScheduler().cancelEventReminders(result);

        return l.t('module.schedule:delete-event.response', { title: result.title });
    }
}

module.exports = CommandDeleteEvent;
