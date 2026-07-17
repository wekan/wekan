'use strict';

// Tests for the "Select Color" theme categories (models/lib/themeCategories.js):
// the category partition, the custom-color gating (flat=1, clear=2, dark/special=0),
// and the custom-colors validator — including negative cases. Also a source guard
// that the partition exactly covers config/const.js ALLOWED_BOARD_COLORS.
//
// Run: node tests/themeCategories.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const TC = require('../models/lib/themeCategories.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('categories partition into flat/clear/dark/special in order', () => {
  assert.deepStrictEqual(TC.THEME_CATEGORY_ORDER, ['flat', 'clear', 'dark', 'special']);
  assert.deepStrictEqual(TC.colorsInCategory('clear'), ['clearblue']);
  assert.deepStrictEqual(TC.colorsInCategory('dark'), ['midnight', 'dark', 'moderndark', 'exodark', 'cleandark']);
  assert.strictEqual(TC.colorsInCategory('flat').length, 9);
  assert.strictEqual(TC.colorsInCategory('special').length, 4);
});

test('categoryOf maps each color, null for unknown', () => {
  assert.strictEqual(TC.categoryOf('belize'), 'flat');
  assert.strictEqual(TC.categoryOf('clearblue'), 'clear');
  assert.strictEqual(TC.categoryOf('moderndark'), 'dark');
  assert.strictEqual(TC.categoryOf('corteza'), 'special');
  assert.strictEqual(TC.categoryOf('nope'), null); // negative
  assert.strictEqual(TC.categoryOf(undefined), null); // negative
});

test('custom colors: flat=1, clear=2, dark/special=0', () => {
  assert.strictEqual(TC.customColorCount('flat'), 1);
  assert.strictEqual(TC.customColorCount('clear'), 2);
  assert.strictEqual(TC.customColorCount('dark'), 0); // negative
  assert.strictEqual(TC.customColorCount('special'), 0); // negative
  assert.strictEqual(TC.allowsCustomColor('flat'), true);
  assert.strictEqual(TC.allowsCustomColor('clear'), true);
  assert.strictEqual(TC.allowsCustomColor('dark'), false); // negative
  assert.strictEqual(TC.allowsCustomColor('special'), false); // negative
});

test('isValidCustomColors enforces category + count + hex', () => {
  // flat: exactly one hex
  assert.strictEqual(TC.isValidCustomColors('belize', ['#0a1b2c']), true);
  assert.strictEqual(TC.isValidCustomColors('belize', ['#0a1b2c', '#ffffff']), false); // too many
  assert.strictEqual(TC.isValidCustomColors('belize', []), false); // too few
  assert.strictEqual(TC.isValidCustomColors('belize', ['red']), false); // not hex
  assert.strictEqual(TC.isValidCustomColors('belize', ['#fff']), false); // short hex
  // clear: exactly two hex (color slide)
  assert.strictEqual(TC.isValidCustomColors('clearblue', ['#000000', '#ffffff']), true);
  assert.strictEqual(TC.isValidCustomColors('clearblue', ['#000000']), false); // too few
  // dark/special: never allowed
  assert.strictEqual(TC.isValidCustomColors('dark', ['#000000']), false);
  assert.strictEqual(TC.isValidCustomColors('corteza', ['#000000']), false);
  assert.strictEqual(TC.isValidCustomColors('unknown', ['#000000']), false);
});

// --- source guard: the partition covers ALLOWED_BOARD_COLORS exactly ---
test('partition equals config/const.js ALLOWED_BOARD_COLORS (no gaps/extras)', () => {
  const repoRoot = path.resolve(__dirname, '..');
  const src = fs.readFileSync(path.join(repoRoot, 'config/const.js'), 'utf8');
  const block = src.slice(src.indexOf('ALLOWED_BOARD_COLORS = ['));
  const arr = block.slice(0, block.indexOf(']'));
  const allowed = (arr.match(/'([a-z]+)'/g) || []).map(s => s.replace(/'/g, ''));
  const union = TC.THEME_CATEGORY_ORDER.flatMap(c => TC.colorsInCategory(c));
  assert.deepStrictEqual([...union].sort(), [...allowed].sort(),
    'every board color is categorized exactly once and no extras exist');
});

console.log(`\nAll ${passed} theme-category tests passed`);
