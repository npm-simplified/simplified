#!/usr/bin/env node

const path = require('path');

global.ABSPATH = process.cwd();

require( path.resolve( ABSPATH, './index.js') );

// @todo: check if file exist

dbManager.install()
.then( check => {
    if ( isError(check) ) {
        console.error(check.message);
    }

    console.log('Installation successful.');

    return true;
});