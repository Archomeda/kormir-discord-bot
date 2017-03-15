'use strict';

const snakeCase = require('change-case').snakeCase;


/**
 * Represents a base Discord hook for the bot.
 */
class DiscordHook {
    /**
     * Constructs a new base hook.
     * @param {Module} module - The module that owns this hook.
     * @param {Object} [options] - Extra options to set for the module, only name and id are supported.
     */
    constructor(module, options) {
        if (new.target === DiscordHook) {
            throw new TypeError('Cannot construct DiscordHook instances directly');
        }

        this.name = (options && options.name) || new.target.name.replace(/(.*?)(Hook)?/, '$1');
        this.id = (options && options.id) || snakeCase(this.name);

        this._config = module.config.get(`hooks.${this.id}`);
        this._module = module;

        this._hooks = {};
    }

    /**
     * Gets the parent module.
     * @return {Module} - The parent module.
     */
    get module() {
        return this._module;
    }

    /**
     * Gets the config.
     * @return {*} The config instance.
     */
    get config() {
        return this._config;
    }

    /**
     * Gets the hooked events.
     * @return {Object.<string, function>} The events to hook.
     */
    get hooks() {
        return this._hooks;
    }
}

module.exports = DiscordHook;
