'use strict';

const Promise = require('bluebird');
const i18next = Promise.promisifyAll(require('i18next'));

const CommandParam = require('../CommandParam');
const RestrictChannelsMiddleware = require('../../middleware/RestrictChannelsMiddleware');
const CommandDatabaseSchedule = require('./CommandDatabaseSchedule');


class CommandEditEvent extends CommandDatabaseSchedule {
    constructor(module) {
        super(module, 'edit', {
            defaultTrigger: 'editevent'
        });

        i18next.loadNamespacesAsync('schedule').then(() => {
            this.helpText = i18next.t('schedule:edit-event.help');
            this.shortHelpText = i18next.t('schedule:edit-event.short-help');
            this.params = [
                new CommandParam('id', i18next.t('schedule:common.param-id')),
                new CommandParam('title', i18next.t('schedule:common.param-title')),
                new CommandParam('start-date', i18next.t('schedule:common.param-start-date')),
                new CommandParam('end-date', i18next.t('schedule:common.param-end-date')),
                new CommandParam('description', i18next.t('schedule:common.param-description')),
                new CommandParam('reminders', i18next.t('schedule:common.param-reminders')),
                new CommandParam('channels', i18next.t('schedule:common.param-channels'), false, 'channels'),
                new CommandParam('mentions', i18next.t('schedule:common.param-mentions'), true, 'mentions')
            ];
        });

        this.middleware = new RestrictChannelsMiddleware({ types: 'text' });
    }

    formatResult(response, result) {
        if (!result) {
            return i18next.t('schedule:common.response-missing-event');
        }
        this.module.scheduleEventReminders(result);
        return i18next.t('schedule:edit-event.response', { title: result.title });
    }
}

module.exports = CommandEditEvent;
