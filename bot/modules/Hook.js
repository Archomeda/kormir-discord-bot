'use strict';

const Activity = require('./Activity');


/**
 * A hook that gets called upon various events.
 */
class Hook extends Activity {
    /**
     * Initializes the hook.
     */
    initializeHook() {

    }

    /**
     * Enables the hook.
     */
    enableHook() {

    }

    /**
     * Disables the hook.
     */
    disableHook() {

    }

    initialize() {
        this.initializeHook();
        super.initialize();
    }

    enable() {
        this.enableHook();
        super.enable();
    }

    disable() {
        this.disableHook();
        super.disable();
    }
}

module.exports = Hook;
