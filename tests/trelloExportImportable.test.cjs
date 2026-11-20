'use strict';
// A Trello export must be what WeKan's own Trello import accepts
// (models/trelloCreator.js checkBoard, checkCards, checkLists, checkLabels,
// checkChecklists, checkActions). Until 2026-11-20 the export wrote no
// card's dateLastActivity or pos, so no Trello export imported back, and its
// checklists and comment actions were empty arrays.
// Run: node --test tests/trelloExportImportable.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const isIso = value => typeof value === 'string' && !Number.isNaN(Date.parse(value));
let fmt;
test.before(async () => { fmt = (await import('../models/lib/externalExportFormatters.js')).formatters; });

const board = { _id: 'b1', title: 'Plant', labels: [{ _id: 'l1', name: 'Bug', color: 'red' }, { _id: 'l2', color: 'blue' }] };
const lists = [{ _id: 'L1', title: 'To Do' }, { _id: 'L2', title: 'Done' }];
const items = [
  { cardId: 'c1', title: 'One', listId: 'L1', labelIds: ['l1'], createdAt: '2026-11-01T10:00:00Z', description: 'Text',
    checklists: [{ title: 'Steps', items: [{ title: 'A', done: true }, { title: 'B', done: false }] }],
    comments: [{ text: 'First', author: 'ann', date: '2026-11-02T10:00:00Z' }, { text: 'No date', author: 'bob' }] },
  { cardId: 'c2', title: 'Two', listId: 'L2' },
];

test('every part of the export has what the Trello import checks for', () => {
  const doc = JSON.parse(JSON.stringify(fmt.trello({ board, lists, items })));
  assert.strictEqual(typeof doc.name, 'string');
  assert.strictEqual(typeof doc.prefs.background, 'string');
  assert.ok(['org', 'private', 'public'].includes(doc.prefs.permissionLevel));
  for (const card of doc.cards) {
    assert.strictEqual(typeof card.closed, 'boolean');
    assert.ok(isIso(card.dateLastActivity), `${card.name}: dateLastActivity`);
    assert.strictEqual(typeof card.desc, 'string');
    assert.ok(Array.isArray(card.idLabels) && card.idLabels.every(id => typeof id === 'string'));
    assert.ok(Array.isArray(card.idMembers));
    assert.strictEqual(typeof card.name, 'string');
    assert.strictEqual(typeof card.pos, 'number');
  }
  for (const label of doc.labels) assert.strictEqual(typeof label.name, 'string', 'a label with no name too');
  for (const list of doc.lists) assert.ok(typeof list.closed === 'boolean' && typeof list.name === 'string');
  assert.strictEqual(doc.checklists.length, 1);
  for (const checklist of doc.checklists) {
    assert.ok(['idBoard', 'idCard', 'name'].every(key => typeof checklist[key] === 'string'));
    assert.ok(checklist.checkItems.every(item => typeof item.state === 'string' && typeof item.name === 'string'));
  }
  assert.deepStrictEqual(doc.checklists[0].checkItems.map(item => item.state), ['complete', 'incomplete']);
  assert.deepStrictEqual(doc.cards[0].idChecklists, [doc.checklists[0].id]);
  assert.strictEqual(doc.actions.length, 2);
  for (const action of doc.actions) {
    assert.ok(action.data && typeof action.data === 'object' && isIso(action.date) && action.type === 'commentCard');
    assert.strictEqual(action.data.card.id, 'c1');
  }
  assert.deepStrictEqual(doc.actions.map(action => action.data.text), ['First', 'No date']);
});

test('the board\'s people are Trello members, and each card names its own', () => {
  const people = [{ ...items[0], owner: 'ann', assignees: ['cid'] }, { ...items[1], assignees: ['dan'] }];
  const doc = fmt.trello({ board, lists, items: people });
  assert.deepStrictEqual(doc.members.map(m => m.username), ['ann', 'cid', 'bob', 'dan'], 'owners, assignees and comment authors');
  assert.deepStrictEqual(doc.cards[0].idMembers, ['ann', 'cid']);
  assert.deepStrictEqual(doc.cards[1].idMembers, ['dan']);
  // Negative: a Trello file with no members imports - the mapper takes it as nobody to map.
  const mapper = read('client/components/import/trelloMembersMapper.js');
  assert.match(mapper, /const membersToMap = Array\.isArray\(data\.members\) \? data\.members : \[\];/);
});

test('negative: a card with nothing has empty arrays, and the importer still checks these fields', () => {
  const doc = fmt.trello({ board, lists, items: [items[1]] });
  assert.deepStrictEqual([doc.checklists, doc.actions, doc.cards[0].idChecklists], [[], [], []]);
  const creator = read('models/trelloCreator.js');
  for (const field of ['dateLastActivity: DateString', 'pos: Number', 'idLabels: [String]', 'idBoard: String', 'date: DateString']) {
    assert.ok(creator.includes(field), `the import checks ${field}`);
  }
});

test('custom fields: one Trello field per name, typed by its values, each card\'s values as customFieldItems', () => {
  const fielded = [
    { ...items[0], customFields: { Estimate: 3, Done: true, Shipped: '2026-11-03', Note: 'Hi', Tags: ['a', 'b'] } },
    { ...items[1], customFields: { Estimate: 5, Note: 'There' } },
  ];
  const doc = fmt.trello({ board, lists, items: fielded });
  assert.deepStrictEqual(doc.customFields.map(f => [f.name, f.type]),
    [['Estimate', 'number'], ['Done', 'checkbox'], ['Shipped', 'date'], ['Note', 'text'], ['Tags', 'text']]);
  assert.ok(doc.customFields.every(f => f.display.cardFront === true), 'the import reads display.cardFront');
  const byName = card => Object.fromEntries(card.customFieldItems.map(item =>
    [doc.customFields.find(f => f.id === item.idCustomField).name, item.value]));
  assert.deepStrictEqual(byName(doc.cards[0]), { Estimate: { number: '3' }, Done: { checked: 'true' },
    Shipped: { date: '2026-11-03T00:00:00.000Z' }, Note: { text: 'Hi' }, Tags: { text: 'a, b' } });
  assert.deepStrictEqual(byName(doc.cards[1]), { Estimate: { number: '5' }, Note: { text: 'There' } }, 'a card without a value has no item');
  // Negative: no custom fields, none written; and the import reads a number back as a number.
  assert.deepStrictEqual(fmt.trello({ board, lists, items }).customFields, []);
  assert.match(read('models/trelloCreator.js'), /const number = Number\(item\.value\.number\);\n\s+custom\.value = Number\.isFinite\(number\) \? number : item\.value\.number;/);
});

test('archived cards and lists are Trello\'s closed ones; the Trello export alone collects them', () => {
  const doc = fmt.trello({ board, lists: [...lists, { _id: 'L3', title: 'Old', archived: true }],
    items: [...items, { cardId: 'c3', title: 'Gone', listId: 'L3', archived: true }] });
  assert.deepStrictEqual(doc.lists.map(l => [l.name, l.closed]), [['To Do', false], ['Done', false], ['Old', true]]);
  assert.deepStrictEqual(doc.cards.map(c => [c.name, c.closed]), [['One', false], ['Two', false], ['Gone', true]]);
  const exporters = read('models/lib/externalExporters.js');
  assert.match(exporters, /const ARCHIVED_FORMATS = new Set\(\['trello', 'trellozip'\]\);/, 'negative: no other format');
  assert.match(exporters, /const open = ARCHIVED_FORMATS\.has\(format\) \? notDeleted\(\{\}\) : \{ archived: false \};/,
    'never a deleted card, archived or not');
});
