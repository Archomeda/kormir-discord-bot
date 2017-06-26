'use strict';

const objectPath = require('object-path');

class ConfigItem {
    constructor(config, defaultConfig, defaultAppConfig, root) {
        this._config = config;
        this._defaultConfig = defaultConfig;
        this._defaultAppConfig = defaultAppConfig;
        this._root = root || [];
    }

    root(path) {
        path = this._mergePath(path);
        return new ConfigItem(this._config, this._defaultConfig, this._defaultAppConfig, path);
    }

    get(path, defaultValue) {
        const mergedPath = this._mergePath(path);
        let val = objectPath.get(this._config, mergedPath);
        val = val !== undefined ? val : objectPath.get(this._defaultAppConfig, mergedPath, defaultValue);
        val = val !== undefined ? val : objectPath.get(this._defaultConfig, mergedPath, defaultValue);

        if (typeof val === 'object' && !Array.isArray(val)) {
            // Returned item is actually an object, wrap it
            return this.root(path);
        }
        return val;
    }

    has(path) {
        return this.hasConfig(path) || this.hasDefault(path);
    }

    hasConfig(path) {
        path = this._mergePath(path);
        return objectPath.has(this._config, path);
    }

    hasDefault(path) {
        path = this._mergePath(path);
        return objectPath.has(this._defaultAppConfig, path) || objectPath.has(this._defaultConfig, path);
    }

    set(path, value) {
        path = this._mergePath(path);
        objectPath.set(this._config, path, value);
    }

    raw() {
        let val = objectPath.get(this._config, this._root);
        val = val !== undefined ? val : objectPath.get(this._defaultAppConfig, this._root);
        return val !== undefined ? val : objectPath.get(this._defaultConfig, this._root);
    }

    _mergePath(path) {
        if (path.startsWith('/')) {
            return path.substr(1).split('.');
        }
        return this._root.concat(path.split('.'));
    }
}

module.exports = ConfigItem;
