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

        expect(middleware.onReplyConstructed(response)).to.deep.equal(response);
        expect(middleware.onReplyPosted(response)).to.deep.equal(response);
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

    it('doesn\'t overwrite the target users when there are no mentions', () => {
        const middleware = new MentionableCommandMiddleware();
        const response = {
            request: {
                message: {
                    author: { id: '123' },
                    mentions: {
                        users: new Collection()
                    }
                }
            }
        };

        const result = middleware.onCommand(response);
        expect(result.targetUsers).to.be.undefined;
    });

    it('filters the author', () => {
        const middleware = new MentionableCommandMiddleware();
        const response = {
            request: {
                message: {
                    author: { id: '1234' },
                    mentions: {
                        users: new Collection([['1234', { id: '1234' }], ['2345', { id: '2345' }]])
                    }
                }
            }
        };

        const result = middleware.onCommand(response);
        expect(result.targetUsers).to.deep.equal([{ id: '2345' }]);
    });

    it('filters bots', () => {
        const middleware = new MentionableCommandMiddleware();
        const response = {
            request: {
                message: {
                    author: { id: '123' },
                    mentions: {
                        users: new Collection([['1234', { id: '1234', bot: true }], ['2345', { id: '2345' }]])
                    }
                }
            }
        };

        const result = middleware.onCommand(response);
        expect(result.targetUsers).to.deep.equal([{ id: '2345' }]);
    });
});
