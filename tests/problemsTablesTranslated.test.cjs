'use strict';

// The Problems report tables wrote their column names, filter labels and
// options in English in the code ("Title", "Archived?", "Show", "All" ...), and
// the Email pane its "Email service" and "Enable below email settings": found
// by spec 47 on 2026-11-24. Each is a translation key now.
// Run: node --test tests/problemsTablesTranslated.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
// Field names of a rule's stored action and trigger: the same in every language.
const IDENTIFIERS = new Set(['actionType', 'activityType']);

test('every column and filter of the Problems tables is named by a translation key', () => {
  const src = read('client/components/settings/adminProblems.js');
  const keys = [...src.matchAll(/labelKey: '([^']+)'/g)].map(m => m[1]);
  assert.ok(keys.length >= 42, `the tables use keys (${keys.length})`);
  assert.deepEqual(keys.filter(k => !(k in en)), [], 'every key exists in en.i18n.json');
});

test('negative: no plain English label is left in the Problems tables', () => {
  const src = read('client/components/settings/adminProblems.js');
  const plain = [...src.matchAll(/\blabel: '([^']+)'/g)].map(m => m[1]).filter(l => !IDENTIFIERS.has(l));
  assert.deepEqual(plain, []);
});

test('the Email pane names its service select and its switch through keys', () => {
  const jade = read('client/components/settings/settingBody.jade');
  assert.match(jade, /label\.title\(for="mail-service"\) \{\{_ 'admin-email-service'\}\}/);
  assert.match(jade, /span \{\{_ 'admin-email-settings-enable'\}\}/);
  assert.doesNotMatch(jade, /Email service$|Enable below email settings/m);
});
