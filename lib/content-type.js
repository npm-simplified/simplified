'use strict';

const _ = require('underscore');

const getTableFields = function( contentType ) {
    let {type, hierarchical, comments, fields} = contentType,
        tableFields = {},
        requiredFields = {
            ID: {
                type: 'int',
                length: 20,
                autoIncrement: true,
                primary: true,
                index: true,
                required: true
            },
            created: {
                type: 'timestamp',
                default: 'CURRENT_TIMESTAMP'
            },
            updated: {
                type: 'timestamp',
                default: 'CURRENT_TIMESTAMP'
            },
            thumb: {
                type: 'int',
                length: 20
            }
        };

    if ( hierarchical ) {
        requiredFields.parent = {
            type: 'int',
            length: 20
        };
    }

    if ( comments ) {
        requiredFields.comments = {
            type: 'enum',
            enum: ['open', 'close', 'disabled'],
            default: 'open'
        };
    }

    if ( ! fields ) {
        let defaultFields = {
            slug: {
                type: 'str',
                length: 200,
                required: true,
                unique: true,
                index: true
            }
        };

        if ( 'content' === type ) {
            defaultFields = _.extend( defaultFields, {
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
                }
            });
        } else {
            defaultFields.name = {
                type: 'str',
                length: 200,
                required: true,
                index: true
            };

            defaultFields.description = {
                type: 'str',
                length: 255
            };
        }

        fields = defaultFields;
    }

    tableFields.content = _.extend( fields, requiredFields );

    tableFields.meta = {
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

    tableFields.comments = {
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

const createContentTable = function( contentType ) {
    let tableFields = getTableFields(contentType),
        tables = Object.keys(tableFields);

    tables.map( async table => {
        let tableName = contentType.slug + '_' + table;
        await dbManager.createTable( tableName, tableFields[table] );
    });

    return true;
};

const updateContentTable = async function( contentType, oldSlug ) {
    let tableFields = getTableFields(contentType),
        tables = Object.keys(tableFields);

    // @todo: either drop previous table or rename the table???

    tables.map( async table => {
        let tableName = contentType.slug + '_' + table,
            structure = await dbManager.getTableStrucutre(tableName),
            fields = tableFields[table];

        if ( isError(structure) ) {
            // Create table is does not exist yet
            await dbManager.createTable( tableName, fields );

            return;
        }

        // Compare table
        if ( _.isEqual(fields, structure) ) {
            return;
        }

        let drops = [],
            update = {},
            insert = {};

        _.each( structure, (def, col) => {
            if ( ! fields[col] ) {
                drops.push(col);

                return;
            }

            if ( ! _.isEqual(def, fields[col]) ) {
                update[col] = fields[col];
            }
        });

        _.each( fields, (def, col) => {
            if ( ! structure[col] ) {
                insert[col] = def;
            }
        });

        await dbManager.updateTable( tableName, insert, update, drops );
    });
};

const dropContentTable = function( contentType ) {
    let table = contentType.slug + '_content';

    // Remove all contents
};

/**
 * Get content type object from the database.
 *
 * @param {string} slug
 * @returns {Promise<object|error>}
 */
const getContentType = async function(slug) {
    if ( ! slug ) {
        return reject( errorHandler( __t('Content unique slug is required.') ) );
    }

    let table = dbManager.contentTypeTable,
        contentCache = appCache('contentType'),
        cache = contentCache.get(slug);

    /**
     * Filter content type object before returning.
     *
     * @type apply
     *
     * @return {object}
     */
    let contentFilter = appFilter('getContentType');

    if ( cache ) {
        cache = await contentFilter.apply(cache);

        return resolve(cache);
    }

    let handleResponse = async contents => {
        if ( ! contents.length ) {
            return errorHandler( __t('Type does not exist.') );
        }

        let contentType = contents.shift();

        // Cache content type before applying filters.
        contentCache.set( slug, contentType );

        contentType = await contentFilter.apply(contentType);

        return contentType;
    };

    return dbManager.get( table, {slug: slug} ).then(handleResponse);
};

/**
 * Add or update content type to the database.
 *
 * @param {object} args {
 *     @param {string} name             The name of content slug.
 *     @param {string} slug             The unique slug use as identifier of content type.
 *     @param {string} type             The type of content to insert. Options are `content`, `group`
 *     @param {string} status           The status
 * }
 * @param oldSlug
 * @returns {Promise<*>}
 */
const setContentType = async function( args, oldSlug ) {
    let {name, slug, archiveSlug} = args,
        errors = [];

    if ( ! name ) {
        errors.push( __t('Content type name is required.') );
    }

    if ( ! slug ) {
        errors.push( __t('A unique slug is required.') );
    }

    if ( errors.length ) {
        return reject( errorHandler(errors) );
    }

    let oldContentType = await getContentType(slug),
        table = dbManager.contentTypeTable,
        isEdit = ! isError(oldContentType),
        contentCache = appCache('getContentType');

    if ( archiveSlug ) {
        args.archiveSlug = toSlug(archiveSlug);
    }

    if ( ! isEdit ) {
        if ( ! archiveSlug ) {
            args.archiveSlug = toSlug(slug);
        }

        if ( ! args.type ) {
            args.type = 'content';
        }
    }

    let handleResponse = async () => {
        if ( oldSlug ) {
            contentCache.clear(oldSlug);
        } else if ( isEdit ) {
            contentType.clear(slug);
        }

        if ( oldSlug || isEdit ) {
            await updateContentTable( args, oldSlug);

            /**
             * Trigger whenever content type is updated.
             *
             * @param {object} contentType
             * @param {string} oldSlug
             */
            await appEvent('updatedContentType').trigger( args, oldContentType, oldSlug );

            return true;
        }

        await createContentTable(args);

        /**
         * Trigger whenever a new content type is inserted to the database.
         *
         * @param {object} contentType
         */
        await appEvent('insertedContentType').trigger(args);

        return true;
    };

    if ( oldSlug ) {
        return dbManager.update( table, args, {slug: oldSlug}).then(handleResponse);
    } else if ( isEdit ) {
        return dbManager.update( table, args, {slug: slug} ).then(handleResponse);
    }

    return dbManager.insert( table, args ).then(handleResponse);
};
setGlobalVar( 'setContentType', setContentType );

/**
 * Remove content type from the database.
 *
 * @param {string} slug
 * @returns {Promise<boolean|error>}
 */
const dropContentType = async function(slug) {
    if ( ! slug ) {
        return reject( errorHandler( __t('Content unique slug is required.') ) );
    }

    let contentType = await getContentType(slug);
    if ( isError(contentType) ) {
        return reject( errorHandler( __t('Content type does not exist.') ) );
    }

    let table = dbManager.contentTypeTable;

    let responseHandler = async ok => {
        // Remove table and it's contents in silence
        dropContentTable(contentType);

        // Clear all contents cache
        appCache('contentTypes').clear();

        // Clear content object cache
        appCache('getContentType').clear(slug);

        /**
         * Triggered whenever a content type is removed from the database.
         *
         * @param {object} contentType          The content type object prior to deletion.
         */
        await appEvent('deletedContentType').trigger(contentType);

        return ok;
    };

    return dbManager.delete( table, {slug: slug}).then(responseHandler);
};
setGlobalVar( 'dropContentType', dropContentType );

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
        return reject( errorHandler(errors) );
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
        cache = await contentFilter.apply( cache, type );

        return resolve(cache);
    }

    let handleResponse = async contents => {
        if ( ! contents.length ) {
            return errorHandler( __('Content does not exist.') );
        }

        let content = contents.shift();

        // Store content object to cache
        contentCache.set( content.ID, content );
        contentCache.set( content.slug, content );

        content = await contentFilter.apply( content, type );

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
        return reject( errorHandler( __t('Invalid content type.') ) );
    }

    let contentType = await getContentType(type);
    if ( isError(contentType) ) {
        return reject(contentType);
    }

    let isEdit = !! ID,
        oldContent = await getContent(ID),
        table = contentType.slug + '_content',
        contentCache = appCache(table),
        contentsCache = appCache( table + 's' );

    let handleResponse = async id => {
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
             * @param {string} type
             */
            await appEvent( 'updatedContent', ID, type );

            return ID;
        }

        /**
         * Trigger every time a new content is inserted to the database.
         *
         * @param {int} ID
         * @param {string} type
         */
        await appEvent( 'insertedContent', id, type );

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
 * @param {int} ID
 * @param {string} type
 * @returns {Promise<boolean|error>}
 */
const dropContent = async function( ID, type ) {
    let errors = [];

    if ( ! ID || _.isNaN(ID) ) {
        errors.push( __t('Invalid content id.') );
    }

    if ( ! type ) {
        errors.push( __t('Invalid content type.') );
    }

    if ( errors.length ) {
        return reject( errorHandler(errors) );
    }

    let contentType = await getContentType(type);
    if ( isError(contentType) ) {
        return reject(contentType);
    }

    let {slug} = contentType,
        table = slug + '_content';

    let content = await getContent(ID);

    if ( isError(content) ) {
        return reject( errorHandler( __t('Content does not exist.') ) );
    }

    let handleResponse = async ok => {
        // Clear contents cache
        appCache( table + 's' ).clear();

        let contentCache = appCache(table);
        contentCache.clear(ID);
        contentCache.clear(content.slug);

        /**
         * Trigger every time a content is deleted from the database.
         *
         * @param {object} content
         * @param {string} type
         */
        await appEvent('deletedContent').trigger( content, type );

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

            content = await contentFilter.apply( content, type );
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
            results.contents = contents;

            // Save to cache before filtering content object.
            contentsCache.set( key, results );

            let contentCache = appCache(table);

            for ( let i = 0; i < contents.length; i++ ) {
                let content = contents[i];

                // Cache content object for later use
                contentCache.set( content.ID, content );
                contentCache.set( content.slug, content );

                content = await contentFilter.apply( content, type );
                contents[i] = content;
            }

            results.contents = contents;

            return results;
        },
        returnResults = err => {
            errorHandler(err);

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

        return dbManager.rightJoin( tables, whereClause, relation, 'ID', orderBy, order, page, perPage ).then(handleResponse).catch(returnResults);
    }

    let count = await dbManager.get( table, 'count', query );
    if ( isError(count) ) {
        return resolve(results);
    }

    results.foundItems = count;

    return dbManager.get( table, '*', query, false, orderBy, order, page, perPage ).then(handleResponse).catch(returnResults);
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
    return contentQuery(query).then( results => {
        return results.contents;
    });
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
        return resolve(errorHandler(errors));
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
        if ( ! metas.length ) {
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
        return resolve(errorHandler(errors));
    }

    let contentType = await getContentType(Type);
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
        return resolve(errorHandler(errors));
    }

    let contentType = await getContentType(Type);
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
 * @param {string} type                     Required.
 * @param {int} commentId                   Required.
 * @returns {Promise<object|error>}
 */
const getComment = async function(type, commentId) {
    let errors = [];

    if ( ! type ) {
        errors.push( __t('Invalid content type.') );
    }

    if ( ! commentId || _.isNaN(commentId) ) {
        errors.push( __t('Invalid comment id.') );
    }

    if ( errors.length ) {
        return resolve(errorHandler(errors));
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
        return resolve(errorHandler(errors));
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
 * @param {string} commentId                Required.
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
        return resolve(errorHandler(errors));
    }

    let contentType = await getContentType(type);
    if ( isError(contentType) ) {
        return resolve(contentType);
    }

    let {slug} = contentType,
        table = slug + '_comments',
        commentCache = appCache(table),
        allCache = appCache(table + 'list'),
        oldComment = await getComment( type, commentId );

    if ( isError(oldComment) ) {
        return resolve(errorHandler( __t('Comment does not exist.') ) );
    }

    let handleResponse = async ok => {
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
        if ( ! comments.length ) {
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
    return commentsQuery(query)
        .then( results => {
            return results.comments;
        });
};
setGlobalVar( 'getComments', getComments );