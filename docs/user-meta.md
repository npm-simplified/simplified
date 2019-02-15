async: setUserMeta( int: *ID*, string: *name*, any: *value*, boolean: *single* )
-
Insert or update user's metadata into the database.

#### Parameters:
-- (int) `ID`

Required. The id of the user to insert or update the metadata into.

-- (string) `name`

Required. The name of the metadata.

-- (any) `value`

Required. The corresponding value of the metadata.

-- (boolean) `single`

Optional. Use to specify that the metadata should only have on value.

#### returns:
Returns true on success or error on failure.

#### Usage:
~~~~
let done = await setUserMeta( 1, 'beauty', true, true );
if ( isError(done) ) {
    // Print error message
    console.log(done.message);
}
~~~~

async: getUserMeta( int: *ID*, string: *name*, boolean: *single* )
-
Get user's metadata from the database.

#### Parameters:
-- (int) `ID`

The id of the user to get the metadata from.

-- (string) `name`

Optional. The name of the metadata to get to. If omitted, will return an object containing all of user's metadata.

-- (boolean) `single`

Optional. If true, will return the corresponding value of the metadata. Otherwise will return an array of values.

#### @returns:
The return result varies depending on the parameters set and the type of corresponding metadata value. Returns an error object on failure.

#### Usage:
~~~~
// Returns an object of all metadata.
let metas = await getUserMeta(1);
if ( isError(metas) ) {
    // Print error message
    console.log(metas.message);
}

// Returns an array of values
let values = await getUserMeta( 1, 'social-links' );
if ( isError(values) ) {
    // Print error message
    console.log(values.message);
}

// Asumming a meta is something = sure
// Returns `sure`
let value = await getUserMeta( 1, 'something', true );
if ( isError(value) ) {
    // Print error message
    console.log(value.message);
}
~~~~

async: dropUserMeta( int: *ID*, string: *name*, any: *value* )
-
Remove user's metadata from the database.

#### Parameters:
-- (int) `ID`

Required. The id of the user to remove the metadata from.

-- (string) `name`

Optional. If set, will remove user's metadata of the given name. Otherwise will remove all of user's metadata.

-- (any) `value`

Optional. If set, will remove only user's metadata with a match value. Omitting this parameter will remove user's metadata of the given name.

#### @returns:
Returns true on success or error on failure.

#### Usage:
~~~~
// Delete a single metadata
let deleteOne = await dropUserMeta( 1, 'beauty', true );

if ( isError(deleteOne) ) {
    // Print error message
    console.log(deleteOne.message);
}

// Delete all the values of metadata name 'beauty'
let deleted = await dropUserMeta( 1, 'beauty' );
if ( isError(deleted) ) {
    // Print error message
    console.log(deleted.message);
}

// Delete all of user's metadata
let deleteAll = await dropUserMeta( 1 );
if ( isError(deleteAll) ) {
    // Print error message
    console.log(deleteAll.message);
}
~~~~