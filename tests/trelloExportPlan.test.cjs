'use strict';

// Export a WeKan board to Trello (server/trelloApiExport.js), and its
// swimlanes back: Trello has none, so each swimlane travels as a marked label
// ("Swimlane: <title>"), which the "Swimlanes by Blue Cat" Power-Up groups by
// and WeKan's Trello import turns back into swimlanes.
// Run: node tests/trelloExportPlan.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  buildTrelloExportPlan, trelloColor, swimlaneFromLabelName, swimlanesFromTrelloBoard, SWIMLANE_LABEL_PREFIX,
} = require('../models/lib/trelloExportPlan');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const exported = () => ({
  title: 'Roadmap', description: 'Q4',
  labels: [{ _id: 'l1', name: 'Bug', color: 'red' }, { _id: 'l2', name: 'Plum', color: 'plum' }, { _id: 'l3', name: 'Grey', color: 'silver' }],
  swimlanes: [{ _id: 's2', title: 'Team B', sort: 2 }, { _id: 's1', title: 'Team A', sort: 1 }],
  lists: [{ _id: 'L2', title: 'Done', sort: 2 }, { _id: 'L1', title: 'Todo', sort: 1 }, { _id: 'L3', title: 'Old', sort: 3, archived: true }],
  cards: [
    { _id: 'c2', title: 'Second', listId: 'L1', swimlaneId: 's2', sort: 2, labelIds: ['l1'] },
    { _id: 'c1', title: 'First', listId: 'L1', swimlaneId: 's1', sort: 1, description: 'd', dueAt: '2026-10-20T10:00:00Z', endAt: '2026-10-19T10:00:00Z', startAt: '2026-10-01T00:00:00Z' },
    { _id: 'c3', title: 'Archived', listId: 'L2', swimlaneId: 's1', sort: 1, archived: true },
    { _id: 'cx', title: 'Orphan', listId: 'gone', swimlaneId: 's1', sort: 1 },
  ],
  checklists: [{ _id: 'k1', cardId: 'c1', title: 'Steps', sort: 1 }, { _id: 'k2', cardId: 'cx', title: 'Lost', sort: 1 }],
  checklistItems: [{ checklistId: 'k1', title: 'b', sort: 2, isFinished: true }, { checklistId: 'k1', title: 'a', sort: 1 }],
  comments: [
    { cardId: 'c1', userId: 'u1', text: 'later', createdAt: '2026-10-02T00:00:00Z' },
    { cardId: 'c1', userId: 'u2', text: 'first', createdAt: '2026-10-01T00:00:00Z' },
  ],
  users: [{ _id: 'u1', username: 'ann', profile: { fullname: 'Ann A' } }, { _id: 'u2', username: 'bob' }],
  attachments: [{ cardId: 'c1', name: 'a.txt', type: 'text/plain', file: Buffer.from('hi').toString('base64') }, { cardId: 'c1', name: 'nofile' }],
});

test('the board, lists, cards, checklists and comments map to Trello in their order', () => {
  const plan = buildTrelloExportPlan(exported());
  assert.deepEqual(plan.board, { name: 'Roadmap', desc: 'Q4' });
  assert.deepEqual(plan.lists.map(l => [l.name, l.closed]), [['Todo', false], ['Done', false], ['Old', true]]);
  assert.deepEqual(plan.cards.map(c => c.name), ['First', 'Second', 'Archived'], 'sorted, and a card of no list is left out');
  const first = plan.cards[0];
  assert.equal(first.due, '2026-10-20T10:00:00.000Z');
  assert.equal(first.start, '2026-10-01T00:00:00.000Z');
  assert.equal(first.dueComplete, true, 'an end date marks the due date complete');
  assert.equal(plan.cards[2].closed, true);
  assert.deepEqual(plan.checklists, [{ cardKey: 'c1', name: 'Steps', items: [{ name: 'a', checked: false }, { name: 'b', checked: true }] }]);
  assert.deepEqual(plan.comments.map(c => c.text.split(':')[0]), ['bob (2026-10-01T00', 'Ann A (2026-10-02T00']);
  assert.deepEqual(plan.attachments.map(a => a.name), ['a.txt'], 'only attachments that carry their file');
  assert.equal(buildTrelloExportPlan(exported(), { includeAttachments: false }).attachments.length, 0);
});

test('label colours Trello has are kept, near ones mapped, the rest left colourless', () => {
  assert.equal(trelloColor('red'), 'red');
  assert.equal(trelloColor('plum'), 'purple');
  assert.equal(trelloColor('silver'), null);
  assert.equal(trelloColor(undefined), null);
});

test('several swimlanes become marked labels, one per card, in swimlane order', () => {
  const plan = buildTrelloExportPlan(exported());
  const swim = plan.labels.filter(l => l.key.startsWith('swimlane:'));
  assert.deepEqual(swim.map(l => l.name), [`${SWIMLANE_LABEL_PREFIX}Team A`, `${SWIMLANE_LABEL_PREFIX}Team B`]);
  assert.ok(swim.every(l => l.color === null));
  const byName = Object.fromEntries(plan.cards.map(c => [c.name, c.labelKeys]));
  assert.deepEqual(byName.First, ['swimlane:s1']);
  assert.deepEqual(byName.Second, ['label:l1', 'swimlane:s2']);
  // One swimlane: nothing to tell apart, so no marked label at all.
  const single = exported();
  single.swimlanes = [{ _id: 's1', title: 'Default' }];
  assert.ok(!buildTrelloExportPlan(single).labels.some(l => l.key.startsWith('swimlane:')));
});

test('the round trip: an exported board imports back with the same swimlanes', () => {
  const plan = buildTrelloExportPlan(exported());
  // The board as Trello holds it after the export: label ids are Trello's.
  const trelloLabels = plan.labels.map((l, i) => ({ id: `T${i}`, name: l.name, color: l.color }));
  const idOf = Object.fromEntries(plan.labels.map((l, i) => [l.key, `T${i}`]));
  const trelloBoard = {
    labels: trelloLabels,
    cards: plan.cards.map(c => ({ id: c.key, idLabels: c.labelKeys.map(k => idOf[k]) })),
  };
  const back = swimlanesFromTrelloBoard(trelloBoard);
  assert.deepEqual(back.titles, ['Team A', 'Team B'], 'no Default: every card had its swimlane');
  const original = Object.fromEntries(exported().cards.map(c => [c._id, c.swimlaneId === 's1' ? 'Team A' : 'Team B']));
  for (const card of trelloBoard.cards) assert.equal(back.titleForCard(card), original[card.id], card.id);
  // The marked labels are swimlanes, not labels.
  assert.deepEqual(Object.keys(back.labelTitles).sort(), [idOf['swimlane:s1'], idOf['swimlane:s2']].sort());
});

test('a board arranged by hand in Trello imports the same way, and ordinary boards are unchanged (negative)', () => {
  const byHand = swimlanesFromTrelloBoard({
    labels: [{ id: 'a', name: 'Swimlane: Ops' }, { id: 'b', name: 'urgent' }, { id: 'c', name: 'Swimlane:   ' }],
    cards: [{ id: '1', idLabels: ['a', 'b'] }, { id: '2', idLabels: ['b'] }, { id: '3', idLabels: ['c'] }],
  });
  assert.deepEqual(byHand.titles, ['Default', 'Ops']);
  assert.equal(byHand.titleForCard({ idLabels: ['b'] }), 'Default');
  assert.equal(byHand.titleForCard({ idLabels: ['c'] }), 'Default', 'an empty title is no swimlane');
  // Every other label name is an ordinary label.
  for (const name of ['swimlane: lower case', 'Swimlanes: x', 'My Swimlane: x', '', null, undefined]) {
    assert.equal(swimlaneFromLabelName(name), null, String(name));
  }
  assert.deepEqual(swimlanesFromTrelloBoard({ labels: [{ id: 'b', name: 'urgent' }], cards: [{ idLabels: ['b'] }] }).titles, ['Default']);
  // A marked "Default" is reused for unlabelled cards instead of a second one.
  assert.deepEqual(swimlanesFromTrelloBoard({ labels: [{ id: 'd', name: 'Swimlane: Default' }], cards: [{ idLabels: [] }] }).titles, ['Default']);
});

test('the importer and exporter use these helpers, and lists are shared across imported swimlanes', () => {
  const creator = read('models/trelloCreator.js');
  assert.match(creator, /const plan = swimlanesFromTrelloBoard\(board\);/);
  assert.match(creator, /swimlaneId: this\.cardSwimlane\(card\),/);
  assert.match(creator, /swimlaneId: this\.multipleSwimlanes \? '' : this\.swimlane,/);
  assert.match(creator, /if \(swimlaneTitle\) \{\s*this\.swimlaneLabels\[label\.id\] = swimlaneTitle;\s*return;/, 'a marked label is not also a WeKan label');
  const exporter = read('server/trelloApiExport.js');
  assert.match(exporter, /buildTrelloExportPlan\(await exporter\.build\(\), \{ includeAttachments \}\)/);
  // The access check runs before anything is read, and the work runs as the user.
  assert.ok(exporter.indexOf('exporter.canExport(user)') < exporter.indexOf('exporter.build()'));
  assert.match(exporter, /runAsEgressUser\(userId, \(\) => runExport\(/);
  assert.match(exporter, /findOneAsync\(\{ _id: jobId, userId: this\.userId \}\)/, 'a job is read only by its owner');
});

test('creating requests are never retried after Trello may have acted (negative)', () => {
  const src = read('server/trelloApiImport.js');
  assert.match(src, /export async function trelloSend\([\s\S]*?\{ idempotent: false \}\)/);
  assert.match(src, /idempotent \? \(\[408, 425, 429\]\.includes\(res\.status\) \|\| res\.status >= 500\) : res\.status === 429/);
  assert.match(src, /if \(attempt < MAX_RETRIES && idempotent\) \{/);
});
