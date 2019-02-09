'use strict';

const _ = require('underscore'),
    MySQL = require('./db/mysql');

module.exports = function(config) {
    if ( 'mysql' === config.database ) {
        return MySQL(config);
    }
};