'use strict';

const Promise = require('bluebird');
const i18next = Promise.promisifyAll(require('i18next'));

const CommandError = require('../errors/CommandError');
const Command = require('./Command');


/**
 * An abstract command that can map itself 1:1 to a database model.
 */
class CommandDatabaseModel extends Command {
    /**
     * Constructs a new CommandDatabaseModel.
     * @param {Module} module - The module.
     * @param {Model} Model - The database model.
     * @param {string} type - The command type.
     */
    constructor(module, Model, type) {
        super(module);

        this.Model = Model;
        if (!['list', 'view', 'add', 'edit', 'delete'].includes(type)) {
            throw new TypeError('type is not a valid type (should be one of: list, view, add, edit, delete)');
        }
        this.type = type;

        i18next.loadNamespacesAsync('module');
    }

    /**
     * The parameter mapping from command parameters to database fields.
     * Can omit fields if they are the same name; or undefined if no mapping should occur.
     * @return {(Object.<string, string>|undefined)} The mapping from command parameters to database fields.
     */
    get paramsMap() {
        return undefined;
    }

    /**
     * Checks if the current command executor can execute the command.
     * @param {CommandResponse} response - The response object.
     * @param {*} item - The item.
     * @return {boolean} True if allowed; false otherwise.
     */
    canExecute(response, item) {
        switch (this.type) {
            case 'list':
                return this.canList(response, item);
            case 'view':
                return this.canView(response, item);
            case 'add':
                return this.canAdd(response, item);
            case 'edit':
                if (response.request.message.author.id === item.owner) {
                    return this.canEditOwn(response, item);
                }
                return this.canEditOther(response, item);
            case 'delete':
                if (response.request.message.author.id === item.owner) {
                    return this.canDeleteOwn(response, item);
                }
                return this.canDeleteOther(response, item);
            default:
                return false;
        }
    }

    /**
     * Checks if the current command executor can list items.
     * @param {CommandResponse} response - The response object.
     * @param {*} item - The item.
     * @return {boolean} True if allowed; false otherwise.
     */
    canList(response, item) {
        return true;
    }

    /**
     * Checks if the current command executor can view an individual item.
     * @param {CommandResponse} response - The response object.
     * @param {*} item - The item.
     * @return {boolean} True if allowed; false otherwise.
     */
    canView(response, item) {
        return true;
    }

    /**
     * Checks if the current command executor can add items.
     * @param {CommandResponse} response - The response object.
     * @param {*} item - The item.
     * @return {boolean} True if allowed; false otherwise.
     */
    canAdd(response, item) {
        return true;
    }

    /**
     * Checks if the current command executor can edit their own item.
     * @param {CommandResponse} response - The response object.
     * @param {*} item - The item.
     * @return {boolean} True if allowed; false otherwise.
     */
    canEditOwn(response, item) {
        return true;
    }

    /**
     * Checks if the current command executor can edit an item that's not theirs.
     * @param {CommandResponse} response - The response object.
     * @param {*} item - The item.
     * @return {boolean} True if allowed; false otherwise.
     */
    canEditOther(response, item) {
        return this.isExecutionAllowed(response.request.message.member || response.request.message.author, 'other') || false;
    }

    /**
     * Checks if the current command executor can delete their own item.
     * @param {CommandResponse} response - The response object.
     * @param {*} item - The item.
     * @return {boolean} True if allowed; false otherwise.
     */
    canDeleteOwn(response, item) {
        return true;
    }

    /**
     * Checks if the current command executor can delete an item that's not theirs.
     * @param {CommandResponse} response - The response object.
     * @param {*} item - The item.
     * @return {boolean} True if allowed; false otherwise.
     */
    canDeleteOther(response, item) {
        return this.isExecutionAllowed(response.request.message.member || response.request.message.author, 'other') || false;
    }


    /**
     * Gets the respective item.
     * @param {Model} Model - The database model.
     * @param {Object.<string, *>} props - The model properties.
     * @return {Promise} The promise with the item.
     */
    getExecute(Model, props) {
        switch (this.type) {
            case 'list':
                return this.getList(Model, props);
            case 'view':
                return this.getView(Model, props);
            case 'add':
                return this.getAdd(Model, props);
            case 'edit':
                return this.getEdit(Model, props);
            case 'delete':
                return this.getDelete(Model, props);
            default:
                return undefined;
        }
    }

    /**
     * Gets the items.
     * @param {Model} Model - The database model.
     * @param {Object.<string, *>} props - The model properties.
     * @return {Promise} The promise with the item.
     */
    getList(Model, props) {
        return Model.find({});
    }

    /**
     * Gets an individual item.
     * @param {Model} Model - The database model.
     * @param {Object.<string, *>} props - The model properties.
     * @return {Promise} The promise with the item.
     */
    getView(Model, props) {
        return Model.findOne({ id: props.id });
    }

    /**
     * Gets a new item to add.
     * @param {Model} Model - The database model.
     * @param {Object.<string, *>} props - The model properties.
     * @return {Promise} The promise with the item.
     */
    getAdd(Model, props) {
        return Promise.resolve(new Model(props));
    }

    /**
     * Gets an item to edit.
     * @param {Model} Model - The database model.
     * @param {Object.<string, *>} props - The model properties.
     * @return {Promise} The promise with the item.
     */
    getEdit(Model, props) {
        return Model.findOne({ id: props.id });
    }

    /**
     * Gets an item to delete.
     * @param {Model} Model - The database model.
     * @param {Object.<string, *>} props - The model properties.
     * @return {Promise} The promise with the item.
     */
    getDelete(Model, props) {
        return Model.findOne({ id: props.id });
    }


    /**
     * Transforms the value of a parameter.
     * @param {CommandResponse} response - The response object.
     * @param {string} paramName - The command parameter name.
     * @param {*} paramValue - The parameter value.
     * @return {*} The transformed parameter value.
     */
    transformParam(response, paramName, paramValue) {
        return paramValue;
    }

    /**
     * Validates the command parameters.
     * @param {CommandResponse} response - The response object.
     * @param {Object.<string, *>} props - The model properties.
     * @return {(boolean|string)} True if all parameters are valid; otherwise a string explaining what is invalid.
     */
    validateProps(response, props) {
        return true;
    }

    /**
     * Converts command parameters to model properties.
     * @param {CommandResponse} response - The response object.
     * @return {Object.<string, *>} The model properties.
     */
    convertParamsToProps(response) {
        const props = {};
        for (let paramName in response.request.params) {
            if (response.request.params.hasOwnProperty(paramName)) {
                const propsName = this.paramsMap && this.paramsMap[paramName] ? this.paramsMap[paramName] : paramName;
                props[propsName] = this.transformParam(response, paramName, response.request.params[paramName]);
            }
        }
        return props;
    }

    /**
     * Formats the result.
     * @param {CommandResponse} response - The response object.
     * @param {*} result - The result.
     * @return {string} The formatted result.
     */
    formatResult(response, result) {
        throw new TypeError('Derivative should implement format');
    }


    onCommand(response) {
        const props = this.convertParamsToProps(response);
        return this.getExecute(this.Model, props).then(item => {
            if (!this.canExecute(response, item)) {
                throw new CommandError(i18next.t('module:database-model.response-no-permission'));
            }

            if (['add', 'edit'].includes(this.type)) {
                const validation = this.validateProps(response, props);
                if (validation !== true) {
                    throw new CommandError(validation);
                }
            }

            switch (this.type) {
                case 'list':
                case 'view':
                    return this.formatResult(response, item);
                case 'add':
                    return item.save().then(item => this.formatResult(response, item));
                case 'edit':
                    return item.set(props).save().then(item => this.formatResult(response, item));
                case 'delete':
                    return item.remove().then(result => this.formatResult(response, result));
                default:
                    return undefined;
            }
        });
    }
}

module.exports = CommandDatabaseModel;
