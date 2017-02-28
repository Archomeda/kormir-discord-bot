'use strict';

/* eslint-env node, mocha */
const expect = require('chai').expect;
const array = require('../../src/utils/array');


describe('array utils', () => {
    it('ensures that the output value is an array when null', () => {
        const input = null;
        const expected = [];
        expect(array.ensureArray(input)).to.deep.equal(expected);
    });

    it('ensures that the output value is an array when not array', () => {
        const input = 'test';
        const expected = ['test'];
        expect(array.ensureArray(input)).to.deep.equal(expected);
    });

    it('ensures that the output value is an array when array', () => {
        const input = ['test'];
        const expected = ['test'];
        expect(array.ensureArray(input)).to.deep.equal(expected);
    });

    it('combines an array by a given number of characters (limit = 0)', () => {
        const val = [
            '1st entry',
            '2nd entry',
            '3rd entry',
            '4th entry',
            '5th entry'
        ];
        expect(array.groupByNumberOfCharacters(val, 0, ' ')).to.deep.equal(val);
    });

    it('combines an array by a given number of characters (limit = edge)', () => {
        const val = [
            '1st entry',
            '2nd entry',
            '3rd entry',
            '4th entry',
            '5th entry'
        ];
        const expected = [
            '1st entry 2nd entry',
            '3rd entry 4th entry',
            '5th entry'
        ];
        expect(array.groupByNumberOfCharacters(val, 20, ' ')).to.deep.equal(expected);
    });

    it('combines an array by a given number of characters (limit = high)', () => {
        const val = [
            '1st entry',
            '2nd entry',
            '3rd entry',
            '4th entry',
            '5th entry'
        ];
        const expected = [
            '1st entry 2nd entry 3rd entry 4th entry 5th entry'
        ];
        expect(array.groupByNumberOfCharacters(val, 10000, ' ')).to.deep.equal(expected);
    });

    it('combines an array by a given number of characters (single number)', () => {
        const val = [
            '1st entry',
            '2nd entry',
            '3rd entry',
            '4th entry',
            '5th entry'
        ];
        const expected = [
            '1st entry 2nd entry',
            '3rd entry 4th entry',
            '5th entry'
        ];
        expect(array.groupByNumberOfCharacters(val, 20, ' ')).to.deep.equal(expected);
    });

    it('combines an array by a given number of characters (multi number)', () => {
        const val = [
            '1st entry',
            '2nd entry',
            '3rd entry',
            '4th entry',
            '5th entry'
        ];
        const expected = [
            '1st entry 2nd entry',
            '3rd entry',
            '4th entry',
            '5th entry'
        ];
        expect(array.groupByNumberOfCharacters(val, [20, 10], ' ')).to.deep.equal(expected);
    });
});
