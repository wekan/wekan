'use strict';
// Importing a native Scrum transfer INTO an existing board
// (models/lib/scrumTransferMerge.js): what is matched, what is created, what
// is reported, and that a second import of the same file changes nothing.
// Server writes: server/lib/tests/scrumTransferMerge.tests.js. Browser:
// tests/playwright/specs/scrum-import-into-board.e2e.js.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { SCRUM_TRANSFER_FORMAT, remapScrumTransfer, normalizeScrumTransferLosses } = require('../models/lib/scrumTransfer');
const { planScrumTransferMerge, mergeCardScrum, scrumTransferFileFields } = require('../models/lib/scrumTransferMerge');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function snapshot(at, cards) {
  return { at, unit: 'points', estimateSource: 'poker', estimateCustomFieldId: null, completionPolicy: 'dueComplete', cards,
    missingEstimates: cards.filter(row => row.estimate === null).length,
    totalEstimate: cards.reduce((sum, row) => sum + (row.estimate ?? 0), 0) };
}
// A board export of board B: two sprints, a release, three cards.
function exported() {
  const start = '2026-09-01T10:00:00.000Z';
  return {
    _id: 'B', title: 'Source',
    cards: [{ _id: 'c1', title: 'Login', cardNumber: 1, listId: 'l1' }, { _id: 'c2', title: 'Logout', cardNumber: 2, listId: 'l1' },
      { _id: 'c3', title: 'Orphan', cardNumber: 3, listId: 'l1' }],
    lists: [{ _id: 'l1', title: 'Doing' }], customFields: [],
    scrumTransfer: { format: SCRUM_TRANSFER_FORMAT, settings: { enabled: true },
      sprints: [{ _id: 's1', name: 'Sprint 1', state: 'active', startedAt: start,
        startSnapshot: snapshot(start, [{ cardId: 'c1', listId: 'l1', estimate: 3, done: false, archived: false },
          { cardId: 'c3', listId: 'l1', estimate: 1, done: false, archived: false }]) },
      { _id: 's2', name: 'Sprint 2', state: 'planned' }],
      releases: [{ _id: 'r1', name: 'v1', state: 'planned' }],
      events: [{ _id: 'e1', sprintId: 's1', kind: 'review', startsAt: '2026-09-10T09:00:00.000Z', followUpCardIds: ['c1'] }],
      cards: [{ _id: 'c1', scrum: { sprintId: 's1', releaseId: 'r1', backlogRank: 2, acceptanceCriteria: 'Works' } },
        { _id: 'c2', scrum: { sprintId: 's2', issueType: 'Bug' } }, { _id: 'c3', scrum: { sprintId: 's1' } }],
      lists: [{ _id: 'l1', scrum: { category: 'doing' } }], swimlanes: [] },
    scrumTransferLosses: [],
  };
}
// Board D: the same cards imported earlier (other IDs, same numbers and titles).
function destination(extra = {}) {
  return { sprints: [], releases: [], events: [], lists: [{ _id: 'L', title: 'Doing' }], customFields: [],
    cards: [{ _id: 'C1', title: 'Login', cardNumber: 1 }, { _id: 'C2', title: 'Logout', cardNumber: 2 }],
    memberIds: ['u'], foreignCardIds: [], ...extra };
}
let counter = 0;
const newId = () => `new-${++counter}`;
function run(file, dest) {
  const plan = planScrumTransferMerge(file, dest, newId);
  const { transfer, losses } = remapScrumTransfer(plan.prepared, plan.maps);
  return { plan, transfer, losses: [...plan.losses, ...losses] };
}

test('records with no match are created, cards are matched by number and title, never by guess', () => {
  const { plan, transfer, losses } = run(exported(), destination());
  assert.deepEqual([...plan.sprints.values()].map(row => row.action), ['create', 'create']);
  assert.equal(plan.releases.get('r1').action, 'create');
  assert.deepEqual(plan.sprints.get('s1').provenance, { system: 'wekan', recordId: 's1', projectId: 'B' });
  assert.deepEqual(transfer.cards.map(row => row._id), ['C1', 'C2']);
  assert.equal(transfer.cards[0].scrum.sprintId, plan.sprints.get('s1').targetId);
  assert.equal(transfer.cards[0].scrum.releaseId, plan.releases.get('r1').targetId);
  // The card that is not on this board is reported, not created or guessed.
  assert.deepEqual(losses.filter(row => row.path === 'cards.c3'), [{ path: 'cards.c3', sourceId: 'c3', reason: 'card-not-matched' }]);
  // Its row leaves the snapshot, which says it is partial.
  const created = transfer.sprints.find(row => row._id === plan.sprints.get('s1').targetId);
  assert.deepEqual(created.startSnapshot.cards.map(row => [row.cardId, row.listId]), [['C1', 'L']]);
  assert.equal(created.startSnapshot.partial, true);
  assert.equal(created.startSnapshot.totalEstimate, 3);
  assert.deepEqual(transfer.events[0].followUpCardIds, ['C1']);
  // Board settings, list categories and swimlanes are the board's own.
  assert.deepEqual(transfer.lists, []);
  assert.deepEqual(transfer.swimlanes, []);
  assert.doesNotThrow(() => normalizeScrumTransferLosses(losses));
});

test('importing the same file again matches by provenance and changes nothing', () => {
  const first = run(exported(), destination());
  const state = new Map();
  const sprints = first.transfer.sprints.map(row => ({ ...row, provenance: first.plan.sprints.get(row._id === first.plan.sprints.get('s1').targetId ? 's1' : 's2').provenance }));
  const releases = first.transfer.releases.map(row => ({ ...row, provenance: first.plan.releases.get('r1').provenance }));
  const events = first.transfer.events.map(row => ({ _id: row._id, provenance: first.plan.events.get('e1').provenance }));
  const cards = destination().cards.map(card => {
    const incoming = first.transfer.cards.find(row => row._id === card._id);
    const merged = mergeCardScrum({}, incoming.scrum, first.plan.sprintStates);
    state.set(card._id, merged.scrum);
    return { ...card, scrum: merged.scrum };
  });
  const second = run(exported(), destination({ sprints, releases, events, cards }));
  assert.deepEqual([...second.plan.sprints.values()].map(row => [row.action, row.by]), [['match', 'provenance'], ['match', 'provenance']]);
  assert.equal(second.plan.releases.get('r1').by, 'provenance');
  assert.equal(second.plan.events.get('e1').action, 'match');
  assert.deepEqual(second.transfer.events, [], 'a matched event is not written again');
  assert.deepEqual(second.transfer.dailyObservations, []);
  for (const row of second.transfer.cards) {
    const result = mergeCardScrum(state.get(row._id), row.scrum, second.plan.sprintStates);
    assert.equal(result.changed, false, `card ${row._id} is unchanged`);
  }
});

test('this board\'s own export matches every record and card by ID', () => {
  const file = exported();
  const dest = { sprints: [{ _id: 's1', name: 'Sprint 1', state: 'active' }, { _id: 's2', name: 'Renamed', state: 'planned' }],
    releases: [{ _id: 'r1', name: 'v1' }], events: [{ _id: 'e1' }], lists: [{ _id: 'l1', title: 'Doing' }], customFields: [],
    cards: file.cards.map(card => ({ ...card })), memberIds: [], foreignCardIds: [] };
  const { plan, transfer, losses } = run(file, dest);
  assert.deepEqual([...plan.sprints.values()].map(row => row.by), ['id', 'id']);
  assert.deepEqual(transfer.cards.map(row => row._id), ['c1', 'c2', 'c3']);
  assert.deepEqual(transfer.sprints.map(row => row.state), ['planned', 'planned'], 'matched sprints are references only');
  assert.deepEqual(losses, []);
});

test('names match only when exactly one record has the name on each side', () => {
  const file = exported();
  const one = run(file, destination({ sprints: [{ _id: 'X', name: ' Sprint 2 ', state: 'planned' }] }));
  assert.deepEqual(one.plan.sprints.get('s2'), { action: 'match', targetId: 'X', by: 'name', name: ' Sprint 2 ', state: 'planned' });
  const two = run(exported(), destination({ sprints: [{ _id: 'X', name: 'Sprint 2' }, { _id: 'Y', name: 'Sprint 2' }] }));
  assert.equal(two.plan.sprints.get('s2').action, 'skip');
  assert.ok(two.losses.some(row => row.path === 'sprints.s2' && row.reason === 'record-ambiguous'));
  // The card in the ambiguous sprint keeps its own sprint and says why.
  assert.equal(Object.hasOwn(two.transfer.cards.find(row => row._id === 'C2').scrum, 'sprintId'), false);
  assert.ok(two.losses.some(row => row.path === 'cards.c2.scrum.sprintId' && row.reason === 'record-ambiguous'));
  // Two file records of one name never both claim one board record.
  const dup = exported(); dup.scrumTransfer.sprints[1].name = 'Sprint 1';
  const three = run(dup, destination({ sprints: [{ _id: 'X', name: 'Sprint 1' }] }));
  assert.equal(three.plan.sprints.get('s1').action, 'skip');
  assert.equal(three.plan.sprints.get('s2').action, 'skip');
});

test('ambiguous, unmatched and other boards\' cards are reported and never written', () => {
  const file = exported();
  const dest = destination({ cards: [{ _id: 'C1', title: 'Login', cardNumber: 1 }, { _id: 'C1b', title: 'Login', cardNumber: 1 },
    { _id: 'C2', title: 'Logout (renamed)', cardNumber: 2 }], foreignCardIds: ['c3'] });
  const { transfer, losses } = run(file, dest);
  assert.deepEqual(transfer.cards, []);
  const reasons = Object.fromEntries(losses.filter(row => /^cards\.c\d$/.test(row.path)).map(row => [row.sourceId, row.reason]));
  assert.deepEqual(reasons, { c1: 'card-ambiguous', c2: 'card-not-matched', c3: 'card-on-another-board' });
  // Linked cards are never a match: they are another board's card.
  const linked = run(exported(), destination({ cards: [{ _id: 'C1', title: 'Login', cardNumber: 1, type: 'cardType-linkedCard' }] }));
  assert.ok(!linked.transfer.cards.some(row => row._id === 'C1'));
  // Two file cards on one board card: neither is written.
  const twice = exported(); twice.cards[1] = { ...twice.cards[1], title: 'Login', cardNumber: 1 };
  const dupe = run(twice, destination({ cards: [{ _id: 'C1', title: 'Login', cardNumber: 1 }] }));
  assert.deepEqual(dupe.transfer.cards, []);
  // A bare transfer has card IDs only: no ID on this board, no match.
  const bare = run(exported().scrumTransfer, destination());
  assert.deepEqual(bare.transfer.cards, []);
});

test('a card is never moved into a finished sprint, and keeps its history', () => {
  const states = new Map([['S', 'closed'], ['P', 'planned']]);
  const refused = mergeCardScrum({ sprintId: 'P' }, { sprintId: 'S' }, states);
  assert.equal(refused.refused, 'S'); assert.equal(refused.scrum.sprintId, 'P'); assert.equal(refused.changed, false);
  const moved = mergeCardScrum({ sprintId: 'Q', pastSprintIds: ['O'], releaseId: 'R' }, { sprintId: 'P', pastSprintIds: ['N'], releaseId: 'R' }, states);
  assert.equal(moved.scrum.sprintId, 'P');
  assert.deepEqual(moved.scrum.pastSprintIds, ['O', 'N', 'Q']);
  assert.equal(moved.scrum.releaseIds, undefined, 'an unchanged release keeps its stored form');
  assert.equal(mergeCardScrum({ sprintId: 'P', backlogRank: 1 }, { sprintId: 'P', backlogRank: 1 }, states).changed, false);
});

test('the browser sends only what the import reads', () => {
  const file = exported(); file.attachments = [{ _id: 'a', file: 'x'.repeat(1000) }]; file.cards[0].description = 'secret';
  const fields = scrumTransferFileFields(file);
  assert.deepEqual(Object.keys(fields).sort(), ['_id', 'cards', 'customFields', 'lists', 'scrumTransfer', 'scrumTransferLosses']);
  assert.deepEqual(fields.cards[0], { _id: 'c1', title: 'Login', cardNumber: 1 });
  assert.throws(() => scrumTransferFileFields({ title: 'No Scrum' }), /no Scrum planning/);
  assert.throws(() => scrumTransferFileFields([]), /JSON object/);
  assert.throws(() => planScrumTransferMerge({ format: 'wekan-scrum-9' }, destination(), newId), /unsupported version/);
});

test('the server method is admin-only, journaled, recorded in History and offered in the Scrum view', () => {
  const method = read('server/scrum.js');
  const body = method.slice(method.indexOf("'scrum.importIntoBoard'"), method.indexOf("'scrum.inspectHistoryCheckpoint'"));
  assert.match(body, /boardFor\(userId, boardId, true\)/, 'administrators only');
  assert.match(body, /await pending\(boardId\)/, 'refused while another Scrum operation is pending');
  assert.match(body, /return locked\(boardId/, 'one History batch, under the board lock');
  assert.match(body, /record: recordScrumChange/);
  const server = read('server/lib/scrumTransferMerge.js');
  assert.match(server, /board\.hasAdmin\(userId\)/);
  assert.match(server, /writeImportPlan\(/); assert.match(server, /finishImportPlan\(/);
  assert.match(server, /scrumImportPending: true/);
  // Another board's card IDs are looked up only to be reported. The file's own
  // board is not "another board": an unmatched card of it is not matched, as
  // the server test's card that is only in the source expects.
  assert.match(server, /boardId: \{ \$nin: \[boardId, \.\.\.\(typeof file\._id === 'string' \? \[file\._id\] : \[\]\)\] \}/,
    'another board\'s card IDs are looked up only to be reported, the file\'s own board excluded');
  assert.doesNotMatch(server, /boardId: \{ \$ne: boardId \} \}, \{ fields: \{ _id: 1 \} \}/,
    'negative: the source board\'s own cards are not reported as another board\'s');
  assert.doesNotMatch(server, /Cards\.(update|insert|remove)/, 'cards are written only by the journaled stage');
  const recovery = read('server/lib/scrumImportRecovery.js');
  assert.match(recovery, /step\.after\.scrumRevision === step\.before\.scrumRevision \+ 1/);
  const view = read('client/components/boards/scrum/scrumView.jade');
  const admin = view.indexOf('details.scrum-transfer-import');
  assert.ok(admin > view.indexOf('if canAdmin'), 'the import is in the administrators\' part of the view');
});
