'use strict';

// #6811: a minicard shows only the custom fields that hold a value, as it did
// before its sections were rewritten (1d4ffd4080 dropped the 2019 check of
// e2a374f0aa). A field a card carries because it is "automatically on card" /
// "always on card" is null until someone fills it in; drawing those gave every
// minicard a stack of empty rows. From the reporter's patch.
// Run: node tests/minicardFilledCustomFields6811.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

(async () => {
  const { hasCustomFieldValue } = await import('../models/lib/customFieldsWD.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };
  console.log('minicardFilledCustomFields6811:');

  test('empty values are not shown', () => {
    for (const empty of [null, undefined, '', '   ', []]) {
      assert.strictEqual(hasCustomFieldValue(empty), false, JSON.stringify(empty));
    }
  });

  test('negative: 0, false, a date and a selection are values', () => {
    // The 2019 check hid 0 and an unticked checkbox; those are answers.
    for (const value of [0, false, true, 'BVH 123', new Date('2026-10-26'), ['item1'], 12.5]) {
      assert.strictEqual(hasCustomFieldValue(value), true, String(value));
    }
  });

  test('the minicard draws a field only when it has a value', () => {
    const jade = read('client/components/cards/minicard.jade');
    assert.match(jade, /each customFieldsWD\n\s+if definition\.showOnCard\n(\s+\/\/-[^\n]*\n(\s{20,}[^\n]*\n)*)?\s+if minicardCustomFieldHasValue\n\s+\.minicard-custom-field\n/);
    assert.match(read('client/components/cards/minicard.js'),
      /minicardCustomFieldHasValue\(\) \{\n\s+const \{ hasCustomFieldValue \} = require\('\/models\/lib\/customFieldsWD'\);\n\s+return hasCustomFieldValue\(this && this\.value\);/);
  });

  test('negative: no other minicard row of a custom field skips the check', () => {
    const jade = read('client/components/cards/minicard.jade');
    // Every .minicard-custom-field is drawn under the one check.
    const rows = [...jade.matchAll(/\.minicard-custom-field\n/g)].map(m => m.index);
    assert.strictEqual(rows.length, 1, 'one row template');
    const check = jade.indexOf('if minicardCustomFieldHasValue');
    assert.ok(check !== -1 && check < rows[0] && rows[0] - check < 60);
    // The opened card is unchanged: it still lists every field it carries.
    assert.ok(!/hasCustomFieldValue|minicardCustomFieldHasValue/.test(read('client/components/cards/cardCustomFields.jade')));
  });

  console.log(`minicardFilledCustomFields6811: ${passed} passed`);
})().catch(error => { console.error(error); process.exit(1); });
