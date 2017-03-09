'use strict';

/* eslint-env node, mocha */
const expect = require('chai').expect;
const Middleware = require('../../src/middleware/Middleware');

describe('Middleware class', () => {
    it('it throws TypeError in constructor', () => {
        expect(() => new Middleware()).to.throw(TypeError);
    });

    it('returns the original parameter for functions', () => {
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
        expect(middleware.onReplyConstructed(response)).to.deep.equal(response);
        expect(middleware.onReplyPosted(response)).to.deep.equal(response);
    });

    it('sets the default options correctly', () => {
        const options = {
            option1: true,
            option2: 42
        };
        class TestMiddleware extends Middleware {
            get defaultOptions() {
                return options;
            }
        }
        const middleware = new TestMiddleware({ option1: false });

        expect(middleware.options).to.deep.equal(Object.assign({}, options, { option1: false }));
    });
});
