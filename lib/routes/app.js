'use strict';

const express = require('express'),
    path = require('path'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    app = express(),
    adminRouter = express.Router(),
    AdminRoutes = require('./admin'),
    Router = require('./www');

module.exports = function( req, res, config ) {
    let {viewEngine, publicPath} = config;

    // Set powered by
    app.set( 'x-powered-by', 'Simplified' );

    // Set view engine
    app.set( 'viewEngine', viewEngine );

    // Set common middleware
    app.use([
        cookieParser(),
        bodyParser.json(),
        bodyParser.urlencoded({extended: true})
    ]);

    // Set static paths
    publicPath = publicPath || [];
    publicPath.push( ABSPATH );

    publicPath.map( staticPath => {
        app.use( express.static( staticPath ) );
    });

    // Initialize admin
    AdminRoutes(adminRouter);

    // Set admin router first
    app.use( '/admin', adminRouter );

    // Initialize routes
    new Router( app, getRoutes() );

    return app( req, res );
};