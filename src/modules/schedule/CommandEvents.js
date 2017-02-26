'use strict';

const
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),

    CommandDatabaseSchedule = require('./CommandDatabaseSchedule'),
    ReplyToMentionsMiddleware = require('../../middleware/ReplyToMentionsMiddleware'),
    RestrictChannelsMiddleware = require('../../middleware/RestrictChannelsMiddleware');

class CommandEvents extends CommandDatabaseSchedule {
    constructor(module) {
        super(module, 'list');

        i18next.loadNamespacesAsync('schedule').then(() => {
            this.helpText = i18next.t('schedule:events.help');
            this.shortHelpText = i18next.t('schedule:events.short-help');
        });

        this.middleware = [
            new RestrictChannelsMiddleware({ types: 'text' }),
            new ReplyToMentionsMiddleware()
        ];
    }

    formatResult(response, result) {
        const list = [];
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
