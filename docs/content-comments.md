async: insertComment( object: commentData )
-
Insert new comment into the database.

#### Parameters:

-- (string) `type`

Required. The content type slug.

-- (int) `contentId`

Required. The content id where the comment is posted at.

-- (string) `comment`

Required. The posted comment message.

-- (string) `status`

Required. The status of the posted comment. Statuses options are: *approved* | *pending* | *spam*

-- (int) `authorId`

Optional. The id of the user whom posted the comment.

*If a user is currently logged in, the current user id will automatically use.*

-- (string) `author`

Required for non-logged-in user. The name of commentator.

-- (string) `authorEmail`

Required for non-logged-in user. The commentator's email address.

-- (string) `authorUrl`

Optional. The commentator's website link.

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

async: updateComment( object: commentData )
-

Update an existing data in the database.

#### Parameters:

-- (string) `type`

Required. The content type slug.

-- (int) `contentId`

Required. The content id where the comment posted.

-- (int) `ID`

Required. The id of the comment to update to.

-- (string) `status`

Optional. Use only when updating the comment's status.

-- (string) `comment`

Optional. Use only when updating the posted comment.

-- (int) `authorId`

Optional. Use only when updating the comment author id.

-- (string) `author`

Optional. Use only when updating the comment's author name.

-- (string) `authorEmail`

Optional. Use only when updating the comment's author email address.

-- (string) `authorUrl`

Optional. Use only when updating the comment's author link.

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

async: getComment( string: type, int: commentId )
-
Get the comment data from the database.

#### Parameters:

-- (string) `type`

Required. The content type slug.

-- (int) `commentId`

Required. The id of the comment to retrieve to.

#### @returns:
Returns comment object on success or error onn failure.

#### Usage:
~~~~
let comment = await getComment( 'blogs', 1 );

if ( isError(comment) ) {
    // Print error message
    console.log(comment.message);
}
~~~~

async: dropComment( string: type, int: commentId )
-
Remove comment from the database.

### Parameters:

-- (string) `type`

Required. The content type slug.

-- (int) `commentId`

Required. The id of the comment to remove to.

#### Usage:
~~~~
let deleted = await dropComment( 'blogs', 1 );

if ( isError(deleted) ) {
    // Print error message
    console.log(deleted.message);
}
~~~~

async: commentsQuery( object: queryFilter )
-
Retrieve comments from the database.

#### Parameters: *queryFilter*

-- (string) `type`

Required. The content type slug.

-- (int) `contentId`

Required. The content id where the comments are posted at.

-- (string) `status`

Optional. The status of the comments to retrieve at.

-- (array) `status__in`

Optional. An array of comment statuses to retrieve at.

-- (array) `status__not_in`

Optional. An array of comment statuses where the return results comment status is not among the list.

-- (int|string) author

Optional. The commentator's user id or the commentator name.

-- (int) `page`

Optional. The page number use as the start position of the return results.

-- (int) `perPage`

Optional. The number of items of the return results.

#### @returns
Returns an object containing the total number of comments found and an array of comments.

#### Usage:
~~~~
let query = await commentsQuery( {type: 'blogs', contentId: 1} );

// Sample return results
{foundItems: 50, comments: [....]}
~~~~

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