'use strict';

/* eslint-env node, mocha */
const expect = require('chai').expect;
const moment = require('moment');
const momentNlp = require('../../src/utils/moment-nlp');


describe('moment-nlp utils', () => {
    beforeEach(() => {
        momentNlp.setTimezone();
    });

    it('creates a proper moment object using NLP from sugarjs', () => {
        const input = 'next wednesday 20:00';
        const expected = moment.utc().add(1, 'w');
        if (expected.isoWeekday() >= 7) {
            expected.add(1, 'w'); // Add another week because sugarjs works with Sunday-Saturday weeks...
        }
        expected.isoWeekday(3).hour(20).minute(0).second(0).millisecond(0);
        expect(momentNlp(input)._d).to.deep.equal(expected._d);
    });

    it('creates a proper moment object using NLP from sugarjs (with defined timezone)', () => {
        const timezone = 'America/Los_Angeles';
        momentNlp.setTimezone(timezone);
        const input = 'next wednesday 20:00';
        const expected = moment.utc().add(1, 'w');
        if (expected.isoWeekday() >= 7) {
            expected.add(1, 'w'); // Add another week because sugarjs works with Sunday-Saturday weeks...
        }
        expected.isoWeekday(3).hour(20).minute(0).second(0).millisecond(0).tz(timezone);
        expect(momentNlp(input)._d).to.deep.equal(expected._d);
    });

    it('creates a proper moment object using sugarjs', () => {
        const input = '2017-04-14T13:00:00+04:00';
        const expected = moment.utc().year(2017).month(3).date(14).hour(9).minute(0).second(0).millisecond(0);
        expect(momentNlp(input)._d).to.deep.equal(expected._d);
    });
});
