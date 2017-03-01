/**
 * Represents the bot state.
 */
class Bot {
    constructor() {
        /**
         * The config instance.
         * @type {*}
         */
        this.config = null;

        /**
         * The Discord client.
         * @type {Client}
         */
        this.client = null;

        /**
         * The list of active modules.
         * @type {Module[]}
         */
        this.modules = null;

        /**
         * The cache provider instance.
         * @type {CacheProvider}
         */
        this.cache = null;

        /**
         * The database provider instance.
         * @type {DatabaseProvider}
         */
        this.database = null;

        /**
         * The Guild Wars 2 API instance.
         * @type {*}
         */
        this.gw2Api = null;
    }
}

module.exports = new Bot();
