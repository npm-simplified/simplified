'use strict';

require('../lib/load');

const dbManager = require('../lib/db');

let config = {
    database: 'mysql',
    dbName: 'simplified',
    dbUser: 'root',
    dbPass: 'root',
    prefix: 'cjms_'
};
global.dbManager = dbManager(config);