const
    toMarkdown = require('to-markdown');

const converters = {
    'wiki': [
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
    'feed': [

    ]
};

/**
 * Converts HTML to Markdown.
 * @param {string} html - The html text.
 * @param {string} [converter=wiki] - The converter to use (wiki or feed).
 */
function convertHtmlToMarkdown(html, converter = 'wiki') {
    return toMarkdown(html, { converters: converters[converter] })
}

module.exports = {
    convertHtmlToMarkdown
};
