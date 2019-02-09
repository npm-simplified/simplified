'use strict';

const path = require('path'),
    gettext = require('gettext-parser'),
    Languages = {};

const addLanguages = async function( slug, dir ) {
    if ( Languages[slug] ) {
        // No same slug allowed
    }

    let files = await readDir(dir).catch(errorHandler);

    if ( files && files.error ) {

    }
};
setGlobalVar( 'addLanguages', addLanguages );

const __t = function( str, slug ) {
    return str;
};
setGlobalVar( '__t', __t );

const __n = function( singleStr, pluralStr, count, slug ) {
    return str;
};
setGlobalVar( '_n', __n );