'use strict';

/* eslint-env node, mocha */
const chai = require('chai');
const bot = require('../../src/bot');
const RestrictChannelsMiddleware = require('../../src/middleware/RestrictChannelsMiddleware');
const PermissionError = require('../../src/errors/PermissionError');

const expect = chai.expect;

describe('RestrictChannelsMiddleware class', () => {
    it(`returns the original parameter for non-used functions`, () => {
        const middleware = new RestrictChannelsMiddleware();
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

    it('restricts the messages to DM successfully for DMs', () => {
        const middleware = new RestrictChannelsMiddleware({
            types: ['dm']
        });
        const response = {
            request: {
                message: {
                    channel: {
                        type: 'dm'
                    }
                }
            }
        };

        const result = middleware.onCommand(response);
        expect(result).to.deep.equal(response);
    });

    it('restricts the messages to DM successfully for server channels', () => {
        const middleware = new RestrictChannelsMiddleware({
            types: ['dm']
        });
        const response = {
            request: {
                message: {
                    channel: {
                        type: 'text'
                    }
                }
            }
        };

        expect(() => middleware.onCommand(response)).to.throw(PermissionError);
    });

    it('restricts the messages to server channels successfully for DMs', () => {
        const middleware = new RestrictChannelsMiddleware({
            types: ['text']
        });
        const response = {
            request: {
                message: {
                    channel: {
                        type: 'dm'
                    }
                }
            }
        };

        expect(() => middleware.onCommand(response)).to.throw(PermissionError);
    });

    it('restricts the messages to server channels successfully for server channels', () => {
        const middleware = new RestrictChannelsMiddleware({
            types: ['text']
        });
        const response = {
            request: {
                message: {
                    channel: {
                        type: 'text'
                    }
                }
            }
        };

        const result = middleware.onCommand(response);
        expect(result).to.deep.equal(response);
    });

    it('restricts the messages to specific server channels successfully for DMs', () => {
        const middleware = new RestrictChannelsMiddleware({
            types: ['text'],
            channels: ['channel-id']
        });
        const response = {
            request: {
                message: {
                    channel: {
                        type: 'dm'
                    },
                    guild: {
                        channels: new Map([['channel-id', 'channel-object']])
                    }
                }
            }
        };

        expect(() => middleware.onCommand(response)).to.throw(PermissionError);
    });

    it('restricts the messages to specific server channels successfully for the same server channels', () => {
        const middleware = new RestrictChannelsMiddleware({
            types: ['text'],
            channels: ['channel-id']
        });
        const response = {
            request: {
                message: {
                    channel: {
                        type: 'text',
                        id: 'channel-id'
                    },
                    guild: {
                        channels: new Map([['channel-id', 'channel-object']])
                    }
                }
            }
        };

        const result = middleware.onCommand(response);
        expect(result).to.deep.equal(response);
    });

    it('restricts the messages to specific server channels successfully for other server channels', () => {
        const middleware = new RestrictChannelsMiddleware({
            types: ['text'],
            channels: ['channel-id']
        });
        const response = {
            request: {
                message: {
                    channel: {
                        type: 'text',
                        id: 'wrong-channel-id'
                    },
                    guild: {
                        channels: new Map([['channel-id', 'channel-object']])
                    }
                }
            }
        };

        expect(() => middleware.onCommand(response)).to.throw(PermissionError);
    });

    it('restricts the messages to specific server channels and DMs successfully for DMs', () => {
        const middleware = new RestrictChannelsMiddleware({
            types: ['dm', 'text'],
            channels: ['channel-id']
        });
        const response = {
            request: {
                message: {
                    channel: {
                        type: 'dm'
                    },
                    guild: {
                        channels: new Map([['channel-id', 'channel-object']])
                    }
                }
            }
        };

        expect(() => middleware.onCommand(response)).to.throw(PermissionError);
    });

    it('restricts the messages to specific server channels and DMs successfully for the same server channels', () => {
        const middleware = new RestrictChannelsMiddleware({
            types: ['dm', 'text'],
            channels: ['channel-id']
        });
        const response = {
            request: {
                message: {
                    channel: {
                        type: 'text',
                        id: 'channel-id'
                    },
                    guild: {
                        channels: new Map([['channel-id', 'channel-object']])
                    }
                }
            }
        };

        const result = middleware.onCommand(response);
        expect(result).to.deep.equal(response);
    });

    it('restricts the messages to specific server channels and DMs successfully for other server channels', () => {
        const middleware = new RestrictChannelsMiddleware({
            types: ['dm', 'text'],
            channels: ['channel-id']
        });
        const response = {
            request: {
                message: {
                    channel: {
                        type: 'text',
                        id: 'wrong-channel-id'
                    },
                    guild: {
                        channels: new Map([['channel-id', 'channel-object']])
                    }
                }
            }
        };

        expect(() => middleware.onCommand(response)).to.throw(PermissionError);
    });

    it('restricts the messages to server channels while ignoring non-existing server channels', () => {
        const middleware = new RestrictChannelsMiddleware({
            types: ['text'],
            channels: ['channel-id']
        });
        const response = {
            request: {
                message: {
                    channel: {
                        type: 'text',
                        id: 'wrong-channel-id'
                    },
                    guild: {
                        channels: new Map()
                    }
                }
            }
        };

        expect(() => middleware.onCommand(response)).to.throw(PermissionError);
    });
});
