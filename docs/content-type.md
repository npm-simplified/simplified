async: insertContentType( object: *contentTypeData* )
-
Insert new content type into the database.

#### Parameters: *contentTypeData*
-- (string) `type`

Required. The type of content to create at. Options are *content* | *group*. Default is *content*.

-- (string) `name`

Required. The content type name.

-- (string) `slug`

Required. A unique slug use as the content type's identifier.

-- (string) `status`

The content type status. Statuses selections are *active* | *inactive* | *builtin*. Default is active.

-- (boolean) `hierarchical`

Set to true to allow hierarchy to the contents of the content type.

-- (boolean) `archive`

Set to true to enable public archive page, listing the contents of the content type.

-- (boolean) `page`

Set to true to enable individual content view per page.

-- (boolean) `comments`

Set to true to allow comments posted to the content of the content type. Comments can also be disabled per content.

-- (boolean) `rest`

Set to true to let contents of the content type queryable via REST API. For content type of type *group*, the parent content must be set to true for the
contents of the content type to be included in REST query.

-- (string) `archiveTitle`

The content type archive title. Required if *archive* is set to true.

-- (string) `archiveDescription`

Optional. The content type's custom archive description.

-- (string) `archiveSlug`

The content type's unique archive slug. Use to construct the public archive route. Default's content type slug.

-- (int) `itemsPerPage`

The number of contents to display per page. Default is 50.

-- (array) `parents`

Optional. An array of content type's slug where the content type is a descendant at. Required if the content type is of type `group`.
 
-- (object) `fields`

Optional. An object that defines the table structure of the contents of the content type.

// @todo: Link content table structure definition

#### @returns:
Returns true on success or error on failure.

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

#### @hooks:
-- (event) `insertedContentType`(object: *contentTypeData*)

Triggered whenever a new content type is inserted into the database.

async: updateContentType( object: *contentType*, string: *oldSlug* )
-
Updates content type in the database.

#### Parameters:
**object:** ***contentType***

-- (string) `slug`

Required. The content type's unique slug.

-- (string) `type`

Optional. Use only when changing the content type's type.

-- (string) `name`

Optional. Use only when updating the content type's name.

-- (string) `status`

Optional. Use only when updating the content type's status.

-- (boolean) `hierarchical`

Optional. Use only when setting or disabling content's hierarchy.

-- (boolean) `archive`

Optional. Use only when setting or disabling the content type's public archive.

-- (boolean) `page`

Optional. Use only when setting or disabling content's individual page view.

-- (boolean) `comments`

Optional. Use only when setting or disabling commenting on content type's content.

-- (boolean) `rest`

Optional. Use only when including or excluding the content type's contents in REST API queries.

-- (array) `parents`

Optional. Use only when updating the list of parents of the content type.

-- (object) `fields`

Optional. Use only when resetting the content's table structure of the content type.

**string**: **oldSlug**

-- (string) `oldSlug`

Optional. Use only when changing the content type's unique slug identifier.

#### @returns
Returns true on success or error on failure.

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

#### @hooks:
-- (event) `updatedContentType`(object: *contentTypeData*, object: *oldContentTypeData*)

Triggered whenever the content type is updated in the database.

async: dropContentType( string: *slug* )
-
Remove content type from the database.

#### Parameter:
-- (string) `slug`

Required. The content type's unique slug.

#### @returns:
Returns true on success or error on failure.

#### Usage
~~~~
let drop = await dropContentType('blogs');

if ( isError(drop) ) {
    // Print error message
    console.log(drop.message);
}
~~~~

#### @hooks:
-- (event) `deletedContentType`(object: *contentTypeData*)

Triggered whenever a content type is removed from the database.

###### Parameter:
-- (object) `contentTypeData`

An object containing the content type's data before deletion.


async: getContentType( string: *slug* )
-

Get content type from the database.

#### Parameter:
-- (string) `slug`

Required. The content type's unique slug.

#### @returns:
Returns an object containing the content type's data on success or error on failure.

#### Usage:
~~~~
let contentType = await getContentType('blogs');

if ( isError(contentType) ) {
    // Print error message
    console.log(contentType.message);
}
~~~~

#### @hooks:
-- (filter) `getContentType`(object: *ContentTypeData*)

Called whenever a content type is retrieve from the database.
This filter is fired to filter the content type object prior to returning.

async: getContentTypes( object: *queryFilter* ) 
-
Get content types from the database.

#### Parameter: *queryFilter*
-- (string) `status`

Optional. The content type status.

-- (array) `status__in`

Optional. An array of content type statuses to base the return results from.

-- (array) `status__not_in`

Optional. An array of content type statuses where the return results is neither have the list of statuses.

#### @returns
Returns an array of content type object.