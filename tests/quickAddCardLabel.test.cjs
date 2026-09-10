'use strict';
(async () => {

// Unit + negative tests for GitHub issue #3986: quick-add-card bracket label
// syntax. Typing "[Fedora] Do a thing" in the quick-add-card textarea should
// create a card titled "Do a thing" labeled "Fedora", creating the label on
// the board first if it doesn't already exist.
// Run: node tests/quickAddCardLabel.test.cjs

const assert = require('assert');
const {
  parseQuickAddCardLabel,
  findExistingLabelIdByName,
  pickDefaultLabelColor,
} = await import('../models/lib/quickAddCardLabel.js');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// ── parseQuickAddCardLabel ──────────────────────────────────────────────────

check('#3986: "[Fedora] Do a thing" splits into label + title', () => {
  const { title, labelName } = parseQuickAddCardLabel('[Fedora] Do a thing');
  assert.strictEqual(labelName, 'Fedora');
  assert.strictEqual(title, 'Do a thing');
});

check('extra whitespace around the bracket content and rest is trimmed', () => {
  const { title, labelName } = parseQuickAddCardLabel('[  Fedora  ]   Do a thing  ');
  assert.strictEqual(labelName, 'Fedora');
  assert.strictEqual(title, 'Do a thing');
});

check('no bracket prefix leaves the title unchanged and labelName null', () => {
  const { title, labelName } = parseQuickAddCardLabel('Do a thing');
  assert.strictEqual(labelName, null);
  assert.strictEqual(title, 'Do a thing');
});

check('(negative) empty brackets "[] Do a thing" is treated as literal text', () => {
  const { title, labelName } = parseQuickAddCardLabel('[] Do a thing');
  assert.strictEqual(labelName, null);
  assert.strictEqual(title, '[] Do a thing');
});

check('(negative) a bracket with nothing after it is treated as literal text', () => {
  const { title, labelName } = parseQuickAddCardLabel('[Fedora]');
  assert.strictEqual(labelName, null);
  assert.strictEqual(title, '[Fedora]');
});

check('(negative) whitespace-only bracket content is treated as literal text', () => {
  const { title, labelName } = parseQuickAddCardLabel('[   ] Do a thing');
  assert.strictEqual(labelName, null);
  assert.strictEqual(title, '[   ] Do a thing');
});

check('(negative) nested brackets are left as literal text, not parsed', () => {
  const { title, labelName } = parseQuickAddCardLabel('[a[b]] Do a thing');
  assert.strictEqual(labelName, null);
  assert.strictEqual(title, '[a[b]] Do a thing');
});

check('(negative) a bracket not at the very start is left as literal text', () => {
  const { title, labelName } = parseQuickAddCardLabel('Do a [thing]');
  assert.strictEqual(labelName, null);
  assert.strictEqual(title, 'Do a [thing]');
});

check('a title starting with "[" but no closing "]" is literal text', () => {
  const { title, labelName } = parseQuickAddCardLabel('[Fedora Do a thing');
  assert.strictEqual(labelName, null);
  assert.strictEqual(title, '[Fedora Do a thing');
});

check('null/undefined input does not throw and reports no label', () => {
  assert.deepStrictEqual(parseQuickAddCardLabel(null), { title: null, labelName: null });
  assert.deepStrictEqual(parseQuickAddCardLabel(undefined), { title: undefined, labelName: null });
});

// ── findExistingLabelIdByName ───────────────────────────────────────────────

const L = (name, color) => ({ _id: name + '-id', name, color });
const BOARD_LABELS = [L('Fedora', 'green'), L('Ubuntu', 'orange'), L('', 'blue')];

check('finds an existing label case-insensitively', () => {
  assert.strictEqual(findExistingLabelIdByName(BOARD_LABELS, 'fedora'), 'Fedora-id');
  assert.strictEqual(findExistingLabelIdByName(BOARD_LABELS, 'FEDORA'), 'Fedora-id');
  assert.strictEqual(findExistingLabelIdByName(BOARD_LABELS, 'Fedora'), 'Fedora-id');
});

check('(negative) returns null when no label matches', () => {
  assert.strictEqual(findExistingLabelIdByName(BOARD_LABELS, 'Debian'), null);
});

check('(negative) tolerates missing/empty inputs', () => {
  assert.strictEqual(findExistingLabelIdByName(null, 'Fedora'), null);
  assert.strictEqual(findExistingLabelIdByName(undefined, 'Fedora'), null);
  assert.strictEqual(findExistingLabelIdByName(BOARD_LABELS, ''), null);
  assert.strictEqual(findExistingLabelIdByName(BOARD_LABELS, null), null);
});

// ── pickDefaultLabelColor ───────────────────────────────────────────────────

check('picks the first palette color not already used on the board', () => {
  const labels = [L('a', 'green'), L('b', 'yellow')];
  const color = pickDefaultLabelColor(labels, ['green', 'yellow', 'orange', 'red']);
  assert.strictEqual(color, 'orange');
});

check('(negative) falls back to the first palette color when all are used', () => {
  const labels = [L('a', 'green'), L('b', 'yellow')];
  const color = pickDefaultLabelColor(labels, ['green', 'yellow']);
  assert.strictEqual(color, 'green');
});

check('(negative) tolerates an empty/missing palette and label list', () => {
  assert.strictEqual(pickDefaultLabelColor([], []), 'green');
  assert.strictEqual(pickDefaultLabelColor(null, null), 'green');
  assert.strictEqual(pickDefaultLabelColor(null, ['red']), 'red');
});

// ── source guard: listBody.js wires the bracket syntax into quick-add ──────
check('listBody.js addCard uses parseQuickAddCardLabel for the quick-add title', () => {
  const fs = require('fs');
  const path = require('path');
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'client', 'components', 'lists', 'listBody.js'),
    'utf8',
  );
  assert.ok(/parseQuickAddCardLabel\(rawTitle\)/.test(src),
    'addCard must parse the raw quick-add title through parseQuickAddCardLabel');
  assert.ok(/findExistingLabelIdByName\(board\.labels, quickAddLabelName\)/.test(src),
    'addCard must resolve the bracket label name against the board\'s existing labels');
});

console.log(`\nquickAddCardLabel: ${passed} checks passed`);

})().catch(e => { console.error(e); process.exit(1); });
