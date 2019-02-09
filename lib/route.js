'use strict';

/**
 * Returns the value of the given route on success or error in failure.
 *
 * @param {string} route                Required. The route path get the value from.
 *
 * @returns {Promise<object|error>}
 */
const getRoute = function(route) {
    let table = dbManager.routeTable,
        routeCache = appCache('route'),
        cache = routeCache.get(route);

    if ( ! route ) {
        return resolve(errorHandler(__t('Invalid route.')));
    }

    if ( cache ) {
        return resolve(cache);
    }

    let handleResponse = results => {
        if ( ! results.length ) {
            return errorHandler( __t('Route does not exist.') );
        }

        let result = results.shift();
        routeCache.set( route, result.value );

        return result.value;
    };

    return dbManager.get( table, '*', {route: route}).then(handleResponse);
};
setGlobalVar( 'getRoute', getRoute );

/**
 * Set or update a route to the database.
 *
 * @param {string} route                Required. The route path to insert or update to.
 * @param {object} value
 * @param {string} oldRoute             Use in update when updating the route path.
 * @returns {Promise<boolean|error>}
 */
const setRoute = async function( route, value, oldRoute ) {
    let oldData = await getRoute(route),
        table = dbManager.routeTable,
        isEdit = ! isError(oldData),
        routeCache = appCache('route');

    let handleResponse = ok => {
        if ( oldRoute ) {
            routeCache.clear(oldRoute);
        } else if ( isEdit ) {
            routeCache.clear(route);
        }

        return ok;
    };

    let routeData = {route: route, value: value};

    if ( oldRoute ) {
        return dbManager.update( table, routeData, {route: oldRoute}).then(handleResponse);
    } else if ( isEdit ) {
        this.dbManager.update( table, routeData, {route: route}).then(handleResponse);
    }

    return dbManager.insert( table, routeData ).then(handleResponse);
};
setGlobalVar( 'setRoute', setRoute );

/**
 * Delete a route from the database.
 *
 * @param {string} route                Required. The route path to delete to.
 * @returns {Promise<boolean|error>}
 */
const dropRoute = function(route) {
    let table = dbManager.routeTable,
        routeCache = appCache('route');

    let handleResponse = ok => {
        routeCache.clear(route);

        return ok;
    };

    return dbManager.delete( table, {route: route}).then(handleResponse);
};
setGlobalVar( 'dropRoute', dropRoute );