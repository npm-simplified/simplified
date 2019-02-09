'use strict';

const _getUser = appFilter('getUser'),
    _dropUser = appEvent('deletedUser');

// Add user's metadata on user object
const setUserMeta = async user => {
    let metas = await getUserMeta(user.ID);

    if ( isError(metas) ) {
        return user;
    }

    user.metadata = metas;

    return user;
};
_getUser.set(setUserMeta);

// Remove user's metadata when user is deleted from the database.
const __dropUserMeta = userId => {
    dropUserMeta(userId);

    return true;
};
_dropUser.set(__dropUserMeta, 99999);