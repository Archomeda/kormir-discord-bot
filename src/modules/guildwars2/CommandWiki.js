'use strict';

const Discord = require('discord.js');
const Promise = require('bluebird');
const i18next = Promise.promisifyAll(require('i18next'));
const MWBot = require('mwbot');

const convertHtmlToMarkdown = require('../../utils/text').convertHtmlToMarkdown;

const Command = require('../Command');
const CommandParam = require('../CommandParam');
const CommandReplyMessage = require('../CommandReplyMessage');
const CommandError = require('../../errors/CommandError');
const CacheMiddleware = require('../../middleware/CacheMiddleware');
const MentionableCommandMiddleware = require('../../middleware/MentionableCommandMiddleware');
const RestrictChannelsMiddleware = require('../../middleware/RestrictChannelsMiddleware');


const wiki = new MWBot({
    apiUrl: 'https://wiki.guildwars2.com/api.php'
});

class CommandWiki extends Command {
    constructor(module) {
        super(module, {
            defaultTrigger: 'wiki'
        });

        i18next.loadNamespacesAsync('guildwars2').then(() => {
            this.helpText = i18next.t('guildwars2:wiki.help');
            this.shortHelpText = i18next.t('guildwars2:wiki.short-help');
            this.params = new CommandParam('terms', i18next.t('guildwars2:wiki.param-terms'), true, undefined, true);
        });

        this.initializeMiddleware([
            new RestrictChannelsMiddleware({ types: 'text' }),
            new MentionableCommandMiddleware(),
            new CacheMiddleware()
        ]);
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
                const message = new Discord.RichEmbed().setTitle(i18next.t('guildwars2:wiki.response-title', { title }));
                text = convertHtmlToMarkdown(text, 'wiki-ext', { prefixUrl: 'https://wiki.guildwars2.com' }).split('\n')[0].trim();
                message.setURL(encodeURI(`https://wiki.guildwars2.com/wiki/${title}`));
                if (text) {
                    message.setDescription(i18next.t('guildwars2:wiki.response-description', { description: text }));
                } else {
                    message.setDescription(i18next.t('guildwars2:wiki.response-empty'));
                }
                return new CommandReplyMessage('', { embed: message });
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
