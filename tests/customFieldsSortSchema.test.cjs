'use strict';

// Regression guard: models/customFields.js's `sort` field definition once
// carried `decimal: true`, a property SimpleSchema has never supported
// (its schemaDefinitionOptions list is autoValue/defaultValue/label/
// optional/required/type, plus WeKan's own extendOptions(['index',
// 'unique']) in imports/simpleSchema.js - 'decimal' is not among them,
// on any version). It compiled fine and even loaded under a plain Node
// require, since nothing here exercises SimpleSchema's own validation -
// but the moment the real Meteor server started, `new SimpleSchema(...)`
// threw synchronously: '[uncaughtException] WeKan is stopping: Error:
// Invalid definition for sort field: "decimal" is not a supported
// property', crashing boot before any board could load. Number already
// allows fractional values by default, so removing it changed nothing
// about what the field accepts.
//
// This is a source-read test (no Meteor): it can't instantiate the real
// SimpleSchema without the Meteor runtime, so it checks the shape
// directly against the known-valid property list instead.
//
// Run: node tests/customFieldsSortSchema.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// SimpleSchema's own schemaDefinitionOptions (autoValue, defaultValue, label,
// optional, required, type) plus the oneOfProps that may sit under `type`
// but are also accepted at the top level (allowedValues, blackbox, custom,
// exclusiveMax, exclusiveMin, max, maxCount, min, minCount, regEx,
// skipRegExCheckForEmptyStrings, trim), plus WeKan's own
// SimpleSchema.extendOptions(['index', 'unique']) in imports/simpleSchema.js.
const VALID_FIELD_KEYS = new Set([
  'autoValue', 'defaultValue', 'label', 'optional', 'required', 'type',
  'allowedValues', 'blackbox', 'custom', 'exclusiveMax', 'exclusiveMin',
  'max', 'maxCount', 'min', 'minCount', 'regEx',
  'skipRegExCheckForEmptyStrings', 'trim',
  'index', 'unique',
]);

console.log('customFieldsSortSchema:');

test('models/customFields.js sort field has no "decimal" property (or any other unsupported one)', () => {
  const src = fs.readFileSync(path.join(ROOT, 'models', 'customFields.js'), 'utf8');
  const block = /\bsort:\s*\{([\s\S]*?)\n\s{4}\},/.exec(src);
  assert.ok(block, 'customFields.js must still define a top-level sort field');
  const keys = [...block[1].matchAll(/^\s*([a-zA-Z]+)\s*[:(]/gm)].map(m => m[1]);
  assert.ok(keys.includes('type'), 'sort field keeps its type');
  const invalid = keys.filter(k => !VALID_FIELD_KEYS.has(k));
  assert.deepStrictEqual(invalid, [],
    `sort field defines propert${invalid.length === 1 ? 'y' : 'ies'} SimpleSchema does not `
    + `support and will throw on at boot: ${invalid.join(', ')}`);
});

test('no field definition anywhere under models/ uses the removed "decimal" property (negative, whole tree)', () => {
  const offenders = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.js') && /\bdecimal\s*:/.test(fs.readFileSync(full, 'utf8'))) {
        offenders.push(path.relative(ROOT, full));
      }
    }
  };
  walk(path.join(ROOT, 'models'));
  assert.deepStrictEqual(offenders, [],
    `these files still use the unsupported "decimal" schema property: ${offenders.join(', ')}`);
});

console.log(`\ncustomFieldsSortSchema: ${passed} tests passed`);
