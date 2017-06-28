'use strict';


/**
 * A wrapper to delete a Discord message with optionally a delay that ignores errors.
 * @param {Message} message - The Discord message.
 * @param {number} [delay = 0] - The delay in milliseconds.
 */
async function deleteIgnoreErrors(message, delay = 0) {
    if (!message.deletable) {
        return;
    }

    if (!delay) {
        try {
            return message.delete();
        } catch (err) { }
    }

    setTimeout(async () => {
        try {
            return message.delete();
        } catch (err) { }
    }, delay);
}

module.exports = {
    deleteIgnoreErrors
};
