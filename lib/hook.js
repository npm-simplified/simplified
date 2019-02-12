'use strict';

const _ = require('underscore');

let eventHooks = {},
    filterHooks = {};

/**
 * Returns an array of hooks base on the given hook type.
 *
 * @access private
 *
 * @param {string} type
 * @param {string} name
 *
 * @returns {Array}
 */
const getHooks = function(type, name) {
    if ( 'event' === type ) {
        return eventHooks[name] || [];
    }

    return filterHooks[name] || [];
};

/**
 * Update the list of hooks base on the given type and name.
 *
 * @access private
 *
 * @param {string} type
 * @param {string} name
 * @param {array} value
 */
const updateHooks = function(type, name, value) {
    if ( 'event' === type ) {
        eventHooks[name] = value;

        return;
    }

    filterHooks[name] = value;
};

/**
 * Add callable function to the list of hooks that are triggered base on the given name.
 *
 * @param {string} type                 The name of hook type to add the functions to.
 * @param {string} name                 The name of the hook use to trigger an action.
 * @param {function} callback           The function to execute when the hook name is called.
 * @param {int} priority                The order to which the function will be executed. Default is 0.
 * @param {any} args                    Optional arguments to insert when the function is called.
 * @param {boolean} once                Whether to call the set function only once or every time the actionable hook is called.
 */
const addHook = function(type, name, callback) {
    let priority = arguments[3] || 0,
        args = arguments[4] || false,
        once = arguments[5] || false;

    if ( ! callback.name ) {
        return false;
    }

    let hooks = getHooks(type, name);

    hooks.push({
        callback: callback,
        priority: priority,
        args: args,
        once: once
    });

    updateHooks(type, name, hooks);

    return true;
};

/**
 * Remove the actionable function from the list or remove the entire list.
 *
 * @param {string} type                 The type of hook to remove from.
 * @param {string} name                 The name of the list.
 * @param {function} callback           The function that was previously inserted from the list. If omitted, will remove
 *                                      the entire list of actionable functions.
 */
const removeHook = function(type, name) {
    let callback = arguments[2] || false,
        hooks = getHooks(type, name);

    if ( ! hooks.length ) {
        return;
    }

    if ( ! callback ) {
        // Remove all
        updateHooks( type, name, [] );

        return;
    }

    let index = _.findIndex(hooks, {callback: callback} );
    if ( index >= 0 ) {
        hooks = hooks.filter( (hook, i) => {
            return i !== index;
        });
    }

    updateHooks(type, name, hooks);
};

/**
 * Check if the given hook type and name contains actionable list of functions.
 *
 * @param {string} type
 * @param {string} name
 * @returns {boolean}
 */
const hasHook = function(type, name) {
    let hooks = getHooks(type, name);

    return !!(hooks && hooks.length);
};

/**
 * Action event manager.
 *
 * @param {string} name
 * @returns {{once: once, trigger: trigger, off: off, on: on}}
 */
const appEvent = function(name) {
    return {
        /**
         * Sets an event which will only executed once.
         *
         * @param {function} callback
         * @param {int} priority
         * @param {any} args
         */
        setOnce: function(callback) {
            let priority = arguments[1] || 0,
                args = arguments[2] || false;

            return addHook( 'event', name, callback, priority, args, true );
        },

        /**
         * Adds a callable function to the list.
         *
         * @param {function} callback
         * @param {int} priority
         * @param {any} args
         */
        set: function(callback) {
            let priority = arguments[1] || 0,
                args = arguments[2] || false;

            return addHook( 'event', name, callback, priority, args );
        },

        /**
         * Remove a callable function from the list of event hook.
         *
         * @param {function} callback       Optional. Will remove the entire list of omitted.
         */
        unset: (callback) => {
            return removeHook( 'event', name, callback );
        },

        /**
         * Calls and execute the list of attached callable functions.
         *
         * @params {any} ....
         * @returns {Promise<boolean>}
         */
        trigger: async function() {
            if ( ! hasHook( 'event', name ) ) {
                return false;
            }

            let args = _.values(arguments),
                hooks = getHooks( 'event', name );

            hooks = _.sortBy( hooks, 'priority' );

            for ( let i = 0; i < hooks.length; i++ ) {
                let hook = hooks[i],
                    callback = hook.callback,
                    _args = [hook.args].concat(args);

                await callback.apply( null, _args );

                if ( hook.once ) {
                    removeHook( 'event', name, callback );
                }
            }

            return true;
        }
    }
};
setGlobalVar( 'appEvent', appEvent );

/**
 * Filter event manager.
 *
 * @param {string} name
 * @returns {{once: once, apply: apply, off: off, on: on}}
 */
const appFilter = function(name) {
    return {
        /**
         * Sets a filter which will only executed once.
         *
         * @param {function} callback
         * @param {int} priority
         * @param {any} args
         */
        setOnce: function(callback) {
            let priority = arguments[1] || 0,
                args = arguments[2] || false;

            return addHook( 'filter', name, callback, priority, args, true );
        },

        /**
         * Add a callable filter function to the list.
         *
         * @param {function} callback
         * @param {int} priority
         * @param {any} args
         */
        set: function(callback) {
            let priority = arguments[1] || 0,
                args = arguments[2] || false;

            return addHook( 'filter', name, callback, priority, args );
        },

        /**
         * Remove the previously set callable filter or remove the entire filters.
         *
         * @param {function} callback           Optional. If omitted, will remove the entire filter list.
         */
        unset: callback => {
            removeHook( 'filter', name, callback );
        },

        /**
         * Filters the given value thru the list of attached filters of the given filter name.
         *
         * @param {any} value
         * @param {any} .....               Optional. Additional arguments.
         * @param {any} args                The value of the last argument is the value of args during setting.
         *
         * @returns {Promise<*>}
         */
        apply: async function(value) {
            if ( ! hasHook( 'filter', name ) ) {
                return value;
            }

            let args = _.values(arguments).slice(1),
                hooks = getHooks( 'filter', name );

            hooks = _.sortBy( hooks, 'priority' );

            for ( let i = 0; i < hooks.length; i++ ) {
                let hook = hooks[i],
                    callback = hook.callback,
                    _args = [value].concat(args, hook.args);

                value = await callback.apply( null, _args );

                if ( hook.once ) {
                    removeHook( 'filter', name, callback );
                }
            }

            return value;
        }
    }
};
setGlobalVar( 'appFilter', appFilter );

module.exports = function() {
    eventHooks = {};
    filterHooks = {};

    return true;
};