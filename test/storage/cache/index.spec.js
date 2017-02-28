'use strict';

/* eslint-env node, mocha */
const expect = require('chai').expect;
const cache = require('../../../src/storage/cache');

describe('cache storage', () => {
    const cacheStorages = [
        'node',
        'redis'
    ];

    cacheStorages.forEach(function (item) {
        it(`makes sure that ${item} storage exists`, () => {
            expect(() => cache(item)).to.not.throw(TypeError).and.to.exist;
        });
    });

    it('makes sure that unknown storages throw an error', () => {
        expect(() => cache('skritt')).to.throw(TypeError);
    });
});
