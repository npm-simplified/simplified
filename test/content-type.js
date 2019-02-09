'use strict';

const assert = require('chai').assert,
    _ = require('underscore');

require('../lib/load');

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
            }
        });

        assert.isTrue(done);

        return done;
    });

    it('Should drop content type table.', async function() {
        let done = await dbManager.dropTable('content_type');

        assert.isTrue(done);

        return done;
    });
});