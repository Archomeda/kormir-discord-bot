'use strict';

/* eslint-env node, mocha */
const chai = require('chai');
const sinon = require('sinon');
const chaiSinon = require('chai-sinon');
const sinonChaiInOrder = require('sinon-chai-in-order').default;
const Promise = require('bluebird');
const bot = require('../../src/bot');
const CacheMiddleware = require('../../src/middleware/CacheMiddleware');

const expect = chai.expect;
chai.use(chaiSinon);
chai.use(sinonChaiInOrder);

describe('CacheMiddleware class', () => {
    it(`returns the original parameter for non-used functions`, () => {
        const middleware = new CacheMiddleware();
        const response = {
            should: {
                be: {
                    the: {
                        same: 'object'
                    }
                }
            }
        };

        expect(middleware.onReplyPosted(response)).to.deep.equal(response);
    });

    it('returns the original object when nothing has been cached', () => {
        const middleware = new CacheMiddleware();
        bot.cache = {
            get: sinon.stub().returns(Promise.resolve(undefined))
        };
        const response = {
            request: {
                params: { }
            }
        };

        return middleware.onCommand(response).then(result => {
            expect(result).to.deep.equal(response);
            expect(bot.cache.get).to.have.been.called;
        });
    });

    it('returns the original object plus text from cache', () => {
        const text = 'some cached text';
        const middleware = new CacheMiddleware();
        bot.cache = {
            get: sinon.stub().returns(Promise.resolve(text))
        };
        const response = {
            request: {
                params: {
                    some: 'param'
                }
            }
        };

        return middleware.onCommand(response).then(result => {
            expect(result.reply).to.equal(text);
            expect(bot.cache.get).to.have.been.called;
        });
    });

    it('caches the result', () => {
        const middleware = new CacheMiddleware({
            duration: 10
        });
        bot.cache = {
            get: sinon.stub().returns(Promise.resolve()),
            set: sinon.expectation.create('set').returns(Promise.resolve())
        };
        const response = {
            request: {
                params: { }
            },
            reply: 'some text to cache'
        };

        return middleware.onReplyConstructed(response).then(() => {
            expect(bot.cache.set.args[0][2]).to.equal(middleware.options.duration);
            expect(bot.cache.set.args[0][3]).to.equal(response.reply);
        });
    });

    it('caches the result with param uniqueness', () => {
        const middleware = new CacheMiddleware({
            unique_params: true
        });
        bot.cache = {
            get: sinon.expectation.create('get').thrice().returns(Promise.resolve()),
            set: sinon.stub().returns(Promise.resolve())
        };
        const response1 = {
            request: {
                params: { }
            },
            reply: 'some text to cache'
        };
        const response2 = {
            request: {
                params: {
                    some: 'param'
                }
            },
            reply: 'some text to cache'
        };

        return middleware.onReplyConstructed(response1).then(() => {
            return Promise.all([
                middleware.onCommand(response1),
                middleware.onCommand(response2)
            ]).then(() => {
                expect(bot.cache.get.args[1][1]).to.not.equal(bot.cache.get.args[2][1]);
            });
        });
    });

    it('caches the result with user uniqueness', () => {
        const middleware = new CacheMiddleware({
            unique_params: false,
            unique_user: true
        });
        bot.cache = {
            get: sinon.expectation.create('get').thrice().returns(Promise.resolve()),
            set: sinon.stub().create('set').returns(Promise.resolve())
        };
        const response1 = {
            request: {
                message: {
                    author: {
                        id: '1'
                    }
                }
            },
            reply: 'some text to cache'
        };
        const response2 = {
            request: {
                message: {
                    author: {
                        id: '2'
                    }
                }
            },
            reply: 'some text to cache'
        };

        return middleware.onReplyConstructed(response1).then(() => {
            return Promise.all([
                middleware.onCommand(response1),
                middleware.onCommand(response2)
            ]).then(() => {
                expect(bot.cache.get.args[1][1]).to.not.equal(bot.cache.get.args[2][1]);
            });
        });
    });
});
