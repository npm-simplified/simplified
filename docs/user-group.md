async: insertUserGroup( string: *name*, array: *grants* )
-
Insert new user group into the database.

#### Parameters:

-- (string) `name`

Required. The name of the group to insert to.

-- (array) `grants`

An array of user permissions the group is granted for.

#### @returns:
Returns true on success or an error object.

#### Usage:
~~~~
let insert = await insertUserGroup( 'manager', ['editUser', 'deleteUser'] );
if ( isError(insert) ) {
    // Print error message
    console.log(insert.message);
}
~~~~

async: updateUserGroup( string: *name*, array: *grants*, string: oldGroupName)
-
Update an existing user group into the database.

#### Parameters:
-- (string) `name`

Required. The name of the group to update to. When changing the group's name, the old group name must be set at the third parameter.

-- (string) `grants`

Required. An array of updated user permissions or the old permissions list.

-- (string) `oldGroupName`

Optional. Use only when changing the name of the group.

#### @returns:

Returns true on success of an error object.

#### Usage:
~~~~
let update = await updateUserGroup( 'helper', [], 'manager' );
if ( isError(update) ) {
    // Print error message
    console.log(update.message);
}
~~~~

async: getUserGroup( string: name )
-
Retrieve a user group data from the database.

#### Parameters:

-- (string) `name`

Required. The name of the group to retrieve the data from.

#### @returns:

Returns the group data object or an error on failure.

#### Usage:
~~~~
let group = await getUserGroup( 'helper' );
if ( isError(group) ) {
    // Print error message
    console.log(group.message);
}
~~~~

async: dropUserGroup( string: name )
-
Remove user group from the database.

#### Parameters:

-- (string) `name`

The name of the group to remove to.

### @returns:
Returns true on success or an error object.

#### Usage:
~~~~
let deleted = await dropUserGroup( 'helper' );
if ( isError(deleted) ) {
    // Print error message
    console.log(deleted.message);
}
~~~~

async: getUserGroups(void)
-

Returns an array of all user group inserted into the database.

#### Usage:
~~~~
let groups = await getUserGroups();

// Print an array of user group
if ( groups.length ) {
    console.log(groups);
}
~~~~