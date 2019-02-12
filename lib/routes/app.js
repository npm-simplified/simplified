'use strict';

const express = require('express'),
    path = require('path'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    app = express(),
    adminRouter = express.Router(),
    AdminRoutes = require('./admin'),
    Router = require('./www'),
    DBManager = require('../db');


module.exports = function( req, res, config ) {
    // Set database
    global.dbManager = DBManager(config.database);

    // Set powered by
    app.set( 'x-powered-by', 'Simplified' );

    // Set common middleware
    app.use([
        cookieParser(),
        bodyParser.json(),
        bodyParser.urlencoded({extended: true})
    ]);

    // Initialize admin
    AdminRoutes(adminRouter);

    // Set admin router first
    app.use( '/admin', adminRouter );

    // Initialize routes
    new Router(app);

    return app( req, res );
};