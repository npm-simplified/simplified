async: setContentMeta( string: *type*, int: *contentId*, string: *name*, any: *value*, boolean: *single*, string: *oldMetaName* )
-

Insert or update a content's metadata into the database.

#### Parameters:

-- (string) `type`

Required. The content type slug.

-- (int) `contentId`

Required. The id of the content to insert or update the metadata at.

-- (string) `name`

Required. The metadata name.

-- (any) `value`

Required. The metadata value.

-- (boolean) `single`

Optional. Use to specify that the metadata should only have one value.

-- (string) `oldMetaName`

Optional. Use when changing the metadata name.

#### @returns:
Returns true on success or error on failure.

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

async: dropContentMeta( string: *type*, int: *contentId*, string: *name*, any: *value* )
-
Remove the content metadata from the database.

#### Parameters:

-- (string) `type`

Required. The content type slug

-- (int) `contentId`

Required. The content id.

-- (string) `name`

Optional. The name of the metadata to remove at. If omitted, will remove all of the content's metadata.

-- (any) `value`

Optional. The value of the metadata to remove at. If set, will only remove metadata with a match value. Omitting this parameter will remove all metadata matching the given metadata name.

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

async: getContentMeta( string: *type*, int: *contentId*, string: *name*, boolean: *single* )
-

Get the content's metadata from the database.

#### Parameters:

-- (string) `type`

Required. The content type slug.

-- (int) `contentId`

Required. The content id to get the metadata from.

-- (string) `name`

Optional. The name of the metadata to get the value at. If omitted, will return an object containing all of content's metadata.

-- (boolean) `single`

Optional. Set this to true to return the single metadata value. False will return an array of values.

#### @returns:
The return result varies depending on the parameters set and the type of corresponding metadata value. Otherwise, will return an error on failure.

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