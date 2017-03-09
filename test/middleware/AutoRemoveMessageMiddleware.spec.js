'use strict';

/* eslint-env node, mocha */
const chai = require('chai');
const sinon = require('sinon');
const chaiSinon = require('chai-sinon');
const sinonChaiInOrder = require('sinon-chai-in-order').default;
const AutoRemoveMessageMiddleware = require('../../src/middleware/AutoRemoveMessageMiddleware');

const expect = chai.expect;
chai.use(chaiSinon);
chai.use(sinonChaiInOrder);

describe('AutoRemoveMessageMiddleware class', () => {
    it(`returns the original parameter for non-used functions`, () => {
        const middleware = new AutoRemoveMessageMiddleware();
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
    });

    it('skips deleting the original message when the channel type does not match', () => {
        const middleware = new AutoRemoveMessageMiddleware();
        const deleteFunc = sinon.spy();
        const response = {
            request: {
                message: {
                    channel: {
                        type: 'not-a-channel'
                    },
                    delete: deleteFunc
                }
            }
        };

        const result = middleware.onCommand(response);
        expect(result).to.deep.equal(response);
        expect(deleteFunc).to.have.not.been.called;
    });

    it('skips deleting the original message when it is not deletable', () => {
        const middleware = new AutoRemoveMessageMiddleware();
        const deleteFunc = sinon.spy();
        const response = {
            request: {
                message: {
                    channel: {
                        type: 'text'
                    },
                    deletable: false,
                    delete: deleteFunc
                }
            }
        };

        const result = middleware.onCommand(response);
        expect(result).to.deep.equal(response);
        expect(deleteFunc).to.have.not.been.called;
    });

    it('skips deleting the original message when it did not cause an error and it should not delete non-errored messages', () => {
        const middleware = new AutoRemoveMessageMiddleware();
        const deleteFunc = sinon.spy();
        const response = {
            request: {
                message: {
                    channel: {
                        type: 'text'
                    },
                    deletable: true,
                    delete: deleteFunc
                }
            }
        };

        const result = middleware.onCommand(response);
        expect(result).to.deep.equal(response);
        expect(deleteFunc).to.have.not.been.called;
    });

    it('deletes the original message when it did not cause an error and it should delete non-errored messages', () => {
        const middleware = new AutoRemoveMessageMiddleware({
            request: 5
        });
        const deleteFunc = sinon.spy();
        const response = {
            request: {
                message: {
                    channel: {
                        type: 'text'
                    },
                    deletable: true,
                    delete: deleteFunc
                }
            }
        };

        const result = middleware.onCommand(response);
        expect(result).to.deep.equal(response);
        expect(deleteFunc).inOrder.to.have.been.calledWith(5000);
    });

    it('skips deleting the original message when it caused a disallowed error and it should not delete disallowed messages', () => {
        const middleware = new AutoRemoveMessageMiddleware();
        const error = new Error('some error');
        error.name = 'PermissionError'; // Simulate error
        const deleteFunc = sinon.spy();
        const response = {
            error,
            request: {
                message: {
                    channel: {
                        type: 'text'
                    },
                    deletable: true,
                    delete: deleteFunc
                }
            }
        };

        const result = middleware.onCommand(response);
        expect(result).to.deep.equal(response);
        expect(deleteFunc).to.have.not.been.called;
    });

    it('deletes the original message caused a disallowed error and it should delete disallowed messages', () => {
        const middleware = new AutoRemoveMessageMiddleware({
            disallowed_request: 5
        });
        const error = new Error('some error');
        error.name = 'PermissionError'; // Simulate error
        const deleteFunc = sinon.spy();
        const response = {
            error,
            request: {
                message: {
                    channel: {
                        type: 'text'
                    },
                    deletable: true,
                    delete: deleteFunc
                }
            }
        };

        const result = middleware.onCommand(response);
        expect(result).to.deep.equal(response);
        expect(deleteFunc).inOrder.to.have.been.calledWith(5000);
    });

    it('skips deleting the original message when it caused an error and it should not delete errored messages', () => {
        const middleware = new AutoRemoveMessageMiddleware();
        const deleteFunc = sinon.spy();
        const response = {
            error: new Error('some error'),
            request: {
                message: {
                    channel: {
                        type: 'text'
                    },
                    deletable: true,
                    delete: deleteFunc
                }
            }
        };

        const result = middleware.onCommand(response);
        expect(result).to.deep.equal(response);
        expect(deleteFunc).to.have.not.been.called;
    });

    it('deletes the original message caused an error and it should delete errored messages', () => {
        const middleware = new AutoRemoveMessageMiddleware({
            errored_request: 5
        });
        const deleteFunc = sinon.spy();
        const response = {
            error: new Error('some error'),
            request: {
                message: {
                    channel: {
                        type: 'text'
                    },
                    deletable: true,
                    delete: deleteFunc
                }
            }
        };

        const result = middleware.onCommand(response);
        expect(result).to.deep.equal(response);
        expect(deleteFunc).inOrder.to.have.been.calledWith(5000);
    });

    it('skips deleting the reply message when the channel type does not match', () => {
        const middleware = new AutoRemoveMessageMiddleware();
        const deleteFunc = sinon.spy();
        const response = {
            request: {
                message: {
                    channel: {
                        type: 'not-a-channel'
                    }
                }
            }
        };
        const message = {
            delete: deleteFunc
        };

        const result = middleware.onReplyPosted(response, message);
        expect(result).to.deep.equal(response);
        expect(deleteFunc).to.have.not.been.called;
    });

    it('skips deleting the reply message when it is not deletable', () => {
        const middleware = new AutoRemoveMessageMiddleware();
        const deleteFunc = sinon.spy();
        const response = {
            request: {
                message: {
                    channel: {
                        type: 'text'
                    }
                }
            }
        };
        const message = {
            deletable: false,
            delete: deleteFunc
        };

        const result = middleware.onReplyPosted(response, message);
        expect(result).to.deep.equal(response);
        expect(deleteFunc).to.have.not.been.called;
    });

    it('skips deleting the reply message when it did not cause an error and it should not delete non-errored messages', () => {
        const middleware = new AutoRemoveMessageMiddleware();
        const deleteFunc = sinon.spy();
        const response = {
            request: {
                message: {
                    channel: {
                        type: 'text'
                    }
                }
            }
        };
        const message = {
            deletable: true,
            delete: deleteFunc
        };

        const result = middleware.onReplyPosted(response, message);
        expect(result).to.deep.equal(response);
        expect(deleteFunc).to.have.not.been.called;
    });

    it('deletes the reply message when it did not cause an error and it should delete non-errored messages', () => {
        const middleware = new AutoRemoveMessageMiddleware({
            response: 5
        });
        const deleteFunc = sinon.spy();
        const response = {
            request: {
                message: {
                    channel: {
                        type: 'text'
                    }
                }
            }
        };
        const message = {
            deletable: true,
            delete: deleteFunc
        };

        const result = middleware.onReplyPosted(response, message);
        expect(result).to.deep.equal(response);
        expect(deleteFunc).inOrder.to.have.been.calledWith(5000);
    });

    it('skips deleting the reply message when it caused a disallowed error and it should not delete disallowed messages', () => {
        const middleware = new AutoRemoveMessageMiddleware();
        const error = new Error('some error');
        error.name = 'PermissionError'; // Simulate error
        const deleteFunc = sinon.spy();
        const response = {
            error,
            request: {
                message: {
                    channel: {
                        type: 'text'
                    }
                }
            }
        };
        const message = {
            deletable: true,
            delete: deleteFunc
        };

        const result = middleware.onReplyPosted(response, message);
        expect(result).to.deep.equal(response);
        expect(deleteFunc).to.have.not.been.called;
    });

    it('deletes the reply message caused a disallowed error and it should delete disallowed messages', () => {
        const middleware = new AutoRemoveMessageMiddleware({
            disallowed_response: 5
        });
        const error = new Error('some error');
        error.name = 'PermissionError'; // Simulate error
        const deleteFunc = sinon.spy();
        const response = {
            error,
            request: {
                message: {
                    channel: {
                        type: 'text'
                    }
                }
            }
        };
        const message = {
            deletable: true,
            delete: deleteFunc
        };

        const result = middleware.onReplyPosted(response, message);
        expect(result).to.deep.equal(response);
        expect(deleteFunc).inOrder.to.have.been.calledWith(5000);
    });

    it('skips deleting the reply message when it caused an error and it should not delete errored messages', () => {
        const middleware = new AutoRemoveMessageMiddleware();
        const deleteFunc = sinon.spy();
        const response = {
            error: new Error('some error'),
            request: {
                message: {
                    channel: {
                        type: 'text'
                    }
                }
            }
        };
        const message = {
            deletable: true,
            delete: deleteFunc
        };

        const result = middleware.onReplyPosted(response, message);
        expect(result).to.deep.equal(response);
        expect(deleteFunc).to.have.not.been.called;
    });

    it('deletes the reply message caused an error and it should delete errored messages', () => {
        const middleware = new AutoRemoveMessageMiddleware({
            errored_response: 5
        });
        const deleteFunc = sinon.spy();
        const response = {
            error: new Error('some error'),
            request: {
                message: {
                    channel: {
                        type: 'text'
                    }
                }
            }
        };
        const message = {
            deletable: true,
            delete: deleteFunc
        };

        const result = middleware.onReplyPosted(response, message);
        expect(result).to.deep.equal(response);
        expect(deleteFunc).inOrder.to.have.been.calledWith(5000);
    });

});
