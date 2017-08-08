'use strict';

const objectPath = require('object-path');


/**
 * A config item.
 */
class ConfigItem {
    /**
     * Creates a new config.
     * @param {ConfigItem} config - The original config object.
     * @param {Object} defaultConfig - Default config.
     * @param {Object} defaultAppConfig - Default application config.
     * @param {Array} [root] - The config root.
     */
    constructor(config, defaultConfig, defaultAppConfig, root) {
        this._config = config;
        this._defaultConfig = defaultConfig;
        this._defaultAppConfig = defaultAppConfig;
        this._root = root || [];
    }

    /**
     * Sets the root.
     * @param {string} path - The path to use as the root, relative to the current root. Can use "/" as prefix to avoid using the relative root.
     * @returns {ConfigItem} The config object.
     */
    root(path) {
        const newPath = this._mergePath(path);
        return new ConfigItem(this._config, this._defaultConfig, this._defaultAppConfig, newPath);
    }

    /**
     * Gets a config value.
     * @param {string} path - The path, relative to the current root. Can use "/" as prefix to avoid using the defined root.
     * @param {*} [defaultValue] - The default value if the config value is not found.
     * @returns {ConfigItem|*} - The config value, or a new config object wrapper if the value is an object, with its root set to the path of the value.
     */
    get(path, defaultValue) {
        const mergedPath = this._mergePath(path);
        let val = objectPath.get(this._config, mergedPath);
        val = val !== undefined ? val : objectPath.get(this._defaultAppConfig, mergedPath, defaultValue);
        val = val !== undefined ? val : objectPath.get(this._defaultConfig, mergedPath, defaultValue);

        if (val && typeof val === 'object' && !Array.isArray(val)) {
            // Returned item is actually an object, wrap it
            return this.root(path);
        }
        return val;
    }

    /**
     * Checks if the config has a value for a path.
     * @param {string} path - The path, relative to the current root. Can use "/" as prefix to avoid using the defined root.
     * @returns {boolean} True if it exists; false otherwise.
     */
    has(path) {
        return this.hasConfig(path) || this.hasDefault(path);
    }

    /**
     * Explicitly checks if the config has a local config for a path.
     * @param {string} path - The path, relative to the current root. Can use "/" as prefix to avoid using the defined root.
     * @returns {boolean} True if it exists; false otherwise.
     */
    hasConfig(path) {
        return objectPath.has(this._config, this._mergePath(path));
    }

    /**
     * Explicitly checks if the config has a default config for a path.
     * @param {string} path - The path, relative to the current root. Can use "/" as prefix to avoid using the defined root.
     * @returns {boolean} True if it exists; false otherwise.
     */
    hasDefault(path) {
        const mergedPath = this._mergePath(path);
        return objectPath.has(this._defaultAppConfig, mergedPath) || objectPath.has(this._defaultConfig, mergedPath);
    }

    /**
     * Sets a config.
     * @param {string} path - The path, relative to the current root. Can use "/" as prefix to avoid using the defined root.
     * @param {*} value - The value to set.
     */
    set(path, value) {
        objectPath.set(this._config, this._mergePath(path), value);
    }

    /**
     * Gets the config value as a raw value, e.g. a generic object instead of a config object.
     * @returns {*} The raw value.
     */
    raw() {
        let val = objectPath.get(this._config, this._root);
        val = val !== undefined ? val : objectPath.get(this._defaultAppConfig, this._root);
        return val !== undefined ? val : objectPath.get(this._defaultConfig, this._root);
    }

    /**
     * Merges the given path into the current root and returns it, but does not set the root.
     * @param {string} path - The path, relative to the current root. Can use "/" as prefix to avoid using the defined root.
     * @returns {Array} The new path, as array.
     * @private
     */
    _mergePath(path) {
        if (path.startsWith('/')) {
            return path.substr(1).split('.');
        }
        return this._root.concat(path.split('.'));
    }
}

module.exports = ConfigItem;
