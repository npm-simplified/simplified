async: insertContentType( object: args )
-
Adds a new content type into the database.

#### Parameters:
-- (string) `name`

The content type name.

-- (string) `slug`

A unique slug use as the content type's identifier.

-- (string) `status`

The status of the content type. Options are **active**|**inactive**. Default is *active*.

-- (boolean) `hierarchical`

Whether a content of the content type can have children.

-- (boolean) `archive`

Whether contents of the content type are archive for public users.

-- (boolean) `page`

Whether an individual content of the content type is publicly viewable.

-- (boolean) `comments`

Whether users may leave comments to the content of the content type.

-- (boolean) `rest`

Whether contents of the content type are accessible via REST API.

-- (string) `archiveTitle`

The content type archive title.

-- (string) `archiveDescription`

Optional. The content type's archive description.

-- (string) `archiveSlug`

Required. Use to construct the readable link which points to the content type's archive page.

-- (int) `itemsPerPage`

Required. The number of contents to display per page.

-- (array) `parents`

An array of other content type slug where the content type is a descendant of.

-- (object) `fields`

Optional. An object that defines the content type's content table structure. 

#### @returns:
Returns true on success or error object on failure.

#### Usage:
~~~~
// Adding content type of type `Blog`
let blog = await insertContentType({
    name: 'Blog',
    slug: 'blog',
    status: 'active',
    hierarchical: true,
    archive: true,
    page: true,
    comments: true,
    rest: true
});

if ( isError(blog) ) {
    // Print error message
    console.log(blog.message);
}

// Creating categorization for `Blog`
let category = await insertContentType({
    name: 'Categories',
    slug: 'category',
    status: 'active',
    hierarchical: true,
    parents: ['blog'],
    fields: {
        name: {
            type: 'string',
            length: 60,
            required: true,
            index: true
        },
        description: {
            type: 'string',
            length: 255
        }
    }
});
if ( isError(category) ) {
    // Print error message
    console.log(category.message);
}
~~~~

async: updateContentType( object: contentType, string: oldSlug )
-
Updates an existing content type in the database.

#### Parameters:
**object:** ***contentType***

-- (string) `slug`

Required. The content type slug identifier to update to.
*Note: When changing the content type slug, set the old content type slug as the second parameter.

-- (string) `name`

Optional. Use only when updating the content type's name.

-- (string) `status`

Optional. Use only when updating the content type's status.

-- (boolean) `hierarchical`

Optional. Use only when setting or disabling content's hierarchy.

-- (boolean) `archive`

Optional. Use only when setting or disabling the content type's archive.

-- (boolean) `page`

Optional. Use only when setting or disabling the content type's content page.

-- (boolean) `comments`

Optional. Use only when setting or disabling commenting on content type's content.

-- (boolean) `rest`

Optional. Use only when including or excluding the content type's contents in REST API queries.

-- (array) `parents`

Optional. Use only when updating the list of parents or remove parents of the content type.

-- (object) `fields`

Optional. Use only when resetting the content type's content table structure.

**oldSlug**

-- (string) `oldSlug`

The content type's old unique slug identifier prior to updating.

#### @returns
Returns true on success or error object on failure.

#### Usage:
~~~~
let blog = await updateContentType({
    name: 'Blogs',
    slug: 'blogs'
}, 'blog' );

if ( isError(blog) ) {
    // Print error message
    console.log(blog.message);
}
~~~~

async: dropContentType( string: slug )
-
Remove content type from the database.

*Note: All contents, including the content's metadata, comments, and other relevance data associated to the content type will also gets deleted.*

#### Parameter:
-- (string) `slug`

Required. The unique slug content type identifier.

#### @returns:
Returns true on success or error object on failure.

#### Usage
~~~~
let drop = await dropContentType('blogs');

if ( isError(drop) ) {
    // Print error message
    console.log(drop.message);
}
~~~~

async: getContentType( string: slug )
-

Get the content type object from the database base on the given content type slug.

#### Parameter:
-- (string) `slug`

#### @returns:
Returns content type object on success or error on failure.

#### Usage:
~~~~
let contentType = await getContentType('blogs');

if ( isError(contentType) ) {
    // Print error message
    console.log(contentType.message);
}
~~~~

async: getContentTypes( object: queryFilter ) 
-
Retrieve content types from the database.

#### Parameters:
-- (string) `status`

Optional. The content type status.

-- (array) `status__in`

Optional. An array of content type statuses to base the return results from.

-- (array) `status__not_in`

Optional. An array of content type statuses where the return results is neither have the list of statuses.

#### @returns
Returns an array of content type object.