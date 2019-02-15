async: insertContent( object: *contentData* )
-
Insert new content into the database.

#### Parameters: *contentData*

-- (string) `type`

Required. The content type unique slug.

Other than the content type slug, the content data object parameter varies depending on the
content type type. 

##### Content type of type `content`

-- (string) `title`

The content title.

-- (string) `slug`

Required. The content slug use when constructing the content url.

-- (string) `status`

The content status. Options are (*public*|*private*|*pending*|*draft*).

-- (string) `summary`

A short, not more than 255 characters content summary.

-- (string) `description`

The content's full description.

-- (int) `author`

The id of the user whom the content author.

-- (int) `parent`

The content parent id.

-- (string) `comment`

The content comment status. Options are: *open*|*close*|*disabled*


##### Content type of type `group`

-- (string) `name`

Required. The content group name.

-- (string) `slug`

Required. The content unique slug.

-- (string) `description`

Optional. A group description consisting of at most 255 characters.

-- (string) `parent`

The content parent id.

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

async: updateContent( object: contentData )
-

Update content data to the database.

#### Parameters:

-- (int) `ID`

Required. The id of the content to update.

-- (string) `type`

Required. The content type unique slug.

Other than the content type slug and content id, the content data object parameter varies depending on the
content type type. 

##### Content type of type `content`

-- (string) `title`

Optional. Use only when updating the content tile.

-- (string) `slug`

Optional. Use only when updating the content's slug.

-- (string) `status`

Optional. Use only when updating the content's status.

-- (string) `summary`

Optional. Use only when updating the content's summary.

-- (string) `description`

Optional. Use only when updating the content's full description.

-- (int) `author`

Optional. Use only when updating the content's author.

-- (int) `parent`

Optional. Use only when updating the content's parent id.

##### Content type of type `group`

-- (string) `name`

Optional. Use only when updating the content group's name.

-- (string) `slug`

Optional. Use only when updating the content group's slug.

-- (string) `description`

Optional. Use only when updating the content group's description.

-- (string) `parent`

Optional. Use only when updating the content group's parent id.

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

async: getContentBy( string: type, string: column, any: value )
-

Retrieve a content from the database base on column type and column value.

#### Parameters:

-- (string) `type`

Required. The content type slug.

-- (string) `column`

Required. The content table column name to base the result from. Allowed columns are *ID* and *slug*.

-- (string|int) `value`

Required. The corresponding value of the given column name.

#### @returns
Returns content object on success or error on failure.

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

async: getContent( string: type, int: ID )
-
Get content object base on the given id.

#### Parameters:

-- (string) `type`

Required. The content type slug.

-- (int) `ID`

Required. The id of the content to retrieve to.

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

async: dropContent( string: type, int: ID )
-
Remove the content from the database.

#### Parameters:

-- (string) `type`

Required. The content type slug.

-- (int) `ID`

Required. The id of the content to delete.

#### @returns:
Returns true on success or error on failure.

*Note: When a content is deleted, all related data, including the content's metadata and comments will also gets deleted.*

#### Usage:
~~~~
let deleted = await dropContent( 'blogs', 1 );

if ( isError(deleted) ) {
    // Print error
    console.log(deleted.message);
}
~~~~

async: contentsQuery( object: queryFilter )
-

Get contents from the database base.

#### Parameter: *queryFilter*

-- (string) `type`

Required. The content type slug.

-- (string) `status`

The content status.

-- (array) `status__in`

An array of statuses to base the return contents at.

-- (array) `status__not_in`

An array of content statuses where the return contents statuses must not be on the list.

-- (int) `parent`

The content parent id.

-- (int) `parent__in`

An array of content IDs where the parent of the return contents.

-- (int) `page`

The page number use as the start position in the query.

-- (int) `perPage`

The number of items of the return contents.

*Note:*
The query filters varies depending on the define fields of content type type. You may use the preset query filters of the default types.

##### Content type of type `content`

-- (int) `author`

The content author

-- (array) `author__in`

An array of author IDs where the return results are base at.

-- (array) `within`

An array of content IDs where the return results are base at.

-- (array) `not__within`

An array of content IDs where the result results id is not among the list.

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

Returns an array of contents.

#### Usage:
~~~~
let contents = await getContents({type: 'blogs'});

// Print contents length
console.log(contents.length);
~~~~