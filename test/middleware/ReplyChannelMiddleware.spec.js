'use strict';

/* eslint-env node, mocha */
const chai = require('chai');
const sinon = require('sinon');
const chaiSinon = require('chai-sinon');
const sinonChaiInOrder = require('sinon-chai-in-order').default;
const bot = require('../../src/bot');
const ReplyChannelMiddleware = require('../../src/middleware/ReplyChannelMiddleware');

const expect = chai.expect;
chai.use(chaiSinon);
chai.use(sinonChaiInOrder);

describe('ReplyChannelMiddleware class', () => {
    it(`returns the original parameter for non-used functions`, () => {
        const middleware = new ReplyChannelMiddleware();
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

    it('sets the target channel to DM', () => {
        const middleware = new ReplyChannelMiddleware({
            channel: 'dm'
        });
        const response = {
            request: {
                message: {
                    author: {
                        dmChannel: 'dm-channel'
                    }
                }
            }
        };

        const result = middleware.onCommand(response);
        expect(result.targetChannel).to.equal('dm-channel');
    });

    it('sets the target channel to a guild channel', () => {
        const middleware = new ReplyChannelMiddleware({
            channel: 'channel-id'
        });
        const response = {
            request: {
                message: {
                    guild: {
                        channels: new Map([['channel-id', 'channel-object']])
                    }
                }
            }
        };

        const result = middleware.onCommand(response);
        expect(result.targetChannel).to.equal('channel-object');
    });

    it('does nothing when no channel', () => {
        const middleware = new ReplyChannelMiddleware({
            channel: 'channel-id'
        });
        const response = {
            request: {
                message: {
                    guild: {
                        channels: new Map([['channel-id', 'channel-object']])
                    }
                }
            }
        };

        const result = middleware.onCommand(response);
        expect(result.targetChannel).to.equal('channel-object');
    });
});
