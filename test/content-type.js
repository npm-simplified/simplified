'use strict';

const assert = require('chai').assert,
    _ = require('underscore');

describe('Content type queries', () => {
    it('Should create new content type table.', async function() {
        let done = await dbManager.createTable( 'content_type', {
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

        assert.isTrue(done);

        return done;
    });

    it('Should add new content type', async function() {
        this.timeout(10000);

        // Create blogs
        let done = await insertContentType({
            name: 'Blog',
            slug: 'blog',
            hierarchical: true,
            archive: true,
            page: true,
            comments: true,
            rest: true
        });

        assert.isTrue(done);

        // Create categories
        done = await insertContentType({
            name: 'Categories',
            slug: 'categories',
            hierarchical: true,
            type: 'group',
            archive: true,
            page: true,
            parents: ['blog']
        });

        assert.isTrue(done);

        return done;
    });

    it('Should update content type', async function() {
        this.timeout(5000);

        let done = await updateContentType({
            slug: 'blog',
            // Disable comments
            comments: false
        });

        assert.isTrue(done);

        // Change content type slug
        done = await updateContentType({
            slug: 'category'
        }, 'categories' );

        assert.isTrue(done);

        return done;
    });

    it('Should get all content types', async function() {
        let types = await getContentTypes();

        assert.equal( types.length, 2 );

        return types;
    });


    it('Should delete content type', async function() {
        let done = await dropContentType('blog');

        assert.isTrue(done);

        done = await dropContentType('category');

        assert.isTrue(done);

        return done;
    });


    it('Should drop content type table.', async function() {
        let done = await dbManager.dropTable('content_type');

        assert.isTrue(done.affectedRows > 0);

        return done;
    });
});