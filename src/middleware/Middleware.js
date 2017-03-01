'use strict';

class Middleware {
    constructor() {
        if (new.target === Middleware) {
            throw new TypeError('Cannot construct Middleware instances directly');
        }
        this.name = this.constructor.name;
        this.order = 0;
    }

    onCommand(response) {
        return response;
    }

    onResponse(response) {
        return response;
    }

    onReply(response, message) {
        return response;
    }
}

module.exports = Middleware;
