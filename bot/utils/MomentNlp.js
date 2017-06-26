'use strict';

const moment = require('moment-timezone');
const sugar = require('sugar-date').Date;


let tz;

/**
 * Constructs a new moment JS object by using NLP (UTC).
 * @param {string} date - The date in NLP.
 * @returns {Moment} The moment JS object.
 */
function momentNlp(date) {
    const sugarDate = sugar.create(date, { fromUTC: true });
    return tz ? moment.tz(sugarDate, tz) : moment(sugarDate);
}

/**
 * Sets the default timezone to use.
 * @param {string|undefined} [timezone] - A moment JS compatible timezone string; or undefined to use Moment default.
 */
momentNlp.setTimezone = function (timezone) {
    tz = timezone;
};


module.exports = momentNlp;
