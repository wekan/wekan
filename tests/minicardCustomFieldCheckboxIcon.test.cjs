'use strict';

// GitHub issue #3142 (CarloRampini): a checkbox-type custom field shown on a
// minicard rendered its true/false value as plain text (or a bare
// materialCheckBox square) - "This will allow to display read-only values
// like true/false and yes/no with icons" such as a tick or a cross.
// Run: node tests/minicardCustomFieldCheckboxIcon.test.cjs
//
// Fix: the minicard template now renders a Font Awesome fa-check-circle /
// fa-times-circle icon for a `checkbox`-type custom field, in both the
// "label at left, value at right" and the "no label, full width" branches.
// Every other custom field type (currency, date, stringtemplate, text,
// number, dropdown, multi-select) is unchanged - it still goes through the
// generic `+viewer = trueValue` / dedicated helper path.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('minicardCustomFieldCheckboxIcon:');

const minicardJade = read('client/components/cards/minicard.jade');

test('a checkbox-type custom field renders a tick/cross FA icon on the minicard', () => {
  const checkboxBranches = minicardJade
    .split('\n')
    .filter(l => /\$eq definition\.type "checkbox"/.test(l));
  assert.ok(checkboxBranches.length >= 2,
    'both the labelled and the full-width branches must handle the checkbox type');

  assert.ok(/i\.fa\.minicard-custom-field-checkbox-icon/.test(minicardJade),
    'the checkbox value must render as a Font Awesome icon element');
  assert.ok(/fa-check-circle minicard-custom-field-checkbox-true/.test(minicardJade),
    'a true value gets the check icon');
  assert.ok(/fa-times-circle minicard-custom-field-checkbox-false/.test(minicardJade),
    'a false value gets the times icon');
});

test('the icon is not plain text and does not reuse the generic value viewer (negative)', () => {
  // Slice out just the checkbox branches (the two lines right after each
  // `$eq definition.type "checkbox"` match) and confirm neither one falls
  // back to the generic `+viewer = trueValue` text path or the bare
  // `.materialCheckBox` square the old code used.
  const lines = minicardJade.split('\n');
  lines.forEach((line, i) => {
    if (/\$eq definition\.type "checkbox"/.test(line)) {
      const nextLine = lines[i + 1];
      assert.ok(!/\.materialCheckBox/.test(nextLine),
        'checkbox must no longer render the plain materialCheckBox square');
      assert.ok(!/\+viewer/.test(nextLine),
        'checkbox must not fall through to the generic text viewer');
    }
  });
});

test('the icon carries a title tooltip using the existing yes/no i18n keys, not new ones', () => {
  assert.ok(/title="\{\{#if value\}\}\{\{_ 'yes'\}\}\{\{else\}\}\{\{_ 'no'\}\}\{\{\/if\}\}"/
    .test(minicardJade),
    'the tooltip must reuse the existing "yes"/"no" i18n keys');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.ok(Object.prototype.hasOwnProperty.call(en, 'yes') &&
    Object.prototype.hasOwnProperty.call(en, 'no'),
    'those keys must already exist in en.i18n.json - no new key was needed');
});

test('other custom field types keep their existing rendering, unchanged (negative)', () => {
  assert.ok(/formattedCurrencyCustomFieldValue\(definition\)/.test(minicardJade),
    'currency still uses its dedicated formatter');
  assert.ok(/formattedStringtemplateCustomFieldValue\(definition\)/.test(minicardJade),
    'stringtemplate still uses its dedicated formatter');
  assert.ok(/\+minicardCustomFieldDate/.test(minicardJade),
    'date still uses its dedicated template');
  assert.ok(/\+viewer\s*\n\s*= trueValue/.test(minicardJade),
    'the generic text/number/dropdown/multi-select fallback (+viewer = trueValue) is still present');
});

test('the full card-detail checkbox editor is untouched', () => {
  const cardCustomFields = read('client/components/cards/cardCustomFields.jade');
  assert.ok(/\.check-box\.materialCheckBox/.test(cardCustomFields),
    'the card-detail view keeps its real checkbox input widget - only the minicard changed');
  assert.ok(!/minicard-custom-field-checkbox-icon/.test(cardCustomFields),
    'the new minicard-only icon markup must not leak into the card-detail editor');
});

console.log(`\nminicardCustomFieldCheckboxIcon: ${passed} tests passed`);
