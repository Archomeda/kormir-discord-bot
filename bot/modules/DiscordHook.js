'use strict';

const Hook = require('./Hook');


/**
 * A hook that gets called for various Discord events.
 */
class DiscordHook extends Hook {
    /**
     * Creates a new Discord hook.
     * @param {Bot} bot - The bot instance.
     * @param {string} id - The activity id.
     */
    constructor(bot, id) {
        super(bot, id);
        this._bot = bot;
        this._id = id;
        this._hooks = {};

        this._isEnabled = false;
        this._isInitialized = false;
    }


    /**
     * Gets the list of Discord hooks, mapped by event id (see Discord docs).
     * @returns {Object<string, function>} The Discord hooks.
     */
    getHooks() {
        return this._hooks;
    }


    async enableHook() {
        const client = this.getBot().getClient();
        const hooks = this.getHooks();
        Object.keys(hooks).forEach(hookName => {
            const hook = hooks[hookName];
            if (!client.listeners(hookName).includes(hook)) {
                // Prevent duplicate hook
                client.on(hookName, hook);
            }
        });
    }

    async disableHook() {
        const client = this.getBot().getClient();
        const hooks = this.getHooks();
        Object.keys(hooks).forEach(hookName => {
            const hook = hooks[hookName];
            client.removeListener(hookName, hook);
        });
    }
}

module.exports = DiscordHook;
