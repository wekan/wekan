'use strict';

// Clearing a card title or description (and a board description) writes the
// value '' - an edit, recorded in History, never a deletion, so Admin Panel /
// Problems / Delete has no part in it. collection2's default clean removes ''
// from $set and then throws "your modifier is now empty", so every write that
// can legitimately carry '' must say { removeEmptyStrings: false }. Without it
// the card details clear failed, and History's redo / Restore of a cleared value
// threw while its undo (putting the old text back) worked.
// UI: tests/playwright/specs/card-clear-undo-redo.e2e.js.
// Run: node tests/emptyStringClearWrites.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { diffFields, contentForDirection, valueFromContent } = require('../models/lib/changeHistoryGroups.js');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// An update cleaned the way collection2 does by default.
function collection2Update(doc, modifier, options = {}) {
  const set = { ...modifier.$set };
  for (const key of Object.keys(set)) {
    if (typeof set[key] === 'string' && options.trimStrings !== false) set[key] = set[key].trim();
    if (set[key] === '' && options.removeEmptyStrings !== false) delete set[key];
  }
  if (Object.keys(set).length === 0) {
    throw new Error('After filtering out keys not in the schema, your modifier is now empty');
  }
  return { ...doc, ...set };
}

// The REST block that starts at `marker`, up to where it marks the card updated.
function optionsAfter(source, marker) {
  const at = source.indexOf(marker);
  assert.ok(at >= 0, `missing ${marker}`);
  return source.slice(at, source.indexOf('updated =', at)).replace(/\/\/.*$/gm, '');
}

function body(source, start) {
  const at = source.indexOf(start);
  assert.ok(at >= 0, `missing ${start}`);
  return source.slice(at, source.indexOf('\n  },', at));
}

const history = read('server/models/changeHistory.js');
const applyField = body(history, 'async function applyFieldContent(');
const historyOptions = /removeEmptyStrings:\s*false/.test(applyField) && /trimStrings:\s*false/.test(applyField)
  ? { removeEmptyStrings: false, trimStrings: false } : {};

const [cleared] = diffFields('card', { _id: 'c', title: 'Old title' }, { _id: 'c', title: '' }, ['title']);

test('clearing a title records the old value as a removal', () => {
  assert.strictEqual(cleared.changeType, 'removed');
  assert.deepStrictEqual(cleared.previousContent, { field: 'title', value: 'Old title' });
  assert.deepStrictEqual(cleared.newContent, { field: 'title', value: '' });
});

test('undo, redo and Restore of a cleared title each write their value', () => {
  const card = { _id: 'c', title: '' };
  for (const [direction, expected] of [['undo', 'Old title'], ['redo', ''], ['restore', '']]) {
    const content = contentForDirection(cleared, direction);
    const value = valueFromContent(content);
    const written = collection2Update(card, { $set: { [content.field]: value } }, historyOptions);
    assert.strictEqual(written.title, expected, direction);
  }
});

test('negative: without the options, redo of a cleared value throws', () => {
  assert.throws(() => collection2Update({ _id: 'c' }, { $set: { title: '' } }), /modifier is now empty/);
  // A title of spaces is trimmed to '' and then removed: the REST 500.
  assert.throws(() => collection2Update({ _id: 'c' }, { $set: { title: '   ' } }, { removeEmptyStrings: true }),
    /modifier is now empty/);
  assert.strictEqual(collection2Update({ _id: 'c' }, { $set: { title: '   ' } }, { removeEmptyStrings: false }).title, '');
});

test('History writes recorded values back exactly', () => {
  assert.match(applyField, /updateAsync\([^;]*removeEmptyStrings:\s*false/s);
  assert.match(applyField, /updateAsync\([^;]*trimStrings:\s*false/s);
});

test('the card and board setters keep a cleared value', () => {
  const cards = read('models/cards.js');
  assert.match(cards, /const keepEmptyStrings = \(\) => \(\{ removeEmptyStrings: false \}\);/);
  for (const setter of ['  setTitle(title) {', '  async setDescription(description) {']) {
    const calls = body(cards, setter).match(/\.updateAsync\([^;]*/gs) || [];
    assert.ok(calls.length > 0, setter);
    for (const call of calls) assert.match(call, /keepEmptyStrings\(\)/, `${setter} ${call}`);
  }
  const boards = body(read('models/boards.js'), '  async setDescription(description) {');
  assert.match(boards, /removeEmptyStrings:\s*false/);
});

test('the REST card PUT writes title and description with removeEmptyStrings false', () => {
  const server = read('server/models/cards.js');
  for (const field of ['title', 'description']) {
    const call = optionsAfter(server, `if ('${field}' in scalars.set) {`);
    assert.match(call, /removeEmptyStrings:\s*false/, field);
    // Not conditional on the value: '   ' is trimmed to '' after the check.
    assert.doesNotMatch(call, /removeEmptyStrings:\s*[^f\s]/, field);
  }
});

console.log(`emptyStringClearWrites: ${passed} tests passed`);
