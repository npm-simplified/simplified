#### async: insertUser( object: *userData* )

Insert new user into the database.

Parameters: *userData*
-
-- (string) *display*

Required. The display name of the user.

-- (string) *email*

Required. The email address of the user.

-- (string) *pass*

Require. The human readable password of the user. Primarily use in login authentication.

-- (string) *group*

Required. The name of the group assign to the user. Note that the assign group name must exist from the database. Otherwise will return an error.

@returns:
-

Returns new user id on success or an object containing the error message.

Usage:
-
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

Parameters:
-
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

@returns:
-

Returns user ID on success or error object on failure.

Usage:
-

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

####async: getUserBy( string: column, string|int: value )

Get the user's database from the database base on the given table column name and value.

Parameters:
-
-- (string) `column`

The name of user's table column to match to. Allowed column names are **ID** and **email**.

-- (string|int) `value`

The value of the given column name to match to the database.

@returns:
-
Returns an object container the user's data on success or an error object.

Usage:
-
~~~~
let user = await getUserBy( 'email', 'natasha@awesomesite.com' );

if ( isError(user) ) {
    // Print error message
    console.log(user.message);
    
    return;
}
~~~~

####async: getUser( int: ID )

A convenient way to get the user's data from the database using an id.

Parameters:
-
-- (int) `ID`

The id of the user to get the data to.

@returns:
-
Returns an object of user's data on success or an error object.

Usage:
-
~~~~
let user = await getUser(1);

if ( isError(user) ) {
    // Print the error message
    console.log(user.message);
    return;
}

// Do something to the user object here
.....
~~~~

####async: dropUser(ID)

Remove user from the database.

Parameters:
-

-- (int) `ID`

The id of the user to remove to. Other data such as metadata are also removed from the database.

Usage:
-

~~~~
let deleted = await dropUser(1);

if ( isError(deleted) ) {
    // Print error message here
    console.log(deleted.message);
    return;
}

// Continue your stuff here
....
~~~~

####async: usersQuery( object: queryFilters )

Parameters: *queryFilters*
-

-- (string) `group`

The name of the group users are a member of.

-- (array) `group__in`

A list of user group where a user is a member to any of the given list.

-- (array) `group__not_in`

A list of user group where a user is not a member of to any of the given list.

-- (array) `within`
A list user IDs the return results are base upon.

-- (array) `not__within`

A list of user IDs where user's ID is not among the given list.

-- (int) `page`

The page number to base the results at.

-- (int) `perPage`

The number of users to return in the query.

@returns:
-
Returns an object containing the total number of users found and an array of user object .

Usage:
-

~~~~
let query = await usersQuery({ group: 'helper' });

if ( query.foundItems > 0 ) {
    let users = query.users;
    
    // Do your thing here
    ....
}
~~~~

####async: getUsers( object: queryFilter )
A convenient way to get the list of users from the database.

Parameters: *queryFilter*
-- (string) `group`

The name of the group users are a member of.

-- (array) `group__in`

A list of user group where a user is a member to any of the given list.

-- (array) `group__not_in`

A list of user group where a user is not a member of to any of the given list.

-- (array) `within`
A list user IDs the return results are base upon.

-- (array) `not__within`

A list of user IDs where user's ID is not among the given list.

-- (int) `page`

The page number to base the results at.

-- (int) `perPage`

The number of users to return in the query.

@returns:
-
Returns an array of user object.

Usage:
-
~~~~
let users = await getUsers();

// Print the results length
console.log(users.length);
~~~~

####async: validateUser( string: email, string: pass )

Validate user prior to login.

Parameters:
-
-- (string) `email`

Required. The email address use during user insertion.

-- (string) `pass`

Required. The human readable password of the user to validate to.

@returns:
-
Returns an object container the user's data on success or an error object.

Usage:
-
~~~~
let user = await validateUser( 'natasha@awesomemail.com', '123456' );

if ( isError(user) ) {
    // Print error message
    console.log(user.message);
    return;
}

// Continue here
...
~~~~

####async: loginUser( string: email, string: pass )

Validate and login user.

Parameters:
-
-- (string) `email`

Required. The email address use during user insertion.

-- (string) `pass`

Required. The human readable password of the user to validate to.

@returns:
-
Returns an object container the user's data on success or an error object.

*Note: A global variable name `currentUser` will then contain data of the current user.*

Usage:
-
~~~~
let login = await loginUser( 'natasha@awesomemail.com', '123456' );

if ( isError(login) ) {
    // Print error message
    console.log(login.message);
    
    return;
}

// Continue your stuff here
let {ID} = currentUser.ID;
~~~~

####async: logoutUser(void)

Use to logout the current user from the system.

#### isUserLoggedIn(void)

Check if a user is currently logged in into the system.

Usage:
-
~~~~
if ( isUserLoggedIn() ) {
    console.log('User is login.');
}
~~~~

####async: isUserGranted( int: ID, (string|array) perms, any: grantFor ) 

Verify if a user have granted the given permission or any of the given list of permissions.

Parameters:
-
-- (int) `ID`

The id of the user to check the existence of the permission at.

-- (string|array) `perm`

The type of permission to check if the user have granted at.

-- (any) `grantFor`

An optional parameter use to further validation the user's permission at.

@returns:
-
Returns true on success or false on failure.

Usage:
-
~~~~
if ( ! isUserGranted( 1, 'editUser', 5 ) ) {
    // Print warning here
    console.log('You are not allowed to edit this user.');
    
    return;
}

// Continue editing here
...
~~~~

####async: currentUserCan( string|array: perm, any: grantFor )

A convenient way to check the current logged in user's granted permissions.

Parameters:
-

-- (string|array) `perm`

The type of permission/s to check against the current user to.

-- (any) `grantFor`

Optional. An additional data use for further validation of the current user's granted permission/s.

Usage:
-
~~~~
if ( ! currentUserCan( 'edit-user', 5 ) ) {
    // Print warning here
    console.log('You are not allowed to edit this user.');
    
    return;
}

// Continue here
...
~~~~