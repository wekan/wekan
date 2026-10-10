'use strict';

// #6755: "shortcut not working ... i have to disable and reenable shortcuts".
// The users schema stored profile.keyboardShortcuts: false for every new user
// (defaultValue: false) while isKeyboardShortcuts() treats a missing value as
// ON (`keyboardShortcuts = true`, since "Enable keyboard shortcuts by
// default"). So new accounts had shortcuts off while the code meant them on,
// until the user toggled them off and on.
//
// This pins it for every profile boolean, not only that one: wherever a helper
// in models/users.js reads `const { name = X } = this.profile`, the schema's
// defaultValue for 'profile.name' must be the same X.
// Run: node tests/profileBooleanDefaults.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const users = fs.readFileSync(path.join(__dirname, '..', 'models', 'users.js'), 'utf8');

const schemaDefaults = new Map();
const schemaRe = /'profile\.(\w+)':\s*\{[^{}]*?type:\s*Boolean,[^{}]*?defaultValue:\s*(true|false)/g;
for (const m of users.matchAll(schemaRe)) schemaDefaults.set(m[1], m[2] === 'true');

const helperDefaults = [];
const helperRe = /const \{ (\w+) = (true|false) \} = this\.profile/g;
for (const m of users.matchAll(helperRe)) helperDefaults.push([m[1], m[2] === 'true']);

assert.ok(schemaDefaults.has('keyboardShortcuts'), 'the schema declares profile.keyboardShortcuts');
assert.equal(schemaDefaults.get('keyboardShortcuts'), true, 'keyboard shortcuts are on for a new user');
assert.ok(helperDefaults.some(([name]) => name === 'keyboardShortcuts'));
// Not vacuous: several profile booleans are read with a default.
assert.ok(helperDefaults.length >= 3, `helpers with a default were found (${helperDefaults.length})`);

// Negative: no profile boolean anywhere is stored with one default and read
// with the other.
for (const [name, helperDefault] of helperDefaults) {
  if (!schemaDefaults.has(name)) continue;
  assert.equal(schemaDefaults.get(name), helperDefault,
    `profile.${name}: the schema stores ${schemaDefaults.get(name)} for a new user but the helper defaults to ${helperDefault}`);
}

console.log(`profileBooleanDefaults: ${helperDefaults.length} profile defaults agree with the schema`);
