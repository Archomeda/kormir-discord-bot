'use strict';

const Feedparser = require('feedparser');
const request = require('request');


class RssError extends Error {
    /**
     * Creates a new RSS error.
     * @param {integer} status - The status code.
     */
    constructor(status) {
        super(`Invalid status code ${status}`);
        this.name = 'RssError';
        Error.captureStackTrace(this, this.constructor);
        this.status = status;
    }
}

/**
 * Reads an RSS feed.
 * @param {string} url - The URL.
 * @returns {Promise<{}>} The RSS reader.
 */
function readRss(url) {
    return new Promise((resolve, reject) => {
        const r = request(url);
        const feed = new Feedparser();

        r.on('error', reject);
        r.on('response', function (res) {
            if (res.statusCode >= 200 && res.statusCode <= 299) {
                this.pipe(feed);
            } else {
                reject(new RssError(res.statusCode));
            }
        });

        const ret = {
            meta: undefined,
            items: []
        };
        feed.on('error', reject);
        feed.on('readable', function () {
            let item;
            while ((item = this.read())) {
                ret.items.push(item);
            }
            if (!ret.meta) {
                ret.meta = this.meta;
            }
        });

        r.on('end', () => {
            resolve(ret);
        });
    });
}

module.exports = {
    readRss,
    RssError
};
