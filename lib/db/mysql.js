'use strict';

const mysql = require('mysql'),
    _ = require('underscore');

const dbTable = function(prefix, db) {
    let table = prefix + '_table_structure',
        cache = appCache(table);

    return {
        create: function() {
            let sql = 'CREATE TABLE IF NOT EXISTS ?? (' +
                '`table` VARCHAR(100) NOT NULL PRIMARY KEY UNIQUE,' +
                '`columns` LONGTEXT' +
            ')';

            return db.query(sql, [table]);
        },

        get: tableName => {
            let old = cache.get(tableName);

            if ( old ) {
                return resolve(old);
            }

            let sql = 'SELECT * FROM ?? WHERE `table` = ?',
                format = [table, tableName];

            let handleResponse = results => {
                if ( ! results.length ) {
                    return errorHandler(__t('Table does not exist.'));
                }

                let result = results.shift();

                result.columns = unserialize(result.columns);

                return result.columns;
            };

            return db.query( sql, format ).then(handleResponse);
        },

        insert: function(tableName, columns) {
            let sql = 'INSERT INTO ?? SET ?',
                format = [table, {table: tableName, columns: serialize(columns)}];

            return db.query( sql, format );
        },

        update: function(tableName, columns, oldTableName) {
            let sql = 'UPDATE ?? SET ? WHERE `table` = ?',
                format = [table, {table: tableName, columns: serialize(columns)}, oldTableName || tableName];

            cache.clear(tableName);

            return db.query( sql, format );
        },

        drop: function(tableName) {
            let sql = 'DELETE FROM ?? WHERE `table` = ?',
                format = [table, tableName];

            cache.clear(tableName);

            return db.query( sql, format );
        }
    }
};

class MySQLDB {
    constructor(config) {
        this.config = _.extend( {charset: 'DEFAULT'}, config );
        this.dbTable = dbTable( this.config.prefix, this );

        this.usersTable = 'users';
        this.userMetaTable = 'user_meta';
        this.userGroupTable = 'user_group';
        this.contentTypeTable = 'content_type';
    }

    configure() {
        return this.dbTable.create();
    }

    tableName(table) {
        return this.config.prefix + table;
    }

    connect() {
        let config = {
            host: this.config.host || 'localhost',
            port: this.config.port || 3306,
            user: this.config.user,
            password: this.config.pass,
            database: this.config.name,
            connectionLimit: 50,
            dateStrings: true,
            timezone: 'UTC',
            supportBigNumbers: true
        };

        return new Promise( ( res, rej ) => {
            let conn = mysql.createConnection(config);

            conn.connect(err => {
                if ( err ) {
                    rej(err);
                }

                res(conn);
            });
        });
    }

    checkConnection() {
        return this.connect()
            .then( conn => {
                conn.end();

                return true;
            });
    }

    query( query, options ) {
        return this.connect()
            .then( conn => {
                return new Promise( ( res, rej ) => {
                    conn.query( query, options, (err, results) => {
                        conn.end();

                        if ( err ) {
                            rej(err);
                        }

                        res(results);
                    });
                });
            });
    }

    columns( columns, update ) {
        let arr = [],
            indexes = [];

        _.each( columns, (def, name) => {
            let _column = ['`' + name + '`'],
                length = def.length || 0;

            switch(def.type) {
                case 'int' && def.autoIncrement:
                case 'bigint' :
                    length = length || 20;

                    // Assume bigint if auto increment
                    _column.push(`BIGINT(${length})`);
                    break;

                case 'int' :
                    length = length || 1;
                    _column.push(`INT(${length})`);
                    break;

                case 'str' && length > 255 :
                case 'string' && length > 255 :
                case 'array' :
                case 'object' :
                    _column.push('LONGTEXT');
                    break;

                case 'str' :
                case 'string' :
                    _column.push(`VARCHAR(${length})`);
                    break;

                case 'date' :
                case 'timestamp' :
                    _column.push('TIMESTAMP');
                    break;

                case 'enum' :
                    let enums = '"' + def.enum.join('", "') + '"';
                    _column.push(`ENUM (${enums})`);
                    break;

                case 'bool' :
                    _column.push('SMALLINT(1) DEFAULT 0');
                    break;
            }

            if ( def.required ) {
                _column.push('NOT NULL');
            }

            if ( def.unique ) {
                _column.push(`UNIQUE`);
            }

            if ( def.primary ) {
                _column.push(`PRIMARY KEY`);
            }

            if ( def.autoIncrement ) {
                _column.push(`AUTO_INCREMENT`);
            }

            if ( def.default && ! _.contains(['CURRENT_TIMESTAMP'], def.default ) ) {
                _column.push(`DEFAULT "${def.default}"`);
            }

            arr.push(_column.join(' '));

            if ( def.index ) {
                indexes.push(name);
            }
        });

        if ( ! update && indexes.length ) {
            arr.push('Index (`' + indexes.join('`,`') + '`)');
        }

        return arr;
    }

    getTableStructure(table) {
        return this.dbTable.get(table);
    }

    createTable( tableName, columns, charset ) {
        let table = this.tableName(tableName);
        charset = charset || this.config.charset;

        let colArr = this.columns(columns);

        let sql = `CREATE TABLE IF NOT EXISTS ${table} (${colArr.join(', ')})engine=InnoDB charset=${charset}`;

        let handleResponse = results => {

            return this.dbTable.insert(tableName, columns).then(returnTrue);
        };

        return this.query(sql).then(handleResponse).catch(errorHandler);
    }

    async renameTable( tableName, newTableName ) {
        let table = this.tableName(tableName),
            newTable = this.tableName(newTableName),
            sql = 'ALTER TABLE ?? RENAME TO ??',
            format = [table, newTable],
            structure = await this.getTableStructure(tableName);

        let handleResponse = () => {
            return this.dbTable.update( newTableName, structure, tableName );
        };

        return this.query( sql, format ).then(handleResponse);
    }

    /**
     * Update table structure in the database.
     *
     * @param {string} tableName
     * @param {object} newColumns
     * @param {object} updateColumns
     * @param {array} deleteColumns
     * @returns {Promise<*>}
     */
    async updateTable( tableName, newColumns, updateColumns, deleteColumns ) {
        let table = this.tableName(tableName),
            origStructure = await this.getTableStructure(tableName);

        let structure = _.clone(origStructure);

        let sql = `ALTER TABLE ${table}`;

        if ( _.keys(newColumns).length > 0 ) {
            structure = _.extend( structure, newColumns );

            sql += ' ADD ' + this.columns( newColumns, true );
        }

        if ( _.keys(updateColumns).length > 0 ) {
            // Replace column definition
            //structure = _.extend( structure, updateColumns );
            let columns = this.columns( updateColumns, true ),
                update = [];

            _.keys(updateColumns).map( col => {
                let def = updateColumns[col];

                if ( structure[col] && ! _.isEqual( structure[col], def ) ) {
                    structure[col] = def;

                    let colDef = columns[col];

                    update.push(` CHANGE COLUMN \`${col}\` ${colDef}`);
                }
            });

            if ( update.length ) {
                sql += update.join(',');
            }
        }

        if ( deleteColumns.length > 0 ) {
            let drops = [];

            for( let i = 0; i < deleteColumns.length; i++ ) {
                let col = deleteColumns[i];

                if ( origStructure[col] ) {
                    let def = origStructure[col];

                    if ( def.index ) {
                        // Drop index first
                        let done = await dbManager.query('DROP INDEX ?? ON ??', [col, table] ).catch(errorHandler);

                        console.log(done);
                    }

                    drops.push(` DROP COLUMN \`${col}\``);

                    if ( structure[col] ) {
                        delete structure[col];
                    }
                }
            }

            if ( drops.length ) {
                sql += drops.join(',');
            }
        }

        let handleResponse = () => {
            return this.dbTable.update(tableName, structure);
        };

        return this.query(sql).then(handleResponse);
    }

    dropTable(tableName) {
        let table = this.tableName(tableName);

        let sql = `DROP TABLE ${table}`;

        let handleResponse = () => {
            return this.dbTable.drop(tableName);
        };

        return this.query(sql).then(handleResponse);
    }

    async validateTableColumns( table, columns, matchAll ) {
        let structure = await this.getTableStructure(table),
            keys = Object.keys(structure),
            colKeys = Object.keys(columns),
            newColumns = {};

        for ( let i = 0; i < keys.length; i++ ) {
            let column = keys[i],
                def = structure[column],
                dateType = false,
                value = columns[column];

            if ( matchAll ) {
                if ( _.contains(['date', 'timestamp'], def.type) && def.default ) {
                    dateType = true;
                    columns[column] = new Date(new Date().toUTCString());
                }

                if ( ! _.contains( colKeys, column ) && ! dateType) {
                    if ( ! def.default && def.required && ! def.autoIncrement ) {
                        return errorHandler( sprintf( __t('%s is required.'), column ) );
                    }

                    continue;

                    /**
                    if ( ( 'int' === def.type && ! def.autoIncrement && ! def.default ) ||
                        ( 'int' !== def.type && ! def.default && def.required ) ) {
                        return errorHandler( sprintf( __t('%s is required.'), column ) );
                    }

                    continue;
                     **/
                }
            }

            if ( ! columns[column] ) {
                continue;
            }

            if ( 'object' === def.type || 'array' === def.type ) {
                value = serialize(value);
            }

            if ( 'bool' === def.type ) {
                value = value ? 1 : 0;
            }

            newColumns[column] = value;
        }

        return newColumns;
    }

    async insert( table, columns ) {
        columns = await this.validateTableColumns( table, columns, true );

        if ( isError(columns) ) {
            return reject(columns.message);
        }

        return this.__insert( table, columns );
    }

    __insert( table, columns ) {
        let sql = `INSERT INTO ??`,
            format = [this.tableName(table)];

        if ( _.isArray(columns) ) {
            sql += ` VALUES (?)`;
            format.push(columns);

            return this.query(sql, format);
        }

        sql += ' SET ?';
        format.push(columns);

        let handleResponse = results => {
            return results.insertId || true;
        };

        return this.query( sql, format ).then(handleResponse);
    }

    conditions(clause, table) {
        let $where = [],
            $filters = [],
            coms = {
                $gt: '> ?',
                $gte: '>= ?',
                $lt: '< ?',
                $lte: '<= ?',
                $not: '!= ?',
                $in: 'IN (?)',
                $notin: 'NOT IN (?)',
                $like: 'LIKE ?',
                $notlike: 'NOT LIKE ?',
                $between: 'BETWEEN ? AND ?'
            };

        let mapCon = cond => {
            let where = [],
                filters = [];

            Object.keys(cond).map( key => {
                let value = cond[key],
                    com = false;

                if ( _.isObject(value) ) {
                    com = _.first(_.keys(value));
                    value = value[com];
                }

                com = coms[com] || '= ?';

                if ( table ) {
                    where.push(`\`${table}\`.\`${key}\` ${com}`);
                } else {
                    where.push(`\`${key}\` ${com}`);
                }

                filters.push(value);
            });

            if ( where.length ) {
                if ( where.length > 1 ) {
                    where = '(' + where.join(' AND ') + ')';
                } else {
                    where = where.join(' AND ');
                }
            }

            return {where: where, filters: filters};
        };

        let getWhere = function(cond) {
            let arr = [];

            if ( _.isArray(cond) ) {
                cond.map(mapCon).map( result => {
                    arr.push(result.where);
                    $filters = $filters.concat(result.filters);
                });
            } else if ( _.isObject(cond) ) {
                Object.keys(cond).map( con => {
                    let obj = {};
                    obj[con] = cond[con];

                    con = mapCon(obj);
                    arr.push(con.where);
                    $filters = $filters.concat(con.filters);
                });
            }

            return arr;
        };

        _.each( clause, (cond, o) => {
            let found = false;

            switch(o) {
                case '$and' :
                    found = true;

                    let $and = getWhere(cond);

                    if ( ! $and.length ) {
                        break;
                    }

                    $and = '(' + $and.join(' AND ') + ')';
                    $where.push($and);
                    break;

                case '$or' :
                    found = true;

                    let $or = getWhere(cond);

                    if ( ! $or.length ) {
                        break;
                    }

                    $or = '(' + $or.join(' OR ') + ')';
                    $where.push($or);

                    break;
            }

            if ( ! found ) {
                let obj = {};
                obj[o] = cond;

                let $o = mapCon(obj);

                $where.push($o.where);
                $filters = $filters.concat($o.filters);
            }
        });

        $where = $where.join(' AND ');

        return {where: $where, filters: $filters};
    }

    async update( table, columns, whereClause ) {
        columns = await this.validateTableColumns( table, columns );

        if ( isError(columns) ) {
            return reject(columns.message);
        }

        return this.__update( table, columns, whereClause );
    }

    __update( table, columns, whereClause ) {
        let sql = `UPDATE ?? SET ?`,
            format = [this.tableName(table), columns];

        let where = this.conditions(whereClause, format[0]);

        if ( where.where ) {
            sql += ' WHERE ' + where.where;
            format = format.concat(where.filters);
        }

        return this.query( sql, format ).then(returnTrue);
    }

    delete( table, whereClause, offset, limit ) {
        let sql = `DELETE FROM ??`,
            format = [this.tableName(table)];

        let where = this.conditions(whereClause, format[0]);

        if ( where.where ) {
            sql += ' WHERE ' + where.where;
            format = format.concat(where.filters);
        }

        if ( limit > 0 ) {
            offset = offset || 0;

            sql += ` LIMIT ${offset}, ${limit}`;
        }

        return this.query( sql, format ).then(returnTrue);
    }

    get( table, columns, whereClause, groupBy, orderBy, order, page, perPage ) {
        let sql = 'SELECT ?? FROM ??',
            format = [columns, this.tableName(table)];

        if ( 'count' === columns ) {
            sql = 'SELECT COUNT(*) AS `count` FROM ??';
            format = [this.tableName(table)];
        }

        let where = this.conditions(whereClause, this.tableName(table));

        if ( where.where ) {
            sql += ' WHERE ' + where.where;
            format = format.concat(where.filters);
        }

        if ( groupBy ) {
            sql += ' GROUP BY ?';
            format.push(groupBy);
        }

        if ( orderBy ) {
            sql += ` ORDER BY ${orderBy}`;
        }

        page = page || 1;
        if ( perPage > 0 ) {
            let offset = (page * perPage) - perPage;

            sql += ` LIMIT ${offset}, ${perPage}`;
        }

        return this.query( sql, format )
            .then( async results => {
                if ( ! results.length ) {
                    return results;
                }

                if ( 'count' === columns ) {
                    return results.shift().count;
                }

                let structure = await this.getTableStructure(table);

                results.map( (result, i) => {
                    Object.keys(result).map( key => {
                        let def = structure[key];

                        if ( 'object' === def.type || 'array' === def.type ) {
                            result[key] = unserialize(result[key]);
                        }

                        if ( 'bool' === def.type ) {
                            result[key] = !! result[key];
                        }
                    });

                    results[i] = result;
                });

                return results;
            });
    }

    join( joinType, tables, whereClause, relation, groupBy, orderBy, order, page, perPage ) {
        let firstTable = '',
            join = [],
            where = [],
            query = [],
            format = [],
            sql = 'SELECT ?? FROM ',
            a = false;

        Object.keys(tables).map( tableName => {
            let columns = tables[tableName],
                table = this.tableName(tableName);

            if ( 'string' === typeof columns ) {
                query.push(`${table}.${columns}`);

            } else if ( _.isArray(columns) ) {
                columns.map( col => {
                    query.push(`${table}.${col}`);
                });
            }

            let compare = relation[tableName],
                statement = `\`${table}\`.\`${compare}\``;
            if ( ! firstTable ) {
                firstTable = table;
                join.push(table);
                a = statement;
            } else {
                let b = `${joinType} ${table} ON ${a} = ${statement}`;
                join.push(b);
                a = statement;
            }
        });

        format.push(query);
        sql += join.join(' ');

        Object.keys(whereClause).map( tableName => {
            let columns = whereClause[tableName];

            if ( true === columns ) {
                return;
            }

            let _where = this.conditions( columns, this.tableName(tableName) );

            if ( _where.where ) {
                where.push(_where.where);
                format = format.concat(_where.filters);
            }
        });

        if ( where.length ) {
            sql += ' WHERE ' + where.join(' AND ');
        }

        if ( orderBy ) {
            order = order || 'ASC';
            orderBy = `\`${firstTable}\`.\`${orderBy}\` ${order}`;

            sql += ` ORDER BY ${orderBy}`;
        }

        if ( groupBy ) {
            let groups = [];

            Object.keys(groupBy).map( tableName => {
                let table = this.tableName(table),
                    col = groupBy[tableName];

                groups.push(`\`${table}\`.\`${col}\``);
            });

            sql += ` GROUP BY ${groups.join(',')}`;
        }

        page = page || 1;
        if ( perPage > 0 ) {
            let offset = (page * perPage) - perPage;

            sql += ` LIMIT ${offset}, ${perPage}`;
        }

        return this.query( sql, format );
    }

    rightJoin( tables, whereClause, relation, groupBy, orderBy, order, page, perPage ) {
        return this.join( 'RIGHT JOIN', tables, whereClause, relation, groupBy, orderBy, order, page, perPage );
    }

    leftJoin(tables, whereClause, relation, groupBy, orderBy, order, page, perPage ) {
        return this.join('LEFT JOIN', tables, whereClause, relation, groupBy, orderBy, order, page, perPage );
    }
}

module.exports = config => {
    return new MySQLDB(config);
};