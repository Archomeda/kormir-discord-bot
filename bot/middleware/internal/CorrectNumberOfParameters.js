'use strict';

const { deleteIgnoreErrors } = require('../../utils/DiscordMessage');

const Middleware = require('../Middleware');
const ParameterError = require('./ParameterError');


/**
 * A middleware to warn users if the amount of used parameters does not equal the required amount of parameters.
 */
class CorrectNumberOfParametersMiddleware extends Middleware {
    /**
     * Creates a new middleware to warn users if the amount of used parameters does not equal the required amount of parameters.
     * @param {Bot} bot - The bot instance.
     * @param {DiscordCommand} command - The Discord command.
     * @param {Object<string, *>} [options] - Additional options for the middleware.
     */
    constructor(bot, command, options) {
        super(bot, 'correctNumberOfParameters', command, options);

        this._defaultOptions = {
            removeDelay: 60
        };
    }

    /**
     * Checks if a request has the correct amount of parameters.
     * @param {DiscordCommandRequest} request - The command request.
     * @returns {boolean} True if it's correct; false otherwise.
     * @private
     */
    _hasCorrectAmountOfParameters(request) {
        const routeParameters = request.getRoute().getParameters();
        const parameters = request.getParameters();

        const minParamCount = routeParameters.filter(p => !p.isOptional()).length;
        const maxParamCount = routeParameters.length;
        const currentParamCount = routeParameters.filter(p => parameters[p.getId()]).length;
        return currentParamCount >= minParamCount && currentParamCount <= maxParamCount;
    }


    async onCommand(response) {
        const request = response.getRequest();
        const message = request.getMessage();

        if (!this._hasCorrectAmountOfParameters(request)) {
            await deleteIgnoreErrors(message, this.getOptions().removeDelay * 1000);
            throw new ParameterError(request);
        }
        return response;
    }

    async onReplyPosted(response, message) {
        if (!(response.getError() instanceof ParameterError)) {
            return response;
        }

        await deleteIgnoreErrors(message, this.getOptions().removeDelay * 1000);
        return response;
    }
}

module.exports = CorrectNumberOfParametersMiddleware;
