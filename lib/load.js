'use strict';

require('./utils');
require('./hook');
require('./filesystem');
require('./i18n');
require('./cache');
require('./user');

// Always clear hooks on first load
//clearHooks();

require('./events/user');