'use strict';

const crypto = require('crypto'),
    encoding = 'aes-256-cbc',
    type = 'base64';

const randomSalt = ( bytes, length, format ) => {
    bytes = bytes || 16;
    length = length || 64;
    format = format || type;

    return crypto.randomBytes(bytes)
        .toString(format)
        .slice( 0, length );
};
setGlobalVar( 'randomSalt', randomSalt );

const getSecretKey = () => {
    return randomSalt( 64, 32, 'hex' );
};

const passwordHash = async ( str ) => {
    let SECRET_KEY = getSecretKey();

    str = str.toString();

    return new Promise( res => {
        let iv = crypto.randomBytes(16),
            secretKey = Buffer.from(SECRET_KEY),
            cipher = crypto.createCipheriv( encoding, secretKey, iv );

        cipher.on('readable', () => {
            let key = cipher.read();

            if ( ! key ) {
                return res( errorHandler( __t('Something went wrong. Unable to encrypt the given key.') ) );
            }

            key = [iv.toString(type), key.toString(type), SECRET_KEY];

            res(key.join(';)'));
        });

        cipher.write(str);
        cipher.end();
    });
};
setGlobalVar( 'passwordHash', passwordHash );

const decrypt = async (hash) => {
    return new Promise( res => {
        let _hash = hash.split(';)'),
            secretKey = Buffer.from( _hash[2] ),
            iv, encrypt;

        iv = Buffer.from(_hash[0], type);
        encrypt = Buffer.from(_hash[1], type);

        let decipher = crypto.createDecipheriv( encoding, secretKey, iv );

        decipher.on('readable', () => {
            let match = decipher.read();

            if(!match) {
                return res( errorHandler(__t('Something went wrong. Unable to decrypt the given hash string.') ) );
            }

            match = match.toString();

            res(match);
        });
        decipher.write(encrypt);
        decipher.end();
    });
};
setGlobalVar( 'decrypt', decrypt );

const verifyHash = async function(name, hash) {
    return decrypt(hash)
        .then( str => {
            if ( str === name ) {
                return true;
            }

            return false;
        })
        .catch(errorHandler);
};
setGlobalVar( 'verifyHash', verifyHash );