async: emailExist( string: *email* )
-
Check if an email is already in use.

#### Parameter:
-- (string) `email`

The user's email address to check into.

#### @returns:
Returns an object containing an existing user's data on success or error on failure.

#### Usage:
~~~~
let otherUser = await emailExist('natasha@awesomemail.com');
if ( ! isError(otherUser) && otherUser.ID ) {
    // Email is already in use
    console.log('Email already exist.');
}
~~~~

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
-- (event) `updatedUser`( int: *ID*, object: *user*)

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

async: getUserBy( string: *column*, string|int: *value* )
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

Called whenever user is retrieve from the database.

###### Parameter:
-- (object) `userData`

An object containing user's data.

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

async: getUser( int: *useId* )
-
A convenient way to get user's data from the database base on user id.

#### Parameters:

-- (int) `useId`

The id of the user to get the data to.

#### @returns:

Returns an object containing user's data on success or error on failure.

#### Usage:
~~~~
let user = await getUser(1);

if ( isError(user) ) {
    // Print the error message
    console.log(user.message);
    return;
}
~~~~

async: dropUser(int: *ID*)
-
Remove user from the database.

#### Parameters:

-- (int) `userId`

The id of the user to remove to.

#### @returns:
Returns true on success or error on failure.

#### Usage:
~~~~
let deleted = await dropUser(1);

if ( isError(deleted) ) {
    // Print error message here
    console.log(deleted.message);
    return;
}
~~~~

#### @hooks
-- (event) `deletedUser`(object: *userData*)

Triggered whenever user is deleted from the database.

###### Parameter:
-- (object) `userData`

The deleted user's data.

###### Sample Usage:
~~~~
// Remove your custom data from somewhere
const deletedUser = function(user) {
    // Do your stuff here...
    ......
};
appEvent('deletedUser').set(deletedUser);
~~~~

async: usersQuery( object: *queryFilters* )
-

Get users from the database filtered by the given query filters.

#### Parameters: *queryFilters*

-- (string) `group`

Optional. The name of the group assigned to user.

-- (array) `group__in`

Optional. An array of user group names assigned to users.

-- (array) `group__not_in`

Optional. An array of user group names where users is not a member of.

-- (array) `within`
Optional. An array of users ID where the return results must be within the list.

-- (array) `not__within`

Optional. An array or users ID where the return results must exclude the given list.

-- (int) `page`

Optional. The page number use to start the query at.

-- (int) `perPage`

Optional. Specifies the number of users to return in the query.

-- (object) `meta`

Optional. An object consist of user's metadata filters to match against the users.

#### @returns:
Returns an object containing the total number match found and an array of user object.

#### Usage:
~~~~
let query = await usersQuery({ group: 'helper' });
// Return object
{foundItems: 20, users: [...]}
~~~~

#### @hooks:
-- (filter) `preGetUsers`(object: *queryFilters*)

Fired to allow alteration on the query filters before execution.

-- (filter) `getUser`(object: *userData*)

Applied to every return users found in the query.

async: getUsers( object: *queryFilter* )
-
A convenient way to get the list of users from the database.

*Refer to `usersQuery` for parameters definition.*

#### @returns:
Returns an array users on success or empty array on failure.

#### Usage:
~~~~
let users = await getUsers();

// Print the results length
console.log(users.length);
~~~~

async: validateUser( string: *email*, string: *pass* )
-
Validate user prior to login.

#### Parameters:

-- (string) `email`

Required. The user's email address.

-- (string) `pass`

Required. The user's human readable password.

#### @returns:

Returns user object on success or error on failure.

#### Usage:
~~~~
let user = await validateUser( 'natasha@awesomemail.com', '123456' );

if ( isError(user) ) {
    // Print error message
    console.log(user.message);
    return;
}
~~~~

async: loginUser( string: *email*, string: *pass* )
-
Validate and login user.

#### Parameters:
-- (string) `email`

Required. The user's email address.

-- (string) `pass`

Required. The user's human readable password.

#### @returns:

Returns true on success or error on failure.

#### Usage:
~~~~
let login = await loginUser( 'natasha@awesomemail.com', '123456' );

if ( isError(login) ) {
    // Print error message
    console.log(login.message);
}

// Print current user
console.log(currentUser);
~~~~

#### @hooks:
-- (filter) `loginDuration`(int: expires)

Fired to allow alteration to the number of microseconds a user must stay login.

###### Parameter:
-- (int) `expires`

The duration to which the user must stay login. Default is 30 days in microseconds.

-- (event) `login`(object: *userData*)

Triggered whenever a user successfully login.

###### Parameter:
-- (object) `userData`

The current login user's object data.

###### Sample Usage:
~~~~
// Change login duration to 7 days
const changeToSeven = expires => {
    expires = Date.now() + (38400 * 7 * 6000);
    
    return expires;
};
appFilter('loginDuration').set(changeToSeven);

// Do some recording to login user
const doSomething = userData => {
    // Do something to the login user here
    .....
};
appEvent('login').set(doSomething);
~~~~

async: logoutUser(void)
-
Log user out from the system.

#### @hooks:
-- (event) `logout`(object: *userData*)

Triggered when user logout from the system.

###### Parameter:
-- (object) `userData`

The current user's object bound to logout.

###### Sample Usage:
~~~~
const logMeOut = userData => {
    // Do your stuff here...
    ......
};
appEvent('logout').set(logMeOut);
~~~~

isUserLoggedIn(void)
-
Check if the current user is logged in.

#### Usage:
~~~~
if ( isUserLoggedIn() ) {
    console.log('User is login.');
}
~~~~

async: isUserGranted( int: *ID*, string: *perms*, any: *grantFor* ) 
-
Check if a user have granted permission(s).

#### Parameters:

-- (int) `ID`

Required. The id of the user to check.

-- (string|array) `perm`

Required. The type or types of permission to check at.

-- (any) `grantFor`

An optional parameter use to further validate the user's permission.

#### @returns:
Returns true on success or false on failure.

#### Usage:
~~~~
if ( ! isUserGranted( 1, 'editUser', 5 ) ) {
    // Print warning here
    console.log('You are not allowed to edit this user.');
}
~~~~

#### @hooks:
-- (filter) `userPermissions`(object: *grants*, object: *user*, string: *perm*, any: *grantFor*)

Filter the current user's granted permissions to allow alteration or changes before validation.

###### Parameters:
-- (array) `grants`

An array of user's granted permissions.

-- (object) `user`

The user's object data currently validated.

-- (string|array) `perm`

The type or types of permission to validate against.

-- (any) `grantFor`

An optional parameter use to further validate the user's permission.

###### @returns:
Returns an array containing the user's granted permissions.

###### Sample Usage:
~~~~
// Check if user is allowed to edit other user's profile
if ( ! isUserGranted( 1, 'edit-user', 3 ) ) {
    // Print error restriction
    console.log('You are not allowed to edit this user.');
}
~~~~

async: currentUserCan( string: *perm*, any: *grantFor* )
-
Check if current logged in user have granted permission(s).

#### Parameters:

-- (string|array) `perm`

The type or types of permission to check against.

-- (any) `grantFor`

An optional parameter use to further validate the user's permission.

#### Usage:
~~~~
if ( ! currentUserCan( 'edit-user', 5 ) ) {
    // Print warning here
    console.log('You are not allowed to edit this user.');
}
~~~~