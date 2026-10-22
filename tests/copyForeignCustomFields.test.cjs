'use strict';

// #6800: a card made from a card template, linked from another board, or
// copied - and a subtask copied with it - took its whole customFields array
// along: values of another board's fields, of deleted fields, entries with no
// field id. The admin-only field guard cannot match those to a field of the new
// card's board, so it refused the whole card and recorded AdminFieldBleed
// against the user. One instance had 110 such values (84 of another board's
// field, 26 with no id); copying or linking any of those cards failed.
// Run: node tests/copyForeignCustomFields.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const { customFieldsForBoard } = require('../models/lib/customFieldsForBoard.cjs');
const { protectedValues } = require('../models/lib/adminOnlyCustomFields.js');

const pending = [];
let passed = 0;
function test(name, fn) {
  pending.push(Promise.resolve().then(fn).then(() => { passed += 1; console.log('  ok -', name); }));
}

const DEFINITIONS = new Map([
  ['own', { _id: 'own', boardIds: ['dest'] }],
  ['shared', { _id: 'shared', boardIds: ['source', 'dest'] }],
  ['foreign', { _id: 'foreign', boardIds: ['source'] }],
  ['secret', { _id: 'secret', boardIds: ['dest'], adminOnly: true }],
]);
const lookup = async id => DEFINITIONS.get(id) || null;
const VALUES = [
  { _id: 'own', value: 'a' },
  { _id: 'shared', value: 'b' },
  { _id: 'foreign', value: 'c' }, // another board's field
  { _id: 'deleted', value: 'd' }, // no definition any more
  { value: 'e' }, // no field id (old imports)
  null,
];

test('only values of fields defined on the destination board are carried', async () => {
  const kept = await customFieldsForBoard(VALUES, 'dest', lookup);
  assert.deepStrictEqual(kept.map(f => f._id), ['own', 'shared']);
  assert.deepStrictEqual(await customFieldsForBoard(undefined, 'dest', lookup), []);
  assert.deepStrictEqual(await customFieldsForBoard(VALUES, '', lookup), []);
});

test('the guard then finds nothing protected in the new card, so the copy goes through', async () => {
  const adminBoards = new Set();
  // Before: the foreign, deleted and id-less values are "protected" - refused.
  const before = protectedValues({ boardId: 'dest', customFields: VALUES.filter(Boolean) }, DEFINITIONS, adminBoards);
  assert.deepStrictEqual(before.map(f => f._id || '(none)').sort(), ['(none)', 'deleted', 'foreign']);
  // After the filter: nothing.
  const kept = await customFieldsForBoard(VALUES, 'dest', lookup);
  assert.deepStrictEqual(protectedValues({ boardId: 'dest', customFields: kept }, DEFINITIONS, adminBoards), []);
});

test('negative: an admin-only value of the destination board is NOT stripped - the guard still decides it', async () => {
  const kept = await customFieldsForBoard([{ _id: 'secret', value: 'FORGED' }], 'dest', lookup);
  assert.deepStrictEqual(kept, [{ _id: 'secret', value: 'FORGED' }]);
  // ...and for a member who is not an admin of that board it is still protected.
  assert.strictEqual(protectedValues({ boardId: 'dest', customFields: kept }, DEFINITIONS, new Set()).length, 1);
});

test('copy, its subtask copies, and link all filter just before their insert', () => {
  const cards = read('models/cards.js');
  for (const [variable, insert] of [
    ['cardData', 'const _id = await Cards.insertAsync(cardData);'],
    ['copySubtask', 'const newSubtaskId = await Cards.insertAsync(copySubtask);'],
  ]) {
    const at = cards.indexOf(insert);
    assert.ok(at > 0, insert);
    const before = cards.slice(cards.lastIndexOf('\n', cards.lastIndexOf('\n', at) - 1), at);
    assert.ok(before.includes(`${variable}.customFields = await customFieldsForBoard(${variable}.customFields, boardId, fieldDefinitionNow);`), variable);
  }
  const link = cards.slice(cards.indexOf('async link(boardId, swimlaneId, listId) {'));
  const linkBody = link.slice(0, link.indexOf('return await Cards.insertAsync(linkCard);'));
  assert.match(linkBody, /linkCard\.customFields = await customFieldsForBoard\(linkCard\.customFields, boardId, fieldDefinitionNow\);/);
  // The definition is read from the collection, not from ReactiveCache.
  const now = cards.slice(cards.indexOf('async function fieldDefinitionNow'), cards.indexOf('const { customFieldsForBoard }'));
  assert.ok(!/ReactiveCache/.test(now), 'a cached definition may not yet include the destination board');
});

test('negative: no card built from another card is inserted without the filter', () => {
  // The shape: a card document cloned from an existing one (JSON copy, Object.assign
  // from a card, or a build*Copied* helper) and inserted.
  const cards = read('models/cards.js');
  for (const m of cards.matchAll(/await Cards\.insertAsync\((\w+)\)/g)) {
    const variable = m[1];
    const body = cards.slice(Math.max(0, m.index - 3000), m.index);
    const cloned = new RegExp(`(?:const|let) ${variable} = (?:JSON\\.parse\\(JSON\\.stringify\\(this\\)\\)|Object\\.assign\\(\\{\\}, this|build\\w*Copied\\w*\\(|\\{ \\.\\.\\.this)`).test(body)
      || new RegExp(`(?:const|let) ${variable} = (?:await )?(?:this\\.|\\{\\s*\\.\\.\\.)`).test(body);
    if (!cloned) continue;
    assert.ok(new RegExp(`${variable}\\.customFields = await customFieldsForBoard\\(`).test(body), `${variable} is inserted without the custom field filter`);
  }
});

Promise.all(pending).then(() => console.log(`\n${passed} passed`), (error) => {
  console.error(error);
  process.exit(1);
});
