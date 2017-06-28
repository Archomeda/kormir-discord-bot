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

    async onCommand(request) {
        const bot = this.getBot();
        const l = bot.getLocalizer();
        const terms = request.getParams().terms;

        if (!terms) {
            return;
        }

        try {
            const articleData = await this._searchArticle(terms);
            const embed = this._createEmbed(articleData);
            await this._setThumbnail(embed, articleData);

            return new DiscordReplyMessage('', { embed });
        } catch (err) {
            switch (err.message) {
                case 'not found':
                    throw new DiscordCommandError(l.t('module.guildwars2:wiki.response-not-found'));
                case 'no title':
                    throw new DiscordCommandError(l.t('module.guildwars2:wiki.no-title'));
                default:
                    throw err;
            }
        }
    }

    async _searchArticle(terms) {
        let response;

        // Search with nearmatch first
        response = await wiki.request({
            action: 'query',
            list: 'search',
            srsearch: terms,
            srwhat: 'nearmatch'
        });

        if (!response || response.query.search.length === 0) {
            // No results, search with title
            response = await wiki.request({
                action: 'query',
                list: 'search',
                srsearch: terms,
                srwhat: 'title'
            });
        }

        if (response && !response.error && response.query.search.length > 0) {
            // Found our article, get it
            response = await wiki.request({
                action: 'parse',
                page: response.query.search[0].title,
                redirects: true,
                prop: 'text',
                disabletoc: true
            });
        } else if (!response || response.query.search.length === 0) {
            throw new Error('not found');
        }

        if (response && response.error) {
            if (response.error.code === 'missingtitle') {
                throw new Error('not found');
            } else if (response.error.info) {
                throw new Error(response.error.info);
            }
        }

        if (!response || !response.parse.text['*']) {
            throw new Error('not found');
        }

        return {
            text: response.parse.text['*'],
            title: response.parse.title
        };
    }

    _createEmbed(articleData) {
        const l = this.getBot().getLocalizer();
        let text = articleData.text;
        const title = articleData.title;

        // Construct message
        const embed = new Discord.RichEmbed().setTitle(l.t('module.guildwars2:wiki.response-title', { title }));
        const splittedText = convertHtmlToMarkdown(text, 'wiki-ext', { prefixUrl: 'https://wiki.guildwars2.com' }).split('\n');
        if (splittedText[0].startsWith('> ')) {
            text = splittedText[0].trim().substr(2);
            for (let i = 1; i < splittedText.length; i++) {
                if (splittedText[i]) {
                    text += `\n${splittedText[i]}`;
                } else {
                    if (i + 1 < splittedText.length) {
                        text += `\n\n${splittedText[i + 1]}`;
                    }
                    break;
                }
            }
        } else {
            text = splittedText[0].trim();
        }
        embed.setURL(encodeURI(`https://wiki.guildwars2.com/wiki/${title}`));

        if (text) {
            embed.setDescription(l.t('module.guildwars2:wiki.response-description', { description: text }));
        } else {
            embed.setDescription(l.t('module.guildwars2:wiki.response-empty'));
        }

        return embed;
    }

    async _setThumbnail(embed, articleData) {
        const response = await wiki.request({
            action: 'browsebysubject',
            subject: articleData.title
        });

        let filename = 'Logo.png';
        if (response && response.query.data.length > 0) {
            // Check for a game icon
            const iconProperty = response.query.data.find(e => e.property === 'Has_game_icon');
            if (iconProperty && iconProperty.dataitem.length > 0) {
                filename = iconProperty.dataitem[0].item.replace(/#[^#]+#$/, '');
            }
        }

        const hash = crypto.createHash('md5').update(filename).digest('hex');
        const url = `https://wiki.guildwars2.com/images/${hash.substr(0, 1)}/${hash.substr(0, 2)}/${filename}`;
        embed.setThumbnail(url);
        return embed;
    }
}

module.exports = CommandWiki;
