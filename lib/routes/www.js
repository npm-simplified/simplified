'use strict';

const _ = require('underscore'),
    globalFunc = require('../global');

class Router {
    constructor(router) {
        this.router = router;
        this.isAdmin = false;
        this.routes = {};

        router.use( this.init.bind(this) );
    }

    async init( req, res, next ) {
        let lastCheck = await getProperty( '__dbCheck', false ),
            timeNow = Date.now();

        if ( ! lastCheck ) {
            let connected = await dbManager.connect().catch(errorHandler);

            if ( isError(connected) ) {
                // Handle database connection error
            }

            let time = timeNow + ( 3600 * 6000 );

            await setProperty( '__dbCheck', time );
        }

        let keys = await getProperty( '__keys__', false );

        if ( ! keys || keys.time < timeNow ) {
            let keys = {
                login: randomSalt( 64, 32, 'hex' ),
                auth: randomSalt( 64, 32, 'hex' ),
                time: timeNow + ( 86400 * 30 * 6000 ) // Update keys every 30 days
            };

            await setProperty( '__keys__', keys );
        }

        // Make the keys globally accessible
        global.appKeys = keys;

        // Load global
        require('../global')( req, res );

        // Check if user is currently logged in
        let __user = '__user_' + keys.login,
            login = $_COOKIE(__user);

        login = parseInt(login);

        if ( ! login || _.isNaN(login) ) {
            return next();
        }

        let user = await getUser(login);
        if ( isError(user) ) {
            return next();
        }

        global.currentUser = user;

        next();
    }

    setRoutes() {
        let routes = this.routes;

        if ( routes.view ) {
            _.each( routes.view, view => {
                this.setView.apply( null, view );
            });
        }

        if ( routes.post ) {
            _.each( routes.post, post => {
                this.setPostResponse.apply( null, post );
            });
        }

        if ( routes.get ) {
            _.each( routes.get, get => {
                this.setGetResponse.apply( null, get );
            });
        }
    }

    setView( route, callback ) {
        let requireLogin = arguments[2] || false,
            permission = arguments[3] || false,
            postCallback = arguments[4] || false;

        this.router.get( route, this.viewCallback( callback, requireLogin, permission ) );

        if ( ! postCallback ) {
            return;
        }

        this.router.post( route, this.callback( callback, requireLogin, permission ) );
    }

    setPostResponse( route, callback ) {
        let requireLogin = arguments[2] || false,
            permission = arguments[3] || false;

        this.router.post( route, this.callback( callback, requireLogin, permission ) );
    }

    setGetResponse( route, callback ) {
        let requireLogin = arguments[2] || false,
            permission = arguments[3] || false;

        this.router.get( route, this.callback( callback, requireLogin, permission ) );
    }

    callback( callback ) {
        let requireLogin = arguments[1] || false,
            permission = arguments[2] || false;

        return async ( req, res ) => {
            globalFunc( req, res );

            let response;

            if ( requireLogin && ! isUserLoggedIn() ) {
                response = getLoginPage( req, res );
            } else if ( permission && ! currentUserCan(permission) ) {
                response = getAccessDeniedPage(req, res);
            } else {
                response = await callback.call( null, req, res );
            }

            return res.json(response);
        };
    }

    viewCallback( callback ) {
        let requireLogin = arguments[1] || false,
            permission = arguments[2] || false;

        return async ( req, res, next ) => {
            globalFunc( req, res );

            let response;

            if ( requireLogin && ! isUserLoggedIn() ) {
                response = getLoginPage( req, res );
            } else if ( permission && ! currentUserCan(permission) ) {
                response = getAccessDeniedPage( req, res );
            } else {
                response = await callback.call( null, req, res );

                if ( ! response ) {
                    return next();

                } else if ( '404' === response ) {
                    response = getErrorPage( req, res );
                }
            }

            response = await appFilter('appData').apply( response, req, res );

            return response;
        };
    }
}
module.exports = Router;