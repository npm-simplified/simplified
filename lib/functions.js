'use strict';

/**
 * Get the value of the given application property name.
 *
 * @param {string} name
 * @param {any} $default
 * @returns {Promise<any|error>}
 */
const getProperty = function( name, $default ) {
    if ( ! name ) {
        return reject( __t('Property name is required.') );
    }

    let table = dbManager.propertyTable,
        propCache = appCache('property'),
        cache = propCache.set(name);

    if ( cache ) {
        return resolve(cache);
    }

    let handleResponse = function(props) {
            if ( isError(props) || ! props.length ) {
                return $default;
            }

            let prop = props.shift();
            propCache.set( name, prop.value );

            return prop.value;
        };

    return dbManager.get( table, 'value', {name: name} ).then(handleResponse);
};
setGlobalVar( 'getProperty', getProperty );

/**
 * Set or update property value base on the given name.
 *
 * @param {string} name
 * @param {any} value
 * @returns {Promise<boolean|error>}
 */
const setProperty = async function( name, value ) {
    if ( ! name ) {
        return reject( __t('Property name is required.') );
    }

    let oldProp = await getProperty(name),
        isEdit = ! isError(oldProp),
        table = dbManager.propertyTable,
        props = {name: name, value: value};

    let handleResponse = ok => {
        if ( isError(ok) ) {
            return ok;
        }

        if ( isEdit ) {
            // Clear previous cached property
            appCache('property').clear(name);
        }

        return ok;
    };

    if ( isEdit ) {
        return dbManager.update( table, props, {name: name}).then(handleResponse);
    }

    return dbManager.insert( table, props ).then(handleResponse);
};
setGlobalVar( 'setProperty', setProperty );

/**
 * Remove the given property name from the database.
 *
 * @param {string} name
 * @returns {Promise<boolean|error>}
 */
const dropProperty = async function(name) {
    if ( ! name ) {
        return reject( __t('Property name is required.') );
    }

    let oldProp = await getProperty(name),
        table = dbManager.propertyTable;

    if ( isError(oldProp) ) {
        return reject(oldProp);
    }

    let handleResponse = ok => {
        if ( isError(ok) ) {
            return ok;
        }

        appCache('property').clear(name);

        return ok;
    };

    return dbManager.delete( table, {name: name}).then(handleResponse);
};
setGlobalVar( 'dropProperty', dropProperty );

/**
 * Get the arguments of the given route path.
 *
 * @param {string} routePath
 * @returns {Promise<object|error>}
 */
const getRouteEndPoint = function( routePath ) {
    if ( ! routePath ) {
        return reject( __t('Invalid route path.') );
    }

    let table = dbManager.routeEndPointTable,
        routeCache = appCache('routeEndPoint'),
        cache = routeCache(routePath);

    if ( cache ) {
        return resolve(cache);
    }

    let handleResponse = routes => {
        if ( isError(routes) ) {
            return routes;
        }

        if ( ! routes ) {
            return errorHandler( __t('Route does not exist.') );
        }

        let route = routes.shift();
        routeCache.set( routePath, route.args );

        return route.args;
    };

    return dbManager.get( table, '*', {route: routePath}).then(handleResponse);
};
setGlobalVar( 'getRouteEndPoint', getRouteEndPoint );

/**
 * Sets or update route arguments.
 *
 * @param {string} routePath
 * @param {object} args
 * @returns {Promise<boolean|error>}
 */
const setRouteEndPoint = async function( routePath, args ) {
    let oldPath = arguments[2] || false,
        errors = [];

    if ( ! routePath ) {
        errors.push( __t('Invalid route endpoint.') );
    }

    if ( ! args ) {
        errors.push( __t('Route arguments is required.') );
    }

    if ( errors.length ) {
        return reject(errors);
    }

    let oldRoute = await getRouteEndPoint( oldPath || routePath ),
        isEdit = ! isError(oldRoute),
        routeCache = appCache('routeEndPoint'),
        table = dbManager.routeEndPointTable,
        route = {route: routePath, args: args};

    let handleResponse = ok => {
        if ( isError(ok) ) {
            return ok;
        }

        if ( ! isError(oldRoute) ) {
            routeCache.clear(oldRoute.route);
        }

        return ok;
    };

    if ( isEdit ) {
        return dbManager.update( table, route, {route: oldRoute.route}).then(handleResponse);
    }

    return dbManager.insert( table, route ).then(handleResponse);
};
setGlobalVar( 'setRouteEndPoint', setRouteEndPoint );

/**
 * Delete route from the database.
 *
 * @param {string} routePath
 * @returns {Promise<boolean|error>}
 */
const dropRouteEndPoint = async function( routePath ) {
    if ( ! routePath ) {
        return reject( __t('Invalid route path.') );
    }

    let route = await getRouteEndPoint(routePath),
        routeCache = appCache('routeEndPoint'),
        table = dbManager.routeEndPointTable;

    if ( isError(route) ) {
        return resolve(route);
    }

    let handleResponse = ok => {
        if ( isError(ok) ) {
            return ok;
        }

        routeCache.clear(routePath);

        return ok;
    };

    return dbManager.delete( table, {route: routePath}).then(handleResponse);
};
setGlobalVar( 'dropRouteEndPoint', dropRouteEndPoint );

let viewRoutes = {},
    postResponse = {},
    getResponse = {};

const getRoutes = function() {
    return {
        view: viewRoutes,
        post: postResponse,
        get: getResponse
    };
};
setGlobalVar( 'getRoutes', getRoutes );

/**
 * Set view route use to render a page.
 *
 * @param {string} path
 * @param {function} callback
 */
const setViewRoute = function( path, callback ) {
    viewRoutes[path] = arguments;
};
setGlobalVar( 'setViewRoute', setViewRoute );

const setPostResponse = function( path, callback ) {
    postResponse[path] = arguments;
};
setGlobalVar( 'setPostResponse', setPostResponse );

const setGetResponse = function( path, callback ) {
    getResponse[path] = arguments;
};
setGlobalVar( 'setGetResponse', setGetResponse );

let adminRoutes = [
    '/users',
    '/users/page/:page',
    '/users/edit',
    '/users/edit/:id',
    '/users/delete/:id',
    '/content-types',
    '/content-types/page/:page',
    '/content-type',
    '/content-type/delete/:id',
    '/content-type/:id',
    '/content/:type',
    '/content/:type/page/:page',
    '/content/:type/edit',
    '/content/:type/edit/:id',
    '/content/:type/delete/:id',
    '/content/:type/:group',
    '/content/:type/:group/edit',
    '/content/:type/:group/edit/:id',
    '/content/:type/:group/delete/:id'
];

let adminViews = {},
    adminPostResponse = {},
    adminGetResponse = {};

const setAdminView = function( path, callback ) {
    if ( _.contains( adminRoutes, path) ) {
        return false;
    }

    adminViews[path] = arguments;

    return true;
};
setGlobalVar( 'setAdminView', setAdminView );

const setAdminPostResponse = function( path, callback ) {
    if ( _.contains( adminRoutes, path ) ) {
        return false;
    }

    adminPostResponse[path] = arguments;
};
setGlobalVar( 'setAdminPostResponse', setAdminPostResponse );

const setAdminGetResponse = function( path, callback ) {
    if ( _.contains( adminRoutes, path ) ) {
        return false;
    }

    adminGetResponse = arguments;
};
setGlobalVar( 'setAdminGetResponse', setAdminGetResponse );

const getAdminRoutes = function() {
    return {
        view: adminViews,
        post: adminPostResponse,
        get: adminGetResponse
    };
};
setGlobalVar( 'getAdminRoutes', getAdminRoutes );

module.exports = function() {
    adminViews = {};
    adminPostResponse = {};
    adminGetResponse = {};
};