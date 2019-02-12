'use strict';

/**
 * Helper function to load core files with optional application configuration.
 *
 * @access private
 *
 * @param {string} file
 * @param {object} config
 */
const loader = function( file ) {
    let config = arguments[1] || {};

    try {
        let mod = require(file);

        if ( 'function' === typeof mod ) {
            mod.call( null, config );
        }

    } catch(e) {
        // @todo: log file
    }
};

module.exports = function(config) {
    global.currentUser = {ID: 0};

    loader('./utils');
    loader('./hook');
    loader('./filesystem');
    loader('./cache');
    loader('./i18n');
    loader('./encrypt');
    loader('./functions');
    loader('./mail', config );
    loader('./user');
    loader('./content-type');
    loader( './db', config );

    // Load routes
    loader('./routes/user');
    loader('./routes/content-type');

    // Load event listener files
    loader('./events/user');
    loader('./events/content-type');
};