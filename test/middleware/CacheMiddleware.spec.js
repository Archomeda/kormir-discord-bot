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
    it('it constructs an CacheMiddleware object properly with defaults', () => {
        let middleware;
        expect(() => {
            middleware = new CacheMiddleware();
        }).to.not.throw(TypeError);

        expect(middleware.options.duration).to.equal(5 * 60);
    });

    it('it constructs an CacheMiddleware object properly with non-defaults', () => {
        let middleware;
        expect(() => {
            middleware = new CacheMiddleware({
                duration: 10,
            });
        }).to.not.throw(TypeError);

        expect(middleware.options.duration).to.equal(10);
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
            expect(result.replyText).to.equal(text);
            expect(bot.cache.get).to.have.been.called;
        });
    });

    it('caches the result', () => {
        const middleware = new CacheMiddleware({
            duration: 10,
        });
        bot.cache = {
            set: sinon.expectation.create('set').returns(Promise.resolve())
        };
        const response = {
            request: {
                params: { }
            },
            replyText: 'some text to cache'
        };

        return middleware.onResponse(response).then(result => {
            expect(bot.cache.set.args[0][2]).to.equal(middleware.options.duration);
            expect(bot.cache.set.args[0][3]).to.equal(response.replyText);
        });
    });
});
