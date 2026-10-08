'use strict';
// Planning Sync (2026-10-08): a synced issue's sprint and releases as the
// card's Scrum planning (models/lib/listSyncPlanning.js), through the same
// saved steps, History and conditional writes as the other Sync fields.
// Run: node tests/listSyncPlanning.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const P = require('../models/lib/listSyncPlanning');
const { validateStep } = require('../server/lib/syncOperationJournal');
const { prepareSyncOperationMutation } = require('../server/lib/syncOperationMutation');
const { applySyncOperationStep } = require('../server/lib/syncOperationApply');
const { buildListSyncSteps } = require('../server/lib/listSyncSteps');
const { prepareSyncFieldHistory, validateSyncFieldHistory } = require('../server/lib/syncHistoryBatch');
const { syncOperationEffectId } = require('../server/lib/syncOperationApply');
const { describeSyncSourceCoverage } = require('../server/lib/listSyncSourceCoverage');
const { syncTextSelector } = require('../models/lib/listSyncTextMerge');
const { historyDocument } = require('../models/lib/scrumHistory');
const { cardReleaseIds } = require('../models/lib/scrum');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const SPRINT = 'com.pyxis.greenhopper.jira:gh-sprint';

// --- Fixtures, in the field names the real APIs use ---------------------------
// Jira Cloud search with the Sprint field (an array of sprint objects) and
// fixVersions; `schema` as server/lib/listSyncFetch.js attaches it.
const jira = () => ({ schema: { customfield_10020: { type: 'array', items: 'json', custom: SPRINT } }, issues: [
  { key: 'PLAN-1', fields: { summary: 'Both', customfield_10020: [
    { id: 41, name: 'Sprint 41', state: 'closed', boardId: 3, startDate: '2026-09-01T08:00:00.000Z', endDate: '2026-09-14T08:00:00.000Z' },
    { id: 42, name: 'Sprint 42', state: 'active', boardId: 3, goal: 'Ship the pump', startDate: '2026-09-15T08:00:00.000Z', endDate: '2026-09-28T08:00:00.000Z' },
    { id: 43, name: 'Sprint 43', state: 'future', boardId: 3 }],
  fixVersions: [{ self: 'https://jira.example.org/rest/api/2/version/10000', id: '10000', name: 'v1.0', archived: false,
    released: true, releaseDate: '2026-09-30' }, { id: '10001', name: 'v1.1', archived: false, released: false,
    releaseDate: '2026-02-30' }] } },
  { key: 'PLAN-2', fields: { summary: 'Future only', customfield_10020: [{ id: 43, name: 'Sprint 43', state: 'future' },
    { id: 44, name: 'Sprint 44', state: 'future', startDate: 'not a date' }], fixVersions: [] } },
  { key: 'PLAN-3', fields: { summary: 'Cleared', customfield_10020: null, fixVersions: null } },
  { key: 'PLAN-4', fields: { summary: 'Absent' } },
  { key: 'PLAN-5', fields: { summary: 'Closed only', customfield_10020: [{ id: 41, name: 'Sprint 41', state: 'closed' }] } },
  { key: 'PLAN-6', fields: { summary: 'Malformed', customfield_10020: [{ name: 'no id', state: 'active' }],
    fixVersions: [{ id: '10002' }] } },
  { key: 'PLAN-7', fields: { summary: 'Legacy form', customfield_10020: [
    'com.atlassian.greenhopper.service.sprint.Sprint@1a2b[id=45,rapidViewId=1,state=ACTIVE,name=Sprint 45,startDate=2026-10-01T08:00:00.000Z,endDate=<null>,goal=<null>]'] } },
] });
// GitLab Issues API v4: `iteration` (1 upcoming, 2 current, 3 closed) and `milestone`.
const gitlab = () => [
  { iid: 7, title: 'Pump', state: 'opened',
    iteration: { id: 501, iid: 5, sequence: 5, group_id: 9, title: null, description: null, state: 2,
      start_date: '2026-10-01', due_date: '2026-10-14', web_url: 'https://gitlab.example.org/groups/g/-/iterations/501' },
    milestone: { id: 12, iid: 3, project_id: 42, title: '2026.10', description: 'October', state: 'active',
      start_date: '2026-10-01', due_date: '2026-10-31', web_url: 'https://gitlab.example.org/g/p/-/milestones/3' } },
  { iid: 8, title: 'Valve', state: 'opened', iteration: null, milestone: null },
  { iid: 9, title: 'Free tier', state: 'opened' },
  { iid: 10, title: 'Closed things', state: 'closed',
    iteration: { id: 499, iid: 3, title: 'Iteration 3', state: 3, start_date: '2026-09-01', due_date: '2026-09-14' },
    milestone: { id: 11, iid: 2, title: '2026.09', state: 'closed', due_date: '2026-09-31' } },
];
// GitHub REST issues (Gitea and Forgejo use the same `milestone` names).
const github = () => [
  { number: 3, title: 'Docs', state: 'open', milestone: { url: 'https://api.github.com/repos/o/r/milestones/1', id: 1002604,
    node_id: 'MDk6TWlsZXN0b25lMTAwMjYwNA==', number: 1, title: 'v1.0', description: 'Tracking milestone for version 1.0',
    open_issues: 4, closed_issues: 8, state: 'open', created_at: '2026-01-10T20:09:31Z', due_on: '2026-10-09T07:00:00Z',
    closed_at: null } },
  { number: 4, title: 'Done', state: 'closed', milestone: { id: 1002605, number: 2, title: 'v0.9', state: 'closed',
    due_on: null, closed_at: '2026-09-01T10:00:00Z' } },
  { number: 5, title: 'None', state: 'open', milestone: null },
  { number: 6, title: 'A pull request', pull_request: { url: 'x' }, milestone: { id: 1, title: 'ignored', state: 'open' } },
];

test('only the planning a source carries can be selected (negative: no sprint from GitHub, Gitea or Forgejo)', () => {
  assert.deepEqual(P.syncPlanningFields({ type: 'jira', fields: ['title', 'sprint', 'releases'] }), ['sprint', 'releases']);
  assert.deepEqual(P.syncPlanningFields({ type: 'gitlab', fields: ['releases'] }), ['releases']);
  assert.deepEqual(P.syncPlanningFields({ type: 'github', fields: ['title'] }), []);
  for (const type of ['github', 'gitea', 'forgejo']) {
    assert.deepEqual(P.syncPlanningFields({ type, fields: ['releases'] }), ['releases']);
    assert.throws(() => P.syncPlanningFields({ type, fields: ['sprint'] }), error => error.code === 'sync-planning-invalid');
  }
});

test('Jira: the active sprint (else the last future one) and every fix version, with their dates', () => {
  const planning = P.sourcePlanning('jira', jira(), ['sprint', 'releases']);
  const one = planning.get('PLAN-1');
  assert.deepEqual([one.sprint.recordId, one.sprint.name, one.sprint.goal], ['42', 'Sprint 42', 'Ship the pump']);
  assert.equal(one.sprint.plannedStart.toISOString(), '2026-09-15T08:00:00.000Z');
  assert.equal(one.sprint.plannedEnd.toISOString(), '2026-09-28T08:00:00.000Z');
  assert.deepEqual(one.releases.map(r => [r.recordId, r.name, r.state]), [['10000', 'v1.0', 'released'], ['10001', 'v1.1', 'planned']]);
  assert.equal(one.releases[0].releasedAt.toISOString(), '2026-09-30T00:00:00.000Z');
  // Malformed date (no February 30th): the release is still made, without it.
  assert.equal(one.releases[1].plannedEnd, undefined);
  const two = planning.get('PLAN-2');
  assert.equal(two.sprint.recordId, '44', 'the last open sprint listed');
  assert.equal(two.sprint.plannedStart, undefined, 'a malformed start date is dropped');
  assert.deepEqual(two.releases, [], 'an empty fixVersions list says: no releases');
  assert.deepEqual(planning.get('PLAN-3'), { sprint: null, releases: [] }, 'null clears');
  assert.equal(planning.has('PLAN-4'), false, 'absent fields say nothing');
  assert.equal(planning.has('PLAN-5'), false, 'only a closed sprint: unchanged, never a clear');
  assert.equal(planning.has('PLAN-6'), false, 'malformed values: unchanged, never a clear');
  assert.deepEqual([planning.get('PLAN-7').sprint.recordId, planning.get('PLAN-7').sprint.name], ['45', 'Sprint 45']);
  // Without the schema, nothing names the Sprint field: no sprint at all.
  const { schema, ...bare } = jira();
  assert.equal(P.sourcePlanning('jira', bare, ['sprint']).size, 0);
  // Only the selected planning is read.
  assert.equal(P.sourcePlanning('jira', jira(), ['releases']).get('PLAN-1').sprint, undefined);
  assert.equal(P.sourcePlanning('jira', jira(), []).size, 0);
});

test('GitLab: iteration as the sprint and milestone as the release', () => {
  const planning = P.sourcePlanning('gitlab', gitlab(), ['sprint', 'releases']);
  const seven = planning.get('7');
  assert.deepEqual([seven.sprint.recordId, seven.sprint.name], ['501', 'Iteration 2026-10-01 - 2026-10-14'],
    'an automatic cadence\'s iteration has no title: named by its dates');
  assert.equal(seven.sprint.plannedEnd.toISOString(), '2026-10-14T00:00:00.000Z');
  assert.deepEqual(seven.releases.map(r => [r.recordId, r.name, r.state, r.notes]), [['12', '2026.10', 'planned', 'October']]);
  assert.deepEqual(planning.get('8'), { sprint: null, releases: [] });
  assert.equal(planning.has('9'), false, 'GitLab Free returns no iteration: unchanged');
  const ten = planning.get('10');
  assert.equal(ten.sprint, undefined, 'a closed iteration is not assigned');
  assert.equal(ten.releases[0].state, 'released');
  assert.equal(ten.releases[0].plannedEnd, undefined, 'September has no 31st');
});

test('GitHub, Gitea and Forgejo: the milestone as the release, if the payload carries one', () => {
  for (const type of ['github', 'gitea', 'forgejo']) {
    const planning = P.sourcePlanning(type, github(), ['releases']);
    assert.deepEqual(planning.get('3').releases.map(r => [r.recordId, r.name, r.state]), [['1002604', 'v1.0', 'planned']]);
    assert.equal(planning.get('3').releases[0].plannedEnd.toISOString(), '2026-10-09T07:00:00.000Z');
    assert.equal(planning.get('4').releases[0].releasedAt.toISOString(), '2026-09-01T10:00:00.000Z');
    assert.deepEqual(planning.get('5').releases, []);
    assert.equal(planning.has('6'), false, 'pull requests are not synced');
    assert.equal(planning.get('3').sprint, undefined);
  }
  // The adapters already read this field: the parsers' milestone tag and due date.
  const parsers = read('models/lib/externalParsers.js');
  assert.match(parsers, /issue\.milestone && \(issue\.milestone\.title \|\| issue\.milestone\.name\)/);
  assert.match(parsers, /issue\.iteration && issue\.iteration\.title/);
});

const ORIGIN = 'https://jira.example.org';
test('records are matched by source id first, then by name, and never from another board (negative)', () => {
  const records = P.planningRecords(P.sourcePlanning('jira', jira(), ['sprint', 'releases']));
  const existing = {
    sprints: [
      // Another board's record with the very same source id and name: never used.
      { _id: 'foreign', boardId: 'other', name: 'Sprint 42', state: 'planned', provenance: { system: 'jira', projectId: ORIGIN, recordId: '42' } },
      // Renamed locally, but it is source sprint 44: matched by id.
      { _id: 'renamed', boardId: 'board', name: 'Our sprint', state: 'planned', provenance: { system: 'jira', projectId: ORIGIN, recordId: '44' } },
      // A finished WeKan sprint of the same name is not given new work.
      { _id: 'closed42', boardId: 'board', name: 'Sprint 42', state: 'closed' },
      // Claimed by another source sprint: not taken by name.
      { _id: 'claimed', boardId: 'board', name: 'Sprint 45', state: 'planned', provenance: { system: 'jira', projectId: ORIGIN, recordId: '99' } },
    ],
    releases: [{ _id: 'byName', boardId: 'board', name: ' V1.0 ', state: 'planned' },
      { _id: 'foreignRelease', boardId: 'other', name: 'v1.1', state: 'planned' }],
  };
  const { resolved, create } = P.resolvePlanningRecords({ boardId: 'board', system: 'jira', origin: ORIGIN, records, existing });
  assert.equal(resolved.get('sprint:44')._id, 'renamed');
  assert.equal(resolved.get('release:10000')._id, 'byName');
  for (const [key, foreign] of [['sprint:42', 'foreign'], ['release:10001', 'foreignRelease'], ['sprint:45', 'claimed']]) {
    assert.notEqual(resolved.get(key)._id, foreign, key);
    assert.notEqual(resolved.get(key)._id, 'closed42', key);
    assert.equal(resolved.get(key).created, true, key);
  }
  const made = Object.fromEntries(create.map(row => [row.document.provenance.recordId, row.document]));
  assert.ok(create.every(row => row.document.boardId === 'board'));
  assert.deepEqual([made['42'].name, made['42'].goal, made['42'].state], ['Sprint 42', 'Ship the pump', 'planned']);
  assert.equal(made['42'].plannedStart.toISOString(), '2026-09-15T08:00:00.000Z');
  assert.deepEqual(made['42'].provenance, { system: 'jira', projectId: ORIGIN, recordId: '42' });
  assert.equal(made['10001'].state, 'planned');
  // The id a record is made with is derived from its source: a retry names the same one.
  const again = P.resolvePlanningRecords({ boardId: 'board', system: 'jira', origin: ORIGIN, records, existing });
  assert.deepEqual(again.create.map(row => row.document._id), create.map(row => row.document._id));
  assert.notEqual(P.syncRecordId({ boardId: 'other', kind: 'sprint', system: 'jira', origin: ORIGIN, recordId: '42' }), made['42']._id);
  // Once made, the next run finds it by id even after a rename.
  const madeSprint = { ...made['42'], name: 'Renamed later' };
  const next = P.resolvePlanningRecords({ boardId: 'board', system: 'jira', origin: ORIGIN, records,
    existing: { sprints: [madeSprint], releases: [] } });
  assert.equal(next.resolved.get('sprint:42')._id, made['42']._id);
  assert.ok(!next.create.some(row => row.document._id === made['42']._id));
  // A Jira-imported record (provenance without a server) is the same sprint.
  const imported = P.resolvePlanningRecords({ boardId: 'board', system: 'jira', origin: ORIGIN, records,
    existing: { sprints: [{ _id: 'imported', boardId: 'board', name: 'x', state: 'active', provenance: { system: 'jira', recordId: '42' } }] } });
  assert.equal(imported.resolved.get('sprint:42')._id, 'imported');
  // ...but another server's is not.
  const elsewhere = P.resolvePlanningRecords({ boardId: 'board', system: 'jira', origin: ORIGIN, records,
    existing: { sprints: [{ _id: 'elsewhere', boardId: 'board', name: 'x', state: 'planned', provenance: { system: 'jira', projectId: 'https://other.example.org', recordId: '42' } }] } });
  assert.notEqual(elsewhere.resolved.get('sprint:42')._id, 'elsewhere');
  // A finished sprint matched by id is never assigned: the card keeps its sprint.
  const finished = P.resolvePlanningRecords({ boardId: 'board', system: 'jira', origin: ORIGIN, records,
    existing: { sprints: [{ _id: 'done', boardId: 'board', name: 'Sprint 42', state: 'closed', provenance: { system: 'jira', projectId: ORIGIN, recordId: '42' } }] } });
  const planning = P.sourcePlanning('jira', jira(), ['sprint']).get('PLAN-1');
  assert.equal(P.localPlanning(planning, finished.resolved).sprintId, undefined);
});

const fields = ['sprint', 'releases'];
test('a card takes the source\'s planning; a local edit stays until the source changes; replay is idempotent', () => {
  // First Sync of a new card.
  const first = P.planCardPlanning({ incoming: { sprintId: 's1', releaseIds: ['r1', 'r2'] }, fields });
  assert.deepEqual(first.changes.scrum, { releaseId: 'r1', releaseIds: ['r1', 'r2'], sprintId: 's1' });
  assert.equal(first.changes.scrumRevision, 1);
  assert.deepEqual(first.baseline, { sprint: 's1', releases: ['r1', 'r2'] });
  let card = { scrum: first.changes.scrum, scrumRevision: 1, syncLastSource: first.baseline };
  // Replay of the same source: nothing to write.
  assert.equal(P.planCardPlanning({ card, incoming: { sprintId: 's1', releaseIds: ['r1', 'r2'] }, fields }).changes, null);
  // A local edit (another sprint, one more release) survives an unchanged source.
  card = { ...card, scrum: { ...card.scrum, sprintId: 'local', releaseIds: ['r1', 'r2', 'mine'] }, scrumRevision: 2 };
  assert.equal(P.planCardPlanning({ card, incoming: { sprintId: 's1', releaseIds: ['r1', 'r2'] }, fields }).changes, null);
  // The source moves the issue and drops r2: applied; the local-only release stays.
  const moved = P.planCardPlanning({ card, incoming: { sprintId: 's2', releaseIds: ['r1', 'r3'] }, fields });
  assert.equal(moved.changes.scrum.sprintId, 's2');
  assert.deepEqual(cardReleaseIds(moved.changes.scrum), ['r1', 'mine', 'r3']);
  assert.deepEqual(moved.changes.scrum.pastSprintIds, ['local'], 'historical membership, as a manual move records it');
  assert.equal(moved.changes.scrumRevision, 3);
  card = { scrum: moved.changes.scrum, scrumRevision: 3, syncLastSource: moved.baseline };
  assert.equal(P.planCardPlanning({ card, incoming: { sprintId: 's2', releaseIds: ['r1', 'r3'] }, fields }).changes, null);
  // Missing source fields leave the card unchanged; so does an unknown sprint.
  assert.equal(P.planCardPlanning({ card, incoming: {}, fields }).changes, null);
  assert.deepEqual(P.planCardPlanning({ card, incoming: {}, fields }).baseline, {});
  // The source clears: applied against the baseline.
  const cleared = P.planCardPlanning({ card, incoming: { sprintId: null, releaseIds: [] }, fields });
  assert.equal(cleared.changes.scrum.sprintId, null);
  assert.deepEqual(cardReleaseIds(cleared.changes.scrum), ['mine']);
  assert.deepEqual(cleared.baseline, { sprint: '', releases: [] });
  // A first Sync of an existing card never empties local planning.
  const local = { scrum: { sprintId: 'local', releaseId: 'mine', releaseIds: ['mine'] }, scrumRevision: 4 };
  const untouched = P.planCardPlanning({ card: local, incoming: { sprintId: null, releaseIds: [] }, fields });
  assert.equal(untouched.changes, null);
  assert.deepEqual(untouched.baseline, { sprint: '', releases: [] });
  // ...and adds the source's releases beside the card's own.
  const joined = P.planCardPlanning({ card: local, incoming: { releaseIds: ['r9'] }, fields: ['releases'] });
  assert.deepEqual(cardReleaseIds(joined.changes.scrum), ['mine', 'r9']);
  assert.equal(joined.changes.scrum.sprintId, 'local', 'an unselected field is never touched');
  // Unrelated card metadata stays as it is.
  const ranked = P.planCardPlanning({ card: { scrum: { backlogRank: 3, issueType: 'Bug' } }, incoming: { sprintId: 's1' }, fields });
  assert.deepEqual(ranked.changes.scrum, { backlogRank: 3, issueType: 'Bug', sprintId: 's1' });
});

// --- The saved step and its History ---------------------------------------------
const before = { _id: 'card', boardId: 'board', listId: 'list', swimlaneId: 'lane', title: 'T', archived: false,
  scrum: { sprintId: 'old', backlogRank: 2 }, scrumRevision: 4, syncLastSource: { title: 'T', sprint: 'old' } };
const after = { ...before, scrum: { sprintId: 'new', backlogRank: 2, pastSprintIds: ['old'] }, scrumRevision: 5,
  syncLastSource: { title: 'T', sprint: 'new' } };
const step = { kind: 'update', cardId: 'card', before, after };

test('the journal accepts a planning step, and only one (negative)', () => {
  assert.doesNotThrow(() => validateStep(structuredClone(step)));
  const refused = [
    [{ after: { ...after, scrumRevision: 4 } }, /planning/], // revision not moved on
    [{ after: { ...after, scrumRevision: 7 } }, /planning/],
    [{ after: { ...after, scrum: { ...after.scrum, backlogRank: 9 } } }, /unmapped-planning/], // not Sync's key
    [{ after: { ...after, syncLastSource: { title: 'T' } } }, /planning/], // no planning baseline
    [{ after: { ...after, scrum: { ...after.scrum, releaseIds: ['r1'], releaseId: 'r2' } } }, /planning/],
    [{ after: { ...after, scrum: { sprintId: 7 } } }, /planning/],
    [{ after: { ...after, scrum: 'x' } }, /planning/],
    [{ after: { ...after, syncLastSource: { sprint: 7 } } }, /baseline/],
    [{ after: { ...after, syncLastSource: { releases: ['ok', 3] } } }, /baseline/],
    [{ before: { ...before, scrumRevision: -1 } }, /planning/],
  ];
  for (const [over, code] of refused) {
    assert.throws(() => validateStep(structuredClone({ ...step, ...over })), code, JSON.stringify(over).slice(0, 80));
  }
  // A release-only change needs the releases baseline, not the sprint one.
  const releases = { ...after, scrum: { ...before.scrum, releaseId: 'r', releaseIds: ['r'] } };
  assert.throws(() => validateStep(structuredClone({ ...step, after: releases })), /planning/);
  validateStep(structuredClone({ ...step, after: { ...releases, syncLastSource: { title: 'T', sprint: 'old', releases: ['r'] } } }));
  // A new card's planning starts at revision one.
  const create = { kind: 'create', cardId: 'n', before: null, after: { _id: 'n', boardId: 'board', listId: 'list',
    title: 'N', scrum: { sprintId: 's' }, scrumRevision: 1, syncLastSource: { sprint: 's' } } };
  validateStep(structuredClone(create));
  assert.throws(() => validateStep(structuredClone({ ...create, after: { ...create.after, scrumRevision: 2 } })), /planning/);
  assert.throws(() => validateStep(structuredClone({ ...create, after: { ...create.after, syncLastSource: {} } })), /planning/);
});

test('a planning step records the Scrum History row a manual change records', () => {
  const effectId = syncOperationEffectId(randomUUID(), 0);
  const plan = prepareSyncFieldHistory({ step, effectId, userId: 'actor', createdAt: new Date(0) });
  const row = plan.rows.find(r => r.entityType === 'scrum');
  assert.ok(row);
  assert.deepEqual([row.group, row.changeType, row.cardId, row.entityId, row.listId, row.swimlaneId],
    ['scrum', 'edited', 'card', 'card', 'list', 'lane']);
  // The same content Scrum History's undo compares the live card with.
  assert.deepEqual(row.newContent, { records: [{ type: 'card', id: 'card', document: historyDocument('card', after) }] });
  assert.deepEqual(row.previousContent, { records: [{ type: 'card', id: 'card', document: historyDocument('card', before) }] });
  assert.equal(validateSyncFieldHistory(plan, step, effectId), true);
  // A tampered row is refused.
  const tampered = structuredClone(plan);
  tampered.rows.find(r => r.entityType === 'scrum').newContent.records[0].document.scrum.sprintId = 'elsewhere';
  assert.throws(() => validateSyncFieldHistory(tampered, step, effectId));
  // No planning change: no Scrum row.
  const plainStep = { ...step, after: { ...before, title: 'U' } };
  assert.ok(!prepareSyncFieldHistory({ step: plainStep, effectId, userId: 'actor', createdAt: new Date(0) })
    .rows.some(r => r.entityType === 'scrum'));
});

// A store that answers the exact selectors the journal makes.
function matches(doc, selector) {
  return Object.entries(selector).every(([key, want]) => {
    const value = doc[key];
    if (want && typeof want === 'object' && !Array.isArray(want)) {
      if (Object.hasOwn(want, '$exists') && (value !== undefined) !== want.$exists) return false;
      if (Object.hasOwn(want, '$eq')) return JSON.stringify(value ?? null) === JSON.stringify(want.$eq);
      return true;
    }
    return JSON.stringify(value) === JSON.stringify(want);
  });
}
test('a planning step replays idempotently and never overwrites a concurrent Scrum edit (negative)', async () => {
  const run = async row => {
    const state = { row: structuredClone(row), writes: 0 };
    const cards = { findOne: async q => (matches(state.row, q) ? state.row : null),
      insertOne: async () => assert.fail('no insert'),
      updateOne: async (q, m) => { if (!matches(state.row, q)) return { matchedCount: 0 }; state.writes++;
        Object.assign(state.row, structuredClone(m.$set || {})); for (const k of Object.keys(m.$unset || {})) delete state.row[k];
        return { matchedCount: 1 }; } };
    const args = { cards, step: structuredClone(step), operationId: randomUUID(), index: 0, assertCurrent: async () => {},
      completeEffects: async ({ effectId }) => effectId };
    return { state, args };
  };
  const { state, args } = await run(before);
  assert.equal(await applySyncOperationStep(args), 'applied');
  assert.deepEqual(state.row.scrum, after.scrum);
  assert.equal(state.row.scrumRevision, 5);
  assert.equal(await applySyncOperationStep(args), 'already-applied');
  assert.equal(state.writes, 1);
  // Somebody moved the card to another sprint meanwhile: the step does not write.
  const edited = await run({ ...before, scrum: { ...before.scrum, sprintId: 'theirs' }, scrumRevision: 5 });
  await assert.rejects(applySyncOperationStep(edited.args), /write-unconfirmed/);
  assert.equal(edited.state.row.scrum.sprintId, 'theirs');
  assert.ok(prepareSyncOperationMutation(step).modifier.$set.scrum);
});

test('steps carry planning only when the run maps it, and a changed card stops the plan', () => {
  const fetched = { _id: 'card', title: 'T', archived: false, syncLastSource: before.syncLastSource,
    scrum: before.scrum, scrumRevision: 4 };
  const stored = { ...before };
  const changes = { scrum: after.scrum, scrumRevision: 5, syncLastSource: after.syncLastSource };
  const [planned] = buildListSyncSteps({ creations: [], updates: [{ cardId: 'card', changes }], archives: [],
    fetched: [fetched], current: new Map([['card', stored]]), now: new Date(0) });
  assert.deepEqual(planned.before.scrum, before.scrum);
  assert.deepEqual(planned.after.scrum, after.scrum);
  validateStep(planned);
  // A run without planning neither carries nor compares it.
  const { scrum, scrumRevision, ...withoutPlanning } = fetched;
  const [plain] = buildListSyncSteps({ creations: [], updates: [{ cardId: 'card', changes: { title: 'U' } }], archives: [],
    fetched: [withoutPlanning], current: new Map([['card', { ...stored, scrumRevision: 99 }]]), now: new Date(0) });
  assert.equal(Object.hasOwn(plain.before, 'scrum'), false);
  assert.throws(() => buildListSyncSteps({ creations: [], updates: [{ cardId: 'card', changes }], archives: [],
    fetched: [fetched], current: new Map([['card', { ...stored, scrumRevision: 5 }]]), now: new Date(0) }), /sync-card-changed/);
  // The direct path's conditional write compares the same fields.
  assert.deepEqual(Object.keys(syncTextSelector({ ...fetched }, 'board', 'list')).filter(k => k.startsWith('scrum')), ['scrum', 'scrumRevision']);
  assert.ok(!Object.keys(syncTextSelector(withoutPlanning, 'board', 'list')).some(k => k.startsWith('scrum')));
});

test('source coverage reports the planning attributes as synced once selected', () => {
  const jiraRows = describeSyncSourceCoverage('jira', jira(), ['title', 'sprint', 'releases']).rows;
  assert.ok(jiraRows.some(row => row.path.endsWith('/fixVersions') && row.target === 'releases' && row.reason === 'converted'));
  assert.ok(jiraRows.some(row => row.path.endsWith('/customfield_10020') && row.target === 'sprint'));
  assert.ok(!jiraRows.some(row => row.path === '/schema'), 'the fetched schema is transport, not issue data');
  const plainJira = describeSyncSourceCoverage('jira', jira(), ['title']).rows;
  assert.ok(plainJira.some(row => row.path.endsWith('/fixVersions') && row.reason === 'unmapped'));
  const lab = describeSyncSourceCoverage('gitlab', gitlab(), ['title', 'sprint', 'releases']).rows;
  assert.ok(lab.some(row => row.path.endsWith('/iteration') && row.target === 'sprint'));
  assert.ok(lab.some(row => row.path.endsWith('/milestone') && row.target === 'releases'));
  const hub = describeSyncSourceCoverage('github', github(), ['title']).rows;
  assert.ok(hub.some(row => row.path.endsWith('/milestone') && row.target === 'tags'), 'unselected: as before');
});

test('the settings, fetchers, schemas and both write paths are wired (source checks)', () => {
  const methods = read('server/methods/listSync.js');
  assert.match(methods, /'remainingEstimate',\s*'sprint', 'releases'\)\]\)/);
  assert.match(methods, /if \(source\) syncPlanningFields\(config\);/);
  assert.match(read('models/lists.js'), /'syncSource\.fields\.\$':[^\n]*'sprint', 'releases'/);
  const cards = read('models/cards.js');
  for (const key of ["'syncLastSource.sprint'", "'syncLastSource.releases'", "'syncLastSource.releases.$'"]) assert.ok(cards.includes(key), key);
  const fetch = read('server/lib/listSyncFetch.js');
  assert.match(fetch, /\/rest\/api\/2\/field/);
  assert.match(fetch, /if \(planning\.releases\) fields\.push\('fixVersions'\)/);
  assert.ok(fetch.includes(`const JIRA_SPRINT_SCHEMA = '${require('../models/lib/jiraScrumPlanning').JIRA_PLANNING_SCHEMA.sprint}';`),
    'the fetcher and the Jira import find the same Sprint field');
  const sync = read('server/listSync.js');
  assert.match(sync, /planningSkipped = await planningUnavailable\(/);
  assert.match(sync, /await createPlanningRecords\(/);
  assert.match(sync, /await recordPlanningHistory\(/);
  assert.match(sync, /\.\.\.\(planningFields\.length \? \{ scrum: c\.scrum, scrumRevision: c\.scrumRevision \} : \{\}\)/);
  const server = read('server/lib/listSyncPlanning.js');
  assert.match(server, /board\.scrum\?\.enabled !== true\) return 'scrum-disabled'/);
  assert.match(server, /withScrumBoardLock\(boardId/);
  assert.match(server, /normalizeScrumRecord\(kind/);
  // Negative: the board's records are read for THIS board only, everywhere.
  assert.ok(!/Scrum(Sprints|Releases)\.find\(\{\s*\}/.test(server));
  assert.equal((server.match(/Scrum(?:Sprints|Releases)\.find\(\{ boardId \}/g) || []).length, 2);
  const ui = read('client/components/lists/listHeader.js');
  assert.match(ui, /'remainingEstimate', 'sprint', 'releases'\]/);
  assert.match(ui, /type === 'gitlab' \? \['title', 'description', 'estimate', 'sprint', 'releases'\]/);
  assert.match(ui, /type \? \['title', 'description', 'releases'\]/);
  assert.match(read('client/components/lists/listHeader.jade'), /if syncPlanningEnabled\n\s+p\.quiet\.js-list-sync-planning-hint/);
  assert.match(read('server/lib/tests/index.js'), /import '\.\/listSyncPlanning\.tests';/);
});
