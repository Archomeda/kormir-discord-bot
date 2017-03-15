'use strict';

const Promise = require('bluebird');
const i18next = Promise.promisifyAll(require('i18next'));

const CommandParam = require('../CommandParam');
const RestrictChannelsMiddleware = require('../../middleware/RestrictChannelsMiddleware');
const CommandDatabaseSchedule = require('./CommandDatabaseSchedule');


class CommandDeleteEvent extends CommandDatabaseSchedule {
    constructor(module) {
        super(module, 'delete', {
            defaultTrigger: 'deleteevent'
        });

        i18next.loadNamespacesAsync('schedule').then(() => {
            this.helpText = i18next.t('schedule:delete-event.help');
            this.shortHelpText = i18next.t('schedule:delete-event.short-help');
            this.params = new CommandParam('id', i18next.t('schedule:common.param-id'));
        });

        this.initializeMiddleware(new RestrictChannelsMiddleware({ types: 'text' }));
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
