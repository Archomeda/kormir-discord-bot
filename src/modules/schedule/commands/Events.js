'use strict';

const DatabaseScheduleBase = require('./DatabaseScheduleBase');
const CommandEvent = require('./Event');


class CommandEvents extends DatabaseScheduleBase {
    constructor(bot) {
        super(bot, 'events', ['events'], 'list');
    }

    async formatResult(message, result) {
        const bot = this.getBot();
        const l = bot.getLocalizer();
        const eventInvocation = this.getModule().getActivity(CommandEvent).getCommandRoute().getInvocation();

        const list = [];
        if (result.length === 0) {
            return l.t('module.schedule:events.response-empty');
        }

        for (const event of result) {
            const id = event.id;
            const title = event.title || l.t('module.schedule:events.missing-title');
            const start = event.start;
            if (start) {
                list.push(l.t('module.schedule:events.response-item', { id, title, start }));
            }
        }
        return l.t('module.schedule:events.response-list', { events: list.join('\n'), event: eventInvocation });
    }
}

module.exports = CommandEvents;
