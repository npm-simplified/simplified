'use strict';

let Request,
    Response;

const $_GET = function(key) {
    if ( ! key ) {
        return Request.query;
    }

    return Request.query[key];
};

const $_POST = function(key) {
    if ( 'get' === Request.method ) {
        return {};
    }

    if ( ! key ) {
        return Request.body;
    }

    return Request.body[key];
};

const $_COOKIE = function(name) {
    let cookies = Request.cookies,
        setCookie = function( value, expires, cookiePath, cookieDomain, isSSl, httpOnly, sameSite ) {
            let args = {
                maxAge: expires,
                path: cookiePath || '/',
                domain: cookieDomain || Request.hostname,
                httpOnly: httpOnly,
                secure: isSSl,
                sameSite: sameSite || true
            };

            Response.cookie( name, value, args );
        };

    return {
        get: function() {
            return cookies && cookies[name];
        },

        set: function( value, expires, cookiePath, cookieDomain, isSSl, httpOnly, sameSite ) {
            return setCookie( value, expires, cookiePath, cookieDomain, isSSl, httpOnly, sameSite );
        },

        clear: function() {
            return setCookie( -1, -1 );
        }
    }
};

module.exports = function(req, res, next) {
    Request = req;
    Response = res;

    global.$_GET = $_GET;
    global.$_POST = $_POST;
    global.$_COOKIE = $_COOKIE;

    next();
};