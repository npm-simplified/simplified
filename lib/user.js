'use strict';

const {encrypt, decrypt, randomSalt} = require('./encrypt'),
    _ = require('underscore');

/**
 * Get user data base on the specified column and it's corresponding value.
 *
 * @param {string} column
 * @param {int|string} value
 * @returns {Promise<*>}
 */
const getUserBy = async function(column, value) {
    let errors = [];

    if ( ! column ) {
        errors.push( __t('Missing column name.') );
    }

    if ( ! value ) {
        errors.push( __t('Missing column value.') );
    }

    if ( errors.length ) {
        return reject(errors);
    }

    // Check allowed columns
    if ( ! _.contains( ['ID', 'email'], column ) ) {
        errors.push( __t('Invalid column type.') );
    }

    if ( 'ID' === column && _.isNaN(value) ) {
        errors.push( __t('Invalid user ID.') );
    }

    if ( errors.length ) {
        return reject(errors);
    }

    let cache = appCache( 'user' ),
        user = cache.get(value);

    /**
     * Filter the user object before returning to allow insertion of additional user data.
     *
     * @param {object} user
     */
    let filter = appFilter('getUser');

    if ( user ) {

        user = await filter.apply(user);

        return resolve(user);
    }

    let col = {};
    col[column] = value;

    return dbManager.get( dbManager.usersTable, '*', col )
        .then( async users => {
            if ( ! users.length ) {
                return errorHandler( __t('No user found.') );
            }

            user = users.shift();

            cache.set( user.ID, user );
            cache.set( user.email, user );

            /**
             * Filter the user object before returning to allow insertion of additional user data.
             *
             * @param {object} user
             */
            user = await filter.apply(user);

            return user;
        });
};

/**
 * Returns user object base on the given user ID.
 *
 * @param {int} userId
 * @returns {Promise<*>}
 */
const getUser = function(userId) {
    return getUserBy( 'ID', userId );
};
setGlobalVar( 'getUser', getUser );

/**
 * Check if the given email address already exist in the database. Returns user object if it exist.
 *
 * @param {string} email
 * @returns {Promise<*>}
 */
const emailExist = function(email) {
    if ( ! email || ! isEmail(email) ) {
        return reject( __t('Invalid email address.') );
    }

    return getUserBy( 'email', email );
};
setGlobalVar( 'emailExist', emailExist );

/**
 * Insert new user to the database.
 *
 * @param {object} userData {
 *     @param {string} display
 *     @param {string} email
 *     @param {string} pass
 * }
 * @returns {Promise<*>}
 */
const addUser = async function(userData) {
    let {display, email, pass} = userData,
        errors = [];

    if ( ! display ) {
        errors.push( __t('Display name is required.') );
    }

    if ( ! email ) {
        errors.push( __t('Email is required.') );
    } else if ( ! isEmail(email) ) {
        errors.push( __t('Invalid email address') );
    }

    if ( ! pass ) {
        errors.push( __t('Missing password.') );
    }

    let user = await emailExist(email);
    if ( user.ID ) {
        errors.push( __t('Email already exist.') );
    }

    if ( errors.length ) {
        return reject(errors);
    }

    userData.pass = await encrypt(pass).catch(errorHandler);
    if ( isError(pass) ) {
        return reject(pass.message);
    }

    return dbManager.insert( dbManager.usersTable, userData )
        .then( async ID => {
            // Clear cached users
            appCache('users').clear();

            /**
             * Triggered whenever a new user is inserted to the database.
             *
             * @param {int} ID
             */
            appEvent('insertedUser').trigger(ID);

            return ID;
        });
};
setGlobalVar( 'addUser', addUser );

/**
 * Updates user data in the database.
 *
 * @param {object} userData {
 *     @param {int} ID                  Required. The id of the user to update the data to.
 *     @param {string} display
 *     @param {string} email
 *     @param {string} pass
 * }
 * @returns {Promise<*>}
 */
const updateUserData = async function(userData) {
    let {ID, email, pass} = userData,
        errors = [];

    if ( _.isNaN(ID) ) {
        errors.push( __t('Invalid user id.') );
    }

    if ( email && ! isEmail(email) ) {
        errors.push( __t('Invalid email address.') );
    }

    if ( errors.length ) {
        return reject(errors);
    }

    let user = await getUser(ID);

    if ( email && user.email !== email ) {
        let otherUser = await emailExist(email);

        if ( otherUser.ID ) {
            return reject( __t('Email already exist.') );
        }
    }

    if ( pass ) {
        pass = await encrypt(pass).catch(errorHandler);

        if ( isError(pass) ) {
            return reject(pass.message);
        }

        userData.pass = pass;
    }

    return dbManager.update( dbManager.usersTable, userData, {ID: ID} )
        .then( async () => {
            appCache('users').clear();

            let userCache = appCache('user');
            userCache.clear(ID);
            userCache.clear(user.email);

            /**
             * Triggered whenever user's data is updated.
             *
             * @param {int} ID
             */
            await appEvent('updatedUser').trigger(ID);

            return ID;
        });
};
setGlobalVar( 'updateUserData', updateUserData );

/**
 * Remove the given user id from the database.
 *
 * @param {int} ID
 * @returns {Promise<true|error>}
 */
const dropUser = async function(ID) {
    if ( _.isNaN(ID) ) {
        return reject( __t('Invalid user id.') );
    }

    let user = await getUser(ID).catch(errorHandler);
    if ( isError(user) ) {
        return reject( __t('User does not exist.') );
    }

    return dbManager.delete( dbManager.usersTable, {ID: ID} )
        .then( async () => {
            appCache('users').clear();

            let userCache = appCache('user');
            userCache.clear(ID);
            userCache.clear(user.email);

            /**
             * Triggered whenever user is removed from the database.
             *
             * @param {int} ID              The id of the user that is removed.
             * @param {object} user         The old user object data after successfully removed.
             */
            await appEvent('deletedUser').trigger( ID, user );

            return true;
        });
};
setGlobalVar( 'dropUser', dropUser );

/**
 * Returns an object containing the total number of users and an array of users.
 *
 * @param {object} query {
 *     @param {string|array} fields
 * }
 * @returns {Promise<array|error>}
 */
const usersQuery = async function(query) {
    query = query || {};

    query = await appFilter('preGetUsers').apply(query);

    let usersCache = appCache('users'),
        userCache = appCache('user'),
        key = usersCache.genKey(query),
        cache = usersCache.get(key),
        table = dbManager.usersTable,
        metaTable = dbManager.userMetaTable;

    if ( cache ) {
        return resolve(cache);
    }

    let {fields} = query;
    if ( ! fields ) {
        fields = '*';
    } else if ( 'ids' === fields.toLowerCase() ) {
        fields = 'ID';
    }

    if ( query.fields ) {
        delete query.fields;
    }

    let metaQuery = {},
        userFilter = appFilter('getUser');

    let {include, exclude, meta} = query;
    if ( include ) {
        query.ID = {$in: include};
        delete query.include;

        metaQuery.objectId = {$in: include};
    } else if ( exclude ) {
        query.ID = {$notin: exclude};
        delete query.exclude;

        metaQuery.objectId = {$notin: exclude};
    }

    if ( meta ) {
        delete query.meta;

        let $and = [];

        if ( _.keys(metaQuery).length ) {
            $and.push(metaQuery);
        }

        $and.push(meta);

        let tables = {},
            where = {},
            relation = {};

        tables[table] = 'ID';
        tables[metaTable] = true;

        where[table] = query;
        where[metaTable] = {$and: $and};

        relation[table] = 'ID';
        relation[metaTable] = 'objectId';

        let count = await dbManager.rightJoin(tables, where, relation );

        if ( isError(count) ) {
            return reject(count.error);
        }

        tables[table] = '*';

        let results = {itemsFound: count.length, users: []};

        if ( ! count.length ) {
            return resolve(results);
        }

        let users = await dbManager.rightJoin( tables, where, relation );
        results.users = users;
        usersCache.set( key, results );

        for ( let i = 0; i < users.length; i++ ) {
            let user = users[i];

            // Cache individual user for later use
            userCache.set( user.ID, user );
            userCache.set( user.email, user );

            users[i] = await userFilter.apply(users[i]);
        }

        results.users = users;

        return resolve(results);
    }

    let count = await dbManager.get( table, 'count', query ),
        results = {itemsFound: count};

    return dbManager.get( dbManager.usersTable, fields )
        .then( async users => {
            results.users = users;
            usersCache.set( key, results );

            for ( let i = 0; i < users.length; i++ ) {
                let user = users[i];

                userCache.set( user.ID, user );
                userCache.set( user.email, user );

                users[i] = await userFilter.apply(user);
            }

            results.users = users;

            return results;
        });
};
setGlobalVar( 'usersQuery', usersQuery );

const getUsers = function(query) {
    return usersQuery(query)
        .then( users => {
            return users.users;
        });
};
setGlobalVar( 'getUsers', getUsers );

/**
 * Set or update user meta.
 *
 * @param {int} userId
 * @param {string} name
 * @param {any} value
 * @param {boolean} single
 * @returns {Promise<true|error>}
 */
const setUserMeta = async function( userId, name, value, single ) {
    let filter = {
            objectId: userId,
            name: name
        },
        metadata = await dbManager.get( dbManager.userMetaTable, 'value', filter ),
        mode = 'insert';

    if ( metadata.length && single ) {
        mode = 'update';
    }

    if ( 'update' === mode ) {
        return dbManager.update( dbManager.userMetaTable, {value: value}, filter );
    }

    filter.value = value;

    return dbManager.insert( dbManager.userMetaTable, filter );
};
setGlobalVar( 'setUserMeta', setUserMeta );

/**
 * Returns an array of user meta or the value(s) of the supplied meta name.
 *
 * @param {int} userId
 * @param {string} name                 Optional. If omitted, will return an object containing all user's metadata.
 * @param {boolean} single              Optional. Whether to return only the single value of the supplied meta name.
 * @returns {Promise<*>}
 */
const getUserMeta = function(userId) {
    let name = arguments[1] || false,
        single = arguments[2] || false;

    if ( ! userId || _.isNaN(userId) ) {
        return reject( __t('Invalid user id.') );
    }

    let filter = {objectId: userId};

    if ( name ) {
        filter.name = name;
    }

    let metaCache = appCache('userMeta'),
        cache = metaCache.get(userId);

    if ( cache && name && cache[name] ) {
        return resolve(cache[name]);
    }

    cache = cache || {};

    return dbManager.get( dbManager.userMetaTable, '*', filter )
        .then( meta => {
            if ( isError(meta) ) {
                return reject(meta.message);
            }

            let values = [];

            if ( single ) {
                meta = meta.shift();

                values = meta.value;
            } else {
                if ( name ) {
                    values = _.pluck( meta, 'value' );
                } else {
                    values = {};

                    meta.map( m => {
                        values[m.name] = m.value;
                    });
                }
            }

            if ( name ) {
                cache[name] = values;
            } else {
                cache = values;
            }

            metaCache.set( userId, cache );

            return values;
        });
};
setGlobalVar( 'getUserMeta', getUserMeta );

/**
 * Remove user meta from the database.
 *
 * @param {int} userId                  Required. The id of the user to remove the meta at.
 * @param {string} name                 Optional. If set, will delete all meta data having the same name.
 * @param {any} value                   Optional. If set, will delete meta having the supplied value.
 * @returns {Promise<boolean|error>}
 */
const dropUserMeta = function(userId) {
    let name = arguments[1] || false,
        value = arguments[2] || false,
        filter = {objectId: userId};

    if ( name ) {
        filter.name = name;
    }

    if ( value ) {
        filter.value = value;
    }

    let metaCache = appCache('userMeta'),
        cache = metaCache.get(userId);

    return dbManager.delete( dbManager.userMetaTable, filter )
        .then( ok => {
            if ( name && cache[name] ) {
                delete cache[name];

                if ( _.isEmpty(cache) ) {
                    metaCache.clear(userId);
                } else {
                    metaCache.set(userId, cache);
                }
            }

            return ok;
        });
};
setGlobalVar( 'dropUserMeta', dropUserMeta );