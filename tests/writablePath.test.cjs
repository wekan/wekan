'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { resolveWritablePath } = require('../models/lib/writablePath');

assert.equal(resolveWritablePath({
  writablePath: '..',
  launchDirectory: '/home/user/repos/wekan',
  runtimeDirectory: '/home/user/repos/wekan/.meteor/local/build/programs/server',
}), path.normalize('/home/user/repos'));

assert.equal(resolveWritablePath({
  writablePath: '/data',
  launchDirectory: '/ignored',
  runtimeDirectory: '/ignored-too',
}), path.normalize('/data'));

assert.equal(resolveWritablePath({
  launchDirectory: '/launch-is-not-used-without-a-setting',
  runtimeDirectory: '/runtime/server',
}), path.normalize('/runtime/server'));

console.log('writablePath: relative launcher and absolute deployment paths passed');
