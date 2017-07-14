'use strict';


/**
 * Gets the maximum value in an Array, Map or Object. If strict is enabled, only one maximum value is allowed.
 * If no maximum value is found, undefined is returned.
 * @param {Array|Map|Object} items - The items.
 * @param {function(*, *)|undefined} [comparer = undefined] - The comparer function.
 * @param {boolean} [strict = false] - Strict mode.
 * @returns {*|undefined} The maximum value, or undefined if not found.
 */
function maxAll(items, comparer = undefined, strict = false) {
    const index = maxAllIndex(items, comparer, strict);
    if (Array.isArray(items)) {
        return index > -1 ? items[index] : undefined;
    }
    return index ? items[index] : undefined;
}

/**
 * Gets the index of the maximum value in an Array, Map or Object. If strict is enabled, only one maximum value is allowed.
 * If no maximum value is found, -1 is returned in case of an Array, and otherwise undefined.
 * @param {Array|Map|Object} items - The items.
 * @param {function(*, *)|undefined} [comparer = undefined] - The comparer function.
 * @param {boolean} [strict = false] - Strict mode.
 * @returns {number|String} The index or key of the maximum value, or if not found -1 in case of Arrays and undefined otherwise.
 */
function maxAllIndex(items, comparer = undefined, strict = false) {
    if (!comparer) {
        comparer = (m, x) => {
            if (!m || x > m) {
                return x;
            } else if (!x || x < m) {
                return m;
            }
            return undefined;
        };
    }

    let max = 0;
    let index = -1;

    if (!items) {
        return -1;
    }
    if (Array.isArray(items)) {
        for (let i = 0; i < items.length; i++) {
            const comp = comparer(max, items[i]);
            if (comp) {
                max = comp;
                index = i;
            } else if (strict) {
                index = -1; // Strict doesn't allow multiple maximum values, reset index
            }
        }
    } else if (items instanceof Map) {
        for (const [key, item] of items) {
            const comp = comparer(max, item);
            if (comp) {
                max = comp;
                index = key;
            } else if (strict) {
                index = undefined; // Strict doesn't allow multiple maximum values, reset index
            }
        }
    } else if (typeof items === 'object') {
        for (const key in items) {
            if (items.hasOwnProperty(key)) {
                const comp = comparer(max, items[key]);
                if (comp) {
                    max = comp;
                    index = key;
                } else if (strict) {
                    index = undefined; // Strict doesn't allow multiple maximum values, reset index
                }
            }
        }
    }

    return index;
}

module.exports = {
    maxAll,
    maxAllIndex
};
