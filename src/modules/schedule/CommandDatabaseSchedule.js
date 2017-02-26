'use strict';

const
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),
    moment = require('moment'),

    CommandDatabaseModel = require('../CommandDatabaseModel'),
    CommandParam = require('../CommandParam');

class CommandDatabaseSchedule extends CommandDatabaseModel {
    constructor(module, type) {
        super(module, module.bot.database.Event, type);
    }

    get paramsMap() {
        return {
            'start-date': 'start',
            'end-date': 'end'
        };
    }

    getList(model, props) {
        return model.find({ start: { $gte: new Date() } }, null, { sort: { start: 1 } });
    }

    transformParam(response, paramName, paramValue) {
        switch (paramName) {
            case 'start-date':
            case 'end-date':
                paramValue = moment(paramValue);
                break;
            case 'reminders':
                paramValue = paramValue ? paramValue.split(/\s*,\s*/).map(i => parseInt(i)).filter(i => !isNaN(i)) : [];
                break;
            case 'channels':
                paramValue = paramValue ? paramValue
                    .filter(channel => channel.type === 'text' && channel.permissionsFor(response.request.message.author).hasPermission('MANAGE_MESSAGES'))
                    .map(channel => channel.id) : [];
                break;
            case 'mentions':
                if (paramValue) {
                    paramValue = {
                        users: paramValue.users.map(user => user.id),
                        roles: paramValue.roles.map(role => role.id),
                        everyone: paramValue.everyone
                    };
                }
                break;
        }
        return paramValue;
    }

    validateProps(response, props) {
        if (props.title.length > 100) return i18next.t('schedule:common.response-title-too-long');
        if (!props.start.isValid()) return i18next.t('schedule:common.response-invalid-start-date');
        if (!props.end.isValid()) return i18next.t('schedule:common.response-invalid-end-date');
        if (props.start.isBefore()) return i18next.t('schedule:common.response-invalid-start-date');
        if (props.end.isBefore(props.start)) return i18next.t('schedule:common.response-invalid-end-date');
        if (props.reminders.length === 0) return i18next.t('schedule:common.response-missing-reminders');
        if (props.channels.length === 0) return i18next.t('schedule:common.response-invalid-channels');
        return true;
    }
}

module.exports = CommandDatabaseSchedule;
