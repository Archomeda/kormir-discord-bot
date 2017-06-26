'use strict';

const EventEmitter = require('events');

const Promise = require('bluebird');


/**
 * An activity for a module that can be enabled and disabled.
 */
class Activity extends EventEmitter {
    /**
     * Creates a new activity.
     * @param {Bot} bot - The bot instance.
     * @param {string} id - The activity id.
     */
    constructor(bot, id) {
        super();
        this._bot = bot;
        this._id = id;

        this._isEnabled = false;
        this._isInitialized = false;
    }


    /**
     * Gets the bot instance.
     * @returns {Bot}
     */
    getBot() {
        return this._bot;
    }

    /**
     * Gets the activity id.
     * @returns {string} The activity id.
     */
    getId() {
        return this._id;
    }

    /**
     * Gets the module.
     * @returns {Module} The module.
     */
    getModule() {
        return this._module;
    }

    /**
     * Sets the module.
     * @param {Module} module - The module.
     */
    setModule(module) {
        this._module = module;
    }

    /**
     * Gets whether this activity has been initialized.
     * @returns {boolean} True if initialized; false otherwise.
     */
    isInitialized() {
        return this._isInitialized;
    }

    /**
     * Gets whether this activity has been enabled.
     * @returns {boolean} True if enabled; false otherwise.
     */
    isEnabled() {
        return this._isEnabled;
    }


    /**
     * Initializes this activity.
     */
    initialize() {
        this._isInitialized = true;
    }

    /**
     * Enables this activity.
     */
    enable() {
        this._isEnabled = true;

        if (this._localizerNamespaces) {
            const l = this.getBot().getLocalizer();
            return l.loadNamespacesAsync(this._localizerNamespaces);
        }
        return Promise.resolve(true);
    }

    /**
     * Disables this activity.
     */
    disable() {
        this._isEnabled = false;
    }

    /**
     * Debug logging.
     * @param {string} message - The debug message.
     * @param {string} [level = 'info'] - The debug level.
     */
    log(message, level = 'info') {
        this.emit('log', { message: `[${this.getModule().getId()}.${this.getId()}] ${message}`, level });
    }
}

module.exports = Activity;
