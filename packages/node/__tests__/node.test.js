'use strict';

const node = require('..');
const assert = require('assert').strict;

assert.strictEqual(node(), 'Hello from node');
console.info('node tests passed');
