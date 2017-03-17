'use strict';

const toMarkdown = require('to-markdown');


const converters = {
    wiki: () => [
        {
            // Convert various stuff to plain-text
            filter: ['a', 'small', 'span'],
            replacement: (innerHTML, node) => node.style.display !== 'none' ? innerHTML : ''
        },
        {
            // Filter out all unwanted tags
            filter: node => !node.nodeName.match(/^(b|strong|i|em|s|del|p)$/i),
            replacement: () => ''
        }
    ],
    'wiki-ext': options => [
        {
            filter: 'a',
            replacement: (innerHTML, node) => {
                const url = options.prefixUrl ? `${options.prefixUrl}${node.href}` : node.href;
                if (node.title) {
                    return `[${innerHTML}](${url} "${node.title}")`;
                } else {
                    return `[${innerHTML}](${url})`;
                }
            }
        },
        {
            // Convert various stuff to plain-text
            filter: ['small', 'span'],
            replacement: (innerHTML, node) => node.style.display !== 'none' ? innerHTML : ''
        },
        {
            // Filter out all unwanted tags
            filter: node => !node.nodeName.match(/^(a|b|strong|i|em|s|del|p)$/i),
            replacement: () => ''
        }
    ],
    feed: () => [

    ]
};

/**
 * Converts HTML to Markdown.
 * @param {string} html - The html text.
 * @param {string} [converter=wiki] - The converter to use (wiki or feed).
 * @param {Object} [options] - Extra options.
 * @return {string} The Markdownified text.
 */
function convertHtmlToMarkdown(html, converter = 'wiki', options) {
    return toMarkdown(html, { converters: converters[converter](options || {}) });
}

module.exports = {
    convertHtmlToMarkdown
};
