'use strict';
// build.sh's source test mode (scripts/dev-source) stopped at startup with
// "Cannot find module 'meteor/aldeed:collection2/main'": server/main.js loads
// collection2's main module before the models (2699f4deea), and the source
// runtime resolved only a bare `meteor/<package>`. It now maps
// `meteor/<package>/main` to the same package exports.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const runtime = fs.readFileSync(path.join(root, 'scripts/dev-source/runtime.cjs'), 'utf8');
const mainJs = fs.readFileSync(path.join(root, 'server/main.js'), 'utf8');

// The resolver's own regular expression, taken from the runtime.
const pattern = new RegExp(runtime.match(/const mainModule = \/(.+)\/\.exec\(id\);/)[1]);

test('the runtime maps meteor/<package>/main to the package', () => {
  assert.match(runtime, /if \(mainModule && Package\[mainModule\[1\]\]\) return path\.join\(state, 'meteor', mainModule\[1\] \+ '\.js'\);/);
  assert.equal(pattern.exec('meteor/aldeed:collection2/main')[1], 'aldeed:collection2');
});

test('every meteor/<package>/<path> import in the server entry is one the runtime resolves', () => {
  const ids = [...mainJs.matchAll(/require\('(meteor\/[^']+\/[^']+)'\)/g)].map(m => m[1]);
  assert.ok(ids.includes('meteor/aldeed:collection2/main'), 'the import this fixes is still there');
  for (const id of ids) assert.ok(pattern.test(id), `${id} resolves in source mode`);
});

test('negative: deeper or other sub-paths are not taken for the main module', () => {
  for (const id of ['meteor/aldeed:collection2/lib/x', 'meteor/aldeed:collection2/main/x', 'meteor/aldeed:collection2', 'aldeed:collection2/main']) {
    assert.equal(pattern.test(id), false, id);
  }
});
