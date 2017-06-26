'use strict';

const DiscordCommandError = require('../../../../bot/modules/DiscordCommandError');
const DiscordCommandParameter = require('../../../../bot/modules/DiscordCommandParameter');

const DatabaseScheduleBase = require('./DatabaseScheduleBase');


class CommandDeleteEvent extends DatabaseScheduleBase {
    constructor(bot) {
        super(bot, 'delete-event', ['deleteevent'], 'delete');
    }

    initializeParameters() {
        return new DiscordCommandParameter('id');
    }

    formatResult(request, result) {
        const l = this.getBot().getLocalizer();

        if (!result) {
            throw new DiscordCommandError(l.t('module.schedule:common.response-missing-event'));
        }

        this.getModule().getScheduler().cancelEventReminders(result);

        return l.t('module.schedule:delete-event.response', { title: result.title });
    }
}

module.exports = CommandDeleteEvent;
