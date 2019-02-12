'use strict';

const _ = require('underscore'),
    MySQL = require('./db/mysql');

module.exports = function(config) {
    let {database} = config;

    if ( 'mysql' === database.type ) {
        global.dbManager = MySQL(database);
    }
};