'use strict';
// Focalboard (Mattermost Boards) archive text (models/lib/focalboardFormat.js).
// Run: node tests/focalboard.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
let parseFocalboard, formatFocalboard;
test.before(async () => ({ parseFocalboard, formatFocalboard } = await import('../models/lib/focalboardFormat.js')));

const line = (type, data) => JSON.stringify({ type, data });
const statusOptions = [{ id: 'o1', value: 'Not started' }, { id: 'o2', value: 'Done' }];
const archive = [
  JSON.stringify({ version: 1, date: 1 }),
  line('board', { id: 'b1', title: 'Plant', description: 'Pumps', cardProperties: [
    { id: 'pStatus', name: 'Status', type: 'select', options: statusOptions },
    { id: 'pPri', name: 'Priority', type: 'select', options: [{ id: 'h', value: 'High' }] },
    { id: 'pTags', name: 'Tags', type: 'multiSelect', options: [{ id: 't1', value: 'shop' }, { id: 't2', value: 'urgent' }] },
    { id: 'pDate', name: 'Dates', type: 'date' }, { id: 'pEst', name: 'Estimate', type: 'number' },
    { id: 'pWho', name: 'Owner', type: 'person' }, { id: 'pMade', name: 'Created', type: 'createdTime' }] }),
  line('block', { id: 'v1', parentId: 'b1', boardId: 'b1', type: 'view', title: 'Board',
    fields: { viewType: 'board', groupById: 'pStatus' } }),
  line('block', { id: 'c1', parentId: 'b1', boardId: 'b1', type: 'card', title: 'Order valves', createAt: Date.UTC(2026, 8, 1),
    fields: { contentOrder: ['x2', ['x1']], properties: { pStatus: 'o1', pPri: 'h', pTags: ['t1', 't2'],
      pDate: JSON.stringify({ from: Date.UTC(2026, 9, 1), to: Date.UTC(2026, 9, 10) }), pEst: '3', pWho: 'u9' } } }),
  line('block', { id: 'x1', parentId: 'c1', boardId: 'b1', type: 'checkbox', title: 'Call vendor', fields: { value: true } }),
  line('block', { id: 'x2', parentId: 'c1', boardId: 'b1', type: 'text', title: 'Two of them', fields: {} }),
  line('block', { id: 'm1', parentId: 'c1', boardId: 'b1', type: 'comment', title: 'Ordered', createAt: Date.UTC(2026, 8, 2) }),
  line('block', { id: 'i1', parentId: 'c1', boardId: 'b1', type: 'image', title: '', fields: { fileId: 'f.png' } }),
  line('block', { id: 'c2', parentId: 'b1', boardId: 'b1', type: 'card', title: 'Finished', fields: { properties: { pStatus: 'o2' } } }),
  line('block', { id: 'c3', parentId: 'b1', boardId: 'b1', type: 'card', title: 'Gone', deleteAt: 5, fields: {} }),
  line('block', { id: 'c4', parentId: 'b1', boardId: 'b1', type: 'card', title: 'Template', fields: { isTemplate: true } }),
  line('boardMember', { boardId: 'b1', userId: 'u9' }),
].join('\n');

test('a board.jsonl maps to lists, labels, dates, description, checklist and comments', () => {
  const parsed = parseFocalboard(archive);
  assert.deepEqual([parsed.board.name, parsed.columns.map(c => c.title)], ['Plant', ['Not started', 'Done']]);
  const [card, done] = parsed.tasks;
  assert.equal(parsed.tasks.length, 2, 'deleted cards and templates are not imported');
  assert.deepEqual([card.title, card.column_name, card.description], ['Order valves', 'Not started', 'Two of them']);
  assert.deepEqual(card.tags, ['Priority:High', 'Tags:shop', 'Tags:urgent']);
  assert.deepEqual([card.date_started.slice(0, 10), card.date_due.slice(0, 10)], ['2026-10-01', '2026-10-10']);
  assert.deepEqual(card.checklists, [{ title: 'Checklist', items: [{ title: 'Call vendor', done: true }] }]);
  assert.deepEqual(card.comments.map(c => c.text), ['Ordered']);
  assert.deepEqual(card.custom_fields, { Estimate: '3' });
  assert.equal(done.column_name, 'Done');
  const reasons = parsed.unsupported.map(u => u.reason).join('\n');
  for (const text of ['person property Owner', 'a Focalboard image', 'card template', 'Focalboard member'])
    assert.ok(reasons.includes(text), text);
});

test('older archives: the board as the first block; no group-by view uses the first select', () => {
  const old = [line('block', { id: 'b1', type: 'board', title: 'Old', fields: { cardProperties: [
    { id: 'p', name: 'Stage', type: 'select', options: [{ id: 'a', value: 'Doing' }] }] } }),
  line('block', { id: 'c', parentId: 'b1', type: 'card', title: 'Card', fields: { properties: { p: 'a' } } }),
  line('block', { id: 'd', parentId: 'b1', type: 'card', title: 'No stage', fields: {} })].join('\n');
  const parsed = parseFocalboard(old);
  assert.deepEqual(parsed.tasks.map(t => t.column_name), ['Doing', 'No Stage']);
});

test('negative: not an archive', () => {
  assert.throws(() => parseFocalboard('not json'), /not JSON/);
  assert.throws(() => parseFocalboard(line('block', { id: 'c', type: 'card' })), /no board line/);
  assert.throws(() => parseFocalboard('{"foo":1}\n{"bar":2}'), /not an archive line/);
});

test('export writes what the import reads back', () => {
  const text = formatFocalboard({ board: { _id: 'w', title: 'WeKan board' }, lists: [{ title: 'To Do' }, { title: 'Done' }],
    items: [{ cardId: 'k1', title: 'Pump', description: 'Two', listTitle: 'To Do', labels: ['shop'],
      dueAt: '2026-10-10T00:00:00.000Z', startAt: '2026-10-01T00:00:00.000Z', createdAt: '2026-09-01T00:00:00.000Z',
      checklists: [{ title: 'Steps', items: [{ title: 'Cut', done: true }] }], comments: [{ text: 'Noted', author: 'xet7' }],
      customFields: { Estimate: 3 } },
    { cardId: 'k2', title: 'Shipped', listTitle: 'Done', labels: [] }] }, { now: 1000 });
  assert.equal(JSON.parse(text.split('\n')[0]).version, 1, 'Focalboard\'s header line');
  const back = parseFocalboard(text);
  assert.deepEqual(back.columns.map(c => c.title), ['To Do', 'Done']);
  const [pump, shipped] = back.tasks;
  assert.deepEqual([pump.title, pump.column_name, pump.description, pump.tags], ['Pump', 'To Do', 'Two', ['shop']]);
  assert.deepEqual([pump.date_started.slice(0, 10), pump.date_due.slice(0, 10)], ['2026-10-01', '2026-10-10']);
  assert.deepEqual(pump.checklists[0].items, [{ title: 'Cut', done: true }]);
  assert.deepEqual(pump.comments.map(c => c.text), ['xet7: Noted']);
  assert.deepEqual(pump.custom_fields, { Estimate: '3' });
  assert.equal(shipped.column_name, 'Done');
  assert.equal(formatFocalboard({ board: { _id: 'w' }, items: [] }, { now: 1 }),
    formatFocalboard({ board: { _id: 'w' }, items: [] }, { now: 1 }), 'deterministic');
});
