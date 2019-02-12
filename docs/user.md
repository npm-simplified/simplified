async: insertUser( object: *userData* )
-

Insert new user into the database.

#### Parameters: *userData*
-- (string) *display*

Required. The display name of the user.

-- (string) *email*

Required. The email address of the user.

-- (string) *pass*

Require. The human readable password of the user. Primarily use in login authentication.

-- (string) *group*

Required. The name of the group assign to the user. Note that the assign group name must exist from the database. Otherwise will return an error.

#### @returns:

Returns new user id on success or an error object on failure.

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
    return;
}
~~~~

####async: updateUser( object: *userData* )

Update user's data in the database.

#### Parameters:

-- (int) *ID*

Required. The id of the user to update the data to.

-- (string) *display*

Optional. Use only when updating the user's display name.

-- (string) *email*

Optional. Use only when updating the user's email address.

-- (string) *pass*

Optional. Use only when updating the user's password.

-- (string) *group*

Optional. Use only when updating the user's group.

#### @returns:

Returns user ID on success or error object on failure.

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

async: getUserBy( string: column, string|int: value )
-
Retrieve user's data from the database base on the given column name and value.

### Parameters:

-- (string) `column`

The users table column name, use to match the query.
*Note: Only column names **ID** and **email** are allowed.*

-- (string|int) `value`

The value of the given column name.

#### @returns:

Returns user's data object on success or error.

#### Usage:

~~~~
let user = await getUserBy( 'email', 'natasha@awesomesite.com' );

if ( isError(user) ) {
    // Print error message
    console.log(user.message);
    
    return;
}
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