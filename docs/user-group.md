async: insertUserGroup( string: *name*, array: *grants* )
-
Insert new user group into the database.

#### Parameters:

-- (string) `name`

Required. The name of the group.

-- (array) `grants`

Required. An array of permissions granted to the group.

#### @returns:
Returns true on success or error on failure.

#### Usage:
~~~~
let insert = await insertUserGroup( 'manager', ['editUser', 'deleteUser'] );
if ( isError(insert) ) {
    // Print error message
    console.log(insert.message);
}
~~~~

#### @hooks:
-- (event) `insertedUserGroup`(object: *group*)

Triggered whenever a new user group is inserted into the database.

###### Parameter:
-- (object) `group`

An object containing the new user group's data.

async: updateUserGroup( string: *name*, array: *grants*, string: *oldGroupName*)
-
Update user group in the database.

#### Parameters:
-- (string) `name`

Required. The name of the group to update to. If the group's name
is different from what was previously set, the old group name must
be set as the third parameter.

-- (array) `grants`

Required. An array of permissions granted to the group.

-- (string) `oldGroupName`

Optional. Use only when changing the name of the group.

#### @returns:

Returns true on success or error on failure.

#### Usage:
~~~~
let update = await updateUserGroup( 'helper', [], 'manager' );
if ( isError(update) ) {
    // Print error message
    console.log(update.message);
}
~~~~

#### @hooks:
-- (event) `updatedUserGroup`( object: *group*, object: *oldGroup* )

Triggered whenever a user group data is updated in the database.

###### Parameters:
-- (object) `group`

The updated group object.

-- (object) `oldGroup`

An object containing the group's old data, prior to update.

async: getUserGroup( string: *name* )
-

Get the user group's data from the database.

#### Parameters:

-- (string) `name`

Required. The name of the group to get the data at.

#### @returns:
Returns an object containing the user group's data on success or error on failure.

#### Usage:
~~~~
let group = await getUserGroup( 'helper' );
if ( isError(group) ) {
    // Print error message
    console.log(group.message);
}
// Sample result
{name: 'helper', grants: [....]}
~~~~

#### @hooks:
-- (filter) `userUserGroup`( object: *group* )

Called before returning the user's group data. This filter is fired whenever a user group is retrieve to allow filtering of the user group's data object.

async: dropUserGroup( string: *name* )
-
Remove user group from the database.

#### Parameters:

-- (string) `name`

Required. The name of the group to remove at.

### @returns:
Returns true on success or error on failure.

#### Usage:
~~~~
let deleted = await dropUserGroup( 'helper' );
if ( isError(deleted) ) {
    // Print error message
    console.log(deleted.message);
}
~~~~

#### @hooks:
-- (event) `deletedUserGroup`( object: *group*)

Triggered whenever a user group is deleted from the database.

###### Parameter:
-- (object) `group`

An object containing the user's group data before deletion.

async: getUserGroups(void)
-

Get the list of user groups from the database.

#### @returns:
Returns an array of user group or empty array on failure.

#### Usage:
~~~~
let groups = await getUserGroups();

// Print an array of user group
if ( groups.length ) {
    console.log(groups);
}
~~~~

#### @hooks:
-- (filter) `getUserGroup`( object: *group*)

Called to each user group in the return list.