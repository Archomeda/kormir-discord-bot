'use strict';

const Promise = require('bluebird');
const i18next = Promise.promisifyAll(require('i18next'));

const MentionableCommandMiddleware = require('../../middleware/MentionableCommandMiddleware');
const RestrictChannelsMiddleware = require('../../middleware/RestrictChannelsMiddleware');
const CommandDatabaseSchedule = require('./CommandDatabaseSchedule');


class CommandEvents extends CommandDatabaseSchedule {
    constructor(module) {
        super(module, 'list', {
            defaultTrigger: 'events'
        });

        i18next.loadNamespacesAsync('schedule').then(() => {
            this.helpText = i18next.t('schedule:events.help');
            this.shortHelpText = i18next.t('schedule:events.short-help');
        });

        this.initializeMiddleware([
            new RestrictChannelsMiddleware({ types: 'text' }),
            new MentionableCommandMiddleware()
        ]);
    }

    formatResult(response, result) {
        const list = [];
        if (result.length === 0) {
            return i18next.t('schedule:events.response-empty');
        }

        for (let event of result) {
            const id = event.id;
            const title = event.title || i18next.t('schedule:events.missing-title');
            const start = event.start;
            if (start) {
                list.push(i18next.t('schedule:events.response-item', { id, title, start }));
            }
        }
        return i18next.t('schedule:events.response-list', { events: list.join('\n') });
    }
}

module.exports = CommandEvents;
