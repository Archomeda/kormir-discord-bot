'use strict';

/* eslint-env node, mocha */
const expect = require('chai').expect;
const cache = require('../../../src/storage/database');

describe('database storage', () => {
    const databaseStorages = [
        'mongodb'
    ];

    databaseStorages.forEach(function (item) {
        it(`makes sure that ${item} storage exists`, () => {
            expect(() => cache(item)).to.not.throw(TypeError).and.to.exist;
        });
    });

    it('makes sure that unknown storages throw an error', () => {
        expect(() => cache('skritt')).to.throw(TypeError);
    });
});
