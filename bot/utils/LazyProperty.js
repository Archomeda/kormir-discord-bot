'use strict';


/**
 * Adds a lazy-loaded property on an object.
 * @param {Object} obj - The proxied object.
 * @param {string} prop - The property name.
 * @param {function()} func - The function that will be called upon lazy loading.
 */
function addLazyProperty(obj, prop, func) {
    Object.defineProperty(obj, prop, {
        get() {
            const v = func.call(this);
            Object.defineProperty(this, prop, { value: v, writable: true });
            return v;
        },
        set(v) {
            Object.defineProperty(this, prop, { value: v, writable: true });
            return v;
        },
        configurable: true
    });
}

module.exports = {
    addLazyProperty
};
