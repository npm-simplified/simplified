# Database Queries

Simplified supports the use of *MySQL* and *MongoDB* databases. Simple query methods are in place for a quick and smooth query execution irregardless of which database type your using.

If your application requires a complex queries that none of the simplified methods is able to handle, a raw query, which allows you to issue a statement per database type, is also in place to cater that needs. 

async: createDbTable(string: *tableName*, object: *tableColumns*, string: *charset* )
-
Creates new table into the database.

#### Parameters:
-- (string) `tableName`

Required. The name of the table to create to.

-- (object) `tableColumns`

Required. A tangible object where the property name is the name of the column and the property value
is another object which defines how a column is structured.

###### Column Definitions
-- type: `string|int|bigint|boolean|object|array|enum|date|timestamp`

Specify the column type.

-- length: `int`

Optional. Use only when setting the column type's length. Usually use in string or integer type.

-- required: `boolean`

Optional. Specify if the column value is required.

-- primary: `boolean`

Optional. Specify that the column primary column which uniquely identifies each row in a table.

-- index: `boolean`

Optional. Specify whether column must be indexed.

-- enum: `array`

An array of enumerated values for column type enum.

-- autoIncrement: `boolean`

Optional. Use in integers types of column which generates the value incremented by one for every new insertion.

-- unique: `boolean`

-- default: `int|string`

Optional. Specify the default value to set for the column.

#### @returns:
Returns true on success or error on failure.

#### Usage:
~~~~
let columns = {
    name: {
        type: 'string',
        length: 120,
        required: true,
        index: true,
        primary: true
    },
    age: {
        type: 'int',
        length: 2,
        required: true
    },
    weight: {
        type: 'int'
    }
};

// ES7 async/await
let done = await createDbTable( 'puppies', columns );

if ( isError(done) ) {
    // Print error message
    console.log(done.message);
}

// ES6 Promise
createDbTable( 'puppies', columns )
.then( results => {
    if ( isError(results) ) {
        // Print error message or something...
        console.log(results.message);
        
        return false;
    }
    
    console.log('New table successfully created.');
    
    return true;
})
~~~~

async: updateDbTable( string: *tableName*, object: *newColumns*, object: *updateColumns*, array: *dropColumns* )
-

Updates the table's column structure in the database.

#### Parameters:
-- (string) `tableName`

Required. The name of the table to update the structure at.

-- (object) `newColumns`

Optional. The new columns to add into the table.

-- (object) `updateColumns`

Optional. An object which redefines an existing table columns.

-- (array) `dropColumns`

Optional. An array of column names to remove from the table.

#### @returns:
Returns true on success or error on failure.

#### Usage:
~~~~
let newColumns = { marks: { type: 'str' } },
    updateColumns = false,
    deleteColumns= ['weight'];
    
// ES7 async/await
let update = await updateDbTable( 'puppies', newColumns, updateColumns, deleteColumns );

if ( isError(update) ) {
    // Print error message
    console.log(update.message);
}

// ES6 Promise
updateDbTable( 'puppies', newColumns, updateColumns, deleteColumns )
.then( results => {
    if ( isError(results) ) {
        // Print error message or something...
        console.log(results.message);
        return false;
    }
    
    console.log('Update successful!');
    
    return true;
});
~~~~

async: renameDbTable( string: *oldTableName*, string: *newTableName*)
-

Change table name in the database.

#### Parameters:
-- (string) `oldTableName`

Required. The name of the table to change to.


-- (string) `newTableName`

Required. The new table name.

#### @returns:
Returns true on success or error on failure.

#### Usage:
~~~~
// ES7 async/await
let done = await renameDbTable( 'products', 'produkto' );

if ( isError(done) ) {
    // Print error message
    console.log(error);
}

// ES6 Promise
renameDbTable( 'products', 'produkto' )
.then( results => {
    if ( isError(results) ) {
        // Print error message or something...
        console.log(results.message);
        
        return false;
    }
    
    console.log('Table name successfully changed.');
    return true;
} );
~~~~

async: dropDbTable(string: *tableName*)
-

Remove the table from the database.

#### Parameter:
-- (string) `tableName`

Required. The name of the table to remove at.

#### Usage:
~~~~
// ES7 async/await
let drop = await dropDbTable('puppies');

if ( isError(drop) ) {
    // Print error message
    console.log(drop.message);
}

// ES6 Promise
dropDbTable('puppies')
.then( results => {
    if ( isError(results) ) {
        // Print error message or something
        console.log(results.message);
        
        return false;
    }
    
    console.log('Table removed.');
    
    return true;
});
~~~~

async: dbQuery( string: *tableName*, mixed: *columnsToGet*, object: *whereClause*, mixed: *groupBy*, string: *orderBy*, string: *order*, int: *page*, int: *perPage* )
-

Get table rows from the database.

#### Parameters:
-- (string) `tableName`

Required. The name of the table to get the data at.

-- (string|array) `columnsToGet`

A column name or an array of column names to get to. Use asterisk(*) to get all columns.

-- (object) `whereClause`

An object specifying the conditions to satisfy in query for the return data.

###### Conditions
-- columnName: value

-- $not: `!= ?`

-- $gt: `> ?`

-- $gte: `>= ?`

-- $lt: `< ?`

-- $lte: `<= ?`

-- $in: `array`

-- $notin: `array`

-- $like: `string`

-- $notlike: `string`

-- $between: `[fromValue, toValue]`

###### Relational keys
-- $and: `object|array`

-- $or: `object|array`

-- (string|array) `groupBy`

A column name or an array of column names.

-- (string) `orderBy`

-- (string) `order`

-- (int) `page`

-- (int) `perPage`

#### Usage:
~~~~
// ES7 async/await
let puppies = await dbQuery( 'puppies', '*' );
if ( isError(puppies) ) {
    // Print error message
    console.log(puppies.error);
}

// ES6 Promise
dbQuery( 'puppies', '*' )
.then( results => {
    if ( isError(results) ) {
        // Print error message or something
        return false;
    }
    
    // Do something to the list of puppies
    console.log(results);
});
~~~~

async: dbGetRow( string: *tableName*, string: *columns*, object: *whereClause* )
-

Get the first table row that matches in the given conditions in the database.

#### Parameters:
-- (string) `tableName`

Required. The name of the table to execute the query to.

-- (string|array) `columns`

Required. The column name or array of column names to retrieve at.

-- (object) `whereClause`

Required. An object which specify the conditions to satisfy in the query.


async: dbGetValue( string: *tableName*, string: *columnName*, object: *whereClause*, any: *$defaultValue* )
-
Get the value of the given column from the database.

#### Parameters:
-- (string) `tableName`

Required. The name of the table to get the value at.

-- (string) `columnName`

Required. The table's column name.

-- (object) `whereClause)`

Required. An object which specify the conditions to satisfy in the query.

-- (any) `$defaultValue`

Optional. The value to return if no matched found.

#### @returns:
Returns column value on success or the specified default value on error.

#### Usage:
~~~~
// ES7 async/await
let age = await dbGetValue( 'puppies', 'age', {name: 'marimar'}, 1 );
// Print's 1 on error or the puppy's actual age on success
console.log(age);

// ES6 Promise
dbGetValue( 'puppies', 'age', {name: 'marimar'}, 1 )
.then( age => {
    // Print's 1 on error or the puppy's actual age on success
    console.log(age);
});
~~~~

async: dbInsert( string: *tableName*, object|array: *columns* )
-

Insert new data into the database.

#### Parameters:
-- (string) `tableName`

The name of the table to insert the data to.

-- (object|array) `columns`

An object or array of objects containing the column name/value pair to insert at.

#### @returns:
Returns inserted id(s) or boolean true on success or error on failure.

#### Usage:
~~~~
// Insert a single row
let inserted = await dbInsert( 'puppies', {name: 'marimar', age: 2} );
if ( isError(inserted) ) {
    // Print error message
    console.log(inserted.message);
}
~~~~

async: dbUpdate( string: *tableName*, object: *columnsToUpdate*, object: *whereClause* )
-

Update columns data in the database.

#### Parameters:
-- (string) `tableName`

Required. The name of the table to update the data at.

-- (object) `columnsToUpdate`

An object containing the column name/value pair to update.

-- (object) `whereClause`

An object specifying the conditions to apply the update into.


async: dbDelete( string: *tableName*, object: *whereClause*, int: *offset*, int: *limit* )
-

Remove data from the database table.

#### Parameters:
-- (string) `tableName`

The name of the table to remove the data at.

-- (object) `whereClause`

An object containing the conditions to delete the data to.

-- (int) `offset`

Optional. The position where to start deleting the data to.

-- (int) `limit`

Optional. The number of data to delete.

#### @returns:
Returns true on success or error on failure.

async: dbRawQuery( mixed: *query*, mixed: *options* )
-

A raw query, directly executed into the database.

#### Parameters:

-- (any) `query`

Required. A raw query statement. The statement varies depending on the type of database use. It maybe may be a simple SQL statement or mongodb query statement.

-- (any) `options`

Optional. A formatting structure or any additional options which supports the raw query statement.