'use strict';


/**
 * A base module.
 */
class Module {
    /**
     * Creates a new module instance.
     * @param {Bot} bot - The bot instance.
     * @param {string} id - The module id.
     */
    constructor(bot, id) {
        this._bot = bot;
        this._id = id;
        this._activities = [];

        this._isEnabled = false;
        this._isInitialized = false;
        this._config = this._bot.getConfig().root(`modules.${this._id}`);
    }


    /**
     * Gets the bot instance.
     * @returns {Bot}
     */
    getBot() {
        return this._bot;
    }

    /**
     * Gets the module id.
     * @returns {string} The module id.
     */
    getId() {
        return this._id;
    }

    /**
     * Gets the configuration of this module.
     * @returns {ConfigItem} The config instance for this module.
     */
    getConfig() {
        return this._config;
    }

    /**
     * Gets the registered activities for this module.
     * @returns {Activity[]} The list of activities.
     */
    getActivities() {
        return this._activities;
    }

    /**
     * Gets an activity that is registered to this module.
     * @param {function|string} Activity - The activity class or its id.
     * @returns {Activity} The activity
     */
    getActivity(Activity) {
        if (typeof Activity === 'string') {
            return this.getActivities().find(a => a.getId() === Activity);
        }
        return this.getActivities().find(a => a instanceof Activity);
    }


    /**
     * Registers an activity for this module.
     * @param {Activity} activity - The activity to register.
     */
    register(activity) {
        if (!this._activities.find(a => a.getId() === activity.getId())) {
            this._activities.push(activity);
            activity.setModule(this);
        }
    }


    /**
     * Gets whether this module has been initialized.
     * @returns {boolean} True if initialized; false otherwise.
     */
    isInitialized() {
        return this._isInitialized;
    }

    /**
     * Gets whether this module has been enabled.
     * @returns {boolean} True if enabled; false otherwise.
     */
    isEnabled() {
        return this._isEnabled;
    }


    /**
     * Initializes this module.
     */
    initialize() {
        this._isInitialized = true;

        for (const activity of this._activities) {
            activity.initialize();
        }
    }

    /**
     * Enables this module.
     */
    enable() {
        this._isEnabled = true;

        for (const activity of this._activities) {
            if (this.getConfig().get(`${activity.getId()}.enabled`)) {
                activity.enable();
                activity.on('log', this.onActivityLog);
            }
        }
    }

    /**
     * Disables this module.
     */
    disable() {
        this._isEnabled = false;

        for (const activity of this._activities) {
            activity.disable();
            activity.removeListener(this.onActivityLog);
        }
    }

    onActivityLog(log) {
        // TODO: Probably more useful somewhere else
        console[log.level](log.message);
    }
}

module.exports = Module;
