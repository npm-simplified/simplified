'use strict';

const setUserObject = async function(user) {
    // Set user's meta data
    let metas = await getUserMeta(user.ID);

    if ( ! isError(metas) ) {
        user.metadata = metas;
    }

    // Set user's permission
    let {group} = user;

    if ( 'administrator' !== group ) {
        let groupObj = await getUserGroup(group);

        if ( ! isError(groupObj) ) {
            user.grants = groupObj.grants || {};
        }
    }

    return user;
};

const onDeletedUser = function(user) {
    let {ID} = user;

    // Delete user's metadata.
    dropUserMeta(ID);

    return true;
};

module.exports = function() {
    appFilter('getUser').set(setUserObject);

    appEvent('deletedUser').set( onDeletedUser, 9999 );
    return true;
};