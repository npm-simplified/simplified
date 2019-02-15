#!/usr/bin/env node

const [,,...args] = process.argv,
    path = require('path');

global.ABSPATH = process.cwd();

console.log(ABSPATH);