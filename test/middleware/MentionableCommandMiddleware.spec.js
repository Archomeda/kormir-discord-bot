'use strict';

/* eslint-env node, mocha */
const chai = require('chai');
const sinon = require('sinon');
const chaiSinon = require('chai-sinon');
const sinonChaiInOrder = require('sinon-chai-in-order').default;
const Collection = require('discord.js').Collection;
const bot = require('../../src/bot');
const MentionableCommandMiddleware = require('../../src/middleware/MentionableCommandMiddleware');

const expect = chai.expect;
chai.use(chaiSinon);
chai.use(sinonChaiInOrder);

describe('MentionableCommandMiddleware class', () => {
    it('it constructs the object properly with defaults', () => {
        let middleware;
        expect(() => {
            middleware = new MentionableCommandMiddleware();
        }).to.not.throw(TypeError);
    });

    it(`returns the original parameter for non-used functions`, () => {
        const middleware = new MentionableCommandMiddleware();
        const response = {
            should: {
                be: {
                    the: {
                        same: 'object'
                    }
                }
            }
        };

        expect(middleware.onResponse(response)).to.deep.equal(response);
        expect(middleware.onReply(response)).to.deep.equal(response);
    });

    it('sets the target users', () => {
        const middleware = new MentionableCommandMiddleware();
        const response = {
            request: {
                message: {
                    author: { id: '123' },
                    mentions: {
                        users: new Collection([['1234', { id: '1234' }]])
                    }
                }
            }
        };

        const result = middleware.onCommand(response);
        expect(result.targetUsers).to.deep.equal([{ id: '1234' }]);
    });

    it('filters the author', () => {
        const middleware = new MentionableCommandMiddleware();
        const response = {
            request: {
                message: {
                    author: { id: '1234' },
                    mentions: {
                        users: new Collection([['1234', { id: '1234' }]])
                    }
                }
            }
        };

        const result = middleware.onCommand(response);
        expect(result.targetUsers).to.deep.equal([]);
    });

    it('filters bots', () => {
        const middleware = new MentionableCommandMiddleware();
        const response = {
            request: {
                message: {
                    author: { id: '123' },
                    mentions: {
                        users: new Collection([['1234', { id: '1234', bot: true }]])
                    }
                }
            }
        };

        const result = middleware.onCommand(response);
        expect(result.targetUsers).to.deep.equal([]);
    });
});
