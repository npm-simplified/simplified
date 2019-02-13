# Functions & Definitions

async: getProperty( string: *name*, any: *$default* )
-
Get the property value from the database.

##### Parameters:

-- (string) `name`

The property name to get from the database.

-- (any) `$default`

The default value if a property does not exist.

##### @returns:
Returns property value on success or the default value on failure.

##### Usage:
~~~~
let appTitle = await getProperty( 'appTitle', 'An Awesome App' );

// Print result
console.log(appTitle); 
~~~~

async: setProperty( string: name, any: value, string: oldName )
-
Insert or update a property value into the database.

##### Parameters:

-- (string) `name`

The property name to insert or update into the database.

-- (any) `value`

The property value to insert or update into the database.

-- (string) `oldName`

Optional. Use only when changing the name of the property.

##### @returns:
Returns true on success or error on failure.

##### Usage:
~~~~
// Add new property
let add = await setProperty( 'appTitle', 'Awesome App' );

if ( isError(add) ) {
    // Print error message
    console.log(add.message);
}

// Update property name
let update = await setProperty( 'title', 'Awesome App', 'appTitle' );

if ( isError(update) ) {
    // Print error message
    console.log(update.message);
}
~~~~

async: dropProperty( string: name )
-
Remove a property from the database.

##### Parameter:

-- (string) `name`

Required. The property name to remove to.

##### @returns:
Returns true on success or error object on failure.

##### Usage:
~~~~
let drop = await dropProperty( 'title' );

if ( isError(drop) ) {
    // Print error message
    console.log(drop.message);
}
~~~~

---
## Routing

setAdminView( string: *route*, function: *getCallback*, function: *postCallback*, boolean: *requireLogin*, string: *permission* )
-

Sets or update an admin view route.

#### Parameters:

-- (string) `route`

The route path end point use to listen in the request.

-- (function) `callback`

A callable function which handles the **request** and **response** object.

Example: myPage( object: *request*, object: *response*)

-- (function) `postCallback`

Optional. Handles the reponse for a POST request.

-- (boolean) `requireLogin`

Optional. Set to true to force user to be login to view the page.

-- (string|array) `permission`

The type or types of permissions a user have granted to access the page.

#### @returns:
Returns true on success or false on failure.

async: setAdminPostResponse( string: *route*, function: *callback*, boolean: *requireLogin*, string: *permission* )
-

Create and handle an admin post request.

#### Parameters:

-- (string) `route`

Required. The route path use to listen to a post request.

-- (function) `callback`

Required. The callable function which is use to handle the *request* and *response* object.

-- (boolean) `requireLogin`

Optional. Set to true to require user to login to send the request.

-- (string|array) `permissions`

The type or types of permissions a user have granted to gain access.

##### @returns:
Returns true on success or false on failure.

async: setAdminGetResponse( string: route, function: callback, boolean: requireLogin, string: permission )
-

Sets an admin GET route response handler.

#### Parameters:

-- (string) `route`

Required. The route path use to listen the request.

-- (function) `callback`

Required. A callable function that is called to handle the *request* and *response* object.

-- (boolean) `requireLogin`

Optional. Set to true to force user to login.

-- (string|array) `permission`

The type or types of permissions a user have granted to gain access.


setRouteView( string: *route*, function: *callback*, boolean: *requireLogin*, string: *permission*, function: *postCallback* )
-

Sets a view route

setPostResponse( string: *route*, function: *callback*, boolean: *requireLogin*, string: *permission* )
-

setGetResponse( string: *route*, function: *callback*, boolean: *requireLogin* )
-

getRoutes(void)
-

---

async: insertRouteEndPoint( string: routePath, object: args )
-
Insert a route endpoint use as response handler.

#### Parameters:

-- (string) `routePath`

Required. The url endpoint of the route. Example: `/sample-page`

-- (object) `args`

Required. An object containing data that are use in handling the response.

#### @returns:
Returns true on success or error on failure.

#### Usage:
~~~~
let insert = await insertRouteEndPoint( '/my-funny-valentines', {
    type: 'content',
    typeSlug: 'blogs'
} );

if ( isError(insert) ) {
    // Print error message
    console.log(insert.message);
}
~~~~

async: updateRouteEndPoint( string: routePath, object: args, string: oldRoutePath )
-
Update the route path in the database.

#### Parameters:

-- (string) `routePath`

The route endpoint to update to.

-- (object) `args`

An object containing the data use in handling the response.

-- (string) `oldRoutePath`

Optional. Use only when changing the route path endpoint.

#### @returns:
Returns true on success or error on failure.

### Usage:
~~~~
let update = await updateRouteEndPoint( '/my-valentines', {value: 1}, '/my-funny-valentines');

if ( isError(update) ) {
    // Print error message
    console.log(update.message);
}
~~~~

async: getRouteEndPoint( string: routePath )
-
Get the arguments of the given route end point path.

#### Parameter:

-- (string) `routePath`

The route path endpoint.

#### @returns:

Returns an object arguments on success or error on failure.

#### Usage:
~~~~
let route = await getRouteEndPoint( '/my-valentines');

if ( isError(route) ) {
    // Print error message
    console.log(route.message);
}
~~~~

async: dropRouteEndPoint( string: routePath )
-
Remove the route path endpoint from the database.

#### Parameter:

-- (string) `routePath`

The route path endpoint.

#### Usage:
~~~~
let deleted = await dropRouteEndPoint( '/my-valentine');

if ( isError(deleted) ) {
    // Print error message
    console.log(deleted.message);
}
~~~~

----

appEvent( string: eventName )
-

Returns an event object methods.

#### Parameters:

-- (string) `eventName`

#### @returns type methods

#### set( function: callback, int: priority, object: args )

##### Parameters:

-- (function) `callback`

-- (int) `priority`

-- (object) `args`

##### @returns:
Returns true on success or false on failure.


### setOnce( function: *callback*, int: *priority*, object: *args* )

##### Parameters:

-- (function) `callback`

-- (int) `priority`

-- (object) `args`

##### @returns:
Returns true on success of false on failure.

### unset( string|function: callback )

Remove hook from the list.

##### Parameters:

-- (string|function) `callback`

Optional. If set, will only remove the specified callback. Otherwise will remove all hooked functions of the event name.

##### Parameter:

-- (string|function) `callback`

The name of callback function or the function itself.

### async: trigger([....])

Triggers all the set callable callback functions.

##### Parameter(s):

The parameter or parameters varies depending on the event name executed.

##### Usage:
~~~~
let customEVent = appEvent('showMe');

// Set a hook which only trigger once.
const callOnce = function() {
    console.log('call me once');
    return true;
}
customEvent.setOne( callOne );

// Set a hook that is called an event name is triggered.
const callMe = function() {
    console.log('Call me');
    
    return true;
}
customEvent.set( callMe );

// Trigger `showMe` event.
await customEvent.trigger();
~~~~

appFilter( string: filterName )
-

#### set( function: callback, int: priority, object: args )

Sets a callback filter that gets triggered whenever the filter name event is called.

##### Parameters:

-- (function) `callback`

The function to execute when the filter name event is called.

-- (int) `priority`

Optional. The order to which the function gets executed among the list. Default is 0.

-- (array|object) `args`

Optional. Additional arguments that is appended to the filter name event arguments during execution.

##### @returns:
Returns true on success or false on failure.

#### setOnce( function: callback, int: priority, object: args )

Sets a callback filter that is triggered only once whenever the filter name event is called.

##### Parameters:

-- (function) `callback`

The function to execute when the filter name event is called.

-- (int) `priority`

Optional. The order to which the callback is called among the list. Default is 0.

-- (array|object) `args`

Optional. Additional arguments that is appended to the filter event arguments during execution.

#### unset( string|function: callback )

Remove the callback function from the list.

#### apply( any: value, [....])

Calls all hooked callable functions sorted by priority and returns the filtered. value.
 
##### Usage:
~~~~
let customFilter = appFilter('changeName');

// Change the value into 'all' only once when the filter event is triggered.
const toAll = function(value) {
    return 'all';
}
customFilter.set( toAll );

// Call all hooked filters
let value = await customFilter.apply('me');

console.log(value); // print 'all'

// Add awesome to the value
const toAwesome = function(value) {
    return value + 'awesome';
}
value = await customFilter.apply('You are ');

console.log(value); // print 'You are awesome'
~~~~