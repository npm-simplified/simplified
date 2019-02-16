async: insertContent( object: *contentData* )
-
Insert new content into the database.

#### Parameter: *contentData*

-- (string) `type`

Required. The content type unique slug.

-- (string) `slug`

Required. The content's unique slug.

###### Default parameters for content of type *content*:

-- (string) `title`

The content title.

-- (string) `status`

The content status. Options are (*public*|*private*|*pending*|*draft*). Default is *pending*.

-- (string) `summary`

Optional. A short, not more than 255 characters content summary.

-- (string) `description`

The content's full description.

-- (int) `author`

The id of the user whom the content author.

-- (int) `parent`

Optional. The id of the content where the content is a descendant of.

-- (string) `comment`

The content's comment status. Options are: *open* | *close* | *disabled*. Default is *open*.


###### Default parameters for content of type *group*:

-- (string) `name`

Required. The content group name.

-- (string) `description`

Optional. The group's description consisting of at most 255 characters.

-- (string) `parent`

Optional. The id of the content where the content is a descendant of.

#### @returns:
Returns content id on success or error object on failure.

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

An object containing the content's content type data.

async: updateContent( object: *contentData* )
-

Update content in the database.

#### Parameter: *contentData*

-- (string) `type`

Required. The content type unique slug.

-- (int) `ID`

Required. The id of the content to update at.
 
###### Default parameters for content of type *content*:

-- (string) `title`

Optional. Use only when updating the content title.

-- (string) `status`

Optional. Use only when changing the content status.

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

###### Default parameters for content of type *group*:

-- (string) `name`

Optional. Use only when updating the content's name.

-- (string) `description`

Optional. Use only when updating the content's description.

-- (string) `parent`

Optional. Use only when changing the content's parent.

#### @returns:
Returns content id on success or error object on failure.

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

async: getContentBy( string: *type*, string: *column*, any: *value* )
-

Get content from the database base on the given column name and value.

#### Parameters:

-- (string) `type`

Required. The content type slug.

-- (string) `column`

Required. The column name to base the query at. Allowed columns are *ID* and *slug*.

-- (string|int) `value`

Required. The corresponding value of the given column name.

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

Called whenever a content is retrieve from the database.

###### Parameters:
-- (object) `content`

The content object.

-- (object) `contentTypeData`

An object containing the content's content type data.

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

async: getContent( string: *type*, int: *ID* )
-
A convenient way to get the content data base on content id.

#### Parameters:

-- (string) `type`

Required. The content type slug.

-- (int) `ID`

Required. The id of the content to get the data at.

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

Required. The content type slug.

-- (int) `ID`

Required. The id of the content to remove at.

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

Required. The content type slug.

-- (array) `within`

Optional. An array of content ID where the return results must be within the specified list.

-- (array) `not__within`

Optional. An array of content ID which should be excluded in the query.

-- (int) `page`

Optional. The page number use as the start position in the query.

-- (int) `perPage`

Optional. The number of items of the return contents.

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