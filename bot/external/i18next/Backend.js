'use strict';

const fs = require('fs');
const Backend = require('i18next-node-fs-backend');

class LocalizationBackend extends Backend {
    read(language, namespace, callback) {
        // Intercept this call to support loading from multiple folders
        if (Array.isArray(this.options.loadPath) && !this.options.loadPaths) {
            this.options.loadPaths = this.options.loadPath;
        }

        const filenames = Array.isArray(this.options.loadPaths) ? this.options.loadPaths : [this.options.loadPaths];
        for (const filename of filenames) {
            const intFilename = this.services.interpolator.interpolate(filename, { lng: language, ns: namespace });
            if (fs.existsSync(intFilename)) {
                this.options.loadPath = filename;
                break;
            }
        }

        return super.read(language, namespace, callback);
    }
}

module.exports = LocalizationBackend;
