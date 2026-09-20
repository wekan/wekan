'use strict';

const path = require('node:path');

// Run the existing Meteor server entry in this source-loaded process, with the
// same installed Mocha version as meteortesting:mocha-core. No test copy or
// second Meteor build is involved.
module.exports = async function runServerTests({
  root,
  packagePath,
  versions
}) {
  const Mocha = require(path.join(packagePath('meteortesting:mocha-core', versions['meteortesting:mocha-core']), 'npm/node_modules/mocha'));
  const mocha = new Mocha({
    reporter: 'spec',
    timeout: 10000,
    bail: process.env.WEKAN_TEST_BAIL === '1'
  });
  if (process.env.MOCHA_GREP) mocha.grep(process.env.MOCHA_GREP);
  mocha.suite.emit('pre-require', global, path.join(root, 'server/lib/tests/index.js'), mocha);
  Meteor.isTest = true;
  require(path.join(root, 'server/lib/tests/index.js'));
  return new Promise(resolve => mocha.run(failures => resolve(failures ? 1 : 0)));
};
