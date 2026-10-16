'use strict';

// Every literal translation key a Jade template asks for ({{_ 'key'}}) must
// exist in imports/i18n/data/en.i18n.json. A missing key is not an error at
// runtime: TAPi18n shows the key itself, so the sidebar filter's Due group
// was headed "dueAt", the Scrum sprint form said "end" and "no-cards", and
// the passkey trash icon's tooltip read "remove". Each now uses the existing
// key with that wording, so every language that already translates it shows
// it translated.
//
// The negative sweep reads every template under client/, so a key misspelt
// or never added cannot reach a page anywhere.
//
// Run: node tests/templateI18nKeysExist.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const en = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'imports/i18n/data/en.i18n.json'), 'utf8'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name.endsWith('.jade')) out.push(full);
  }
  return out;
}

const uses = [];
for (const file of walk(path.join(ROOT, 'client'))) {
  fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/\{\{\{?_\s+['"]([^'"]+)['"]/g)) {
      uses.push({ key: m[1], where: `${path.relative(ROOT, file)}:${i + 1}` });
    }
  });
}

console.log('templateI18nKeysExist:');

test('the scan finds the templates\' translation keys', () => {
  assert.ok(uses.length > 1000, `found only ${uses.length} keys`);
});

test('the keys that were missing now use existing ones', () => {
  const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
  assert.ok(read('client/components/sidebar/sidebarFilters.jade').includes("legend {{_ 'due-date'}}"));
  const scrum = read('client/components/boards/scrum/scrumView.jade');
  for (const key of ['card-end', 'no-cards-found', 'custom-fields']) {
    assert.ok(scrum.includes(`{{_ '${key}'}}`), `scrumView uses ${key}`);
  }
  assert.ok(read('client/components/users/userHeader.jade').includes("title=\"{{_ 'remove-btn'}}\""));
});

test('every literal key a template asks for exists in en.i18n.json (negative)', () => {
  const missing = uses.filter(u => !Object.prototype.hasOwnProperty.call(en, u.key))
    .map(u => `${u.where}: '${u.key}'`);
  assert.deepStrictEqual(missing, [],
    'these templates would show the raw key instead of a translation');
});

console.log(`\ntemplateI18nKeysExist: ${passed} tests passed`);
