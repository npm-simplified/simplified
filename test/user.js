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
            grants: {
                type: 'array'
            }
        });

        assert.isTrue(done);

        return done;
    });

    it('Should add user group name = subscriber, author', async function() {
        let done = await insertUserGroup( 'subscriber', ['read', 'edit-user'] );

        assert.isTrue(done);

        done = await insertUserGroup( 'author' );

        assert.isTrue(done);

        done = await insertUserGroup( 'editor' );

        assert.isTrue(done);

        done = await insertUserGroup( 'pakals', ['eating'] );

        return done;
    });

    it('Should update user group', async function() {
        // Change group's name
        let done = await updateUserGroup( 'honest', ['eating', 'generous'], 'pakals');

        assert.isTrue(done);

        let group = await getUserGroup( 'honest' );

        assert.isObject(group);
        assert.equal( group.name, 'honest' );

        return done;
    });

    it('Should delete user group', async function() {
        let done = await dropUserGroup('honest');

        assert.isTrue(done);

        return done;
    });

    it('Should get the list of user groups', async function() {
        let groups = await getUserGroups();

        assert.equal( groups.length, 3 );

        return groups;
    });

    let userId, user2, user3;

    it('Should add new users', async function() {
        userId = await insertUser({
            display: 'irene',
            email: 'irene@local.dev',
            pass: 'Webdevenquiry@21',
            group: 'subscriber'
        });

        assert.isNumber(userId);

        user2 = await insertUser({
            display: 'natasha',
            email: 'natasha@local.dev',
            pass: 12346,
            group: 'author'
        });

        assert.isNumber(user2);

        user3 = await insertUser({
            display: 'ellen',
            email: 'ellen@local.dev',
            pass: 'iamme',
            group: 'editor'
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
        let done = await updateUser({
            ID: userId,
            email: 'irene1@local.dev'
        });

        assert.equal(done, userId);

        done = await getUser(userId);

        assert.equal(done.email, 'irene1@local.dev');

        return done;
    });

    it('Should get user', async function() {
        let user = await getUserBy( 'email', 'irene1@local.dev' );

        assert.equal( user.ID, userId );

        user = await getUser(user2);

        assert.equal(user.ID, user2);

        return user;
    });

    it('Should set user metadata', async function() {
        // Add
        let done = await setUserMeta( userId, 'cup', 'big' );

        assert.isTrue(done);

        done = await setUserMeta( user2, 'cup', 'big' );

        assert.isTrue(done);

        done = await setUserMeta( user3, 'cup', 'small' );

        assert.isTrue(done);

        return done;
    });

    it('Should get users thru usersQuery', async function() {
        let users = await usersQuery({group: 'subscriber'});

        assert.equal( users.users.length, 1 );

        // @todo: Get users with metadata

        users = await usersQuery({meta: {name: 'cup', value: 'big'}});

        assert.equal( users.users.length, 2 );

        return users;
    });

    it('Should validate user', async function() {
        let done = await validateUser( 'irene1@local.dev', 'Webdevenquiry@21' );

        assert.equal( done.ID, userId );

        return done;
    });

    it('Should check if user have granted read permission', async function() {
        let done = await isUserGranted( userId, 'read' );

        assert.isTrue(done);

        return done;
    });

    it('Should remove user from the database', async function() {
        let done = await dropUser(userId);

        assert.isTrue(done);

        return done;
    });

    it('Should get the list of users without filters', async function() {
        let users = await getUsers();

        assert.equal( users.length, 2 );

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

    it('Should get user meta in different parameters', async function() {
        let meta = await getUserMeta( userId, 'role', true );

        assert.equal( meta, 'subscriber' );

        meta = await getUserMeta( userId, 'role' );

        assert.equal( meta.length, 1 );

        return meta;
    });

    it('Should delete user meta', async function() {
        let done = await dropUserMeta( userId, 'role' );

        assert.isTrue(done);

        return done;
    });

    it('Should get all user meta', async function() {
        let meta = await getUserMeta(userId);

        assert.equal( _.keys(meta).length, 2 );

        return meta;
    });

    it('Should get users where group = subscriber', async function() {
        let users = await usersQuery({group: 'subscriber'});

        assert.equal( users.users.length, 1 );

        return users;
    });

    it('Should get users that are a member of group = subscriber, author', async function() {
        let users = await usersQuery({group__in: ['subscriber', 'author']});

        assert.equal( users.users.length, 1 );

        return users;
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