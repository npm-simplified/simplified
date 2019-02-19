'use strict';

const _ = require('underscore'),
    MySQL = require('./db/mysql');

const selectDatabase = function(config) {
    let {database} = config;

    if ( 'mysql' === database.type ) {
        global.dbManager = MySQL(database);
    }

    //dbManager.install = installApp.bind(config);
};

const isdbConfigured = function() {
    return 'undefined' !== typeof dbManager && dbManager.config;
};

/**
 * Get the current use database type.
 *
 * @returns {string|null}
 */
const getDbType = function() {
    if ( ! isdbConfigured() ) {
        return null;
    }

    return dbManager.config.type;
};
setGlobalVar( 'getDbType', getDbType );

/**
 * Creates new table into the database.
 *
 * @param {string} tableName
 * @param {object} columns
 * @returns {Promise<boolean|error>}
 */
const createDbTable = function( tableName, columns ) {
    if ( ! isdbConfigured() ) {
        return reject( __t('No database configured.') );
    }

    let errors = [];

    if ( ! tableName ) {
        errors.push( __t('Table name is required.') );
    }

    if ( ! columns ) {
        error.push( __t('Table columns is required.') );
    }

    if ( errors.length ) {
        return reject(errors);
    }

    return dbManager.createTable.apply( dbManager, arguments );
};
setGlobalVar( 'createDbTable', createDbTable );

/**
 * Update table structure in the database.
 *
 * @param {string} tableName
 * @param {object} newColumns
 * @param {object} updateColumns
 * @param {array} dropColumns
 * @returns {Promise<boolean|error>}
 */
const updateDbTable = function( tableName, newColumns, updateColumns, dropColumns ) {
    if ( ! isdbConfigured() ) {
        return reject( __t('No database configured.') );
    }

    let errors = [],
        found = false;

    if ( ! tableName ) {
        errors.push( __t('Table name is required.') );
    }

    if ( newColumns || updateColumns || dropColumns ) {
        found = true;
    }

    if ( ! found ) {
        error.push( __t('Specify the column to insert, update, or delete.') );
    }

    if ( errors.length ) {
        return reject(errors);
    }

    return dbManager.updateTable.apply( dbManager, arguments );
};
setGlobalVar( 'updateDbTable', updateDbTable );

/**
 * Rename table name in the database.
 *
 * @param {string} tableName
 * @param {string} newTableName
 * @returns {Promise<boolean|error>}
 */
const renameDbTable = function( tableName, newTableName ) {
    if ( ! isdbConfigured() ) {
        return reject( __t('No database configured.') );
    }

    let errors = [];

    if ( ! tableName ) {
        errors.push( __t('Table name is required.') );
    }

    if ( ! newTableName ) {
        errors.push( __t('New table name is required.') );
    }

    if ( errors.length ) {
        return reject(errors);
    }

    return dbManager.renameTable.apply( dbManager, arguments );
};
setGlobalVar( 'renameDbTable', renameDbTable );

/**
 * Remove table from the database.
 *
 * @param {string} tableName
 * @returns {Promise<boolean|error>}
 */
const dropDbTable = function(tableName) {
    if ( ! isdbConfigured() ) {
        return reject( __t('No database configured.') );
    }

    if ( ! tableName ) {
        return reject( __t('No table name.') );
    }

    return dbManager.dropTable.apply( dbManager, arguments );
};
setGlobalVar( 'dropDbTable', dropDbTable );

/**
 * Insert new table row into the database.
 *
 * @param {string} tableName
 * @param {object|array} columns
 * @returns {Promise<boolean|error>}
 */
const dbInsert = function( tableName, columns ) {
    if ( ! isdbConfigured() ) {
        return reject( __t('Database is not configured.') );
    }

    let errors = [];

    if ( ! tableName ) {
        errors.push( _t('Table name is required.') );
    }

    if ( ! columns ) {
        errors.push( __t('No columns to update.') );
    }

    if ( errors.length ) {
        return reject(errors);
    }

    return dbManager.insert.apply( dbManager, arguments );
};
setGlobalVar( 'dbInsert', dbInsert );

/**
 * Update table row in the database.
 *
 * @param {string} tableName
 * @param {object} columns
 * @param {object} whereClause
 * @returns {Promise<boolean|error>}
 */
const dbUpdate = function( tableName, columns, whereClause ) {
    if ( ! isdbConfigured() ) {
        return reject( __t('Database is not configured.') );
    }

    let errors = [];
    if ( ! tableName ) {
        errors.push( __t('Table name is required.') );
    }

    if ( ! columns ) {
        errors.push( __t('No columns to update.') );
    }

    if ( ! whereClause ) {
        errors.push( __t('No specified conditions.') );
    }

    if ( errors.length ) {
        return reject(errors);
    }

    return dbManager.update.apply( dbManager, arguments );
};
setGlobalVar( 'dbUpdate', dbUpdate );

/**
 * Get table rows from the database.
 *
 * @param {string} tableName
 * @param {string|array} columns
 * @param {object} whereClause
 * @param {string|array} groupBy
 * @param {string} orderBy
 * @param {string} order
 * @param {int} page
 * @param {int} perPage
 *
 * @returns {Promise<array|error>}
 */
const dbQuery = function( tableName, columns ) {
    if ( ! isdbConfigured() ) {
        return reject( __t('Database is not configured.') );
    }

    let errors = [];
    if ( ! tableName ) {
        errors.push( __t('Table name is required.') );
    }

    if ( ! columns ) {
        errors.push( __t('No columns to update.') );
    }

    if ( errors.length ) {
        return reject(errors);
    }

    return dbManager.get.apply( dbManager, arguments );
};
setGlobalVar( 'dbQuery', dbQuery );

/**
 * Get first table row that matches the given conditions in the database.
 *
 * @param {string} tableName
 * @param {string|array} columns
 * @param {object} whereClause
 *
 * @returns {Promise<any|error>}
 */
const dbGetRow = function( tableName, columns, whereClause ) {
    let handleResponse = results => {
        if ( isError(results) || ! results.length ) {
            return reject( __t('No row found.') );
        }

        return results.shift();
    };

    return dbQuery( tableName, columns, whereClause ).then(handleResponse);
};
setGlobalVar( 'dbGetRow', dbGetRow );

/**
 * Get the value of the given column name from the database.
 *
 * @param {string} tableName
 * @param {string} column
 * @param {object} whereClause
 * @param {any} $defaultValue
 *
 * @returns {Promise<any|error>}
 */
const dbGetValue = function( tableName, column, whereClause ) {
    let $defaultValue = arguments[3] || undefined;

    let handleResponse = row => {
        if ( isError(row) ) {
            return $defaultValue;
        }

        return row[column] || $defaultValue;
    };

    return dbGetRow( tableName, column, whereClause ).then(handleResponse);
};
setGlobalVar( 'dbGetValue', dbGetValue );

/**
 * Delete table row(s) from the database.
 *
 * @param {string} tableName
 * @param {object} whereClause
 * @param {int} offset
 * @param {int} limit
 *
 * @returns {Promise<boolean|error>}
 */
const dbDelete = function( tableName ) {
    if ( ! isdbConfigured() ) {
        return reject( __t('Database is not configured.') );
    }

    if ( ! tableName ) {
        return reject(__t('Table name is required.') );
    }

    return dbManager.delete.apply( dbManager, arguments );
};
setGlobalVar( 'dbDelete', dbDelete );

/**
 * Executes query from the database to two or more tables with `left join` clause.
 *
 * @param {object} tables
 * @param {object} whereClause
 * @param {object} relation
 * @returns {Promise<any|error>}
 */
const dbLeftJoin = function( tables, whereClause, relation ) {
    if ( ! isdbConfigured() ) {
        return reject( __t('Database is not configured.') );
    }

    let errors = [];
    if ( ! tables ) {
        errors.push( __t('Table names is required.') );
    }

    if ( ! whereClause ) {
        errors.push( __t('No conditions specified.') );
    }

    if ( ! relation ) {
        errors.push( __t('Specify the relationship between tables.') );
    }

    if ( errors.length ) {
        return reject(errors);
    }

    return dbManager.leftJoin.apply( dbManager, arguments );
};
setGlobalVar( 'dbLeftJoin', dbLeftJoin );

/**
 * Executes query from the database to two or more tables with `right join` clause.
 *
 * @param {object} tables
 * @param {object} whereClause
 * @param {object} relation
 * @returns {Promise<any|error>}
 */
const dbRightJoin = function( tables, whereClause, relation ) {
    if ( ! isdbConfigured() ) {
        return reject( __t('Database is not configured.') );
    }

    let errors = [];
    if ( ! tables ) {
        errors.push( __t('Table names is required.') );
    }

    if ( ! whereClause ) {
        errors.push( __t('No conditions specified.') );
    }

    if ( ! relation ) {
        errors.push( __t('Specify the relationship between tables.') );
    }

    if ( errors.length ) {
        return reject(errors);
    }

    return dbManager.rightJoin.apply( dbManager, arguments );
};
setGlobalVar( 'dbRightJoin', dbRightJoin );

/**
 * Executes a raw query into the database.
 *
 * @param {any} queryStatement
 * @param {any} options
 *
 * @returns {Promise<*>}
 */
const dbRawQuery = function( queryStatement ) {
    if ( ! isdbConfigured() ) {
        return reject( __t('Database is not configured.') );
    }

    if ( ! queryStatement ) {
        return reject( __t('No query statement specified.') );
    }

    return dbManager.query.apply( dbManager, arguments );
};
setGlobalVar( 'dbRawQuery', dbRawQuery );

/**
 * Install database tables.
 *
 * @returns {Promise<*>}
 */
const installTables = async function() {
    if ( ! isdbConfigured() ) {
        return reject( __t('Database is not configured.') );
    }

    let checkConnection = await dbManager.checkConnection().catch(errorHandler);

    if ( isError(checkConnection) ) {
        return checkConnection;
    }

    // Begin table installation
    // Create table of tables
    let done = await dbManager.dbTable.create().catch(errorHandler);
    if ( isError(done) ) {
        return done;
    }

    // Create property table
    done = await dbManager.createTable( 'properties', {
        name: {
            type: 'str',
            length: 200,
            required: true,
            primary: true
        },
        value: {
            type: 'object'
        }
    });

    if ( isError(done) ) {
        return done;
    }

    // Create routes table
    done = await dbManager.createTable( 'routes', {
        route: {
            type: 'str',
            length: 255,
            primary: true
        },
        args: {
            type: 'object'
        }
    });

    if ( isError(done) ) {
        return done;
    }

    // Create `users table`
    done = await dbManager.createTable( 'users', {
        ID: {
            type: 'int',
            length: 20,
            autoIncrement: true,
            primary: true,
            required: true,
            index: true
        },
        display: {
            type: 'str',
            length: 60,
            required: true
        },
        email: {
            type: 'str',
            length: 100,
            required: true,
            index: true
        },
        pass: {
            type: 'str',
            length: 255,
            required: true
        },
        group: {
            type: 'str',
            length: 60,
            required: true
        },
        registered: {
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
        }
    });

    if ( isError(done) ) {
        return done;
    }

    // Create content type's table
    done = dbManager.createTable( 'content_types', {
        name: {
            type: 'str',
            length: 60,
            required: true,
            index: true
        },
        slug: {
            type: 'str',
            length: 100,
            required: true,
            unique: true
        },
        type: {
            type: 'enum',
            enum: ['content', 'group'],
            default: 'content'
        },
        status: {
            type: 'enum',
            enum: ['active', 'inactive', 'builtin'],
            default: 'active'
        },
        hierarchical: {
            type: 'bool'
        },
        archive: {
            type: 'bool',
        },
        page: {
            type: 'bool',
        },
        comments: {
            type: 'bool'
        },
        rest: {
            type: 'bool'
        },
        archiveTitle: {
            type: 'str',
            length: 160
        },
        archiveDescription: {
            type: 'str',
            length: 255
        },
        archiveSlug: {
            type: 'str',
            length: 60,
            required: true
        },
        itemsPerPage: {
            type: 'int',
            length: 2,
            default: 50
        },
        fields: {
            type: 'object'
        },
        parents: {
            type: 'array'
        }
    });

    if ( isError(done) ) {
        return done;
    }

    if ( ! this.onInstall ) {
        return true;
    }

    done = this.onInstall.call( this );

    return done;
};
setGlobalVar( 'installTables', installTables );

module.exports = selectDatabase;