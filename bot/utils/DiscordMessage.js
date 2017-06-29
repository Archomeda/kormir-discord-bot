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

    const doStuff = async () => {
        try {
            return await message.delete();
        } catch (err) { }
    };

    if (!delay) {
        return doStuff();
    }

    setTimeout(doStuff, delay);
}

module.exports = {
    deleteIgnoreErrors
};
