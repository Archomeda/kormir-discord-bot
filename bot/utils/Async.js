'use strict';


/**
 * Delays the async execution.
 * @param {number} delay - The delay in milliseconds.
 * @returns {Promise} The promise.
 */
async function wait(delay) {
    return new Promise(resolve => {
        setTimeout(() => resolve(), delay);
    });
}

module.exports = {
    wait
};
