'use strict';

/**
 * Makes sure that the argument is returned as an array. If it's already an array, it's returned immediately.
 * @param {*} value - The value.
 * @return {*} The value as an array.
 */
function ensureArray(value) {
    if (!value) {
        return [];
    }
    if (!Array.isArray(value)) {
        return [value];
    }
    return value;
}

/**
 * Groups an array of strings by a given amount of characters.
 * @param {Array.<string>} array - The array.
 * @param {number|Array.<number>} numChars - The amount of characters to use, or an array of the amount of characters to use in order (the last element will be repeated).
 * @param {string} delimiter - The delimiter to use when array elements are combined.
 * @return {Array} The new array.
 */
function groupByNumberOfCharacters(array, numChars, delimiter) {
    const newArray = [];
    let chars = 0;
    let i = 0;
    for (let line of array) {
        const innerNumChars = Array.isArray(numChars) ? numChars.length > i ? numChars[i] : numChars[numChars.length - 1] : numChars;
        if (chars + line.length + delimiter.length >= innerNumChars) {
            i++;
            chars = 0;
        }
        newArray[i] = (newArray[i] ? `${newArray[i]}${delimiter}${line}` : line);
        chars += line.length + delimiter.length;
    }
    return newArray;
}

module.exports = {
    ensureArray,
    groupByNumberOfCharacters
};
