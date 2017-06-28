'use strict';

const Activity = require('./Activity');


/**
 * A worker that runs in the background.
 */
class Worker extends Activity {
    /**
     * Initializes the worker.
     * @returns {Promise} The promise.
     */
    async initializeWorker() {

    }

    /**
     * Enables the worker.
     * @returns {Promise} The promise.
     */
    async enableWorker() {

    }

    /**
     * Disables the worker.
     * @returns {Promise} The promise.
     */
    async disableWorker() {

    }


    async initialize() {
        await super.initialize();
        return this.initializeWorker();
    }

    async enable() {
        await super.enable();
        return this.enableWorker();
    }

    async disable() {
        await this.disableWorker();
        return super.disable();
    }
}

module.exports = Worker;
