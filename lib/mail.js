'use strict';

const applyMailTokens = async function( message, tokens ) {
    tokens = tokens || {};

    /**
     * Filter mail tokens to allow insertion of additional token data.
     *
     * @param {object} tokens
     */
    tokens = await appFilter('mailTokens').apply( tokens );

    message = message.replace( /^{(?)}$/g, x => {
        if ( tokens[x] ) {
            return tokens[x];
        }

        return x;
    });

    return message;
};

const getMailFrom = function() {
    return 'MAIL FROM HERE:';
};

const sendMail = async function( mailArgs ) {
    let errors = [];

    let {to, subject, message} = mailArgs;

    if ( ! to || ! to.length ) {
        errors.push( __t('Specify where to send you email.') );
    }

    if ( ! subject ) {
        errors.push( __t('Email subject is required.') );
    }

    if ( ! message ) {
        errors.push( __t('No message to send.') );
    }

    if ( errors.length ) {
        return reject(errors);
    }

    let {tokens, headers, attachment, format, cc, bcc} = mailArgs;
    format = format || 'plain';

    message = await applyMailTokens( message, tokens );

    headers = await appFilter('mailHeaders').apply(headers);

    format = await appFilter('mailFormat').apply(format);

    // Send mail here

    // @todo: if to is an array, check for pool mail setting otherwise send the mail individually
};
setGlobalVar( 'sendMail', sendMail );

module.exports = function(config) {
    let {mailer} = config;

    // Set mailer here
};