'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const i18next = Promise.promisifyAll(require('i18next'));

const Middleware = require('../Middleware');
const PermissionError = require('../../errors/PermissionError');


class RestrictPermissionsMiddleware extends Middleware {
    constructor(options) {
        super(options);
        this.order = -1000;
        i18next.loadNamespacesAsync('middleware');
    }

    get defaultOptions() {
        return {
            permissions: {}
        };
    }

    onCommand(response) {
        const request = response.request;
        if (!this.isCommandAllowed(request.message, request.command, request.params)) {
            throw new PermissionError(
                `Access to command denied by permissions (user: ${request.message.author.fullUsername}, command: ${request.command.trigger}, permission: ${request.command.permissionId})`,
                'log',
                i18next.t('middleware:restrict-permissions.access-denied')
            );
        }
        return response;
    }

    isCommandAllowed(message, command, params) {
        return command.isExecutionAllowed(message.member || message.author);
    }
}

module.exports = RestrictPermissionsMiddleware;
