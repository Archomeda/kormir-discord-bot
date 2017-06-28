'use strict';

const toMarkdown = require('to-markdown');


function replacePlainText(innerHTML, node) {
    return node.style.display !== 'none' ? innerHTML : '';
}

function replaceDivs(innerHTML, node) {
    if (node.className.includes('box') || node.className.includes('thumb')) {
        return '';
    }
    if (node.style.position === 'absolute') {
        return '';
    }
    return innerHTML;
}

function replaceBlockquote(innerHTML) {
    innerHTML = innerHTML.trim().replace(/\n+/g, '\n');
    return `> ${replaceItalic(innerHTML)}`;
}

function replaceItalic(innerHTML) {
    const hasUnderscores = innerHTML.includes('_');
    const hasAsterisks = innerHTML.includes('*');

    if (!hasUnderscores && hasAsterisks) {
        return `_${innerHTML}_`;
    }
    // Normally we want to check hasUnderscores && !hasAsterisks, but even if both symbols are present,
    // we can't really do anything since Discord's Markdown formatting is broken, e.g. *italic_this*_doesn't_work*.
    // It only italicizes italic_this, while we expect it to italicize everything and leave the embedded asterisk alone.
    // Sadly, the same applies if you swap the symbols around. So there's no way to solve it.
    return `*${innerHTML}*`;
}

function filterUnwantedTags(node) {
    return !node.nodeName.match(/^(b|strong|s|del|p)$/i);
}

const converters = {
    wiki: () => [
        {
            // Convert various stuff to plain-text
            filter: ['a', 'small', 'span'],
            replacement: replacePlainText
        },
        {
            // Filter divs
            filter: 'div',
            replacement: replaceDivs
        },
        {
            // Format blockquotes
            filter: 'blockquote',
            replacement: replaceBlockquote
        },
        {
            // Override the default italic output because of a weird bug in Discord embeds that might break formatting
            // if the same formatting symbol exists in the text
            filter: ['i', 'em'],
            replacement: replaceItalic
        },
        {
            // Filter out all unwanted tags
            filter: filterUnwantedTags,
            replacement: () => ''
        }
    ],
    'wiki-ext': options => [
        {
            filter: 'a',
            replacement: (innerHTML, node) => {
                if (innerHTML) {
                    const url = options.prefixUrl && !(node.href.startsWith('http://') || node.href.startsWith('https://')) ?
                        `${options.prefixUrl}${node.href}` : node.href;
                    return node.title ? `[${innerHTML}](${url} "${node.title}")` : `[${innerHTML}](${url})`;
                }
                return '';
            }
        },
        {
            // Convert various stuff to plain-text
            filter: ['small', 'span'],
            replacement: replacePlainText
        },
        {
            // Filter divs
            filter: 'div',
            replacement: replaceDivs
        },
        {
            // Format blockquotes
            filter: 'blockquote',
            replacement: replaceBlockquote
        },
        {
            // Override the default italic output because of a weird bug in Discord embeds that might break formatting
            // if the same formatting symbol exists in the text
            filter: ['i', 'em'],
            replacement: replaceItalic
        },
        {
            // Filter out all unwanted tags
            filter: filterUnwantedTags,
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
    return toMarkdown(html, { converters: converters[converter](options || {}) }).trim();
}

module.exports = {
    convertHtmlToMarkdown
};
