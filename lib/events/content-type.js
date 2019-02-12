'use strict';

const onGetContentType = function(contentType) {
    let {archiveSlug, type, status, parents} = contentType;

    // Set permalink
    if ( archiveSlug && 'builtin' !== status ) {
        if ( 'content' === type ) {
            contentType.permalink = '/' + archiveSlug;
        }

        if ( parents ) {
            let links = {};

            parents.map( parent => {
                let endpoint = '/' + parent + '/' + archiveSlug;

                links.push(endpoint);
            });

            contentType.links = links;
        }
    }

    return contentType;
};

const onInsertedContentType = async function(contentType) {
    // Create content type route
    let {archiveSlug, status, type, parents } = contentType;

    if ( 'builtin' === status && archiveSlug ) {
        let value = {
            type: type,
            typeSlug: archiveSlug
        },
            route = '/' + archiveSlug;

        if ( 'content' === type ) {
            await setRouteEndPoint( route, value );
        } else if ( parents ) {

            parents.map( async parent => {
                let endpoint = '/' + parent + '/' + archiveSlug;

                value.parent = parent;

                await setRouteEndPoint( endpoint, value );
            });
        }
    }

    return true;
};

const onUpdatedContentType = async function(contentType, oldContentType) {
    let {archiveSlug, status, type, parents} = contentType;

    if ( oldContentType.archiveSlug !== archiveSlug ) {
        if ( 'content' === type ) {
            // Remove old endpoint
            await dropRouteEndPoint( '/' + oldContentType.archiveSlug );
        }

        if ( oldContentType.links ) {
            await dropRouteEndPoint(oldContentType.links);
        }
    }

    if ( archiveSlug && 'builtin' !== status ) {
        let value = {
            type: type,
            typeSlug: archiveSlug
        },
            route = '/' + archiveSlug;

        if ( 'content' === type ) {
            await setRouteEndPoint( route, value );
        } else if ( parents ) {
            parents.map( async parent => {
                let endpoint = '/' + parent + '/' + archiveSlug;

                value.parent = parent;

                await setRouteEndPoint( endpoint, value );
            });
        }
    }
};

const onDeletedContentType = function(contentType) {
    let {archiveSlug, type, status, links } = contentType;

    // Delete endpoint in silence
    if ( 'builtin' === status && archiveSlug ) {
        if ( 'content' === type ) {
            dropRouteEndPoint( '/' + archiveSlug );
        } else if ( links ) {
            dropRouteEndPoint(links);
        }
    }

    return true;
};

const onGetContent = function( content, contentType ) {
    let {type, permalink} = contentType;

    if ( 'content' === type ) {
        permalink = permalink + '/' + content.slug;

        content.permalink = permalink;
    }

    return content;
};

const onInsertedContent = async function( ID, contentType ) {
    let content = await getContent( contentType.slug, ID );

    if ( content.permalink ) {
        let {type, archiveSlug} = contentType;

        await setRouteEndPoint( content.permalink, {
            type: type,
            typeSlug: archiveSlug,
            contentId: ID
        });
    }

    return true;
};

const onUpdatedContent = async function( ID, oldContent, contentType ) {
    let {permalink} = oldContent,
        content = await getContent( contentType.slug, ID );

    if ( permalink !== content.permalink ) {
        await dropRouteEndPoint(permalink);
    }

    if ( content.permalink ) {
        let {archiveSlug, type} = contentType;

        await setRouteEndPoint( content.permalink, {
            type: type,
            typeSlug: archiveSlug,
            contentId: ID
        });
    }

    return true;
};

const onDeletedContent = function( content, contentType ) {
    let {ID, permalink} = content;

    // Remove endpoint
    if ( permalink ) {
        dropRouteEndPoint(permalink);
    }

    // Remove content's metadata
    dropContentMeta( contentType.slug, ID );

    return true;
};

module.exports = function() {
    appFilter( 'getContentType' ).set(onGetContentType);

    appEvent('insertedContentType').set(onInsertedContentType);

    appEvent('updatedContentType').set(onUpdatedContentType);

    appEvent('deletedContentType').set( onDeletedContentType, 99999 );

    appFilter('getContent').set(onGetContent);

    appEvent('insertedContent').set(onInsertedContent);

    appEvent('updatedContent').set(onUpdatedContent);

    appEvent('deletedContent').set( onDeletedContent, 99999 );

    return true;
};