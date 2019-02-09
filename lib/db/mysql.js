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

            return db.query( sql, format )
                .then( results => {
                    if ( ! results.length ) {
                        return false;
                    }

                    let result = results.shift();

                    result.columns = unserialize(result.columns);

                    return result;
                });
        },

        insert: function(tableName, columns) {
            let sql = 'INSERT INTO ?? SET ?',
                format = [table, {table: tableName, columns: serialize(columns)}];

            return db.query( sql, format );
        },

        update: function(tableName, columns) {
            let sql = 'UPDATE ?? SET ? WHERE `table` = ?',
                format = [table, {columns: serialize(columns)}, tableName];

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
    }

    configure() {
        return this.dbTable.create();
    }

    tableName(table) {
        return this.config.prefix + table;
    }

    connect() {
        let config = {
            host: this.config.dbHost || 'localhost',
            port: this.config.dbPort || 3306,
            user: this.config.dbUser,
            password: this.config.dbPass,
            database: this.config.dbName,
            connectionLimit: 50,
            dateStrings: true,
            timezone: 'UTC',
            supportBigNumbers: true
        };

        return new Promise( (res, rej) => {
            let conn = mysql.createConnection(config);

            conn.connect(err => {
                if ( err ) {
                    rej(err);
                }

                res(conn);
            });
        });
    }

    query( query, options ) {
        return this.connect()
            .then( conn => {
                return new Promise( (res, rej) => {
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

    columns(columns) {
        let arr = [],
            indexes = [];

        _.each( columns, (def, name) => {
            let _column = ['`' + name + '`'],
                length = def.length || 0;

            switch(def.type) {
                case 'int' && def.autoIncrement:
                    length = length || 20;

                    // Assume bigint if auto increment
                    _column.push(`BIGINT(${length})`);
                    break;

                case 'int' :
                    length = length || 1;
                    _column.push(`INT(${length})`);
                    break;

                case 'str' && length > 255 :
                case 'array' :
                case 'object' :
                    _column.push('LONGTEXT');
                    break;

                case 'str' :
                    _column.push(`VARCHAR(${length})`);
                    break;

                case 'date' :
                case 'timestamp' :
                    _column.push('TIMESTAMP');
                    break;

                case 'enum' :
                    let enums = '"' + def.enum.join('", "') + '"';
                    _column.push(`ENUM [${enums}]`);
                    break;

                case 'bool' :
                    _columns.push('SMALLINT(1) DEFAULT 0');
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
                _column.push(`DEFAULT ${def.default}`);
            }

            arr.push(_column.join(' '));

            if ( def.index ) {
                indexes.push(name);
            }
        });

        if ( indexes.length ) {
            arr.push('Index (`' + indexes.join('`,`') + '`)');
        }

        return arr;
    }

    getTableStructure(table) {
        return this.dbTable.get(table)
            .then( result => {
                if ( ! result ) {
                    return false;
                }

                return result.columns;
            });
    }

    createTable( tableName, columns, charset ) {
        let table = this.tableName(tableName);
        charset = charset || this.config.charset;

        let colArr = this.columns(columns);

        let sql = `CREATE TABLE IF NOT EXISTS ${table} (${colArr.join(', ')})engine=InnoDB charset=${charset}`;

        return this.query(sql)
            .then( () => {
                return this.dbTable.insert(tableName, columns).catch(_.noop);
            })
            .then( () => {
                return true;
            });
    }

    async updateTable( tableName, newColumns, updateColumns, deleteColumns ) {
        let table = this.tableName(tableName),
            columns = await this.getTableStructure(tableName);

        // Merge new columns
        columns = _.extend( columns, newColumns );
        newColumns = this.columns(newColumns);

        let sql = `ALTER TABLE ${table}`;

        if ( newColumns.length ) {
            sql += 'ADD ' + newColumns.join(', ADD');
        }

        // Update columns
        columns = _.extend( columns, updateColumns );

        if ( updateColumns.length ) {
            let toUpdate = this.columns(updateColumns),
                update = [],
                i = 0;

            _.each( updateColumns, (o, key) => {
                let col = toUpdate[i];

                update.push(`CHANGE COLUMN ${key} ${col}`);
            });

            sql += update.join(', ');
        }

        if ( deleteColumns ) {
            deleteColumns.map( col => {
                sql += `DROP COLUMN ${col}`;

                // Delete column
                delete columns[col];
            });
        }

        return this.query(sql)
            .then( ok => {
                return this.dbTable.update( tableName, columns ).catch(_.noop);
            });
    }

    dropTable(tableName) {
        let table = this.tableName(tableName);

        let sql = `DROP TABLE ${table}`;

        return this.query(sql)
            .then( ok => {
                this.dbTable.drop(tableName);

                return ok;
            });
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
                    if ( ( 'int' === def.type && ! def.autoIncrement ) ||
                        ( 'int' !== def.type && ! def.default && def.required ) ) {
                        return errorHandler( sprintf( __t('%s is required.'), column ) );
                    }

                    continue;
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

        return this.query( sql, format )
            .then( results => {
                return results.insertId || true;
            })
            .catch(errorHandler);
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

        return this.query( sql, format )
            .then( results => {
                return results.affectedRows > 0;
            })
            .catch(errorHandler);
    }

    delete( table, whereClause ) {
        let sql = `DELETE FROM ??`,
            format = [this.tableName(table)];

        let where = this.conditions(whereClause, format[0]);

        if ( where.where ) {
            sql += ' WHERE ' + where.where;
            format = format.concat(where.filters);
        }

        return this.query( sql, format )
            .then( results => {
                return results.affectedRows > 0;
            })
            .catch(errorHandler);
    }

    get( table, columns, whereClause, groupBy, orderBy, limit ) {
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

        if ( limit ) {
            sql += ` LIMIT ${limit}`;
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
            })
            .catch(errorHandler);
    }

    join( joinType, tables, whereClause, relation, groupBy, orderBy, order, limit ) {
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

        return this.query( sql, format )
            .catch(e => {
                console.log(e.sql);

                return errorHandler(e);
            });
    }

    rightJoin( tables, whereClause, relation, groupBy, orderBy, order, limit ) {
        return this.join( 'RIGHT JOIN', tables, whereClause, relation, groupBy, orderBy, order, limit );
    }

    leftJoin(tables, whereClause, relation, groupBy, orderBy, order, limit) {
        return this.join('LEFT JOIN', tables, whereClause, relation, groupBy, orderBy, order, limit );
    }
}

module.exports = config => {
    return new MySQLDB(config);
};