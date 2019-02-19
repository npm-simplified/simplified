'use strict';

const assert = require('chai').assert,
    _ = require('underscore');

describe('Database Queries', () => {
    let tester = {
        ID: {
            type: 'int',
            length: 20,
            autoIncrement: true,
            required: true,
            primary: true,
            index: true
        },
        name: {
            type: 'str',
            length: 60,
            required: true
        }
    };

    it('Should check database configuration', async function() {
        let done = await dbManager.configure();

        return done;
    });

    it('Should create new table name tester', async function() {
        let done = await dbManager.createTable( 'tester', tester );

        return done;
    });

    it('Should return and object composing the structure of table tester', async function() {
        let done = await dbManager.getTableStructure('tester');

        assert.isTrue( _.isEqual(done, tester));

        return done;
    });

    let dataId;

    it('Should insert new values to table tester', async function() {
        dataId = await dbManager.insert( 'tester', {name: 'irene'}).catch(errorHandler);

        assert.isNumber( dataId );

        return dataId;
    });

    it('Should get the columns of ', async function() {
        let done = await dbManager.get( 'tester', '*', {ID: dataId});

        assert.equal( done[0].ID, dataId );

        return done;
    });

    it('Should update the column value of the newly inserted values.', async function() {
        let done = await dbManager.update( 'tester', {name: 'irene mitchell'}, {ID: dataId});

        assert.isTrue(done);

        return done;
    });

    it('Should get the updated values', async function() {
        let done = await dbManager.get( 'tester', ['name'], {ID: dataId});

        assert.equal( done[0].name, 'irene mitchell' );

        return done;
    });

    it('Should delete the inserted row', async function() {
        let done = await dbManager.delete( 'tester', {ID: dataId});

        assert.isTrue( done );

        return done;
    });

    it('Should drop table tester', async function() {
        let done = await dbManager.dropTable('tester');

        return done;
    });
});