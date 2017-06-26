'use strict';

const crypto = require('crypto');

const Discord = require('discord.js');
const MWBot = require('mwbot');

const convertHtmlToMarkdown = require('../../../utils/markdown').convertHtmlToMarkdown;

const CacheMiddleware = require('../../../../bot/middleware/Cache');

const DiscordCommand = require('../../../../bot/modules/DiscordCommand');
const DiscordCommandError = require('../../../../bot/modules/DiscordCommandError');
const DiscordCommandParameter = require('../../../../bot/modules/DiscordCommandParameter');
const DiscordReplyMessage = require('../../../../bot/modules/DiscordReplyMessage');


const wiki = new MWBot({
    apiUrl: 'https://wiki.guildwars2.com/api.php'
});


class CommandWiki extends DiscordCommand {
    constructor(bot) {
        super(bot, 'wiki', ['wiki']);
        this._localizerNamespaces = 'module.guildwars2';

        this.setMiddleware(new CacheMiddleware(bot, this, { duration: 30 * 60 }));
    }

    initializeParameters() {
        return new DiscordCommandParameter('terms', { expanded: true });
    }

    onCommand(request) {
        const bot = this.getBot();
        const l = bot.getLocalizer();
        const terms = request.getParams().terms;

        if (!terms) {
            return;
        }

        return this.searchArticle(terms).then(data => {
            return this.createEmbed(data);
        }).then(([embed, data]) => {
            return this.setThumbnail(embed, data);
        }).then(([embed]) => {
            return new DiscordReplyMessage('', { embed });
        }).catch(err => {
            // Capture errors and construct proper fail message
            switch (err.message) {
                case 'not found':
                    throw new DiscordCommandError(l.t('module.guildwars2:wiki.response-not-found'));
                case 'no title':
                    throw new DiscordCommandError(l.t('module.guildwars2:wiki.no-title'));
                default:
                    throw err;
            }
        });
    }

    searchArticle(terms) {
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
            if (!response || !response.parse.text['*']) {
                throw new Error('not found');
            }
            return {
                text: response.parse.text['*'],
                title: response.parse.title
            };
        });
    }

    createEmbed(data) {
        const l = this.getBot().getLocalizer();
        let text = data.text;
        const title = data.title;

        // Construct message
        const message = new Discord.RichEmbed().setTitle(l.t('module.guildwars2:wiki.response-title', { title }));
        text = convertHtmlToMarkdown(text, 'wiki-ext', { prefixUrl: 'https://wiki.guildwars2.com' }).split('\n')[0].trim();
        message.setURL(encodeURI(`https://wiki.guildwars2.com/wiki/${title}`));

        if (text) {
            message.setDescription(l.t('module.guildwars2:wiki.response-description', { description: text }));
        } else {
            message.setDescription(l.t('module.guildwars2:wiki.response-empty'));
        }

        return [message, data];
    }

    setThumbnail(embed, data) {
        return wiki.request({
            action: 'browsebysubject',
            subject: data.title
        }).then(response => {
            if (response && response.query.data.length > 0) {
                // Check for a game icon
                const iconProperty = response.query.data.find(e => e.property === 'Has_game_icon');
                if (iconProperty && iconProperty.dataitem.length > 0) {
                    return iconProperty.dataitem[0].item.replace(/#[^#]+#$/, '');
                }
            }
            return 'Logo.png';
        }).then(filename => {
            const hash = crypto.createHash('md5').update(filename).digest('hex');
            const url = `https://wiki.guildwars2.com/images/${hash.substr(0, 1)}/${hash.substr(0, 2)}/${filename}`;
            embed.setThumbnail(url);
            return [embed, data];
        });
    }
}

module.exports = CommandWiki;
