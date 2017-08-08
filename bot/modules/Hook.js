'use strict';

const Activity = require('./Activity');


/**
 * A hook that gets called upon various events.
 */
class Hook extends Activity {
    /**
     * Initializes the hook.
     * @returns {Promise} The promise.
     */
    async initializeHook() {

    }

    /**
     * Enables the hook.
     * @returns {Promise} The promise.
     */
    async enableHook() {

    }

    /**
     * Disables the hook.
     * @returns {Promise} The promise.
     */
    async disableHook() {

    }


    async initialize() {
        await super.initialize();
        return this.initializeHook();
    }

    async enable() {
        await super.enable();
        return this.enableHook();
    }

    async disable() {
        await this.disableHook();
        return super.disable();
    }
}

module.exports = Hook;
