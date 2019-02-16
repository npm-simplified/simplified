async: insertContent( object: *contentData* )
-
Insert new content into the database.

#### Parameter: *contentData*

-- (string) `type`

Required. The content type's unique slug.

The contentData object properties may vary depending on what was set on the content
type's *fields* properties. The *fields* properties is what constructed the content's table structure. Below are the default
*fields* properties according to it's type.

###### Parameters for content type of type *content*:

-- (string) `title`

The content title.

-- (string) `slug`

The content's unique slug. Default is the generated slug from the content's title.

-- (string) `status`

The content status. Options are (*public* | *private* | *pending* | *draft*). Default is *draft*.

-- (string) `summary`

A short summary, not more than 255 characters.

-- (string) `description`

The content's full description.

-- (int) `author`

The user id of the content author. Default is current user's id.

-- (int) `parent`

The content's parent id.

-- (string) `comment`

The content's comment status. Options are: *open* | *close* | *disabled*. Default is *open*.

###### Parameters for content type of type *group*:

-- (string) `name`

Required. The content's name.

-- (string) `slug`

The content's unique slug. Default is a generated slug from the content's name.

-- (string) `description`

The content's description consisting of at most 255 characters.

-- (string) `parent`

The content's parent id.

#### @returns:
Returns content id on success or error on failure.

#### Usage:
~~~~
// Add a new post
let contentId = await insertContent({
    type: 'blogs',
    title: 'My Funny Day',
    slug: 'my-funny-day',
    summary: '',
    description: '',
    author: 1
});

if ( isError(contentId) ) {
    // Print error message
    console.log(contentId.message);
}

// Add new category
let catId = await insertContent({
    type: 'category',
    name: 'Summer',
    slug: 'summer',
    description: 'All about summer activities.'
});

if ( isError(catId) ) {
    // Print error
    console.log(catId.error);
}
~~~~

#### @hooks:
-- (event) `insertedContent`( int: *ID*, object: *contentTypeData* )

Triggered whenever a new content is inserted into the database.

###### Parameters:
-- (int) `ID`

The new content id.

-- (object) `contentTypeData`

An object containing the content type's data.


async: updateContent( object: *contentData* )
-
Update content in the database.

#### Parameter: *contentData*

-- (string) `type`

Required. The content type unique slug.

-- (int) `ID`

Required. The id of the content to update at.
 
###### Parameters for content type of type *content*:

-- (string) `title`

Optional. Use only when updating the content title.

-- (string) `slug`

Optional. Use only when updating the content's unique slug.

-- (string) `status`

Optional. Use only when changing the content's status.

-- (string) `summary`

Optional. Use only when updating the content summary.

-- (string) `description`

Optional. Use only when updating the content's description.

-- (int) `author`

Optional. Use only when changing the content's author.

-- (int) `parent`

Optional. Use only when changing the content's parent.

-- (string) `comment`

Optional. Use only when changing the content's comment status.

###### Parameters for content type of type *group*:

-- (string) `name`

Optional. Use only when updating the content's name.

-- (string) `slug`

Optional. Use only when updating the content's unique slug.

-- (string) `description`

Optional. Use only when updating the content's description.

-- (string) `parent`

Optional. Use only when changing the content's parent.

#### @returns:
Returns content id on success or error on failure.

#### Usage:
~~~~
// Update post
let contentId = await insertContent({
    type: 'blogs',
    ID: 1,
    author: 2
});

if ( isError(contentId) ) {
    // Print error message
    console.log(contentId.message);
}

// Add new category
let catId = await insertContent({
    type: 'category',
    ID: 1,
    name: 'Hot Summer',
    slug: 'hot-summer',
});

if ( isError(catId) ) {
    // Print error
    console.log(catId.error);
}
~~~~

#### @hooks:
-- (event) `updatedContent`( int: *ID*, object: *oldContent*, object: *contentTypeData* )

Triggered whenever a content is updated in the database.

###### Parameters:
-- (int) `ID`

The id of the updated content.

-- (object) `oldContent`

An object containing the content data before an update.

-- (object) `contentTypeData`

An object containing the content's content type data.


async: getContentBy( string: *column*, any: *value*, string: *type* )
-

Get content from the database base on the given column name and value.

#### Parameters:

-- (string) `column`

Required. The column name to base the query at. Allowed columns are *ID* and *slug*.

-- (string|int) `value`

Required. The corresponding value of the given column name.

-- (string) `type`

Required. The content type's unique slug.

#### @returns
Returns an object containing the content data on success or error on failure. 

#### Usage:
~~~~
// Get the blog post.
let content = await getContentBy( 'blogs', 'slug', 'my-funny-summer' );

if ( isError(content) ) {
    // Print error message
    console.log(content.message);
}

// Get the blog category
let category = await getContentBy( 'category', 'ID', 1 );

if ( isError(category) ) {
    // Print error message
    console.log(category.message);
}
~~~~

#### @hooks:
-- (filter) `getContent`(object: *contentData*, object: *contentTypeData*)

Called whenever a content is retrieve from the database. This filter hook is fired to filter
the content data object before returning.

###### Parameters:
-- (object) `contentData`

The content object.

-- (object) `contentTypeData`

An object containing the content type data.

###### @returns:
Returns the content object.

###### Sample Usage:
~~~~
// Add custom variable to content object if the content's content type is 'blogs
const myVar = (content, contentTypeData) => {
    let {slug} = contentTypeData;
    
    if ( 'blogs' === slug ) {
        content.pretty = 'me';
    }
    
    return content;
};
appFilter('getContent').set(myVar);
~~~~

async: getContent( int: *ID*, string: *type* )
-
A convenient way to get the content data base on content id.

#### Parameters:

-- (int) `ID`

Required. The content id.

-- (string) `type`

Required. The content type's unique slug.

#### @returns
Returns content object on success or error on failure.

#### Usage:
~~~~
let content = await getContent( 'blogs', 1 );

if ( isError(content) ) {
    // Print error message
    console.log(content.message);
}
~~~~

async: dropContent( string: *type*, int: *ID* )
-
Remove the content from the database.

#### Parameters:

-- (string) `type`

Required. The content type's unique slug.

-- (int) `ID`
Required. The content id.

#### @returns:
Returns true on success or error on failure.

#### Usage:
~~~~
let deleted = await dropContent( 'blogs', 1 );

if ( isError(deleted) ) {
    // Print error
    console.log(deleted.message);
}
~~~~

#### @hooks:
-- (event) `deletedContent`(object: *contentData*, object: *contentTypeData*)

Triggered whenever a content is deleted from the database.

###### Parameters:
-- (object) `contentData`

The deleted content data.

-- (object) `contentTypeData`

An object containing the content's content type data.

async: contentQuery( object: *queryFilter* )
-

Get contents from the database base.

#### Parameter: *queryFilter*

-- (string) `type`

Required. The content type's unique slug.

-- (array) `within`

Optional. An array of content ID where the return results id must be within the list.

-- (array) `not__within`

Optional. An array of content ID which are be excluded in the query.

-- (int) `page`

Optional. The page number use as the start position in the query.

-- (int) `perPage`

Optional. The number of contents to return in the query.

-- (string) `orderBy`

Optional. The content table's column name.

-- (string) `order`

Optional. The order to which the contents is return to. Default is *asc* (ascending).

-- (object) `meta`

Optional. The content's metadata.

// @todo: Define how queries are set.

#### @returns:

Returns an object containing the total number of contents found and an array contents.

#### Usage:
~~~~
let query = await contentsQuery({
    type: 'blogs'
});

if ( isError(query) ) {
    // Print error message
    console.log(query.message);
}

// Sample results
{foundItems: 20, contents: [...]}
~~~~

async: getContents( object: queryFilter )
-

Get an array of contents from the database.

#### Parameters:
*Refer to `contentsQuery` parameters.*

#### @returns:

Returns an array of contents or empty array on failure.

#### Usage:
~~~~
let contents = await getContents({type: 'blogs'});

// Print contents length
console.log(contents.length);
~~~~