'use strict';

// Plain-Node unit test (no Meteor) for the "customFields with definitions"
// matcher used by Cards.customFieldsWD().
// Run: node tests/customFieldsWD.test.cjs
//
// Regression guard for the defect half of #3748 ("Link cards does not inherit
// Label and Customfields"): the non-inheritance itself is by design — a linked
// card is a pointer to the original card, and label ids / custom-field
// definition ids are board-scoped (remapping-by-name belongs to the COPY path,
// Cards.copy()/mapCustomFieldsToBoard). But Cards.link() deep-copies the
// original card document, so a cross-board linked card carries a customFields
// snapshot whose definition ids do not exist on the viewing board. The old
// customFieldsWD() returned an empty `{}` placeholder for each unmatched
// entry, which rendered a phantom empty row in the card details and made the
// cardCustomField getTemplate() helper throw
// "TypeError: Cannot read properties of undefined (reading 'type')".
// Unmatched entries must be skipped; matched entries must keep the exact
// {_id, value, trueValue, definition} shape sorted by definition name.

const assert = require('assert');
const {
  buildCustomFieldsWD,
  resolveTrueValue,
} = require('../models/lib/customFieldsWD');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// Definitions attached to the VIEWING board.
const textDef = {
  _id: 'cf-text',
  name: 'Severity',
  type: 'text',
  settings: {},
};
const dropdownDef = {
  _id: 'cf-drop',
  name: 'Area',
  type: 'dropdown',
  settings: {
    dropdownItems: [
      { _id: 'item1', name: 'Frontend' },
      { _id: 'item2', name: 'Backend' },
    ],
  },
};
const boardDefinitions = [textDef, dropdownDef];

// --- POSITIVE: entries whose definition IS on this board -------------------
test('a matched text field keeps its value and definition', () => {
  const ret = buildCustomFieldsWD(
    [{ _id: 'cf-text', value: 'high' }],
    boardDefinitions,
  );
  assert.strictEqual(ret.length, 1);
  assert.deepStrictEqual(ret[0], {
    _id: 'cf-text',
    value: 'high',
    trueValue: 'high',
    definition: textDef,
  });
});

test('a matched dropdown field resolves trueValue to the item NAME', () => {
  const ret = buildCustomFieldsWD(
    [{ _id: 'cf-drop', value: 'item2' }],
    boardDefinitions,
  );
  assert.strictEqual(ret.length, 1);
  assert.strictEqual(ret[0].value, 'item2');
  assert.strictEqual(ret[0].trueValue, 'Backend');
  assert.strictEqual(ret[0].definition, dropdownDef);
});

test('matched entries are sorted by definition name', () => {
  const ret = buildCustomFieldsWD(
    [
      { _id: 'cf-text', value: 'x' }, // "Severity"
      { _id: 'cf-drop', value: 'item1' }, // "Area"
    ],
    boardDefinitions,
  );
  assert.deepStrictEqual(
    ret.map(f => f.definition.name),
    ['Area', 'Severity'],
  );
});

test('every returned entry can feed the cardCustomField getTemplate helper', () => {
  // client/components/cards/cardCustomFields.js getTemplate() does
  // `cardCustomField-${this.definition.type}` — it must never see an entry
  // without a definition.
  const ret = buildCustomFieldsWD(
    [
      { _id: 'cf-from-other-board', value: 'lost' },
      { _id: 'cf-drop', value: 'item1' },
    ],
    boardDefinitions,
  );
  for (const entry of ret) {
    assert.doesNotThrow(() => `cardCustomField-${entry.definition.type}`);
    assert.strictEqual(typeof entry.definition.type, 'string');
  }
});

// --- NEGATIVE: the #3748 linked-card snapshot and other dangling refs ------
test('#3748: a cross-board linked-card snapshot entry is SKIPPED, not {}', () => {
  // Cards.link() copies customFields ids of the ORIGINAL board's definitions;
  // they are not attached to the viewing board, so nothing must be returned
  // (the old code returned [{}], rendering a phantom row and throwing on
  // `undefined.type`).
  const ret = buildCustomFieldsWD(
    [{ _id: 'cf-original-board-only', value: 'snapshot' }],
    boardDefinitions,
  );
  assert.deepStrictEqual(ret, []);
});

test('a mix of matched and unmatched entries keeps only the matched ones', () => {
  const ret = buildCustomFieldsWD(
    [
      { _id: 'cf-original-board-only', value: 'snapshot' },
      { _id: 'cf-text', value: 'low' },
      { _id: 'cf-deleted-definition', value: 42 },
    ],
    boardDefinitions,
  );
  assert.strictEqual(ret.length, 1);
  assert.strictEqual(ret[0]._id, 'cf-text');
});

test('empty or malformed inputs never throw and return []', () => {
  assert.deepStrictEqual(buildCustomFieldsWD([], boardDefinitions), []);
  assert.deepStrictEqual(buildCustomFieldsWD(null, boardDefinitions), []);
  assert.deepStrictEqual(buildCustomFieldsWD(undefined, boardDefinitions), []);
  assert.deepStrictEqual(buildCustomFieldsWD([{ _id: 'cf-text', value: 'x' }], null), []);
  assert.deepStrictEqual(buildCustomFieldsWD([null, undefined], boardDefinitions), []);
  // a null hole in the definitions list must not break matching
  assert.strictEqual(
    buildCustomFieldsWD(
      [{ _id: 'cf-text', value: 'x' }],
      [null, textDef],
    ).length,
    1,
  );
});

test('definitions without a name do not break sorting', () => {
  const namelessDef = { _id: 'cf-noname', type: 'text', settings: {} };
  const ret = buildCustomFieldsWD(
    [
      { _id: 'cf-noname', value: 'a' },
      { _id: 'cf-text', value: 'b' },
    ],
    [namelessDef, textDef],
  );
  assert.strictEqual(ret.length, 2);
});

// --- resolveTrueValue --------------------------------------------------------
test('resolveTrueValue: non-dropdown and unmatched ids keep the raw value', () => {
  assert.strictEqual(resolveTrueValue(textDef, 'raw'), 'raw');
  assert.strictEqual(resolveTrueValue(dropdownDef, 'not-an-item'), 'not-an-item');
  assert.strictEqual(resolveTrueValue(dropdownDef, 'item1'), 'Frontend');
  assert.strictEqual(resolveTrueValue({ settings: {} }, 'v'), 'v');
  assert.strictEqual(resolveTrueValue(undefined, 'v'), 'v');
});

console.log(`\n${passed} passed`);
