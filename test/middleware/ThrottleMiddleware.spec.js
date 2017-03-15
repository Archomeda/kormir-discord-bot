'use strict';

/* eslint-env node, mocha */
const chai = require('chai');
const sinon = require('sinon');
const chaiAsPromised = require('chai-as-promised');
const Promise = require('bluebird');
const bot = require('../../src/bot');
const ThrottleMiddleware = require('../../src/middleware/ThrottleMiddleware');
const ThrottleError = require('../../src/errors/ThrottleError');

const expect = chai.expect;
chai.use(chaiAsPromised);

describe('ThrottleMiddleware class', () => {
    // TODO: Maybe add a test for testing the throttle duration?

    it(`returns the original parameter for non-used functions`, () => {
        const middleware = new ThrottleMiddleware();
        const response = {
            should: {
                be: {
                    the: {
                        same: 'object'
                    }
                }
            }
        };

        expect(middleware.onReplyConstructed(response)).to.deep.equal(response);
        expect(middleware.onReplyPosted(response)).to.deep.equal(response);
    });

    it('returns the original parameter for unsupported types', () => {
        const middleware = new ThrottleMiddleware({
            type: 'something-that-doesn\'t-exist'
        });
        const response = {
            some: 'object'
        };

        expect(middleware.onCommand(response)).to.deep.equal(response);
    });

    it('does not throw an error when a user should not be throttled', () => {
        const middleware = new ThrottleMiddleware();
        const response = {
            request: {
                message: {
                    author: {
                        id: 'author-id'
                    }
                }
            }
        };
        bot.cache = {
            get: sinon.stub().returns(Promise.resolve(undefined)),
            set: sinon.stub().returns(Promise.resolve(response))
        };

        return expect(middleware.onCommand(response)).to.eventually.deep.equal(response);
    });

    it('does throw an error when a user should be throttled', () => {
        const middleware = new ThrottleMiddleware();
        const response = {
            request: {
                message: {
                    author: {
                        id: 'author-id'
                    }
                }
            }
        };
        bot.cache = {
            get: sinon.stub().returns(Promise.resolve({}))
        };

        return expect(middleware.onCommand(response)).to.eventually.be.rejectedWith(ThrottleError);
    });

    it('does not throw an error when a command should not be throttled', () => {
        const middleware = new ThrottleMiddleware({
            type: 'command'
        });
        const response = {
            request: {
                command: {
                    id: 'command-id'
                }
            }
        };
        bot.cache = {
            get: sinon.stub().returns(Promise.resolve(undefined)),
            set: sinon.stub().returns(Promise.resolve(response))
        };

        return expect(middleware.onCommand(response)).to.eventually.deep.equal(response);
    });

    it('does throw an error when a command should be throttled', () => {
        const middleware = new ThrottleMiddleware({
            type: 'command'
        });
        const response = {
            request: {
                command: {
                    id: 'command-id'
                }
            }
        };
        bot.cache = {
            get: sinon.stub().returns(Promise.resolve({}))
        };

        return expect(middleware.onCommand(response)).to.eventually.be.rejectedWith(ThrottleError);
    });
});
