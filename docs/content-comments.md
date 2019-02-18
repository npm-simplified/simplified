async: insertComment( object: *commentData* )
-
Insert new comment into the database.

#### Parameters:

-- (string) `type`

Required. The content type's unique slug.

-- (int) `contentId`

Required. The content id where the comment is posted at.

-- (string) `comment`

Required. The posted comment message.

-- (string) `status`

Required. The comment's status. Available statuses are: *approved* | *pending* | *spam*. Default's *pending*.

-- (int) `authorId`

Optional. The id of the user whom posted the comment.

-- (string) `author`

The comment's author name. Required for non-logged-in user.

-- (string) `authorEmail`

The comment's author email address. Required for non-logged-in user.

-- (string) `authorUrl`

Optional. The comment's author url.

#### @returns:
Returns new comment id on success or error on failure.

#### Usage:
~~~~
let commentId = await insertComment({
    type: 'blogs',
    contentId: 1,
    comment: 'Nice article!',
    status: 'approved'
});

if ( isError(commentId) ) {
    // Print error message
    console.log(commentId.message);
}
~~~~

#### @hooks:
-- (event) `insertedComment`(int: *ID*, int: *contentId*, string: *type*)

Triggered whenever a new comment is inserted into the database.

###### Parameters:
-- (int) `ID`

The new comment id.

-- (int) `contentId`

The content id where the comment is posted.

-- (string) `type`

The content type's unique slug.

async: updateComment( object: *commentData* )
-

Update comment in the database.

#### Parameters:

-- (string) `type`

Required. The content type's unique slug.

-- (int) `contentId`

Required. The content id where the comment was posted.

-- (int) `ID`

Required. The comment id to update at.

-- (string) `status`

Optional. Use only when updating the comment's status.

-- (string) `comment`

Optional. Use only when updating the posted comment.

-- (int) `authorId`

Optional. Use only when changing the comment's author.

-- (string) `author`

Optional. Use only when changing the comment author's name.

-- (string) `authorEmail`

Optional. Use only when changing the comment author's email address.

-- (string) `authorUrl`

Optional. Use only when changing the comment author's url.

#### @returns:
Returns true on success or error on failure.

#### Usage:
~~~~
let update = await updateComment({
    type: 'blogs',
    contentId: 1,
    ID: 1,
    status: 'spam'
});

if ( isError(update) ) {
    // Print error message
    console.log(update.message);
}
~~~~

#### @hooks:
-- (event) `updatedComment`(int: *ID*, int: *contentId*, string: *type*)

Triggered whenever a comment is updated in the database.

###### Parameters:
-- (int) `ID`

The comment's id.

-- (int) `contentId`

The content id where the comment was posted.

-- (string) `type`

The content type's unique slug.

async: getComment( int: *commentId*, string: *type* )
-
Get comment data from the database.

#### Parameters:

-- (int) `commentId`

Required. The comment id to get at.

-- (string) `type`

Required. The content type's unique slug.

#### @returns:
Returns comment object on success or error on failure.

#### Usage:
~~~~
let comment = await getComment( 'blogs', 1 );

if ( isError(comment) ) {
    // Print error message
    console.log(comment.message);
}
~~~~

#### @hooks:
-- (filter) `getComment`(object: *commentData*, string: *type* )

Called whenever a comment is retrieve from the database.

###### Parameters:
-- (object) `commentData`

The comment data object.

-- (string) `type`

The content type's unique slug.

async: dropComment( int: *commentId*, string: *type* )
-
Remove comment from the database.

### Parameters:

-- (int) `commentId`

Required. The id of the comment to remove to.

-- (string) `type`

Required. The content type's unique slug.

#### Usage:
~~~~
let deleted = await dropComment( 'blogs', 1 );

if ( isError(deleted) ) {
    // Print error message
    console.log(deleted.message);
}
~~~~

#### @hooks:
-- (event) `deletedComment`(object: *commentData*, string: *type*)

Triggered whenever a comment is deleted from the database.

###### Parameters:
-- (object) `commentData`

The deleted comment data object.

-- (string) `type`

The content type's unique slug.

async: commentsQuery( object: *queryFilter* )
-
Get comments from the database.

#### Parameter: *queryFilter*

-- (string) `type`

Required. The content type's unique slug.

-- (int) `contentId`

Required. The content id where the comments are posted at.

-- (string) `status`

Optional. The comment status.

-- (array) `status__in`

Optional. An array of statuses that a comment must have.

-- (array) `status__not_in`

Optional. An array of statuses where the return results status is not among the list.

-- (int|string) author

Optional. The comment's author id or name.

-- (int) `page`

Optional. The page number use as the start position of the return results.

-- (int) `perPage`

Optional. The number of comments to get to.

#### @returns
Returns an object containing the total number of comments found and an array of comments.

#### Usage:
~~~~
let query = await commentsQuery( {type: 'blogs', contentId: 1} );

// Sample return results
{foundItems: 50, comments: [....]}
~~~~

#### @hooks:
-- (filter) `getComment`(object: *commentData*, string: *type*)

Filters all the found comments in the query.

async: getComments( string: type, int: contentId )
-

Get the list of content comments.

#### Parameters:
*Refer to `commentsQuery`* parameters.

#### @returns:
Returns an array of comments.

#### Usage:
~~~~
let comments = await getComments({ type: 'blogs', contentId: 1 } );

// Print total comments
console.log(comments.length);
~~~~