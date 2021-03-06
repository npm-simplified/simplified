'use strict';

const http = require('http'),
    https = require('https'),
    exp = module.exports = {};

exp.listen = function( port, host, config, callback ) {
    let {ssl, ABSPATH} = config;

    let server;

    if ( ! ssl ) {
        server = http.createServer( ( req, res ) => {
            // Set global path
            global.ABSPATH = ABSPATH || process.cwd();

            // Load file loader
            require('./load')(config);

            if ( callback ) {
                callback.apply( null );
            }

            if ( callback ) {
                callback.call( null );
            }

            return require('./routes/app')( req, res, config );
        } );
    }

    // Listen to the main host
    server.listen( port, host );

    if ( config.subDomains ) {
        config.subDomains.map( subDomain => {
            server.listen( port, subDomain );
        } );
    }
};