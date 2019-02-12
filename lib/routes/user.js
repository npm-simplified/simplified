'use strict';

/**
 * Handles users management page.
 *
 * @access private
 *
 * @param req
 */
const users = async function( req ) {
    let page = req.params.page || 1,
        response = {
            title: __t('Users')
        },
        query = {page: page, perPage: 20};

    let users = await usersQuery(query);

    if ( ! isError(users) ) {
        response.foundItems = users.foundItems;
        response.users = users;
    }

    return response;
};

/**
 * Handles data generation for create or edit user page.
 *
 * @param req
 * @returns {Promise<object>}
 */
const editUser = async function(req) {
    let id = req.params.id || false,
        response = {};

    if ( id ) {
        let user = await getUser(id);

        if ( isError(user) ) {
            return user;
        }

        response.user = user;
    }

    return response;
};

/**
 * Handles insertion or update's user data.
 *
 * @param req
 * @returns {Promise<object|error>}
 */
const updateUser = async function(req) {
    let id = req.params.id || false,
        user = _.pick( $_POST(), ['display', 'email', 'pass', 'group'] ),
        response = {
            message: __t('New user successfully added.')
        };

    if ( id ) {
        user.ID = id;
        response.message = __t('User successfully updated.');
    }

    let done = await setUser(user);
    if ( isError(done) ) {
        return done;
    }

    response.ID = id;
    response.success = true;

    return response;
};

/**
 * Handles delete user request.
 *
 * @param req
 * @returns {Promise<true|error>}
 */
const deleteUser = async function(req) {
    let id = req.params.id,
        response = {};

    let done = await dropUser(id);
    if ( isError(done) ) {
        return done;
    }

    response.success = true;
    response.message = __t('User successfully deleted.');

    return response;
};

const getLoginPage = function( req, res ) {

};
setGlobalVar( 'getLoginPage', getLoginPage );

const getAccessDeniedPage = function( req, res ) {

};
setGlobalVar( 'getAccessDeniedPage', getAccessDeniedPage );

const getErrorPage = function( req, res ) {

};
setGlobalVar( 'getErrorPage', getErrorPage );

module.exports = function() {
    setAdminView( '/users', users, true, 'edit-user' );
    setAdminView( '/users/page/:page', users, true, 'edit-user' );

    setAdminView( '/users/edit', editUser, true, 'edit-user', updateUser );
    setAdminView( '/users/edit/:id', editUser, true, 'edit-user', updateUser );

    setGetResponse( '/users/delete/:id', deleteUser, true, 'delete-user' );
};