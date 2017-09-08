'use strict';

/**
 * Splits a string into separate array entries based on the delimiter
 * and the maximum amount of characters that may exist in every entry.
 * @param {string} source - The string source.
 * @param {string} delimiter - The delimiter.
 * @param {number} maxCharacters - The maximum amount of characters per entry.
 * @returns {Array} The resulting array.
 */
function splitMax(source, delimiter, maxCharacters) {
    const split = [];
    let pos = maxCharacters - 1;
    let minPos = 0;
    while (pos < source.length) {
        while (source[pos] !== delimiter && pos > minPos) {
            // We assume that the source contains at least 1 delimiter character every maxCharacters, if not, it's rip
            pos--;
        }
        if (source[pos] !== delimiter) {
            break;
        }
        split.push(source.substring(minPos, pos));
        minPos = pos + 1;
        pos += maxCharacters;
    }
    split.push(source.substring(minPos));
    return split;
}

module.exports = {
    splitMax
};
