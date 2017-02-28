'use strict';

const snakeCase = require('change-case').snakeCase;


class DiscordHook {
    constructor(module) {
        if (new.target === DiscordHook) {
            throw new TypeError('cannot construct DiscordHook instances directly');
        }

        this._module = module;

        this.id = snakeCase(new.target.name.replace(/(.*?)(Hook)?/, '$1'));
        this._config = this._module.config.hooks[this.id];
        this._hooks = {};
    }

    get module() {
        return this._module;
    }

    get config() {
        return this._config;
    }

    get hooks() {
        return this._hooks;
    }
}

module.exports = DiscordHook;
