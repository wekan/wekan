'use strict';

// sandstorm.js holds the code a grain needs IN THE BROWSER: the postMessage
// bridge to the Sandstorm shell (the grain URL and title follow the board, the
// Powerbox picker opens), the relative Meteor.absoluteUrl, and the isSandstorm
// template helper that hides what Sandstorm handles itself (email, password,
// logout, avatar upload). Since `mainModule` turned eager loading off, only
// server/imports.js imported it, so none of that ever ran in a browser. It is
// now split: sandstorm.js is shared and imported by the client too, and the
// server half - which loads the Cap'n Proto bridge client, and with it node:net
// - is server/sandstorm.js, which the client bundle must never reach.
// Run: node tests/sandstormClientHalf.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const shared = read('sandstorm.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('sandstormClientHalf:');

test('the client loads the shared half, the server loads both', () => {
  assert.match(read('client/imports.js'), /^import '\/sandstorm';$/m);
  const server = read('server/imports.js');
  assert.match(server, /^import '\/sandstorm';$/m);
  assert.match(server, /^import '\/server\/sandstorm';$/m);
});

test('the shared half carries nothing that only runs on a server (negative)', () => {
  for (const [pattern, why] of [
    [/meteor\/webapp/, 'WebApp handlers'],
    [/require\(['"]fs['"]\)|from ['"](node:)?fs['"]/, 'the filesystem'],
    [/bridgeClient/, 'the Cap\'n Proto client and node:net'],
    [/from ['"]node:/, 'a Node built-in'],
    [/Meteor\.isServer/, 'a server block'],
    [/Meteor\.methods\(/, 'server methods'],
  ]) {
    assert.doesNotMatch(shared, pattern, `sandstorm.js must not contain ${why}`);
  }
});

test('no client code imports the server half (negative)', () => {
  const hits = spawnSync('git', ['grep', '-l', '-E', "['\"]/server/sandstorm['\"]", '--', 'client', 'imports', 'models', 'config', 'sandstorm.js'],
    { cwd: ROOT, encoding: 'utf8' }).stdout.trim();
  assert.strictEqual(hits, '', hits);
});

test('the shell bridge ignores messages that are not its replies', () => {
  assert.doesNotMatch(shared, /throw new Error\(`got unexpected postMessage/,
    'other frames and extensions post messages too; throwing on them broke the page');
  assert.doesNotMatch(shared, /throw new Error\(`no such rpc ID/);
});

test('the grain URL, title and isSandstorm helper are set up on the client', () => {
  const client = shared.slice(shared.indexOf('if (isSandstorm && Meteor.isClient) {'));
  assert.ok(client.length > 0, 'a client block');
  assert.match(client, /setPath:/);
  assert.match(client, /setTitle: document\.title/);
  assert.match(client, /window\.sandstormRequestIdentity = function\(boardId\)/);
  assert.match(shared, /^Blaze\.registerHelper\('isSandstorm', isSandstorm\);$/m);
  assert.match(shared, /^import \{ Blaze \} from 'meteor\/blaze';$/m);
  assert.match(shared, /^import \{ Tracker \} from 'meteor\/tracker';$/m);
});

console.log(`\nsandstormClientHalf: ${passed} tests passed`);
