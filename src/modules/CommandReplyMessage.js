'use strict';


/**
 * Represents a command reply message.
 */
class CommandReplyMessage {
    /**
     * Constructs a new CommandReplyMessage.
     * @param {string} text - The reply message text.
     * @param {Object} [options] - The reply message options.
     */
    constructor(text, options) {
        /**
         * The message contents.
         * @type {string}
         */
        this.text = text;

        /**
         * The embedded message.
         * @type {RichEmbed|undefined}
         */
        this.embed = options && options.embed;

        /**
         * The embedded file.
         * @type {FileOptions|string|undefined}
         */
        this.file = options && options.file;

        // TODO: support splitting messages somehow...
    }
}

module.exports = CommandReplyMessage;
