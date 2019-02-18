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

    let contentId, id2;

    it('Should insert new content', async function() {
        contentId = await insertContent({
            type: 'blog',
            title: 'My Funny Valentines',
            status: 'public'
        });

        assert.isNumber(contentId);

        id2 = await insertContent({
            type: 'category',
            name: 'Apple'
        });

        assert.isNumber(id2);

        return contentId;
    });

    it('Should update content', async function() {
        let done = await updateContent({
            ID: id2,
            type: 'category',
            slug: 'apple-tree'
        });

        assert.equal( done, id2 );

        return done;
    });

    it('Should get content from the database', async function() {
        let content = await getContent( contentId, 'blog' );

        assert.isObject(content);
        assert.equal(content.ID, contentId);

        content = await getContentBy( 'slug', 'apple-tree', 'category' );

        assert.isObject(content);
        assert.equal(content.ID, id2);

        return content;
    });

    it('Should set content metadata', async function() {
        let done = await setContentMeta( 'blog', contentId, 'meta1', true );

        assert.isTrue(done);

        //let meta = await getContentMeta( 'blog', contentId );

        return done;
    });

    it('Should delete content', async function() {
        let done = await dropContent( 'category', id2 );

        assert.isTrue(done);

        return done;
    });

    it('Should get contents', async function() {
        let contents = await contentQuery({type: 'blog'});

        return contents;
    });

    it('Should delete content type', async function() {
        this.timeout(15000);

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