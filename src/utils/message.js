'use strict';

const Discord = require('discord.js');


/**
 * Creates a big embed message, by splitting the description into multiple fields if it exceeds the maximum amount of allowed characters.
 * @param {string|Array<string>} description - The description that should be used in the embed message.
 * @returns {RichEmbed} The embed message.
 */
function createBigEmbedMessage(description) {
    const embed = new Discord.RichEmbed();

    if (typeof description === 'string') {
        description = description.split('\n');
    }
    const messages = groupByNumberOfCharacters(description, [2048, 1024], '\n');

    for (let j = 0; j < messages.length; j++) {
        if (j === 0) {
            embed.setDescription(messages[j]);
        } else {
            embed.addField('\u200B', messages[j]);
        }
    }
    return embed;
}

/**
 * Groups an array of strings by a given amount of characters.
 * @param {Array<string>} array - The array.
 * @param {number|Array<number>} numChars - The amount of characters to use, or an array of the amount of characters to use in order (the last element will be repeated).
 * @param {string} delimiter - The delimiter to use when array elements are combined.
 * @return {Array} The new array.
 */
function groupByNumberOfCharacters(array, numChars, delimiter) {
    const newArray = [];
    let i = 0;
    for (const line of array) {
        if (newArray[i]) {
            const innerNumChars = Array.isArray(numChars) ? numChars.length > i ? numChars[i] : numChars[numChars.length - 1] : numChars;
            if (newArray[i].length + delimiter.length + line.length >= innerNumChars) {
                i++;
            }
        }
        newArray[i] = (newArray[i] ? `${newArray[i]}${delimiter}${line}` : line);
    }
    return newArray;
}

module.exports = {
    createBigEmbedMessage,
    groupByNumberOfCharacters
};
