async: setContentMeta( string: type, int: contentId, string: name, any: value, boolean: single, string: oldMetaName )
-

Insert or update a content's metadata.

#### Parameters:

-- (string) `type`

Required. The content type slug.

-- (int) `contentId`

Required. The id of the content to associate the metadata at.

-- (string) `name`

Required. The metadata name.

-- (any) `value`

Required. The metadata value.

-- (boolean) `single`

Optional. Use only when inserting a unique metadata.

-- (string) `oldMetaName`

Optional. Use when changing the metadata name.

#### @returns:
Returns true on success or error object on failure.

#### Usage:
~~~~
// Adding new meta
let insert = await setContentMeta( 'blogs', 1, 'active', 'read', true );

if ( isError(insert) ) {
    // Print error message
    console.log(insert.message);
}

// Updating metadata
let update = await setContentMeta( 'blogs', 1, 'my-status', 'new', true, 'active' );

if ( isError(update) ) {
    // Print error message
    console.log(update.message);
}
~~~~

async: dropContentMeta( string: type, int: contentId, string: name, any: value )
-
Remove content metadata from the database.

#### Parameters:

-- (string) `type`

Required. The content type slug

-- (int) `contentId`

Required. The content id.

-- (string) `name`

Optional. If omitted, will remove all content metadata of the given content id. Setting the content meta name will only delete the content's metadata having the specified name.

-- (any) `value`

Optional. If present, only metadata having the specified name with the value will be deleted.

#### @returns:
Returns true on success or error on failure.

#### Usage:
~~~~
// Delete a single content meta
let meta = await dropContentMeta( 'blogs', 1, 'my-status', 'new' );

if ( isError(meta) ) {
    // Print error message
    console.log(meta.message);
}


// Delete all content meta where the name is 'my-status'
let deleted = await dropContentMeta( 'blogs', 1, 'my-status' );

if ( isError(deleted) ) {
    // Print error message
    console.log(deleted.message);
}

// Delete all the content's metadata
let deleteAll = await dropContentMeta( 'blogs', 1 );

if ( isError(deleteAll) ) {
    // Print error message
    console.log(deleteAll.message);
}
~~~~

async: getContentMeta( string: type, int: contentId, string: name, boolean: single )
-

Get the content's metadata.

#### Parameters:

-- (string) `type`

Required. The content type slug.

-- (int) `contentId`

Required. The content id to get the metadata from.

-- (string) `name`

Optional. The content's metadata name. If present, will return the metadata value(s).

-- (boolean) `single`

Optional. If true, will return the value of the specified metadata name.

#### @returns:
The return value varies depending on the set parameters. Return values may be an object containing the meta name and value, an array of meta values or the meta value if single is set to true.

#### Usage:
~~~~
// Get the metadata single value
// Returns string, int, or object. Depending on the type of value set for the metadata name.
let single = await getContentMeta( 'blogs', 1, 'my-status', true );

if ( isError(single) ) {
    // Print error message
    console.log(single.message);
}

// Get all values of the metadata name
// Returns an array of values.
let values = await getContentMeta( 'blogs', 1, 'my-status' );

if ( isError(values) ) {
    // Print error message
    console.log(values.message);
}

// Get all the content's metadata
// Returns an object where the object key is the name of the meta and value is it's corresponding values.

let allMeta = await getContentMeta( 'blogs', 1 );

if ( isError(allMeta) ) {
    // Print error message
    console.log(allMeta.message);
}
~~~~