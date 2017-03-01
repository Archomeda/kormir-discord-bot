'use strict';

/* eslint-env node, mocha */
const expect = require('chai').expect;
const Middleware = require('../../src/middleware/Middleware');

describe('Middleware class', () => {
    it(`it throws TypeError in constructor`, () => {
        expect(() => new Middleware()).to.throw(TypeError);
    });

    it(`returns the original parameter for functions`, () => {
        class TestMiddleware extends Middleware {}
        const middleware = new TestMiddleware();
        const response = {
            should: {
                be: {
                    the: {
                        same: 'object'
                    }
                }
            }
        };

        expect(middleware.onCommand(response)).to.deep.equal(response);
        expect(middleware.onResponse(response)).to.deep.equal(response);
        expect(middleware.onReply(response)).to.deep.equal(response);
    })
});
