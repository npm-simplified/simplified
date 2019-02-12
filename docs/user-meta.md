####async: setUserMeta( int: ID, string: name, any: value, boolean: single )

Insert or update user's metadata into the database.

Parameters:
-
-- (int) `ID`

The id of the user to insert the metadata into.

-- (string) `name`

The name of the meta to insert or update to.

-- (any) `value`

The value of the meta to insert to. Value can be of any type.

-- (boolean) `single`

Use to specify whether the user's metadata can only one or not. Default is false.

@returns:
-
Returns true on success or an error object on failure.

Usage:
-
~~~~
let done = await setUserMeta( 1, 'beauty', true, true );
if ( isError(done) ) {
    // Print error message
    console.log(done.message);
    
    return;
}

// Continue here...
console.log('Yes, you are beautiful!');
~~~~

####async: dropUserMeta( int: ID, string: name, any: value )

Remove the user's metadata from the database.

Parameters:
-
-- (int) `ID`

Required. The id of the user to remove the metadata from.

-- (string) `name`

Required. The name of the meta data to remove to.

-- (any) `value`

Optional. The value of the user's metadata to remove to.

@returns:
-
Returns true on success or an error object on failure.

Usage:
-
~~~~
let deleted = await dropUserMeta( 1, 'beauty' );

if ( isError(deleted) ) {
    // Print error message
    console.log(deleted.message);
    
    return;
}

// Continue your stuff here
....
~~~~