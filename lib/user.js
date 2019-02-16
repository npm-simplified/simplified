'use strict';

const _ = require('underscore');

const groupCache = appCache('userGroup'),
    allGroupCache = appCache('userGroups'),
    groupFilter = appFilter('getUserGroup');

/**
 * Get the user group's data from the database.
 *
 * @param {string} name                                     Required. The name of the group to get the data at.
 *
 * @returns {Promise<object|error>}
 * Returns an object containing the user group's data on success or error on failure.
 */
const getUserGroup = function(name) {
    if ( ! name ) {
        return reject( __t('User group name is required.') );
    }

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

            /**
             * Called before return the user's group data.
             * This filter is fired whenever a user group is retrieve to allow filtering of the
             * user group's data object.
             *
             * @param {object} group
             */
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
 * @access private
 * @returns {Promise<boolean|error>}
 */
const setUserGroup = async function(name, grants) {
    let oldName = arguments[2] || false;

    if ( ! name ) {
        return reject( __t('Group name is required.') );
    }

    // Prevent setting admin type group.
    if ( _.contains(['admin', 'administrator'], name ) ) {
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
                 * Triggered whenever a user group date is updated in the database.
                 *
                 * @param {object} group                            The updated group object.
                 * @param {object} oldGroup                         The object containing the group's old date, prior to update.
                 */
                await appEvent('updatedUserGroup').trigger( group, oldGroup );

                return true;
            }

            /**
             * Triggered whenever a new user group is inserted into the database.
             *
             * @param {object} group                            An object containing the new user group's data.
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
 * Insert new user group into the database.
 *
 * @param {string} name                                     Required. The name of the group.
 * @param {array} grants                                    Required. An array of permissions granted to the group.
 *
 * @returns {Promise<boolean|error>}
 * Returns true on success or error on failure.
 */
const insertUserGroup = function( name, grants ) {
    return setUserGroup( name, grants );
};
setGlobalVar( 'insertUserGroup', insertUserGroup );

/**
 * Update user group in the database.
 *
 * @param {string} name                                     Required. The name of the group to update to. If the group's name
 *                                                          is different from what was previously set, the old group name must
 *                                                          be set as the third parameter.
 * @param {array} grants                                    Required. An array of permission granted to the group.
 * @param {string} oldGroupName                             Optional. Use only when changing the name of the group.
 *
 * @returns {Promise<boolean|error>}
 * Returns true on success or error on failure.
 */
const updateUserGroup = function( name, grants, oldGroupName ) {
    return setUserGroup( name, grants, oldGroupName );
};
setGlobalVar( 'updateUserGroup', updateUserGroup );

/**
 * Remove user group from the database.
 *
 * @param {string} name                                     Required. The name of the group to remove at.
 *
 * @returns {Promise<boolean|error>}
 * Returns true on success or error on failure.
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
         * Triggered whenever a user group is deleted from the database.
         *
         * @param {object} group            An object containing the user's group data before deletion.
         */
        await appEvent('deletedUserGroup').trigger(group);

        return done;
    };

    return dbManager.delete( table, {name: name} ).then(handleResponse);
};
setGlobalVar( 'dropUserGroup', dropUserGroup );

/**
 * Get the list of user groups from the database.
 *
 * @returns {Promise<array|error>}
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
 * Get user's data from the database base on the given column name and value.
 *
 * @param {string} column                           The name of the column to use to match in the query. Options are `ID` and `email`.
 * @param {int|string} value                        The corresponding value of the given column name.
 *
 * @returns {Promise<object|error>}
 * Returns an object containing the user's data on success or error on failure.
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

    let handleReturn = async user => {
        /**
         * Called whenever use is retrieve from the database.
         *
         * @param {object} user         An object containing user's data.
         */
        user = await userFilter.apply(user);

        return user;
    };

    if ( user ) {
        user = await handleReturn(user);

        return resolve(user);
    }

    let col = {};
    col[column] = value;

    let handleResponse = async users => {
        if ( isError(users) ) {
            return users;
        }

        if ( ! users.length ) {
            return errorHandler( __t('No user found.') );
        }

        user = users.shift();

        userCache.set( user.ID, user );
        userCache.set( user.email, user );

        user = await handleReturn(user);

        return user;
    };

    return dbManager.get( dbManager.usersTable, '*', col ).then(handleResponse);
};
setGlobalVar( 'getUserBy', getUserBy );

/**
 * A convenient way to get user's data from the database base on user id.
 *
 * @param {int} userId                              The id of the user to get the data to.
 *
 * @returns {Promise<object|error>}
 * Returns an object containing user's data on success or error on failure.
 */
const getUser = function(userId) {
    return getUserBy( 'ID', userId );
};
setGlobalVar( 'getUser', getUser );

/**
 * Check if an email is already in use.
 *
 * @param {string} email                            The user's email address to check into.
 * @returns {Promise<object|error>}
 * Returns an object containing an existing user's data success or error on failure.
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
 * @access private
 * @returns {Promise<int|error>}
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

    if ( group && 'administrator' !== group ) {
        let userGroup = await getUserGroup( group );

        if ( isError(userGroup) ) {
            return resolve(userGroup);
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
             * Triggered whenever user's data is updated in the database.
             *
             * @param {int} ID              The updated user's id.
             * @param {object} user         An object containing the user's data before an update.
             */
            await appEvent('updatedUser').trigger( ID, user );

            return ID;
        }

        /**
         * Triggered whenever a new user is inserted into the database.
         *
         * @param {int} ID                  The new user id.
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
 *     @param {string} display                  Required. The user's display name.
 *     @param {string} email                    Required. The user's email address.
 *     @param {string} pass                     Required. The user's human readable password. Primarily use during authentication.
 *     @param {string} group                    Required. The name of the group assign to the user. The assigned group name must already
 *                                              exist from the database. Assigning an unknown group will return an error.
 * }
 *
 * @returns {Promise<int|error>}
 * Returns new user id on success or error on failure.
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
 * @param {object} userData {
 *     @param {int} ID                          Required. The id of the user to update the data to.
 *     @param {string} display                  Optional. Use ony when updating the user's display name.
 *     @param {string} email                    Optional. Use only when updating the user's email address.
 *     @param {string} pass                     Optional. Use only when updating the user's password.
 *     @param {string} group                    Optional. Use only when reassigning user to a different group.
 * }
 *
 * @returns {Promise<int|error>}
 * Returns user ID on success or error on failure.
 */
const updateUser = function(userData) {
    let {ID} = userData;

    if ( ! ID || _.isNaN(ID) ) {
        return reject( __t('Invalid user id.') );
    }

    return setUser(userData);
};
setGlobalVar( 'updateUser', updateUser );

/**
 * Remove user from the database.
 *
 * @param {int} ID                                          The id of the user to remove to.
 *
 * @returns {Promise<boolean|error>}
 * Returns true on success or error on failure.
 */
const dropUser = async function(ID) {
    if ( _.isNaN(ID) ) {
        return reject( __t('Invalid user id.') );
    }

    let user = await getUser(ID).catch(errorHandler);
    if ( isError(user) ) {
        return reject( __t('User does not exist.') );
    }

    let handleResponse = async ok => {
        if ( isError(ok) ) {
            return ok;
        }

        allUserCache.clear();

        userCache.clear(ID);
        userCache.clear(user.email);

        /**
         * Triggered whenever user is deleted from the database.
         *
         * @param {object} user         The deleted user's data.
         */
        await appEvent('deletedUser').trigger(user);

        return true;
    };

    return dbManager.delete( dbManager.usersTable, {ID: ID} ).then(handleResponse);
};
setGlobalVar( 'dropUser', dropUser );

/**
 * Get users from the database filtered by the given query filters.
 *
 * @param {object} query {
 *     @param {string} group                Optional. The name of the group assigned to user.
 *     @param {array} group__in             Optional. An array of user group names assigned to users.
 *     @param {array} group__not_in         Optional. An array of user group names where user's is not a member of.
 *     @param {array} within                Optional. An array of users ID where the return results must be within the list.
 *     @param {array} not__within           Optional. An array or users ID where the return results must exclude the given list.
 *     @param {int} page                    Optional. The page number use to start the query at.
 *     @param {int} perPage                 Optional. Specifies the number of users to return in the query.
 *     @param {object} meta                 Optional. An object consist of user's metadata filters to match against the users.
 * }
 *
 * @returns {Promise<object|error>}
 * Returns an object containing the total number of match found and an array of user object.
 */
const usersQuery = async function(query) {
    query = query || {};

    /**
     * Fired to allow alteration on the query filters before execution.
     *
     * @param {object} query
     *
     * @returns {object} query
     */
    query = await appFilter('preGetUsers').apply(query);

    let key = allUserCache.genKey(query),
        cache = allUserCache.get(key),
        table = dbManager.usersTable,
        metaTable = dbManager.userMetaTable,
        results = {itemsFound: 0, users: []};

    let handleResults = async results => {
        let _results = _.clone(results),
            {users} = _results;

        for ( let i = 0; i < users.length; i++ ) {
            let userData = users[i];

            /**
             * Applied to every return users found in the query.
             *
             * @param {object} userData                 An object containing the user's data.
             */
            users[i] = await userFilter.apply(userData);
        }

        _results.users = users;

        return _results;
    };

    if ( cache ) {
        let results = await handleResults(cache);

        return resolve(results);
    }

    let handleResponse = async users => {
        if ( isError(users) || ! users.length ) {
            return results;
        }

        results.users = users;
        allUserCache.set( key, results );

        results = await handleResults(results);

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

    let metaQuery = {};

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
 * @param {object} query                        Same as `usersQuery` parameters definition.
 *
 * @returns {Promise<array>}
 * Returns an array of users on success or an empty array on failure.
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
 * Insert or update user's metadata into the database.
 *
 * @param {int} userId                          Required. The id of the user whom to insert or update the metadata.
 * @param {string} name                         Required. The name of the metadata.
 * @param {any} value                           Required. The corresponding value of the metadata.
 * @param {boolean} single                      Optional. Use to specify that the metadata should only have one value.
 *
 * @returns {Promise<boolean|error>}
 * Returns true on success or error on failure.
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

    return dbManager.insert( table, filter ).then(handleResponse);
};
setGlobalVar( 'setUserMeta', setUserMeta );

/**
 * Get user's metadata from the database.
 *
 * @param {int} userId                              Required. The id of the user to get the metadata from.
 * @param {string} name                             Optional. The name of the metadata to get the value at. If omitted, will return
 *                                                  an object containing all the user's metadata.
 * @param {boolean} single                          Optional. Set this to true to return the single metadata value. False will return
 *                                                  an array of values.
 *
 * @returns {Promise<any|error>}
 * The return result varies depending on the parameters set and the type of corresponding metadata value. Otherwise,
 * will return an error on failure.
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
                return _.first(values);
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

        let metas = {};

        results.map( result => {
            if ( ! metas[result.name] ) {
                metas[result.name] = [];
            }

            metas[result.name].push(result.value);
        });

        // Save to cache
        userMetaCache.set( userId, metas );

        return handleResults(metas);
    };

    // Get all user's metadata at once
    return dbManager.get( table, '*', filter ).then(handleResponse);
};
setGlobalVar( 'getUserMeta', getUserMeta );

/**
 * Remove user's metadata from the database.
 *
 * @param {int} userId                  Required. The id of the user whom to remove the metadata from.
 * @param {string} name                 Optional. The name of the metadata to remove at. If omitted, will remove all of the
 *                                      user's metadata.
 * @param {any} value                   Optional. The value of the metadata to remove at. If set, will only remove metadata
 *                                      with a match value. Omitting this parameter will remove all metadata matching the
 *                                      given metadata name.
 *
 * @returns {Promise<boolean|error>}
 * Returns true on success or error on failure.
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
 * Validate user prior to login.
 *
 * @param {string} email                                Required. The user's email address.
 * @param {string} pass                                 Required. The user's human readable password.
 *
 * @returns {Promise<object|error>}
 * Returns user object on success or error on failure.
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
 * Validate and login user.
 *
 * @param {string} email                                Required. The user's email address.
 * @param {string} pass                                 Required. The user's human readable password.
 *
 * @returns {Promise<boolean|error>}
 * Returns true on success or error on failure.
 */
const loginUser = async function( email, pass ) {
    let user = await validateUser( email, pass );

    if ( isError(user) ) {
        return reject(user);
    }

    let __user = '__user_' + appKeys.login,
        expires = Date.now() + ( 86400 * 30 * 6000 ); // Force user to login after 30 days

    /**
     * Fired to allow alteration to the number of microseconds a user must stay login.
     *
     * @param {int} expires                         The duration to which the user must stay login.
     *                                              Default is 30 days in microseconds.
     */
    expires = await appFilter('loginDuration').apply(expires);

    $_COOKIE( __user ).set( user.ID, expires );

    /**
     * Triggered whenever a user successfully logged in.
     *
     * @param {object} user             The current login user's object data.
     */
    await appEvent('login').trigger(user);

    global.currentUser = user;

    return resolve(true);
};
setGlobalVar( 'loginUser', loginUser );

/**
 * Log user out from the system.
 *
 * @returns {Promise<boolean>}
 */
const logoutUser = async function() {
    if ( ! isUserLoggedIn() ) {
        return false; // Do nothing if user is not currently logged in.
    }

    if ( 'undefined' === typeof $_COOKIE ) {
        errorHandler(__t('Failed to attempt to logout from the system.') );

        return false;
    }

    let __user = '__user_' + appKeys.login;

    $_COOKIE(__user).clear();

    /**
     * Triggered whenever user logout from the system.
     *
     * @param {object} currentUser                          The current user's data object.
     */
    await appEvent('logout').trigger(currentUser);

    global.currentUser = {ID: 0};

    return true;
};
setGlobalVar( 'logoutUser', logoutUser );

/**
 * Check if a user have granted permission(s).
 *
 * @param {int} userId                                      Required. The id of the user to check.
 * @param {string|array} perm                               Required. The type or types of permission to check at.
 * @param {any} grantFor                                    Optional. An optional parameter use to further validate the
 *                                                          user's permission(s).
 *
 * @returns {Promise<boolean>}
 * Returns true on success or false on failure.
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
    grants = grants || [];

    /**
     * Filter the current user's granted permissions to allow alteration or changes before validation.
     *
     * @param {array} grants                        An array of user's granted permissions.
     * @param {object} user                         The user's object data currently validated.
     * @param {string|array} perm                   The type or types of permission to validate against.
     * @param {any} grantFor                        An optional parameter use to further validate the user's permission(s).
     *
     * @returns {array}
     */
    grants = await appFilter( 'userPermissions' ).apply( grants, user, perm, grantFor );

    if ( _.isArray(perm) ) {
        // An array of permissions assume user must have at least one grant of the list.
        let found = false;

        perm.map( _perm => {
            if ( _.contains( grants, _perm ) ) {
                found = true;
            }
        });

        return found;
    }

    return !! _.contains( grants, perm );
};
setGlobalVar( 'isUserGranted', isUserGranted );

/**
 * Check if current logged in user have granted permission(s).
 *
 * @param {string|array} perm                               Required. The type or types of permission to check against.
 * @param {any} grantFor                                    An optional parameter use to further validate the user's permission(s).
 * @returns {Promise<boolean>}
 */
const currentUserCan = function( perm, grantFor ) {
    return isUserGranted( currentUser, perm, grantFor );
};
setGlobalVar( 'currentUserCan', currentUserCan );