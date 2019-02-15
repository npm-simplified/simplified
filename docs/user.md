async: insertUser( object: *userData* )
-
Insert new user into the database.

#### Parameters: *userData*
-- (string) `display`

Required. The user's display name.

-- (string) `email`

Required. The user's email address.

-- (string) `pass`

Required. The user's human readable password. Primarily use during authentication. 

-- (string) `group`

Required. The name of the group assign to the user.

The assigned group name must already exist from the database. Assigning an unknown group name will return an error.

#### @returns:
Returns new user id on success or error on failure.

#### Usage:
~~~~
let userId = await insertUser({
    display: 'natasha',
    email: 'natasha@awesomemail.com',
    pass: 123456,
    group: 'subscriber'
});

if ( isError(userId) ) {
    // Print error message
    console.log(userId.message);
}
~~~~

#### @hooks
-- (event) `insertedUser`( int: *ID* )

Triggered whenever a new user is inserted into the database.

###### Parameter:
-- (string) `ID`

The new user id.

###### Sample Usage:
~~~~
// Assuming you want to save the new user's id elsewhere
// Add a callable function to do your stuff that will be called
// whenever a new user is inserted into the database.
const myCustomFunc = function(id) {
    // Do your stuff here
    ....
}
appEvent('insertedUser').set(myCustomFunc);
~~~~

async: updateUser( object: *userData* )
-
Update user's data in the database.

#### Parameters:

-- (int) `ID`

Required. The id of the user to update the data to.

-- (string) `display`

Optional. Use only when updating the user's display name.

-- (string) `email`

Optional. Use only when updating the user's email address.

-- (string) `pass`

Optional. Use only when updating the user's password.

-- (string) `group`

Optional. Use only when reassigning user to a different group.

#### @returns:

Returns user ID on success or error on failure.

#### Usage:

~~~~
let userId = await updateUser({
    ID: 1,
    display: 'awesome'
});

if ( isError(userId) ) {
    // Print error message
    console.log(userId.message);
    
    return;
}
~~~~

#### @hooks
-- (event) `updatedUser`( int: ID, object: user)

Triggered whenever user's data is updated in the database.

###### Parameters:
-- (int) `ID`

The updated user's id.

-- (object) `user`

An object containing the user's data before an update.

###### Sample Usage:
~~~~
// Set a callable function that is called whenever a user
// is updated
const userUpdate = function(id, user) {
    // Do your stuff here
    ....
};
appEvent('updatedUser').set(userUpdate);
~~~~

async: getUserBy( string: column, string|int: value )
-
Get user's data from the database base on the given column name and value.

### Parameters:

-- (string) `column`

The name of the column to use to match the query. Options are *ID* | *email*.

-- (string|int) `value`

The corresponding value of the given column name.

#### @returns:

Returns an object containing user's data on success or error on failure.

#### Usage:
~~~~
let user = await getUserBy( 'email', 'natasha@awesomesite.com' );

if ( isError(user) ) {
    // Print error message
    console.log(user.message);
    
    return;
}
~~~~

#### @hooks
-- (filter) async: `getUser`(object: *userData*)

Fired whenever user is retrieve from the database.

###### Parameter:
-- (object) `userData`

An object containing user's information.

###### Sample Usage:
~~~~
// Set a rating level per user
// * Always return the user object after manipulating
const setUserRating = function(user) {
    user.rating = 10;
    
    return user;
};
appFilter('getUser').set(setUserRating);
~~~~

async: getUser( int: ID )
-
A convenient way to get the user's data from the database using the user's id.

#### Parameters:

-- (int) `ID`

The id of the user to get the data to.

#### @returns:

Returns user's data object on success or an error object.

#### Usage:
~~~~
let user = await getUser(1);

if ( isError(user) ) {
    // Print the error message
    console.log(user.message);
    return;
}
~~~~

async: dropUser(ID)
-
Remove user from the database.

#### Parameters:

-- (int) `ID`

The id of the user to remove to.

*Note: Other user's data, such as metadata are also removed from the database.*

#### Usage:
~~~~
let deleted = await dropUser(1);

if ( isError(deleted) ) {
    // Print error message here
    console.log(deleted.message);
    return;
}
~~~~

async: usersQuery( object: queryFilters )
-

Retrieve users from the database on the given query filters.

#### Parameters: *queryFilters*

-- (string) `group`

Optional. The name of the group a user is a member of.

-- (array) `group__in`

Optional. An array of user group name where the return users must be a member of.

-- (array) `group__not_in`

Optional. An array of user group name where the return users must not be a member of.

-- (array) `within`
Optional. An array of user IDs that the return results are base at.

-- (array) `not__within`

Optional. An array of user IDs where the return users id must not be among the list.

-- (int) `page`

Optional. The page number to base the return results at.

-- (int) `perPage`

Optional. The number of users to return in the query.

#### @returns:
Returns an object containing the total number of users found in the query and an array of user object.

#### Usage:
~~~~
let query = await usersQuery({ group: 'helper' });

if ( query.foundItems > 0 ) {
    let users = query.users;
    
    // Do your thing here
    ....
}
~~~~

async: getUsers( object: queryFilter )
-
A convenient way to get the list of users from the database.

#### Parameters: *queryFilter*
-- (string) `group`

Optional. The name of the group a user is a member of.

-- (array) `group__in`

Optional. An array of user group name where the return users must be a member of.

-- (array) `group__not_in`

Optional. An array of user group name where the return users must not be a member of.

-- (array) `within`
Optional. An array of user IDs that the return results are base at.

-- (array) `not__within`

Optional. An array of user IDs where the return users id must not be among the list.

-- (int) `page`

Optional. The page number to base the return results at.

-- (int) `perPage`

Optional. The number of users to return in the query.

#### @returns:
Returns an array containing user object.

#### Usage:
~~~~
let users = await getUsers();

// Print the results length
console.log(users.length);
~~~~

async: validateUser( string: email, string: pass )
-
Helper function use to validate a user prior to login.

#### Parameters:

-- (string) `email`

Required. The email address use during user insertion.

-- (string) `pass`

Required. The human readable password of the user to validate to.

#### @returns:

Returns an object container the user's data on success or an error object.

#### Usage:
~~~~
let user = await validateUser( 'natasha@awesomemail.com', '123456' );

if ( isError(user) ) {
    // Print error message
    console.log(user.message);
    return;
}
~~~~

async: loginUser( string: email, string: pass )
-
Validate and login a user into the system.

#### Parameters:
-- (string) `email`

Required. The email address use during user insertion.

-- (string) `pass`

Required. The human readable password of the user to validate to.

#### @returns:

Returns an object containing the user's data on success or an error object.

#### Usage:
~~~~
let login = await loginUser( 'natasha@awesomemail.com', '123456' );

if ( isError(login) ) {
    // Print error message
    console.log(login.message);
    
    return;
}
~~~~

async: logoutUser(void)
-
Helper function use for logging out a user from the system.

isUserLoggedIn(void)
-

Check if a user is currently logged in into the system.

#### Usage:
~~~~
if ( isUserLoggedIn() ) {
    console.log('User is login.');
}
~~~~

async: isUserGranted( int: ID, (string|array) perms, any: grantFor ) 
-
Verify if a user have granted the given permission or any of the given list of permissions.

#### Parameters:

-- (int) `ID`

The id of the user to check the existence of the permission at.

-- (string|array) `perm`

The type of permission to check if the user have granted at.

-- (any) `grantFor`

An optional parameter use to further validation the user's permission at.

#### @returns:
Returns true on success or false on failure.

#### Usage:
~~~~
if ( ! isUserGranted( 1, 'editUser', 5 ) ) {
    // Print warning here
    console.log('You are not allowed to edit this user.');
    
    return;
}
~~~~

async: currentUserCan( string|array: perm, any: grantFor )
-
A convenient way to check the current logged in user's granted permissions.

#### Parameters:

-- (string|array) `perm`

The type of permission/s to check against the current user to.

-- (any) `grantFor`

Optional. An additional data use for further validation of the current user's granted permission/s.

#### Usage:
~~~~
if ( ! currentUserCan( 'edit-user', 5 ) ) {
    // Print warning here
    console.log('You are not allowed to edit this user.');
    
    return;
}
~~~~