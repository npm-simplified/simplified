'use strict';

const _ = require('underscore');

let Cache = {};

/**
 * Manage cache object.
 *
 * @param {string} group
 * @returns {{set: set, get: get, clear: clear, genKey: (function(*=): *)}}
 */
const appCache = function(group) {
    let results = Cache[group] || {};

    let genKey = obj => {
        let keys = [];

        if ( _.isArray(obj) ) {
            keys = keys.concat(obj);
        } else if ( _.isObject(obj) ) {
            _.each( obj, (v, k) => {
                if ( _.isObject(v) ) {
                    v = genKey(v);
                }

                keys.push(`${k}_${v}`);
            });
        } else {
            keys.push(obj);
        }

        return keys.join('-');
    };

    return {
        /**
         * Helper method to generate cache key base on the given array or object.
         *
         * @param {object|array} obj
         * @returns {string}
         */
        genKey: obj => {
            return genKey(obj);
        },

        /**
         * Get the value of the given key from cached group.
         *
         * @param {string} key
         * @returns {any}
         */
        get: key => {
            if ( ! key ) {
                return _.keys(results).length && results;
            }

            if ( results[key] ) {
                return results[key];
            }

            return null;
        },

        /**
         * Set a cache value of the given key to the cache group.
         *
         * @param {string} key
         * @param {any} value
         */
        set: (key, value) => {
            results[key] = value;
            Cache[group] = results;
        },

        /**
         * Remove cache value base on the given key or remove the entire cache base on the given group.
         *
         * @param {string} key          Optional. If omitted, will remove the entire cache of the given group name.
         */
        clear: key => {
            if ( key ) {
                delete results[key];

                Cache[group] = results;

                return;
            }

            delete Cache[group];
        }
    }
};
setGlobalVar( 'appCache', appCache );