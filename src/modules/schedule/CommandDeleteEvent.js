'use strict';

const
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),

    CommandDatabaseSchedule = require('./CommandDatabaseSchedule'),
    CommandParam = require('../CommandParam'),
    RestrictChannelsMiddleware = require('../../middleware/RestrictChannelsMiddleware');

class CommandDeleteEvent extends CommandDatabaseSchedule {
    constructor(module) {
        super(module, 'delete');

        i18next.loadNamespacesAsync('schedule').then(() => {
            this.helpText = i18next.t('schedule:delete-event.help');
            this.shortHelpText = i18next.t('schedule:delete-event.short-help');
            this.params = new CommandParam('id', i18next.t('schedule:common.param-id'));
        });

        this.middleware = new RestrictChannelsMiddleware({ types: 'text' });
    }

    formatResult(response, result) {
        if (!result) {
            return i18next.t('schedule:common.response-missing-event');
        }
        this.module.cancelEventReminders(result);
        return i18next.t('schedule:delete-event.response', { title: result.title });
    }
}

module.exports = CommandDeleteEvent;
