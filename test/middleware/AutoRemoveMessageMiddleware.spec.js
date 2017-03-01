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
    it('it constructs an AutoRemoveMessageMiddleware object properly with defaults', () => {
        let middleware;
        expect(() => {
            middleware = new AutoRemoveMessageMiddleware();
        }).to.not.throw(TypeError);

        expect(middleware.options.disallowed_request).to.be.false;
        expect(middleware.options.disallowed_response).to.be.false;
        expect(middleware.options.errored_request).to.be.false;
        expect(middleware.options.errored_response).to.be.false;
        expect(middleware.options.request).to.be.false;
        expect(middleware.options.response).to.be.false;
        expect(middleware.options.types).to.deep.equal(['text']);
    });

    it('it constructs an AutoRemoveMessageMiddleware object properly with non-defaults', () => {
        let middleware;
        expect(() => {
            middleware = new AutoRemoveMessageMiddleware({
                disallowed_request: true,
                disallowed_response: true,
                errored_request: true,
                errored_response: true,
                request: true,
                response: true,
                types: 'dm',
            });
        }).to.not.throw(TypeError);

        expect(middleware.options.disallowed_request).to.be.true;
        expect(middleware.options.disallowed_response).to.be.true;
        expect(middleware.options.errored_request).to.be.true;
        expect(middleware.options.errored_response).to.be.true;
        expect(middleware.options.request).to.be.true;
        expect(middleware.options.response).to.be.true;
        expect(middleware.options.types).to.deep.equal(['dm']);
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

        const result = middleware.onReply(response, message);
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

        const result = middleware.onReply(response, message);
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

        const result = middleware.onReply(response, message);
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

        const result = middleware.onReply(response, message);
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

        const result = middleware.onReply(response, message);
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

        const result = middleware.onReply(response, message);
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

        const result = middleware.onReply(response, message);
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

        const result = middleware.onReply(response, message);
        expect(result).to.deep.equal(response);
        expect(deleteFunc).inOrder.to.have.been.calledWith(5000);
    });

});
