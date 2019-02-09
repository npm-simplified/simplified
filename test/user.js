'use strict';

const assert = require('chai').assert,
    _ = require('underscore');

describe('User Queries', () => {
    it('Should create users table', async function() {
        let done = await dbManager.createTable( 'users', {
            ID: {
                type: 'int',
                length: 20,
                autoIncrement: true,
                primary: true,
                required: true,
                index: true
            },
            display: {
                type: 'str',
                length: 60,
                required: true
            },
            email: {
                type: 'str',
                length: 100,
                required: true,
                index: true
            },
            pass: {
                type: 'str',
                length: 255,
                required: true
            },
            group: {
                type: 'str',
                length: 60,
                required: true
            },
            registered: {
                type: 'timestamp',
                default: 'CURRENT_TIMESTAMP'
            }
        });

        assert.isTrue(done);

        return done;
    });

    it('Should create user meta table', async function() {
        let done = await dbManager.createTable( 'user_meta', {
            name: {
                type: 'str',
                length: 60,
                required: true,
                index: true
            },
            value: {
                type: 'object'
            },
            objectId: {
                type: 'int',
                length: 20,
                required: true,
                index: true
            }
        });

        return done;
    });

    it('Should create user group table', async function() {
        let done = await dbManager.createTable( 'user_group', {
            name: {
                type: 'str',
                length: 60,
                required: true,
                index: true
            },
            caps: {
                type: 'object'
            }
        });

        assert.isTrue(done);

        return done;
    });

    it('Should add user group name = subscriber, author', async function() {
        let done = await setUserGroup( 'subscriber' );

        assert.isTrue(done);

        done = await setUserGroup( 'author' );

        assert.isTrue(done);

        return done;
    });

    let userId, user2, user3;

    it('Should add new users', async function() {
        userId = await setUser({
            display: 'irene',
            email: 'irene@local.dev',
            pass: 'Webdevenquiry@21',
            group: 'subscriber'
        });

        assert.isNumber(userId);

        user2 = await setUser({
            display: 'natasha',
            email: 'natasha@local.dev',
            pass: 12346,
            group: 'author'
        });

        assert.isNumber(user2);

        user3 = await setUser({
            display: 'ellen',
            email: 'ellen@local.dev',
            pass: 'iamme',
            group: 'subscriber'
        });

        assert.isNumber(user3);

        return userId;
    });

    it('Should get user data', async function() {
        let user = await getUser(userId);

        assert.equal( user.ID, userId );
        assert.equal( user.email, 'irene@local.dev' );

        return user;
    });

    it('Should update user data', async function() {
        let done = await setUser({
            ID: userId,
            email: 'irene1@local.dev'
        });

        assert.equal(done, userId);

        done = await getUser(userId);

        assert.equal(done.email, 'irene1@local.dev');

        return done;
    });

    it('Should get the list of users without filters', async function() {
        let users = await getUsers();

        assert.equal( users.length, 3 );

        return users;
    });

    it('Should add user meta', async function() {
        let done = await setUserMeta( userId, 'role', 'subscriber', true );

        assert.isTrue(done);

        done = await setUserMeta( userId, 'social', {fb: 1, tw: 2});

        assert.isTrue(done);

        done = await setUserMeta( user2, 'role', 'subscriber', true );

        return done;
    });

    it('Should get the single value of user meta', async function() {
        let meta = await getUserMeta( userId, 'role', true );

        assert.equal( meta, 'subscriber' );

        meta = await getUserMeta(userId);

        return meta;
    });

    it('Should delete user meta', async function() {
        return true;

        /**
        let done = await dropUserMeta( userId, 'role' );

        assert.isTrue(done);

        return done;
         **/
    });

    it('Should get all user meta', async function() {
        let meta = await getUserMeta(userId);

        assert.equal( _.keys(meta).length, 2 );

        return meta;
    });

    it('Should get users where group = subscriber', async function() {
        let users = await usersQuery({group: 'subscriber'});

        assert.equal( users.users.length, 2 );

        return users;
    });

    it('Should get users that are a member of group = subscriber, author', async function() {
        let users = await usersQuery({group__in: ['subscriber', 'author']});

        assert.equal( users.users.length, 3 );

        return users;
    });

    it('Should get users with filters', async function() {
        let users = await usersQuery({
            meta: {
                name: 'role',
                value: 'subscriber'
            }
        });

        assert.equal( users.users.length, 2 );

        return users;
    });

    it('Should delete user', async function() {
        let done = await dropUser(userId);

        assert.isTrue(done);

        return done;
    });

    it('Should drop user meta table', async function() {
        let done = await dbManager.dropTable('user_meta');

        assert.isTrue( ! isError(done) );

        return done;
    });

    it('Should drop user group table', async function() {
        let done = await dbManager.dropTable( 'user_group' );

        assert.isTrue( !isError(done) );

        return done;
    });

    it('Should drop users table', async function() {
        let done = await dbManager.dropTable('users');

        assert.isTrue( ! isError(done) );

        return done;
    });
});