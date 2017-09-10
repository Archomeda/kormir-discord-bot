'use strict';

const DiscordReplyPage = require('./DiscordReplyPage');


/**
 * Represents a reply message for Discord.
 */
class DiscordReplyMessage {
    /**
     * Creates a new reply message.
     * @param {string|DiscordReplyPage[]} content - The reply message text or an array of reply pages.
     * @param {Object} [options] - The reply message options.
     */
    constructor(content, options) {
        /**
         * The reply pages, if any.
         * @type {DiscordReplyPage[]}
         */
        this.pages = [];

        /**
         * The active page.
         * @type {number}
         */
        this.activePage = (options && options.activePage) || 0;

        /**
         * The embedded file.
         * @type {FileOptions|string|undefined}
         */
        this.file = options && options.file;

        /**
         * The associated page browse emojis.
         * @type {Object}
         */
        this.pageEmojis = options && options.pageEmojis;

        /**
         * Extra data.
         * @type {*}
         */
        this.data = options && options.data;

        if (typeof (content) === 'string') {
            this.pages = [new DiscordReplyPage(content, options)];
        } else if (Array.isArray(content)) {
            this.pages = content.slice(0);
        }
    }

    /**
     * Serializes this reply.
     * @returns {Object} The serialized object.
     */
    serialize() {
        return {
            pages: this.pages.slice(),
            activePage: this.activePage,
            file: this.file,
            pageEmojis: this.pageEmojis,
            data: this.data
        };
    }

    /**
     * Deserializes the reply.
     * @param {Object} obj - The object.
     * @returns {DiscordReplyMessage} The deserialized reply.
     */
    static deserialize(obj) {
        return new DiscordReplyMessage(obj.pages.slice(0), {
            activePage: obj.activePage,
            file: obj.file,
            pageEmojis: obj.pageEmojis,
            data: obj.data
        });
    }

    /**
     * Constructs a Discord message to be sent with the .send() function on channels.
     * @param {number|string|undefined} [page] - The page to send (page id, custom page emoji or browse emoji), defaults to the active page if undefined.
     * @param {boolean} [setActive = false] - Whether or not to set the active page to the one that has just been constructed.
     * @returns {[string,{}]|undefined} The message, or undefined if no message is available.
     */
    constructDiscordMessage(page, setActive = false) {
        page = page || this.activePage;

        if (this.pages.length === 0) {
            return undefined;
        }

        // Determine the correct page to construct
        if (typeof (page) === 'string') {
            let id = this.pages.findIndex(p => p.emoji === page);
            if (id < 0) {
                if (this.pageEmojis) {
                    switch (page) {
                        case this.pageEmojis.first:
                            id = 0;
                            break;
                        case this.pageEmojis.last:
                            id = this.pages.length - 1;
                            break;
                        case this.pageEmojis.previous:
                            id = this.activePage - 1;
                            break;
                        case this.pageEmojis.next:
                            id = this.activePage + 1;
                            break;
                        default:
                            break; // Make linter happy
                    }
                }
                if (id >= this.pages.length) {
                    // Out of bounds
                    return undefined;
                }
            }
            page = id;
        }

        if (setActive) {
            this.activePage = page;
        }

        return [
            this.pages[page].text,
            {
                embed: this.pages[page].embed,
                files: this.file ? [this.file] : undefined // TODO: support multiple files
            }
        ];
    }

    /**
     * Checks if this reply has multiple pages.
     * @returns {boolean} True if there are multiple pages; false otherwise.
     */
    hasPages() {
        return this.pages.length > 1;
    }
}

module.exports = DiscordReplyMessage;
