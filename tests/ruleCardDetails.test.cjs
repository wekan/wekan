'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepareRuleCardDetails: prepare } = require('../server/lib/ruleCardDetails');
function fixture() {
  const f = { activity: { cardId: 'card', boardId: 'board', userId: 'actor' }, admin: false, allowed: true };
  f.card = { _id: 'card', boardId: 'board', title: 'Task', listId: 'list', swimlaneId: 'lane', dueAt: new Date('2027-01-01'),
    spentTime: 0, dueComplete: false, members: ['user'], labelIds: ['label'],
    customFields: [{ _id: 'field', value: 'choice' }, { _id: 'private', value: 'SECRET-CUSTOM' }],
    parentId: 'parent', cardDependencies: [{ cardId: 'secret', type: 'blocks' }] };
  f.board = { _id: 'board', title: 'Board', labels: [{ _id: 'label', name: 'Urgent' }], hasAdmin: () => f.admin };
  f.definitions = [{ _id: 'field', boardIds: ['board'], name: 'Priority', type: 'dropdown', settings: { dropdownItems: [{ _id: 'choice', name: 'High' }] } },
    { _id: 'private', boardIds: ['board'], name: 'Private', type: 'text', adminOnly: true }];
  f.notes = [{ cardId: 'card', boardId: 'board', title: 'Review', text: 'Visible note' }, { cardId: 'other', boardId: 'board', title: 'SECRET-NOTE', text: 'private' }];
  f.cards = { card: f.card, parent: { _id: 'parent', boardId: 'board', title: 'Parent task' }, secret: { _id: 'secret', boardId: 'private', title: 'SECRET-CARD' } };
  f.cache = { getCard: async id => f.cards[id], getBoard: async id => id === 'board' ? f.board : { _id: 'private' },
    getList: async () => ({ boardId: 'board', title: 'Doing' }), getSwimlane: async () => ({ boardId: 'board', title: 'Team' }),
    getCustomFields: async () => structuredClone(f.definitions), getCardTextNotes: async () => f.notes,
    getCards: async () => [], getUser: async () => ({ username: 'person', emails: [{ address: 'SECRET-EMAIL' }], services: { token: 'SECRET-TOKEN' } }) };
  f.canReadBoard = (_, board) => f.allowed && board?._id === 'board';
  return f;
}
test('renders public dates, zero/false, labels, people, dropdown names, notes and authorized relations', async () => {
  const f = fixture(), text = await prepare(f);
  for (const expected of ['Due: 2027-01-01T00:00:00.000Z', 'Spent time (hours): 0', 'Due complete: false', 'Labels: Urgent',
    'Members: person', 'Priority: High', 'Review: Visible note', 'Parent: Parent task']) assert.ok(text.includes(expected), expected);
  assert.ok(!text.includes('SECRET'));
  f.admin = true; assert.ok((await prepare(f)).includes('Private: SECRET-CUSTOM'));
});
test('assignment restrictions, revoked admin access and changed field policy abort the result', async () => {
  const f = fixture(); f.board.members = [{ userId: 'actor', isActive: true, isReadAssignedOnly: true }];
  await assert.rejects(prepare(f), /not-authorized/);
  const admin = fixture(); admin.admin = true; admin.cache.getCardTextNotes = async () => { admin.admin = false; return []; };
  await assert.rejects(prepare(admin), /not-authorized/);
  const changed = fixture(); let reads = 0;
  changed.cache.getCustomFields = async () => ++reads === 1 ? structuredClone(changed.definitions) : [];
  await assert.rejects(prepare(changed), /changed/);
});
test('linked cards never disclose stale local snapshots when their source is inaccessible', async () => {
  const f = fixture(); Object.assign(f.card, { type: 'cardType-linkedCard', linkedId: 'secret', locationName: 'SECRET-SNAPSHOT' });
  assert.equal(await prepare(f), '');
  f.card.linkedId = 'parent'; assert.equal(await prepare(f), 'Linked card: Parent task');
});
test('private foreign placement titles and unbounded note text are not exported', async () => {
  const f = fixture(); f.cache.getList = async () => ({ boardId: 'private', title: 'SECRET-LIST' });
  assert.ok(!(await prepare(f)).includes('SECRET'));
  f.notes[0].text = 'x'.repeat(768 * 1024); await assert.rejects(prepare(f), /too-large/);
});
test('custom dates, checkbox values, multiselect, currency and string templates keep their display semantics', async () => {
  const f = fixture();
  f.definitions.push(...[
    ['multi', 'dropdownMultiSelect', { dropdownItems: [{ _id: 'a', name: 'First' }, { _id: 'b', name: 'Second' }] }],
    ['date', 'date', {}], ['flag', 'checkbox', {}], ['money', 'currency', { currencyCode: 'EUR' }],
    ['template', 'stringtemplate', { stringtemplateFormat: '%{board.title}: %{value}', stringtemplateSeparator: '; ' }],
  ].map(([_id, type, settings]) => ({ _id, type, settings, name: _id, boardIds: ['board'] })));
  f.card.customFields.push(...[['multi', ['a', 'b']], ['date', new Date('2027-03-01')], ['flag', false], ['money', 0], ['template', ['one', 'two']]].map(([_id, value]) => ({ _id, value })));
  const text = await prepare(f);
  for (const expected of ['multi: First, Second', 'date: 2027-03-01T00:00:00.000Z', 'flag: false', 'money: 0 EUR', 'template: Board: one; Board: two']) assert.ok(text.includes(expected), expected);
});
