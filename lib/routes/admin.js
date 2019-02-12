'use strict';

const Router = require('./www');

class AdminRoutes extends Router {
    constructor(router) {
        super(router);

        this.isAdmin = true;
        this.routes = getAdminRoutes();

        this.router.use( this.adminInit.bind(this) );
    }

    adminInit( req, res, next ) {
        this.setRoutes();

        if ( ! isUserLoggedIn() ) {
            return this.viewCallback( getLoginPage )( req, res, next );
        }

        if ( ! currentUserCan('administer') ) {
            return this.viewCallback( getAccessDeniedPage )( req, res, next );
        }

        /**
         * Trigger whenever an admin page is loaded.
         *
         * @param {object} AdminRoutes instance
         */
        appEvent('adminInit').trigger( this );

        next();
    }
}

module.exports = function(router) {
    return new AdminRoutes(router);
};