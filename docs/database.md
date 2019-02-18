# Database Queries

Simplified supports the use of *MySQL* and *MongoDB* databases. Because of such, simplified methods are in place for quicker and smoother query manipulation.
If your application requires a more complex queries which none of the prepared methods can handle, we strongly recommend to use the raw `query` where the statement varies per database type.

Simplified Methods
---

async: createTable(string: *tableName*, object: *tableColumns*, string: *charset* )
-
Create new table in the database.

#### Parameters:
-- (string) `tableName`

The name of the table to create. Must not be prefix beforehand.

-- (object) `tableColumns`

An object composing the table's column structure.

// @todo: List column properties here

-- (string) `charset`

Optional. The table charset.

async: updateTable( string: *tableName*, object: *newColumns*, object: *updateColumns*, array: *dropColumns* )
-

Updates the table's column structure in the database.

#### Parameters:
-- (string) `tableName`

Required. The name of the table to update the structure at.

-- (object) `newColumns`

Optional. The new columns to add into the table's existing columns.

-- (object) `updateColumns`

Optional. An object which redefines an existing table columns.

-- (array) `dropColumns`

Optional. An array of column names to remove.

async: renameTable( string: *oldTableName*, string: *newTableName*)
-

Change the name of the in the database.

#### Parameters:
-- (string) `oldTableName`

Required. The name of the table to change to.


-- (string) `newTableName`

Required. The new table's name.


async: dropTable(string: *tableName*)
-

Remove the table from the database.

#### Parameter:
-- (string) `tableName`

Required. The name of the table to remove at.

async: getTableStructure(string: *tableName*)
-

Get the table's column structure.

#### Parameter:
-- (string) `tableName`

The name of the table to get the structure at.

async: insert( string: *tableName*, object: *columns* )
-

Insert new data into the database.

#### Parameters:
-- (string) `tableName`

The name of the table to insert the data to.

-- (object) `columns`

An object containing the column name and value to insert at.

async: update( string: *tableName*, object: *columnsToUpdate*, object: *whereClause* )
-

Update columns data in the database.

#### Parameters:
-- (string) `tableName`

Required. The name of the table to update the data at.

-- (object) `columnsToUpdate`

An object containing the column name and value to update to.

-- (object) `whereClause`

An object specifying the conditions to apply the update into.

async: get( string: *tableName*, mixed: *columnsToGet*, object: *whereClause*, mixed: *groupBy*, string: *orderBy*, string: *order*, int: *page*, int: *perPage* )
-

Get data from the database.

#### Parameters:
-- (string) `tableName`

Required. The name of the table to get the data at.

-- (string|array) `columnsToGet`

A column name or an array of column names to get to. Use asterisk(*) to get all columns.

-- (object) `whereClause`

An object specifying the conditions to match against the data.

-- (string|array) `groupBy`

A column name or an array of column names.

-- (string) `orderBy`

-- (string) `order`

-- (int) `page`

-- (int) `perPage`


async: delete( string: *tableName*, object: *whereClause*, int: *offset*, int: *limit* )
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

Raw Query:
---

async: query( mixed: *query*, mixed: *options* )
-

A raw query, directly executed into the database.

#### Parameters:

-- (any) `query`

Required. A raw query statement. The statement varies depending on the type of database use. It maybe may be a simple SQL statement or mongodb query statement.

-- (any) `options`

Optional. A formatting structure or any additional options which supports the raw query statement.

