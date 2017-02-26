'use strict';

const
    Promise = require('bluebird'),
    EventEmitter = require('events');

/**
 * Represents a continuous background worker.
 */
class BackgroundWorker extends EventEmitter {
    /**
     * Constructs a new BackgroundWorker.
     */
    constructor() {
        super();
        if (new.target === BackgroundWorker) {
            throw new TypeError('Cannot construct BackgroundWorker instances directly');
        }

        this._started = false;
        this._stopRequested = false;
    }

    /**
     * Starts the worker.
     * @param {number} timeout - The time to wait between loops in milliseconds.
     * @param {number} [initialTimeout] - The time to wait in milliseconds before executing the first loop; use undefined for an immediate start.
     * @param {Object} [opts] - Extra options to set.
     */
    start(timeout, initialTimeout, opts) {
        if (this._started) {
            return;
        }

        for (let i in opts) {
            if (opts.hasOwnProperty(i)) {
                this[i] = opts[i];
            }
        }

        this._stopRequested = false;
        this._started = true;

        const run = timeout => Promise.try(() => this._run())
            .catch(err => {
                console.warn(`Error in worker: ${err.message}`);
                console.warn(err.stack);
                return true;
            })
            .then(cont => {
                if (cont) {
                    setTimeout(() => run(timeout), timeout);
                }
            });

        if (!initialTimeout) {
            initialTimeout = 1;
        }
        setTimeout(() => run(timeout), initialTimeout);
    }

    /**
     * Stops the worker.
     * Currently, this actually stops the worker once the next loop is about to start.
     */
    stop() {
        if (this._started) {
            this._stopRequested = true;
        }
    }

    /**
     * The loop.
     */
    run() {
        throw new TypeError('Derivative should implement run');
    }

    _run() {
        if (!this._stopRequested) {
            this.run();
            return true;
        }
        return false;
    }

    /**
     * Debugging.
     * @param {string} message - The debug message.
     */
    debug(message) {
        this.emit('debug', message);
    }

    /**
     * Error.
     * @param {Error} error - The error object.
     */
    error(error) {
        this.emit('error', error);
    }
}

module.exports = BackgroundWorker;
