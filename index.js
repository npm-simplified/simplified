'use strict';

const Simplified = require('./lib/simplified'),
    [,file] = process.argv,
    path = require('path');

module.exports = {
    listen: function( port, host, config, callback ) {
        let baseFile = path.basename(file);

        switch(baseFile) {
            case 'install.js' :
                return require('./lib/load')(config);

            default :
                return Simplified.listen.apply( this, arguments );
        }
    }
};