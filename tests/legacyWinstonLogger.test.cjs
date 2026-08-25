'use strict';

// Regression coverage for #1094. The optional Winston/Zulip observer replaced
// Meteor's default console transport during startup and could prevent WeKan
// from connecting to its database. It was reverted in 2017; keep the removed
// startup hook and its dependencies from being accidentally advertised or
// restored.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('the startup logger and database observer remain removed', () => {
  assert.strictEqual(fs.existsSync(path.join(root, 'server/logger.js')), false);
  assert.strictEqual(fs.existsSync(path.join(root, 'server/observableChanges.js')), false);
});

test('Winston and its Zulip transport are not application dependencies', () => {
  const pkg = JSON.parse(read('package.json'));
  for (const group of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    const dependencies = pkg[group] || {};
    assert.strictEqual(dependencies.winston, undefined);
    assert.strictEqual(dependencies['winston-zulip'], undefined);
  }
});

test('Docker keeps its database URL and no longer advertises the removed logger', () => {
  const compose = read('docker-compose.yml');
  assert.match(compose, /MONGO_URL=mongodb:\/\/ferretdb:27017\/wekan/);
  assert.doesNotMatch(compose, /Console, file, and zulip logger on database changes/);
  assert.match(compose, /legacy Winston\/Zulip database-change logger was removed/);
});

console.log(`\nlegacyWinstonLogger: ${passed} tests passed`);
