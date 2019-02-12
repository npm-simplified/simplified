'use strict';

const _ = require('underscore');

/**
 * Helper function to add non-writable global variable.
 *
 * @param name
 * @param value
 * @returns {boolean}
 */
const setGlobalVar = (name, value) => {
    if ( Object.hasOwnProperty(name) ) {
        return false;
    }

    global[name] = value;

    Object.defineProperty( global, name, {
        value: value,
        writable: false
    } );

    return true;
};
Object.defineProperty( global, 'setGlobalVar', {
    value: setGlobalVar,
    writable: false
});

/**
 * Helper function to handle error responses.
 *
 * @param error
 * @returns {{error: boolean, message: (*|string)}}
 * @private
 */
const errorHandler = error => {
    let message = '';

    if ( 'string' === typeof error ) {
        message = error;
    } else if ( _.isArray(error) ) {
        message = error;
    } else if ( error && error.sqlMessage ) {
        message = error.sqlMessage;
    } else if ( error && error.message ) {
        message = error.message;
    } else if ( error && error.errmsg ) {
        message = error.errmsg;
    } else {
        message = '';//il8n('An unknown error occur.');
    }

    return {
        error: true,
        message: message
    };
};
setGlobalVar( 'errorHandler', errorHandler );

const isError = function(resp) {
    return !!(resp && resp.error && resp.message);
};
setGlobalVar( 'isError', isError );

const sprintf = function(str) {
    let pattern = /%[1-9]\$s|%s|%d/g,
        formats = str.match(pattern),
        values = _.values(arguments).slice(1);

    if ( ! formats ) {
        return str;
    }

    let start = 0;
    str = str.replace( pattern, x => {
        x = values[start];
        start++;

        return x;
    });

    return str;
};
setGlobalVar( 'sprintf', sprintf );

/**
 * Serialize the given value if it is of object or array type.
 *
 * @param value
 * @returns {*}
 */
const serialize = value => {
    if ( ! value ) {
        return value;
    }

    if ( 'string' === typeof value ) {
        return value;
    }

    return JSON.stringify(value);
};
setGlobalVar( 'serialize', serialize );

/**
 * Unserialize the value that was previously serialized.
 *
 * @param value
 * @returns {*}
 */
const unserialize = value => {
    if ( ! value ) {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch(e) {
        return value;
    }
};
setGlobalVar( 'unserialize', unserialize );

/**
 * Helper function that simply returns true.
 *
 * @returns {boolean}
 */
const returnTrue = () => {
    return true;
};
setGlobalVar( 'returnTrue', returnTrue );

/**
 * Helper function to return a resolve promise.
 *
 * @param response
 * @returns {Promise<any>}
 * @private
 */
const resolve = response => {
    return Promise.resolve(response);
};
setGlobalVar( 'resolve', resolve );

/**
 * Helper function to return a rejected promise.
 *
 * @param response
 * @returns {Promise<error>}
 * @private
 */
const reject = response => {
    return Promise.resolve(errorHandler(response));
};
setGlobalVar( 'reject', reject );

/**
 * Check if it is a valid email address.
 * @param {string} email
 * @returns {boolean}
 */
const isEmail = email => {
    let atPos = email.indexOf('@'),
        dotPos = email.indexOf('.');

    return atPos && dotPos && dotPos > (atPos+2);
};
setGlobalVar( 'isEmail', isEmail );

/**
 * Generate slug string base on the given string.
 *
 * @param {string} str
 * @returns {string}
 */
const toSlug = str => {
    return str.toLowerCase().replace(/[ '`"*&^%$#@!<>\/]/g, '-');
};
setGlobalVar( 'toSlug', toSlug );