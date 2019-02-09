'use strict';

const {encrypt, decrypt, randomSalt} = require('./encrypt'),
    _ = require('underscore');

/**
 * Return an object of user group base on the given name.
 *
 * @param {string} name
 * @returns {Promise<*>}
 */
const getUserGroup = function(name) {
    if ( ! name ) {
        return reject( __t('Group name is required.') );
    }

    /**
     * Filter the group object before returning.
     *
     * @type apply
     *
     * @param {object} group
     * @return {object} group
     */
    let groupFilter = appFilter('getUserGroup'),
        groupCache = appCache('userGroup'),
        table = dbManager.userGroupTable,
        handleResponse = async groups => {
            if ( ! groups.length ) {
                return errorHandler( __t('Group does not exist.') );
            }

            let group = groups.shift();

            groupCache.set( name, group );

            group = await groupFilter.apply(group);

            return group;
        };

    let cache = groupCache.get(name);
    if ( cache ) {

        cache = groupFilter.apply(cache);

        return resolve(cache);
    }

    return dbManager.get( table, '*', {name: name}).then(handleResponse);
};
setGlobalVar( 'getUserGroup', getUserGroup );

/**
 * Add or update user group to the database.
 *
 * @param {string} name                 The name of the group to add to.
 * @param {object} caps                 An object of capabilities the group possess.
 * @param {string} oldName              The previously set name. Use when updating the name of the group.
 * @returns {Promise<*>}
 */
const setUserGroup = async function(name, caps, oldName) {
    if ( ! name ) {
        return reject( __t('Group name is required.') );
    }

    // Prevent setting admin type group.
    if ( 'admin' === name || 'administrator' === name ) {
        return reject( __t('Invalid group name.') );
    }

    caps = caps || {};

    // Check for existing group
    let oldGroup = await getUserGroup(name),
        group = {name: name, caps: caps},
        isEdit = !! isError(oldGroup);

    let groupCache = appCache('userGroup'),
        table = dbManager.userGroupTable,
        handleResponse = async () => {
            if ( oldName ) {
                groupCache.clear(oldName);
            } else {
                groupCache.clear(name);
            }

            // Clear all groups cache
            appCache('userGroups').clear();

            if ( isEdit || oldName ) {
                /**
                 * Triggered whenever user group is updated.
                 *
                 * @param {object} group
                 * @param {string} oldName
                 */
                await appEvent('updatedUserGroup').trigger(group, oldName);

                return true;
            }

            /**
             * Triggered whenever a new group is inserted to the database.
             *
             * @param {object} group
             */
            await appEvent('insertedUserGroup').trigger(group);

            return true;
        };

    if ( isEdit ) {
        return dbManager.update( table, group, {name: name}).then(handleResponse);
    } else if ( oldName ) {
        return dbManager.update( table, group, {name: oldName}).then(handleResponse);
    }

    return dbManager.insert( table, group ).then(handleResponse);
};
setGlobalVar( 'setUserGroup', setUserGroup );

/**
 * Remove user group from the database.
 *
 * @param {string} name
 * @returns {Promise<*>}
 */
const dropUserGroup = async function(name) {
    if ( ! name ) {
        return reject( __t('Group name is required.') );
    }

    let table = dbManager.userGroupTable,
        group = await getUserGroup(name);

    if ( isError(group) ) {
        return reject( __t('Group does not exist.') );
    }

    let handleResponse = async done => {
        // Clear groups cache
        appCache('userGroups').clear();

        // Clear group cache
        appCache('userGroup').clear(name);

        /**
         * Triggered whenever user group is deleted from the database.
         *
         * @param {object} group            The old group object prior to deletion.
         */
        await appEvent('deletedUserGroup').trigger(group);

        return done;
    };

    return dbManager.delete( table, {name: name} ).then(handleResponse);
};
setGlobalVar( 'dropUserGroup', dropUserGroup );

/**
 * Returns an array of user group.
 *
 * @returns {Promise<*>}
 */
const getUserGroups = async function() {
    let table = dbManager.userGroupTable,
        groupCache = appCache('userGroups'),
        groups = groupCache.get('groups'),
        groupFilter = appFilter('getUserGroup');

    if ( groups && groups.length ) {
        for ( let i = 0; i < groups.length; i++ ) {
            let group = groups[i];

            // Filter group object
            group = await groupFilter.apply(group);
            groups[i] = group;
        }

        return resolve(groups);
    }

    let handleResponse = async groups => {
        // Save to cache before applying any filters.
        groupCache.set( 'groups', groups );

        for ( let i = 0; i < groups.length; i++ ) {
            let group = groups[i];

            // Cache each group
            appCache('userGroup').set( group.name, group );

            // Filter group object
            group = await groupFilter.apply(group);

            groups[i] = group;
        }

        return groups;
    };

    return dbManager.get( table ).then(handleResponse);
};
setGlobalVar( 'getUserGroups', getUserGroups );

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
 * Add or update user's data from the database.
 *
 * @param {object} userData {
 *     @param {int} ID                      The id of the user to edit when in edit mode.
 *     @param {string} display
 *     @param {string} email
 *     @param {string} pass
 *     @param {string} group
 * }
 * @returns {Promise<*>}
 */
const setUser = async function(userData) {
    let {ID, display, email, pass, group} = userData,
        table = dbManager.usersTable,
        errors = [],
        isEdit = !! ID;

    if ( ! isEdit ) {
        if ( ! display ) {
            errors.push( __t('Display name is required.') );
        }

        if ( ! email || ! isEmail(email) ) {
            errors.push( __t('Invalid email address.') );
        }

        if ( ! group ) {
            errors.push( __t('User group is required.') );
        }

        if ( ! pass ) {
            errors.push( __t('Password is required.') );
        }
    } else {
        if ( _.isNaN(ID) ) {
            errors.push( __t('Invalid user id.') );
        }
    }

    if ( errors.length ) {
        return reject(errors);
    }

    let user = isEdit ? await getUser(ID) : false;

    if ( ! user || (isEdit && user.email !== email) ) {
        let otherUser = await emailExist(email);

        if ( ! isError(otherUser) && otherUser.ID ) {
            return reject( __t('Email already exist') );
        }
    }

    if ( pass ) {
        pass = await encrypt(pass);

        if ( isError(pass) ) {
            return reject(pass.message);
        }

        userData.pass = pass;
    }

    let handleResponse = async id => {
        // Clear users cache
        appCache('users').clear();

        if ( isEdit ) {
            let userCache = appCache('user');
            userCache.clear(ID);
            userCache.clear(user.email);

            /**
             * Trigger whenever user's data is updated.
             *
             * @param {int} ID
             * @param {object} user         The old user object data, before the update.
             */
            await appEvent('updatedUser').trigger( ID, user );

            return ID;
        }

        /**
         * Trigger whenever a new user is inserted to the database.
         *
         * @param {int} ID
         */
        await appEvent('insertedUser').trigger(id);

        return id;
    };

    if ( isEdit ) {
        return dbManager.update( table, userData, {ID: ID} ).then(handleResponse);
    }

    return dbManager.insert( table, userData ).then(handleResponse);
};
setGlobalVar( 'setUser', setUser );

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
 *     @param {string} group                The name of the group a user user is a member of.
 *     @param {array} group__in             An array of group names where users is a member of.
 *     @param {array} group__not_in         An array of group names that users is not a member of.
 *     @param {array} within                An array of user IDs where the queries will be base at.
 *     @param {array} not__within           An array of user IDS where the queries will exclude at.
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

    let {group__in, group__not_in} = query;
    if ( group__in ) {
        query.group = {$in: group__in};
        delete query.group__in;
    } else if ( group__not_in ) {
        query.group = {$notin: group__not_in};
        delete query.group__not_in;
    }

    let metaQuery = {},
        userFilter = appFilter('getUser');

    let {within, not__within, meta} = query;
    if ( within ) {
        query.ID = {$in: within};
        delete query.within;

        metaQuery.objectId = {$in: within};
    } else if ( not__within ) {
        query.ID = {$notin: not__within};
        delete query.not__within;

        metaQuery.objectId = {$notin: not__within};
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

    return dbManager.get( dbManager.usersTable, fields, query )
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