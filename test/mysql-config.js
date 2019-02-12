'use strict';

let config = {
    database: {
        type: 'mysql',
        name: 'simplified',
        user: 'root',
        pass: 'root',
        prefix: 'cjms_'
    }
};

require('../lib/load')(config);