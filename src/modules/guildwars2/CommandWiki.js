'use strict';

const
    Promise = require('bluebird'),
    i18next = Promise.promisifyAll(require('i18next')),
    MWBot = require('mwbot'),

    convertHtmlToMarkdown = require('../../utils/text').convertHtmlToMarkdown,

    Command = require('../Command'),
    CommandParam = require('../CommandParam'),
    CommandError = require('../../errors/CommandError'),
    CacheMiddleware = require('../../middleware/CacheMiddleware'),
    ReplyToMentionsMiddleware = require('../../middleware/ReplyToMentionsMiddleware'),
    RestrictChannelsMiddleware = require('../../middleware/RestrictChannelsMiddleware');

const wiki = new MWBot({
    apiUrl: 'https://wiki.guildwars2.com/api.php'
});

class CommandWiki extends Command {
    constructor(module) {
        super(module);
        i18next.loadNamespacesAsync('guildwars2').then(() => {
            this.helpText = i18next.t('guildwars2:wiki.help');
            this.shortHelpText = i18next.t('guildwars2:wiki.short-help');
            this.params = new CommandParam('terms', i18next.t('guildwars2:wiki.param-terms'), true, undefined, true);
        });

        this.middleware = [
            new RestrictChannelsMiddleware({ types: 'text' }),
            new ReplyToMentionsMiddleware(),
            new CacheMiddleware()
        ];
    }

    onCommand(response) {
        const terms = response.request.params.terms;
        if (!terms) {
            return;
        }

        // Search with nearmatch first
        return wiki.request({
            action: 'query',
            list: 'search',
            srsearch: terms,
            srwhat: 'nearmatch'
        }).then(response => {
            if (response && response.query.search.length > 0) {
                return response;
            }

            // No results, search with title
            return wiki.request({
                action: 'query',
                list: 'search',
                srsearch: terms,
                srwhat: 'title'
            });
        }).then(response => {
            if (response && response.query.search.length > 0) {
                // Found our article, get it
                return wiki.request({
                    action: 'parse',
                    page: response.query.search[0].title,
                    redirects: true,
                    prop: 'text'
                });
            }
        }).catch(err => {
            // Make sure we have sane errors
            if (err.code === 'missingtitle') {
                throw new Error('not found');
            } else if (err.info) {
                throw new Error(err.info);
            }
            throw err;
        }).then(response => {
            if (response && response.parse.text['*']) {
                // We have our article
                let text = response.parse.text['*'];
                const title = response.parse.title;

                // Construct message
                text = convertHtmlToMarkdown(text).split('\n')[0].trim();
                const url = encodeURI(`https://wiki.guildwars2.com/wiki/${title}`);
                if (text) {
                    text = i18next.t('guildwars2:wiki.response-with-intro', { text, url });
                } else {
                    text = i18next.t('guildwars2:wiki.response-title-only', { title, url });
                }
                return text;
            }
            throw new Error('not found');
        }).catch(err => {
            // Capture errors and construct proper fail message
            switch (err.message) {
                case 'not found':
                    throw new CommandError(i18next.t('guildwars2:wiki.response-not-found'));
                case 'no title':
                    throw new CommandError(i18next.t('guildwars2:wiki.no-title'));
                default:
                    throw err;
            }
        });
    }
}

module.exports = CommandWiki;
