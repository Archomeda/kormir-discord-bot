'use strict';

const DiscordDatabaseCommand = require('../../../../bot/modules/DiscordDatabaseCommand');

const models = require('../../../models');


/**
 * The base for all database related schedule commands.
 */
class DatabaseScheduleBase extends DiscordDatabaseCommand {
    constructor(bot, id, triggers, type, options) {
        super(bot, id, triggers, models.Event, type, options);
        this._localizerNamespaces = 'module.schedule';
    }

    async getList(Model, props) { // eslint-disable-line no-unused-vars
        return Model.find({ start: { $gte: new Date() } }, null, { sort: { start: 1 } });
    }

    transformParam(message, paramName, paramValue) {
        switch (paramName) {
            case 'id':
            case 'recurring':
                paramValue = parseInt(paramValue, 10);
                break;
            case 'reminders':
                paramValue = paramValue ? paramValue.split(/\s*,\s*/).map(i => parseInt(i, 10)) : [];
                break;
            case 'channels':
                paramValue = paramValue ? paramValue
                    .filter(channel => channel.type === 'text' && channel.permissionsFor(message.author).has('MANAGE_MESSAGES'))
                    .map(channel => channel.id) : [];
                break;
            case 'mentions':
                if (paramValue) {
                    paramValue = {
                        users: paramValue.users.map(user => user.id),
                        roles: paramValue.roles.map(role => role.id)
                    };
                }
                break;
            default:
                break;
        }
        return paramValue;
    }

    validateProps(message, props) {
        const l = this.getBot().getLocalizer();
        if (['view', 'edit', 'delete'].includes(this._type)) {
            if (Number(props.id) !== props.id) {
                return l.t('module.schedule:common.response-invalid-id');
            }
        }
        if (['add', 'edit'].includes(this._type)) {
            if (props.title.length > 100) {
                return l.t('module.schedule:common.response-title-too-long');
            }
            if (!props.start.isValid()) {
                return l.t('module.schedule:common.response-invalid-start');
            }
            if (!props.end.isValid()) {
                return l.t('module.schedule:common.response-invalid-end');
            }
            if (props.start.isBefore()) {
                return l.t('module.schedule:common.response-invalid-start');
            }
            if (props.end.isBefore(props.start)) {
                return l.t('module.schedule:common.response-invalid-end');
            }
            if (props.reminders.length === 0) {
                return l.t('module.schedule:common.response-missing-reminders');
            }
            if (props.reminders.some(r => Number(r) !== r || r < 0)) {
                return l.t('module.schedule:common.response-invalid-reminders');
            }
            if (props.channels.length === 0) {
                return l.t('module.schedule:common.response-invalid-channels');
            }
            if (props.recurring && (Number(props.recurring) !== props.recurring || props.recurring < 0)) {
                return l.t('module.schedule:common.response-invalid-recurring');
            }
        }
        return true;
    }
}

module.exports = DatabaseScheduleBase;
