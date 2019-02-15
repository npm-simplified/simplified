'use strict';

const _ = require('underscore');

const groupCache = appCache('userGroup'),
    allGroupCache = appCache('userGroups'),
    groupFilter = appFilter('getUserGroup');

/**
 * Return an object of user group base on the given name.
 *
 * @param {string} name
 * @returns {Promise<*>}
 */
const getUserGroup = function(name) {
    if ( ! name ) {
        return reject( __t('User group name is required.') );
    }

    /**
     * Filter the group object before returning.
     *
     * @type apply
     *
     * @param {object} group
     * @return {object} group
     */
    let table = dbManager.userGroupTable,
        handleResponse = async groups => {
            if ( isError(groups) ) {
                return groups;
            }

            if ( ! groups.length ) {
                return errorHandler( __t('User group does not exist.') );
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
 * @param {array} grants                The list of permissions the group have.
 * @param {string} oldName              An old group name required when changing the group name.
 * @returns {Promise<boolean>}
 */
const setUserGroup = async function(name, grants) {
    let oldName = arguments[2] || false;

    if ( ! name ) {
        return reject( __t('Group name is required.') );
    }

    // Prevent setting admin type group.
    if ( 'admin' === name || 'administrator' === name ) {
        return reject( __t('Invalid group name.') );
    }

    grants = grants || [];

    // Check for existing group
    let oldGroup = await getUserGroup( oldName || name ),
        group = {name: name, grants: grants},
        isEdit = ! isError(oldGroup);

    let table = dbManager.userGroupTable,
        handleResponse = async (o) => {
            if ( isError(o) ) {
                return o;
            }

            // Clear all groups cache
            allGroupCache.clear();

            if ( isEdit ) {
                groupCache.clear(oldGroup.name);

                /**
                 * Triggered whenever user group is updated.
                 *
                 * @param {object} group
                 * @param {object} oldGroup
                 */
                await appEvent('updatedUserGroup').trigger( group, oldGroup );

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
        return dbManager.update( table, group, {name: oldGroup.name}).then(handleResponse);
    }

    return dbManager.insert( table, group ).then(handleResponse);
};

/**
 * Insert new user group to the database.
 *
 * @param {string} name
 * @param {array} grants
 * @returns {Promise<boolean|error>}
 */
const insertUserGroup = function( name, grants ) {
    return setUserGroup( name, grants );
};
setGlobalVar( 'insertUserGroup', insertUserGroup );

/**
 * Update user group's data in the database.
 *
 * @param {string} name
 * @param {array} grants
 * @param {string} oldGroupName
 * @returns {Promise<boolean|error>}
 */
const updateUserGroup = function( name, grants, oldGroupName ) {
    return setUserGroup( name, grants, oldGroupName );
};
setGlobalVar( 'updateUserGroup', updateUserGroup );

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
        allGroupCache.clear();

        // Clear group cache
        groupCache.clear(name);

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
        groups = allGroupCache.get('groups');

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
        if ( isError(groups) ) {
            return [];
        }

        // Save to cache before applying any filters.
        groupCache.set( 'groups', groups );

        for ( let i = 0; i < groups.length; i++ ) {
            let group = groups[i];

            // Cache each group
            groupCache.set( group.name, group );

            // Filter group object
            group = await groupFilter.apply(group);

            groups[i] = group;
        }

        return groups;
    };

    return dbManager.get( table, '*' ).then(handleResponse);
};
setGlobalVar( 'getUserGroups', getUserGroups );

const userCache = appCache('user'),
    allUserCache = appCache('users'),
    userFilter = appFilter('getUser');

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

    let user = userCache.get(value);

    if ( user ) {
        /**
         * Filter the user object before returning to allow insertion of additional user data.
         *
         * @param {object} user
         */
        user = await userFilter.apply(user);

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

            userCache.set( user.ID, user );
            userCache.set( user.email, user );

            /**
             * Filter the user object before returning to allow insertion of additional user data.
             *
             * @param {object} user
             */
            user = await userFilter.apply(user);

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

    let user = false;

    if ( isEdit ) {
        user = await getUser(ID);

        if ( isError(user) ) {
            return resolve(user);
        }
    }

    if ( user && user.email !== email ) {
        let otherUser = await emailExist(email);

        if ( ! isError(otherUser) && otherUser.ID ) {
            return reject( __t('Email already exist') );
        }
    }

    if ( 'administrator' !== group ) {
        let groupData = await getUserGroup(group);
        if ( isError(groupData) ) {
            return resolve(groupData);
        }
    }

    if ( pass ) {
        pass = await passwordHash(pass);

        if ( isError(pass) ) {
            return reject(pass.message);
        }

        userData.pass = pass;
    }

    let handleResponse = async id => {
        // Clear users cache
        allUserCache.clear();

        if ( isEdit ) {
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

/**
 * Insert new user into the database.
 *
 * @param {object} userData {
 *     @param {string} display                  Required. The display name of the user.
 *     @param {string} email                    Required. The email address of the user.
 *     @param {string} pass                     Required. The human readable password of the user. Primarily use in login authentication.
 *     @param {string} group                    Required. The name of the group assign to the user. Note that the assign group name must exist
 *                                              from the database. Otherwise will return an error.
 * }
 * @returns {Promise<int|error>}
 */
const insertUser = function(userData) {
    let {ID} = userData;

    // Don't allow an ID to be present in the parameter during insertion.
    if ( ID ) {
        return reject( __t('Invalid parameter ID.') );
    }

    return setUser(userData);
};
setGlobalVar( 'insertUser', insertUser );

/**
 * Update user's data in the database.
 *
 * @param userData
 * @returns {Promise<*>}
 */
const updateUser = function(userData) {
    return setUser(userData);
};
setGlobalVar( 'updateUser', updateUser );

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
            allUserCache.clear();

            userCache.clear(ID);
            userCache.clear(user.email);

            /**
             * Triggered whenever user is removed from the database.
             *
             * @param {object} user         The old user object data after successfully removed.
             */
            await appEvent('deletedUser').trigger( user );

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

    let key = allUserCache.genKey(query),
        cache = allUserCache.get(key),
        table = dbManager.usersTable,
        metaTable = dbManager.userMetaTable,
        results = {itemsFound: 0, users: []};

    if ( cache ) {
        return resolve(cache);
    }

    let handleResponse = async users => {
        if ( ! isError(users) || ! users.length ) {
            return results;
        }

        results.users = users;
        allUserCache.set( key, results );

        for ( let i = 0; i < users.length; i++ ) {
            let user = users[i];

            userCache.set( user.ID, user );
            userCache.set( user.email, user );

            users[i] = await userFilter.apply(user);
        }

        results.users = users;

        return results;
    };

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

        if ( ! count.length ) {
            return resolve(results);
        }

        results.itemsFound = count.length;

        return dbManager.rightJoin( tables, where, relation ).then(handleResponse);
    }

    let count = await dbManager.get( table, 'count', query );
    results.itemsFound = count;

    return dbManager.get( dbManager.usersTable, fields, query ).then(handleResponse);
};
setGlobalVar( 'usersQuery', usersQuery );

/**
 * A convenient way to get the list of users from the database.
 *
 * @param {object} query
 * @returns {Promise<Array | error | never>}
 */
const getUsers = function(query) {
    let handleResponse = results => {
        return results.users;
    };

    return usersQuery(query).then(handleResponse);
};
setGlobalVar( 'getUsers', getUsers );

const userMetaCache = appCache('userMeta');

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
    let errors = [];

    if ( ! userId || _.isNaN(userId) ) {
        errors.push( __t('Invalid user id.') );
    }

    if ( ! name ) {
        errors.push( __t('Meta name is required.') );
    }

    if ( errors.length ) {
        return resolve(errors);
    }

    let metas = await getUserMeta( userId, name ),
        isEdit = ! isError(metas) && metas.length,
        filter = { objectId: userId, name: name },
        table = dbManager.userMetaTable,
        found = false;

    if ( isEdit ) {
        metas.map( meta => {
            if ( _.isEqual( meta, value ) ) {
                found = true;
            }
        });
    }

    if ( found ) {
        // Just return directly
        return resolve(true);
    }

    filter.value = value;

    let handleResponse = ok => {
        if ( isError(ok) ) {
            return ok;
        }

        // Clear user's meta cache
        userMetaCache.clear(userId);

        return true;
    };

    if ( isEdit && single ) {
        return dbManager.update( table, filter, {name: name} ).then(handleResponse);
    }

    return dbManager.insert( tablee, filter ).then(handleResponse);
};
setGlobalVar( 'setUserMeta', setUserMeta );

/**
 * Returns an array of user meta or the value(s) of the supplied meta name.
 *
 * @param {int} userId
 * @param {string} name                 Optional. If omitted, will return an object containing all user's metadata.
 * @param {boolean} single              Optional. Whether to return only the single value of the supplied meta name.
 * @returns {Promise<any|error>}
 */
const getUserMeta = function(userId) {
    let name = arguments[1] || false,
        single = arguments[2] || false,
        table = dbManager.userMetaTable;

    if ( ! userId || _.isNaN(userId) ) {
        return reject( __t('Invalid user id.') );
    }

    let filter = {objectId: userId},
        cache = userMetaCache.get(userId);

    let handleResults = results => {
        if ( name ) {
            let values = results[name];

            if ( ! values ) {
                return errorHandler( __t('Meta does not exist.') );
            }

            if ( single ) {
                return values.shift();
            }

            return values;
        }

        return results;
    };

    if ( cache ) {
        return handleResults(cache);
    }

    let handleResponse = results => {
        if ( isError(results) ) {
            return results;
        }

        // Save to cache
        userMetaCache( userId, results );

        return handleResults(results);
    };

    // Get all user's metadata at once
    return dbManager.get( table, '*', filter ).then(handleResponse);
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

    let handleResponse = ok => {
        if ( isError(ok) ) {
            return ok;
        }

        // Clear user's meta cache
        userMetaCache.clear(userId);

        return ok;
    };

    return dbManager.delete( dbManager.userMetaTable, filter ).then(handleResponse);
};
setGlobalVar( 'dropUserMeta', dropUserMeta );

/**
 * Check if the given user information are valid and exist from the database.
 *
 * @param {string} email
 * @param {string} pass
 * @returns {Promise<object|error>}
 */
const validateUser = async function( email, pass ) {
    let errors = [];

    if ( ! email || ! isEmail(email) ) {
        errors.push( __t('Invalid email address.') );
    }

    if ( ! pass ) {
        errors.push( __t('No password specified.') );
    }

    if ( errors.length ) {
        return reject(errors);
    }

    let user = await getUserBy( 'email', email );
    if ( isError(user) ) {
        return eject(user);
    }

    let match = await verifyHash( pass, user.pass );
    if ( isError(match) ) {
        return reject( __t('Mismatch email and password.') );
    }

    return user;
};
setGlobalVar( 'validateUser', validateUser );

/**
 * Check if user is currently logged in.
 *
 * @returns {boolean}
 */
const isUserLoggedIn = function() {
    if ( currentUser.ID > 0 ) {
        return true;
    }

    return false;

};
setGlobalVar( 'isUserLoggedIn', isUserLoggedIn );

/**
 * Validate and login user base on the supplied email address and password.
 *
 * @param email
 * @param pass
 * @returns {Promise<object|error>}
 */
const loginUser = async function( email, pass ) {
    let user = await validateUser( email, pass );

    if ( isError(user) ) {
        return reject(user);
    }

    let __user = '__user_' + appKeys.login,
        expires = Date.now() + ( 86400 * 30 * 6000 ); // Force user to login after 30 days

    expires = await appFilter('loginDuration').apply(expires);

    $_COOKIE( __user ).set( user.ID, expires );

    /**
     * Trigger whenever user successfully logged in.
     *
     * @param {object} user             The current user logging in.
     */
    await appEvent('login').trigger(user);

    global.currentUser = user;

    return resolve(user);
};
setGlobalVar( 'loginUser', loginUser );

/**
 * Logout user.
 *
 * @returns {Promise<boolean>}
 */
const logoutUser = async function() {
    if ( ! isUserLoggedIn() ) {
        return false; // Do nothing if user is not currently logged in.
    }

    if ( 'undefined' === typeof $_COOKIE ) {
        errorHandler(__t('Failed to attempt to logout outside the system environment.') );

        return false;
    }

    let __user = '__user_' + appKeys.login;

    $_COOKIE(__user).clear();

    /**
     * Trigger whenever user logout from the system.
     *
     * @param {object} currentUser
     */
    await appEvent('logout').trigger(currentUser);

    global.currentUser = {ID: 0};

    return true;
};
setGlobalVar( 'logoutUser', logoutUser );

/**
 * Check if user have granted permission of the given permission type.
 *
 * @param {int} userId
 * @param {string|array} perm
 * @param {any} grantFor
 * @returns {Promise<boolean>}
 */
const isUserGranted = async function( userId, perm, grantFor ) {
    let user = await getUser(userId);

    if ( isError(user) ) {
        return false;
    }

    // Administrators always granted in all areas
    if ( _.contains( ['admin', 'administrator'], user.group ) ) {
        return true;
    }

    let {grants} = user;
    grants = grants || {};

    /**
     * Filter the list of user permissions to check if additional grants are inserted.
     *
     * @param {object} grants
     * @param {object} user
     * @param {string|array} perm
     */
    grants = await appFilter( 'userPermissions' ).apply( grants, user, perm, grantFor );

    if ( _.isArray(perm) ) {
        // An array of permissions assume user must have at least one grant of the list.
        let found = false;

        perm.map( _perm => {
            if ( grants[_perm] ) {
                found = true;
            }
        });

        return found;
    }

    return !! grants[perm];
};

/**
 * Check if current use have granted permission.
 *
 * @param {string|array} perm
 * @param {any} grantFor
 * @returns {Promise<boolean>}
 */
const currentUserCan = function( perm, grantFor ) {
    return isUserGranted( currentUser, perm, grantFor );
};
setGlobalVar( 'currentUserCan', currentUserCan );