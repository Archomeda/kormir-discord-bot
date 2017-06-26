'use strict';

const Activity = require('./Activity');


/**
 * A worker that runs in the background.
 */
class Worker extends Activity {
    /**
     * Initializes the worker.
     */
    initializeWorker() {

    }

    /**
     * Enables the worker.
     */
    enableWorker() {

    }

    /**
     * Disables the worker.
     */
    disableWorker() {

    }

    initialize() {
        super.initialize();
        this.initializeWorker();
    }

    enable() {
        super.enable();
        this.enableWorker();
    }

    disable() {
        this.disableWorker();
        super.disable();
    }
}

module.exports = Worker;
