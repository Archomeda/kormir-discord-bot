'use strict';

const
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),

    Command = require('../Command'),
    ReplyToMentionsMiddleware = require('../../middleware/ReplyToMentionsMiddleware');

class CommandSource extends Command {
    constructor(module) {
        super(module);
        i18next.loadNamespacesAsync('general').then(() => {
            this.helpText = i18next.t('general:source.help');
            this.shortHelpText = i18next.t('general:source.short-help');
        });

        this.middleware = new ReplyToMentionsMiddleware();
    }

    onCommand(response) {
        return i18next.t('general:source.response', { url: 'https://github.com/Archomeda/kormir-discord-bot' });
    }
}

module.exports = CommandSource;
