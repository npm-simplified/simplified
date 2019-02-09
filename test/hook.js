'use strict';

const assert = require('chai').assert;

require('../lib/load');

const func1 = function() {
        return 5;
    },
    func2 = function() {
        return 1;
    },
    func3 = function() {
        return 3;
    };

describe('appEvent:', () => {
    let app = appEvent('test1');

    it('Should add an event hook of `test1`', function(done) {
        let a = app.set(func1, 5);
        assert.isTrue(a);
        done();
    });

    it('Should add an event hook sorted first', function(done) {
        app.set(func2);
        done();
    });

    it('Should add an event hook that only triggered once', function(done) {
        app.setOnce(func3);
        done();
    });

    it('Should call and execute all attached event hook', async function() {
        let done = await app.trigger();

        return done;
    });

    it('Should remove func1 from the list of event hook', function(done) {
        app.unset(func1);
        done();
    });

    it('Should call and execute the remaining event hook', async function() {
        let done = await app.trigger();

        return done;
    });
});

describe('appFilter', () => {
    let app = appFilter('test1');

    it('Should add an event hook of `test1`', function(done) {
        let a = app.set(func1, 5);
        assert.isTrue(a);
        done();
    });

    it('Should add an event hook sorted first', function(done) {
        app.set(func2);
        done();
    });

    it('Should add an event hook that only triggered once', function(done) {
        app.setOnce(func3);
        done();
    });

    it('Should call and execute all attached event hook', async function() {
        let done = await app.apply(1);

        assert.equal(done, 5);

        return done;
    });

    it('Should remove func1 from the list of event hook', function(done) {
        app.unset(func1);
        done();
    });

    it('Should call and execute the remaining event hook', async function() {
        let done = await app.apply(2);
        assert.equal( done, 1 );

        return done;
    });
});