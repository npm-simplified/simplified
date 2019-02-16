'use strict';

const _ = require('underscore');

/**
 * Generate object fields use to construct or update content type's content table structure.
 *
 * @access private
 *
 * @param {object} contentType
 * @param {null|object} fields
 * @returns {object}
 */
const getContentFields = function( contentType, fields ) {
    let {type, hierarchical, comments} = contentType;
    type = type || 'content';

    let columnFields = {
        ID: {
            type: 'bigint',
            length: 20,
            autoIncrement: true,
            primary: true,
            index: true
        }

    };

    if ( ! fields ) {
        // Set default fields
        fields = {
            slug: {
                type: 'str',
                length: 200,
                required: true,
                index: true
            },
            thumb: {
                type: 'int',
                length: 20
            }
        };

        if ( 'content' === type ) {
            fields = _.extend({
                title: {
                    type: 'str',
                    length: 200,
                    required: true,
                },
                status: {
                    type: 'enum',
                    enum: ['public', 'private', 'pending', 'draft'],
                    default: 'draft',
                    required: true
                },
                summary: {
                    type: 'str',
                    length: 255
                },
                description: {
                    type: 'str',
                    length: 1000
                },
                author: {
                    type: 'int',
                    length: 20,
                    index: true
                },
                created: {
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP'
                },
                updated: {
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP'
                }
            }, fields );
        } else {
            fields = _.extend({
                name: {
                    type: 'str',
                    length: 200,
                    required: true,
                    index: true
                },
                description: {
                    type: 'str',
                    length: 255
                }
            }, fields );
        }

        columnFields = _.extend( fields, columnFields );
    } else {
        //columnFields = _.extend( columnFields, fields );
    }

    if ( hierarchical ) {
        columnFields.parent = {
            type: 'int',
            length: 20
        };
    }

    if ( comments ) {
        columnFields.comments = {
            type: 'enum',
            enum: ['open', 'close', 'disabled'],
            default: 'open'
        };
    }

    return columnFields;
};

/**
 * Generate table structures to create or update for contents of content type.
 *
 * @access private
 *
 * @param {object} contentType
 */
const getTableFields = function( contentType ) {
    let {slug, comments, fields} = contentType,
        tableFields = {};

    tableFields[slug + '_content'] = getContentFields( contentType, fields );

    tableFields[slug + '_meta'] = {
        name: {
            type: 'str',
            length: 160,
            required: true,
            index: true
        },
        value: {
            type: 'object'
        },
        contentId: {
            type: 'bigint',
            required: true,
            index: true
        }
    };

    if ( ! comments ) {
        return tableFields;
    }

    tableFields[slug + '_comments'] = {
        ID: {
            type: 'bigint',
            required: true,
            primary: true,
            autoIncrement: true,
            index: true
        },
        parent: {
            type: 'bigint',
            default: 0
        },
        contentId: {
            type: 'bigint',
            required: true,
            index: true
        },
        comment: {
            type: 'str',
            length: 1000,
            required: true
        },
        status: {
            type: 'enum',
            enum: ['public', 'private', 'pending', 'spam'],
            default: 'pending'
        },
        authorId: {
            type: 'bigint',
        },
        author: {
            type: 'string'
        },
        authorEmail: {
            type: 'str',
            length: 160
        },
        authorUrl: {
            type: 'str',
            length: 160
        },
        date: {
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
        }
    };

    return tableFields;
};

/**
 * Create content tables for new content type.
 *
 * @access private
 *
 * @param {object} contentType
 * @returns {boolean|error}
 */
const createContentTable = async function( contentType ) {
    let tableFields = getTableFields(contentType),
        tables = Object.keys(tableFields);

    for ( let i = 0; i < tables.length; i++ ) {
        let table = tables[i];

        await dbManager.createTable( table, tableFields[table] );
    }

    return true;
};

/**
 * Update content's table structure.
 *
 * @param {object} contentType
 * @param {object} oldContentType
 * @returns {Promise<boolean>}
 */
const updateContentTable = async function( contentType, oldContentType ) {
    let newSlug = contentType.slug,
        newTables = getTableFields( contentType ),
        oldSlug = oldContentType.slug,
        oldTables = getTableFields( oldContentType );

    if ( newSlug !== oldSlug ) {
        let tableKeys = _.keys(oldTables);

        for ( let i = 0; i < tableKeys.length; i++ ) {
            let oldTable = tableKeys[i],
                structure = await dbManager.getTableStructure(oldTable);

            let baseTable = oldTable.replace( oldSlug + '_', '' ),
                newBase = newSlug + '_' + baseTable;

            if ( ! newTables[newBase] ) {
                // Drop the table
                await dbManager.dropTable( oldTable );

                return;
            }

            if ( ! isError(structure) ) {
                await dbManager.renameTable( oldTable, newBase );
            }
        }
    }

    let keys = _.keys(newTables);

    for ( let i = 0; i < keys.length; i++ ) {
        let tableName = keys[i],
            tableFields = newTables[tableName];

        // Check if table already exist
        let structure = await dbManager.getTableStructure(tableName),
            isCreate = isError(structure);

        if ( isCreate ) {
            await dbManager.createTable( tableName, tableFields );

            continue;
        }

        let insert = {},
            update = {},
            drops = [];

        _.each( structure, (def, col) => {
            if ( ! tableFields[col] ) {
                drops.push(col);

                return;
            }

            if ( ! _.isEqual(def, tableFields[col]) ) {
                update[col] = tableFields[col];
            }
        });

        _.each( tableFields, (def, col) => {
            if ( ! structure[col] ) {
                insert[col] = def;
            }
        });

        if ( _.keys(insert).length > 0 || _.keys(update).length > 0 || drops.length > 0 ) {
            await dbManager.updateTable( tableName, insert, update, drops );
        }
    }

    return true;
};

/**
 * Remove content tables.
 *
 * @access private
 * @param {object} contentType
 */
const dropContentTable = async function( contentType ) {
    let {slug} = contentType;

    let handleResponse = contents => {
        contents.map( async content => {
            await dropContent( slug, content.ID );
        });

        return true;
    };

    await getContents({type: slug}).then(handleResponse);

    let tables = getTableFields(contentType);

    Object.keys(tables).map( table => {
        dbManager.dropTable(table);
    });

    return true;
};

/**
 * Get content type from the database.
 *
 * @param {string} slug                                         Required. The content type's unique slug.
 *
 * @returns {Promise<object|error>}
 * Returns an object containing the content type's data on success or error on failure.
 */
const getContentType = async function(slug) {
    if ( ! slug ) {
        return reject( __t('Content unique slug is required.') );
    }

    let table = dbManager.contentTypeTable,
        contentCache = appCache('contentType'),
        cache = contentCache.get(slug);

    let handleResult = async contentType => {
        /**
         * Fired to filter the content type object before returning.
         *
         * @param {object} contentType
         */
        contentType = await appFilter('getContentType').apply(contentType);

        return contentType;
    };

    if ( cache ) {
        cache = await handleResult(cache);

        return resolve(cache);
    }

    let handleResponse = async contents => {
        if ( isError(contents) ) {
            return contents;
        }

        if ( ! contents.length ) {
            return errorHandler( __t('Content ype does not exist.') );
        }

        let contentType = contents.shift();

        // Cache content type before applying filters.
        contentCache.set( slug, contentType );

        contentType = await handleResult(contentType);

        return contentType;
    };

    return dbManager.get( table, '*', {slug: slug} ).then(handleResponse);
};
setGlobalVar( 'getContentType', getContentType );

/**
 * Add or update content type to the database.
 *
 * @access private
 * @returns {Promise<boolean|error>}
 */
const setContentType = async function( args, oldSlug ) {
    let {slug, name, archiveSlug, fields} = args;

    if ( ! slug ) {
        return reject( __t('lug is required.') );
    }

    let oldContentType = await getContentType(oldSlug || slug ),
        isEdit = ! isError(oldContentType);

    if ( ! isEdit ) {
        if ( ! name ) {
            return reject( __t('Content type name is required.') );
        }

        if ( ! archiveSlug ) {
            args.archiveSlug = slug;
        }
    }

    args.fields = getContentFields( args, fields );

    let table = dbManager.contentTypeTable;

    let handleResponse = async res => {
        if ( isError(res) ) {
            return res;
        }

        // Contents slug
        appCache('contentTypes').clear();

        let contentType = await getContentType(slug);

        if ( isEdit ) {
            // Clear cache
            appCache('contentType').clear(oldContentType.slug);

            await updateContentTable( contentType, oldContentType );

            /**
             * Triggered whenever the content type is updated in the database.
             *
             * @param {object} contentType
             * @param {object} oldContentType
             */
            await appEvent('updatedContentType').trigger( contentType, oldContentType );

            return true;
        }

        await createContentTable(args);

        /**
         * Triggered whenever a new content type is inserted into the database.
         *
         * @param {object} contentType
         */
        await appEvent('insertedContentType').trigger(args);

        return true;
    };

    if ( isEdit ) {
        return dbManager.update( table, args, {slug: oldContentType.slug} ).then(handleResponse);
    }

    return dbManager.insert( table, args ).then(handleResponse);
};

/**
 * Insert new content type into the database.
 *
 * @param {object} args {
 *     @param {string} name                                         Required. The content type name.
 *     @param {string} slug                                         Required. A unique slug use as the content type's identifier.
 *     @param {string} type                                         Required. The type of content to create at. Options are `content` | `group`. Default is `content`.
 *     @param {string} status                                       The content type status. Statuses selections are `active` | `inactive` | `builtin`.
 *     @param {boolean} hierarchical                                Set to true to allow hierarchy to the contents of content type.
 *     @param {boolean} archive                                     Set to true to enable public archive page, listing the contents of the content type.
 *     @param {boolean} page                                        Set to true to enable individual content view per page.
 *     @param {boolean} comments                                    Set to true to allow comments posted to the content of the content type. Comments can also be disabled per content.
 *     @param {boolean} rest                                        Set to true to let contents of the content type queryable via REST API.
 *     @param {string} archiveTitle                                 The content type archive title. Required if `archive` is set to true.
 *     @param {string} archiveDescription                           Optional. The content type's custom description.
 *     @param {string} archiveSlug                                  Required. The content type's unique archive slug. Use to construct the public archive route.
 *     @param {int} itemsPerPage                                    Required. The number of items to display per page.
 *     @param {array} parents                                       Optional. An array of content type's slug where the content type is a descendant at. Required if
 *                                                                  the content type is of type `group`.
 *     @param {object} fields                                       Optional. An object that defines the table structure of the contents of the content type.
 * }
 * @returns {Promise<boolean|error>}
 * Returns true on success or error on failure.
 */
const insertContentType = function( args ) {
    return setContentType( args );
};
setGlobalVar( 'insertContentType', insertContentType );

/**
 * Updates content type in the database.
 *
 * @param {object} contentType {
 *     @param {string} old                                          Required. The content type's unique slug.
 *     @param {string} name                                         Optional. Use only when updating the content type's name.
 *     @param {string} type                                         Optional. Use only when changing the content type's type.
 *     @param {string} status                                       Optional. Use only when changing the content type's status.
 *     @param {boolean} hierarchical                                Optional. Use only when setting or disabling content's hierarchy.
 *     @param {boolean} archive                                     Optional. Use only when setting or disabling content type's public archive.
 *     @param {boolean} page                                        Optional. Use only when setting or disabling content's individual page view.
 *     @param {boolean} comments                                    Optional. Use only when setting or disabling commenting on content type's content.
 *     @param {boolean} rest                                        Optional. Use only when including or excluding the content type's contents in REST queries.
 *     @param {array} parents                                       Optional. Use only when updating the list of parents of the content type.
 *     @param {object} fields                                       Optional. Use only when resetting the content's table structure of the content type.
 * }
 * @param {string} oldSlug                                          Optional. Use only when changing the content type's unique slug identifier.
 *
 * @returns {Promise<boolean|error>}
 * Returns true on success or error on failure.
 */
const updateContentType = function( contentType, oldSlug ) {
    return setContentType( contentType, oldSlug );
};
setGlobalVar( 'updateContentType', updateContentType );

/**
 * Remove content type from the database.
 *
 * @param {string} slug                                             Required. The content type's unique slug.
 *
 * @returns {Promise<boolean|error>}
 * Returns true on success or error on failure.
 */
const dropContentType = async function(slug) {
    if ( ! slug ) {
        return reject(__t('Content unique slug is required.'));
    }

    let contentType = await getContentType(slug);

    if ( isError(contentType) ) {
        return reject(__t('Content type does not exist.') );
    }

    let table = dbManager.contentTypeTable;

    let handleResponse = async ok => {
        if ( isError(ok) ) {
            return ok;
        }

        // Remove table and it's contents in silence
        dropContentTable(contentType);

        // Clear all contents cache
        appCache('contentTypes').clear();

        // Clear content object cache
        appCache('getContentType').clear(slug);

        /**
         * Triggered whenever a content type is removed from the database.
         *
         * @param {object} contentType          An object containing the content type's data before deletion.
         */
        await appEvent('deletedContentType').trigger(contentType);

        return ok;
    };

    return dbManager.delete( table, {slug: slug}).then(handleResponse);
};
setGlobalVar( 'dropContentType', dropContentType );

const getContentTypes = async function(queryFilter) {
    queryFilter = queryFilter || {};

    let {status__in, status__not_in} = queryFilter;

    if ( status__in ) {
        queryFilter.status = {$in: status__in};
        delete queryFilter.status__in;
    } else if ( status__not_in ) {
        queryFilter.status = {$notin: status__not_in};
        delete queryFilter.status__not_in;
    }

    let allCache = appCache('contentTypes'),
        key = allCache.genKey( queryFilter ),
        caches = allCache.get(key),
        typeCache = appCache('contentType'),
        table = dbManager.contentTypeTable;

    let typeFilter = appFilter('getContentType'),
        contents = [];

    if ( caches ) {
        for ( let i = 0; i < caches.length; i++ ) {
            contents[i] = await typeFilter.apply(caches[i]);
        }

        return resolve(contents);
    }

    let handleResponse = async results => {
        if ( isError(results) || ! results.length ) {
            return [];
        }

        allCache.set( key, results );

        for ( let i = 0; i < results.length; i++ ) {
            let contentType = results[i];

            typeCache.set( contentType.slug, contentType );

            contents[i] = await typeFilter.apply( contentType );
        }

        return contents;
    };

    return dbManager.get( table, '*', queryFilter ).then(handleResponse);
};
setGlobalVar( 'getContentTypes', getContentTypes );

/**
 * Returns content object base on the given parameters.
 *
 * @param {string} column               Required. Allowed column names are: ID, slug
 * @param {int|string} value            Required. The value of the given column name.
 * @param {string} type                 Required. The unique content type slug used during content type setting.
 *
 * @returns {Promise<object|error>}
 */
const getContentBy = async function( column, value, type ) {
    let errors = [];

    if ( ! column ) {
        errors.push( __t('Column name is required.') );
    } else if ( ! _.contain(['ID', 'slug'], column) ) {
        errors.push( __t('Invalid column name.') );
    }

    if ( ! value ) {
        errors.push( __t('Column value is required.') );
    }

    if ( ! type ) {
        errors.push( __t('Content type is required.') );
    }

    if ( errors.length ) {
        return reject(errors);
    }

    let contentType = await getContentType(type);
    if ( isError(contentType) ) {
        return reject(contentType);
    }

    /**
     * Filter content object before returning.
     *
     * @type apply
     *
     * @param {object} content
     * @param {object} contentType
     *
     * @return {object} content
     */
    let contentFilter = appFilter('getContent');

    let {slug} = contentType,
        table = slug + '_content',
        contentCache = appCache(table),
        cache = contentCache.get(value),
        filter = {};

    filter[column] = value;

    if ( cache ) {
        cache = await contentFilter.apply( cache, contentType );

        return resolve(cache);
    }

    let handleResponse = async contents => {
        if ( isError(contents) ) {
            return contents;
        }

        if ( ! contents.length ) {
            return errorHandler( __('Content does not exist.') );
        }

        let content = contents.shift();

        // Store content object to cache
        contentCache.set( content.ID, content );
        contentCache.set( content.slug, content );

        content = await contentFilter.apply( content, contentType );

        return content;
    };

    return dbManager.get( table, '*', filter ).then(handleResponse);
};
setGlobalVar( 'getContentBy', getContentBy );

/**
 * A convenient way to retrieve content data base on content id.
 *
 * @param {int} ID                      Required. The id of the content to get to.
 * @param {string} type                 Required. The unique content type slug used during content type setting.
 * @returns {Promise<Object|error>}
 */
const getContent = async function( ID, type ) {
    return getContentBy( 'ID', ID, type );
};
setGlobalVar( 'getContent', getContent );

/**
 * Set or update content data to the database.
 *
 * @param {object} contentData {
 *     @param {int} ID                  Required when content update. The id of the content to update to.
 *     @param {string} slug             Optional. If omitted, will generate slug base on preset field.
 *     ......                           Other data fields which varies depending on content type.
 * }
 * @returns {Promise<int|error>}
 */
const setContent = async function( contentData ) {
    let {ID, type} = contentData;

    if ( ! type ) {
        return reject( __t('Invalid content type.') );
    }

    let contentType = await getContentType(type);
    if ( isError(contentType) ) {
        return reject(contentType);
    }

    let isEdit = !! ID,
        oldContent = await getContent( ID, type ),
        table = contentType.slug + '_content',
        contentCache = appCache(table),
        contentsCache = appCache( table + 's' );

    let handleResponse = async id => {
        if ( isError(id) ) {
            return id;
        }

        // Clear contents cache
        contentsCache.clear();

        if ( isEdit ) {
            // Clear old content's cache
            contentCache.clear(ID);
            contentCache.clear(oldContent.slug);

            /**
             * Trigger every time a content is updated.
             *
             * @param {int} ID
             * @param {object} oldContent
             * @param {object} contentType
             */
            await appEvent( 'updatedContent', ID, oldContent, contentType );

            return ID;
        }

        /**
         * Trigger every time a new content is inserted to the database.
         *
         * @param {int} ID
         * @param {object} contentType
         */
        await appEvent( 'insertedContent', id, contentType );

        return id;
    };

    if ( isEdit ) {
        return dbManager.update( table, contentData, {ID: ID}).then(handleResponse);
    }

    return dbManager.insert( table, contentData ).then(handleResponse);
};
setGlobalVar( 'setContent', setContent );

/**
 * Remove content from the database.
 *
 * @param {string} type
 * @param {int} ID
 * @returns {Promise<boolean|error>}
 */
const dropContent = async function( type, ID ) {
    let errors = [];

    if ( ! ID || _.isNaN(ID) ) {
        errors.push( __t('Invalid content id.') );
    }

    if ( ! type ) {
        errors.push( __t('Invalid content type.') );
    }

    if ( errors.length ) {
        return reject(errors);
    }

    let contentType = await getContentType(type);
    if ( isError(contentType) ) {
        return reject(contentType);
    }

    let {slug} = contentType,
        table = slug + '_content';

    let content = await getContent( ID, type );

    if ( isError(content) ) {
        return reject(__t('Content does not exist.'));
    }

    let handleResponse = async ok => {
        if ( isError(ok) ) {
            return ok;
        }

        // Clear contents cache
        appCache( table + 's' ).clear();

        let contentCache = appCache(table);
        contentCache.clear(ID);
        contentCache.clear(content.slug);

        /**
         * Trigger every time a content is deleted from the database.
         *
         * @param {object} content
         * @param {object} contentType
         */
        await appEvent('deletedContent').trigger( content, contentType );

        return ok;
    };

    return dbManager.delete( table, {ID: ID} ).then(handleResponse);
};
setGlobalVar( 'dropContent', dropContent );

/**
 * Returns an object containing the total number of contents found and an array of contents.
 *
 * @param {object} query {
 *     @param {string} type                     Required. The unique content type slug used during content setting.
 *     @param {int} page
 *     @param {int} perPage
 *     @param {string} orderBy
 *     @param {string} order
 * }
 * @returns {Promise<object|error>}
 */
const contentQuery = async function( query ) {
    let {type} = query,
        results = {foundItems: 0, contents: []};

    if ( ! type ) {
        return resolve(results);
    }

    // Remove type
    delete query.type;

    let contentType = await getContentType(type);
    if ( isError(contentType) ) {
        return resolve(results);
    }

    let {slug} = contentType,
        table = slug + '_content',
        contentsCache = appCache( table + 's' ),
        key = contentsCache.genKey(query),
        metaTable = slug + '_meta',
        contents = [];

    let contentFilter = appFilter('getContent'),
        cache = contentsCache.get(key);

    if ( cache ) {
        for ( let i = 0; i < cache.contents.length; i++ ) {
            let content = cache.contents[i];

            content = await contentFilter.apply( content, contentType );
            contents[i] = content;
        }

        cache.contents = contents;

        return resolve(cache);
    }

    let {status__in, status__not_in} = query;
    if ( status__in ) {
        query.status = {$in: status__in};
        delete query.status__in;
    } else if ( status__not_in ) {
        query.status = {$notin: status__not_in};
        delete query.status__not_in;
    }

    let {within, not__within} = query;
    if ( within ) {
        query.ID = {$in: within};
        delete query.within;
    } else if ( not__within ) {
        query.ID = {$notin: not__within};
        delete query.not__within;
    }

    let {parent__in} = query;
    if ( parent__in ) {
        query.parent = {$in: parent__in};
        delete query.parent__in;
    }

    let {page, perPage} = query;
    if ( page ) {
        delete query.page;
    }
    if ( perPage ) {
        delete query.perPage;
    }

    let {orderBy, order} = query;
    if ( order ) {
        delete query.order;
    } else if ( orderBy ) {
        delete query.orderBy;
    }

    let handleResponse = async contents => {
        if (isError(contents)) {
            return results;
        }

        results.contents = contents;

        // Save to cache before filtering content object.
        contentsCache.set(key, results);

        let contentCache = appCache(table);

        for (let i = 0; i < contents.length; i++) {
            let content = contents[i];

            // Cache content object for later use
            contentCache.set(content.ID, content);
            contentCache.set(content.slug, content);

            content = await contentFilter.apply( content, contentType );
            contents[i] = content;
        }

        results.contents = contents;

        return results;
    };

    let {meta} = query;
    if ( meta ) {
        let $and = [];

        let tables = {},
            whereClause = {},
            relation = {};

        tables[table] = 'ID';
        tables[metaTable] = true;

        if ( within ) {
            $and.push({contentId: {$in: within}});
            delete query.ID;
        } else if ( not__within ) {
            $and.push({contentId: {$notin: not__within}});
            delete query.ID;
        }

        whereClause[table] = query;
        whereClause[metaTable] = {$and: $and};

        relation[table] = 'ID';
        relation[metaTable] = 'contentId';

        let count = await dbManager.rightJoin( tables, whereClause, relation );
        if ( isError(count) ) {
            return resolve(results);
        }

        results.foundItems = count.length;

        tables[table] = '*';

        return dbManager.rightJoin( tables, whereClause, relation, 'ID', orderBy, order, page, perPage ).then(handleResponse);
    }

    let count = await dbManager.get( table, 'count', query );
    if ( isError(count) ) {
        return resolve(results);
    }

    results.foundItems = count;

    return dbManager.get( table, '*', query, false, orderBy, order, page, perPage ).then(handleResponse);
};
setGlobalVar( 'contentQuery', contentQuery );

/**
 * Returns an array of content object.
 *
 * @param {object} query
 *
 * @returns {Promise<array|error>}
 */
const getContents = function( query ) {
    let handleResponse = results => {
        return results.contents;
    };

    return contentQuery(query).then(handleResponse);
};
setGlobalVar( 'getContents', getContents );

/**
 * Get content's meta data.
 *
 * @param {string} type                 Required. The unique content type slug used during content type creation.
 * @param {int} contentId               Required. The id of the content the meta is connected to.
 * @param {string} name                 Optional. The name of the meta to get the value at. If omitted, will return an
 *                                      object containing all the meta data of the given content id.
 * @param {boolean} single              Whether to return the first value of the given meta name.
 *
 * @returns {Promise<any|error>}
 */
const getContentMeta = async function( type, contentId ) {
    let errors = [],
        name = arguments[2] || false,
        single = arguments[3] || false;

    if ( ! type ) {
        errors.push( __t('Invalid content type.') );
    }

    if ( ! contentId || _.isNaN(contentId) ) {
        errors.push( __t('Invalid content id.') );
    }

    if ( errors.length ) {
        return resolve(errors);
    }

    let contentType = await getContentType(Type);
    if ( isError(contentType) ) {
        return resolve(contentType);
    }

    let {slug} = contentType,
        table = slug + '_meta',
        metaCache = appCache(table),
        cache = metaCache.get(contentId);

    if ( cache && name && cache[name] ) {
        return resolve(cache[name]);
    }

    cache = cache || {};

    let handleResponse = metas => {
        if ( isError(metas) || ! metas.length ) {
            if ( single ) {
                return '';
            }

            if ( name ) {
                return [];
            }

            return {};
        }

        let value;
        if ( single ) {
            metas = metas.shift();

            value = metas.value;
        } else {
            if ( name ) {
                value = _.pluck( metas, 'value' );
            } else {
                value = {};

                metas.map( meta => {
                    value[meta.name] = meta.value;
                });
            }
        }

        // Cache the value first
        if ( name ) {
            cache[name] = value;
        } else {
            cache = value;
        }

        metaCache.set( contentId, cache );

        return value;
    };

    let filter = {contentId: contentId};

    if ( name ) {
        filter.name = name;
    }

    return dbManager.get( table, '*', filter ).then(handleResponse);
};
setGlobalVar( 'getContentMeta', getContentMeta );

/**
 * Set or update content meta data.
 *
 * @param {string} type
 * @param {int} contentId
 * @param {string} name
 * @param {any} value
 * @param {boolean} single
 * @returns {Promise<boolean|error>}
 */
const setContentMeta = async function( type, contentId, name, value ) {
    let errors = [],
        single = arguments[4] || false;

    if ( ! type ) {
        errors.push( __t('Invalid content type.') );
    }

    if ( ! contentId || _.isNaN(contentId) ) {
        errors.push( __t('Invalid content id.') );
    }

    if ( errors.length ) {
        return resolve(errors);
    }

    let contentType = await getContentType(type);
    if ( isError(contentType) ) {
        return resolve(contentType);
    }

    let {slug} = contentType,
        table = slug + '_meta',
        metaCache = appCache(table);

    let oldMeta = await getContentMeta( type, contentId, name, single ),
        isEdit = ! isError(oldMeta);

    let handleResponse = ok => {
        // Clear meta caches
        metaCache.clear();

        return ok;
    };

    let meta = {
        contentId: contentId,
        name: name,
        value: value
    };

    if ( isEdit ) {
        return dbManager.update( table, meta, {name: name, contentId: contentId}).then(handleResponse);
    }

    return dbManager.insert( table, meta ).then(handleResponse);
};
setGlobalVar( 'setContentMeta', setContentMeta );

/**
 * Remove the content's meta data.
 *
 * @param {string} type
 * @param {int} contentId
 * @param {string} name
 * @param {any} value
 * @returns {Promise<boolean|error>}
 */
const dropContentMeta = async function( type, contentId ) {
    let name = arguments[2] || false,
        value = arguments[3] || false;

    let errors = [];

    if ( ! type ) {
        errors.push( __t('Invalid content type.') );
    }

    if ( ! contentId || _.isNaN(contentId) ) {
        errors.push( __t('Invalid content id.') );
    }

    if ( errors.length ) {
        return resolve(errors);
    }

    let contentType = await getContentType(type);
    if ( isError(contentType) ) {
        return resolve(contentType);
    }

    let {slug} = contentType,
        table = slug + '_meta',
        metaCache = appCache(table);

    let filter = {contentId: contentId};

    if ( name ) {
        filter.name = name;
    }

    if ( value ) {
        filter.value = value;
    }

    let handleResponse = ok => {
        // Clear meta caches
        metaCache.clear();

        return ok;
    };

    return dbManager.delete( table, filter ).then(handleResponse);
};
setGlobalVar( 'dropContentMeta', dropContentMeta );

/**
 * Returns comment object base on the given comment id.
 *
 * @param {int} commentId                   Required.
 * @param {string} type                     Required.
 * @returns {Promise<object|error>}
 */
const getComment = async function( commentId, type ) {
    let errors = [];

    if ( ! type ) {
        errors.push( __t('Invalid content type.') );
    }

    if ( ! commentId || _.isNaN(commentId) ) {
        errors.push( __t('Invalid comment id.') );
    }

    if ( errors.length ) {
        return resolve(errors);
    }

    let contentType = await getContentType(type);
    if ( isError(contentType) ) {
        return resolve(contentType);
    }

    let {slug} = contentType,
        table = slug + '_comments',
        commentCache = appCache(table),
        cache = commentCache.get(commentId);

    if ( cache ) {
        return resolve(cache);
    }

    let handleResponse = comments => {
        if ( isError(comments) ) {
            return comments;
        }

        if ( ! comments.length ) {
            return errorHandler( __('Comment does not exist.') );
        }

        let comment = comments.shift();

        // Store comment to cache
        commentCache.set( commentId, comment );

        return comment;
    };

    return dbManager.get( table, '*', {ID: commentId} ).then(handleResponse);
};

/**
 * Set or update comment data to the database.
 *
 * @param {string} type                     Required.
 * @param {object} comment {
 *      @param {int} ID                     Required when updating comment data.
 *     @param {int} contentId               Required.
 *     @param {int} authorId
 *     @param {string} author
 *     @param {string} authorEmail
 *     @param {string} authorUrl
 *     @param {string} comment
 *     @param {string} status
 *     @param {int} parent                  Optional. The id of the comment it is descendent of.
 * }
 * @returns {Promise<int|error>}
 */
const setComment = async function( type, comment ) {
    let errors = [],
        {contentId, ID} = comment;

    if ( ! type ) {
        errors.push( __t('Invalid content type.') );
    }

    if ( ! contentId || _.isNaN(contentId) ) {
        errors.push( __t('Invalid content id.') );
    }

    if ( errors.length ) {
        return resolve(errors);
    }

    let contentType = await getContentType(type);
    if ( isError(contentType) ) {
        return resolve(contentType);
    }

    let {slug} = contentType,
        table = slug + '_comments',
        commentCache = appCache(table),
        allCache = appCache(table + 'list'),
        isEdit = !! ID;

    let handleResponse = async id => {
        if ( isError(id) ) {
            return id;
        }

        // Clear comments cache
        allCache.clear();

        if ( isEdit ) {
            commentCache.clear(ID);

            /**
             * Trigger whenever a comment is updated.
             *
             * @param {int} ID
             * @param {int} contentId
             * @param {string} type
             */
            await appEvent('updatedComment').trigger( ID, contentId, type );

            return ID;
        }

        /**
         * Trigger whenever a new comment is inserted to the database.
         *
         * @param {int} ID
         * @param {int} contentId
         * @param {string} type
         */
        await appEvent('insertedComment').trigger( id, contentId, type );

        return id;
    };

    if ( isEdit ) {
        return dbManager.update( table, comment, {ID: ID}).then(handleResponse);
    }

    return dbManager.insert( table, comment ).then(handleResponse);
};
setGlobalVar( 'setComment', setComment );

/**
 * Remove comment data from the database.
 *
 * @param {string} type                     Required.
 * @param {int} commentId                   Required.
 * @returns {Promise<boolean|error>}
 */
const dropComment = async function( type, commentId ) {
    let errors = [];

    if ( ! type ) {
        errors.push( __t('Invalid content type.') );
    }

    if ( ! commentId || _.isNaN(commentId) ) {
        errors.push( __t('Invalid comment id.') );
    }

    if ( errors.length ) {
        return resolve(errors);
    }

    let contentType = await getContentType(type);
    if ( isError(contentType) ) {
        return resolve(contentType);
    }

    let {slug} = contentType,
        table = slug + '_comments',
        commentCache = appCache(table),
        allCache = appCache(table + 'list'),
        oldComment = await getComment( commentId, type );

    if ( isError(oldComment) ) {
        return resolve(oldComment);
    }

    let handleResponse = async ok => {
        if ( isError(ok) ) {
            return ok;
        }

        // Clear comments cache
        allCache.clear();

        // Clear comment object cache
        commentCache.clear(commentId);

        /**
         * Trigger whenever a comment is deleted from the database.
         *
         * @param {object} comment              The deleted comment object.
         * @param {string} type
         */
        await appEvent('deletedComment').trigger( oldComment, type );

        return ok;
    };

    return dbManager.delete( table, {ID: commentId}).then(handleResponse);
};
setGlobalVar( 'dropComment', dropComment );

/**
 * Returns an object containing the total number of comments found base on the given query filter and an array of
 * comment object.
 *
 * @param {object} query {
 *     @param {string} type                 Required.
 *     @param {int} contentId               Optional.
 *     @param {string} status
 *     @param {array} status__in
 *     @param {array} status__not_in
 *     @param {string|int} author
 *     @param {array} author__in
 *     @param {string} orderBy
 *     @param {string} order
 *     @param {int} page
 *     @param {int} perPage
 * }
 * @returns {Promise<object|error>}
 */
const commentsQuery = async function(query) {
    let {type} = query,
        results = {foundItems: 0, comments: []};

    if ( ! type ) {
        return resolve(results);
    }

    delete query.type;

    let contentType = await getContentType(type);
    if ( isError(contentType) ) {
        return resolve(results);
    }

    let {slug} = contentType,
        table = slug + '_comments',
        commentCache = appCache(table),
        allCache = appCache(table + 'list'),
        key = allCache.genKey(query),
        cache = allCache.get(key);

    if ( cache ) {
        return resolve(cache);
    }

    let {status__in, status__not_in} = query;
    if ( status__in ) {
        query.status = {$in: status__in};
        delete query.status__in;
    } else if ( status__not_in ) {
        query.status = {$notin: status__not_in};
        delete query.status__not_in;
    }

    let {author, author__in} = query;
    if ( author ) {
        let $or = [
            {authorId: author},
            {author: author}
        ];
        query.$or = $or;
        delete query.author;
    } else if ( author__in ) {
        query.$or = [
            {authorId: {$in: author__in}},
            {author: {$in: author__in}}
        ];
        delete query.author__in;
    }

    let {orderBy, order, page, perPage} = query;
    if ( orderBy ) {
        delete query.orderBy;
    }
    if ( order ) {
        delete query.order;
    }
    if ( page ) {
        delete query.page;
    }
    if ( perPage ) {
        delete quer.perPage;
    }

    let count = await dbManager.get( table, 'count', query );
    if ( isError(count) ) {
        return resolve(results);
    }
    results.foundItems = count;

    let handleResponse = comments => {
        if ( isError(comments) || ! comments.length ) {
            return results;
        }

        results.comments = comments;

        // Cache every comment for later use.
        comments.map( comment => {
            commentCache.set( comment.ID, comment );
        });

        allCache.set( key, results );

        return results;
    };

    return dbManager.get( table, '*', query, false, orderBy, order, page, perPage ).then(handleResponse);
};
setGlobalVar( 'commentsQuery', commentsQuery );

/**
 * Returns an array of comments object.
 *
 * @param {object} query
 * @returns {Promise<array>}
 */
const getComments = function(query) {
    let handleResponse = results => {
        return results.comments;
    };

    return commentsQuery(query).then(handleResponse);
};
setGlobalVar( 'getComments', getComments );