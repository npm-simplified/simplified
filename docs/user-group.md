####async: insertUserGroup( string: *name*, array: *grants* )

Insert new user group into the database.

Parameters:
-
-- *name*

Required. The name of the group to insert to.

-- grants

The list of user permissions the group have.

@returns:
-
Returns true on success or an error object.

Usage:
-
~~~~
let insert = await insertUserGroup( 'manager', ['editUser', 'deleteUser'] );
if ( isError(insert) ) {
    // Print error message
    console.log(insert.message);
} else {
    console.log('You are awesome!');
}
~~~~

####async: updateUserGroup( string: *name*, array: *grants*, string: oldGroupName)

Update an existing user group into the database.

Parameters:
-
-- *name*

The name of the group to update into the database. Note that when changing the group name, the old group name must be set as the third parameter.

-- *grants*

An array of user permissions to update into the database.

-- *oldGroupName*

Optional. Use only when changing the name of the group.

@returns:
-
Returns true on success of an error object.

Usage:
-
~~~~
let update = await updateUserGroup( 'helper', [], 'manager' );
if ( isError(update) ) {
    // Handle error here....
    console.log(update.message);
} else {
    console.log('Great, you are now a helper.');
}
~~~~

####async: getUserGroup( string: name )

Retrieve the user group data from the database.

Parameters:
-

-- name

The name of the group to retrieve to.

@returns:
-
Returns an object containing the group's data or an error object.

{name: helper, grants: []}

Usage:
-

~~~~
let group = await getUserGroup( 'helper' );
if ( isError(group) ) {
    // Handle error here
    console.log(group.message);
} else {
    console.log('Perfect!');
}
~~~~

####async: dropUserGroup( string: name )

Remove user group from the database.

Parameters:
-

-- *name*

The name of the group to remove to.

@returns:
-
Returns true on success or an error object.

Usage:
-
~~~~
let deleted = await dropUserGroup( 'helper' );
if ( isError(deleted) ) {
    // Handle error here
    console.log(deleted.message);
} else {
    console.log('Now you are gone.');
}
~~~~

####async: getUserGroups
*Note: This function has no parameters.*

Returns an array of all user groups inserted into the database.

Usage:
-

~~~~
let groups = await getUserGroups();

if ( groups.length ) {
    console.log('Hurray, the list of groups is here.');
} else {
    console.log('Nothing found...');
}
~~~~