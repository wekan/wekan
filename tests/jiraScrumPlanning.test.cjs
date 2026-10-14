'use strict';
// Jira sprints, fix versions, rank and epic links as Scrum planning data
// (models/lib/jiraScrumPlanning.js). Server test: server/lib/tests/jiraScrumImport.tests.js.
// Run: node tests/jiraScrumPlanning.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const P = require('../models/lib/jiraScrumPlanning');
const { normalizeScrumTransfer } = require('../models/lib/scrumTransfer');

const legacy = '[id=8,rapidViewId=2,state=CLOSED,name=Sprint 8, the old one,goal=Ship it,startDate=2026-08-01T09:00:00.000Z,endDate=2026-08-14T17:00:00.000Z,completeDate=2026-08-14T17:00:00.000Z,sequence=8]';
const data = {
  schema: { customfield_10020: { custom: 'com.pyxis.greenhopper.jira:gh-sprint' },
    customfield_10019: { custom: 'com.pyxis.greenhopper.jira:gh-lexo-rank' } },
  names: { customfield_10014: 'Epic Link', customfield_10020: 'Sprint', customfield_10019: 'Rank' },
  issues: [
    { key: 'P-1', fields: { issuetype: { name: 'Epic' }, customfield_10019: '0|i0000r:' } },
    { key: 'P-2', fields: { issuetype: { name: 'Story' }, customfield_10014: 'P-1', customfield_10019: '0|i0000f:',
      customfield_10020: [`com.atlassian.greenhopper.service.sprint.Sprint@1a2b${legacy}`,
        { id: 9, name: 'Sprint 9', state: 'active', goal: 'Pumps', startDate: '2026-08-15T09:00:00.000Z',
          endDate: '2026-08-28T17:00:00.000Z' }],
      fixVersions: [{ id: '100', name: '1.0', released: true, releaseDate: '2026-08-30' },
        { id: '101', name: '1.1', released: false }] } },
    { key: 'P-3', fields: { customfield_10014: 'X-9', customfield_10020: [{ id: 10, name: 'Sprint 10', state: 'future' }],
      fixVersions: [{ id: '101', name: '1.1' }] } },
  ],
};

test('the planning fields are found by schema, then by name - never by number', () => {
  assert.deepEqual(P.jiraPlanningFields(data), { sprint: 'customfield_10020', rank: 'customfield_10019',
    epicLink: 'customfield_10014' });
  assert.deepEqual(P.jiraPlanningFields({ names: { customfield_1: 'Sprint' } }), { sprint: 'customfield_1' });
  assert.deepEqual(P.jiraPlanningFields({ issues: [] }), {}, 'nothing supplied, nothing guessed');
  assert.deepEqual(P.jiraPlanningFields({ names: { summary: 'Sprint' } }), {}, 'only custom fields');
});

test('sprints in both of Jira\'s forms', () => {
  const closed = P.parseJiraSprint(`com.atlassian.greenhopper.service.sprint.Sprint@1a2b${legacy}`);
  assert.deepEqual([closed.id, closed.name, closed.state, closed.goal], ['8', 'Sprint 8, the old one', 'closed', 'Ship it']);
  assert.equal(closed.startDate.toISOString(), '2026-08-01T09:00:00.000Z');
  assert.equal(P.parseJiraSprint({ id: 9, name: 'S', state: 'ACTIVE' }).state, 'active');
  for (const bad of [null, 'nonsense', { id: 'x', name: 'S', state: 'active' }, { id: 1, name: '', state: 'active' },
    { id: 1, name: 'S', state: 'paused' }]) assert.equal(P.parseJiraSprint(bad), null, JSON.stringify(bad));
});

test('the transfer: open sprints planned, versions as releases, rank order, epic parents, gaps reported', () => {
  const plan = P.jiraScrumPlanning(data);
  const t = plan.transfer;
  // The closed sprint is a closed sprint now (2026-10-15), rebuilt from the issues.
  assert.deepEqual(t.sprints.map(s => [s._id, s.state, s.goal]), [['jira-sprint-9', 'planned', 'Pumps'],
    ['jira-sprint-10', 'planned', ''], ['jira-sprint-8', 'closed', 'Ship it']]);
  assert.equal(t.sprints[0].plannedStart.toISOString(), '2026-08-15T09:00:00.000Z');
  assert.deepEqual(t.releases.map(r => [r._id, r.state, r.releasedAt?.toISOString().slice(0, 10) ?? null]),
    [['jira-version-100', 'released', '2026-08-30'], ['jira-version-101', 'planned', null]]);
  const byKey = Object.fromEntries(t.cards.map(c => [c._id, c.scrum]));
  // Every fix version is one of the card's releases (2026-10-08): the first
  // as `releaseId` too, so an older reader still sees one.
  assert.deepEqual(byKey['P-2'], { issueType: 'Story', sprintId: 'jira-sprint-9', pastSprintIds: ['jira-sprint-8'],
    releaseId: 'jira-version-100', releaseIds: ['jira-version-100', 'jira-version-101'], backlogRank: 1 },
  'the open sprint, the closed one it was in, every version, and the rank before P-1\'s');
  assert.deepEqual(byKey['P-1'], { issueType: 'Epic', backlogRank: 2 });
  assert.deepEqual(byKey['P-3'], { sprintId: 'jira-sprint-10', releaseId: 'jira-version-101' });
  assert.deepEqual(plan.epicParents, { 'P-2': 'P-1' });
  assert.deepEqual(t.settings, { enabled: true });
  assert.deepEqual(plan.skipFields.sort(), ['customfield_10014', 'customfield_10019', 'customfield_10020']);
  // Reported, never invented: the closed sprint, the active one's snapshot and
  // the epic outside the import. A second fix version is no loss any more.
  const reasons = plan.losses.map(l => l.reason).join('\n');
  for (const text of ['closed sprint "Sprint 8, the old one" is imported with its commitment and close rebuilt from the issues (partial)',
    'active sprint "Sprint 9" is imported as planned',
    'epic X-9 is not part of this import']) assert.ok(reasons.includes(text), text);
  assert.doesNotMatch(reasons, /fix version|one release/, 'every fix version is kept, none reported');
  // It is a valid native transfer.
  assert.doesNotThrow(() => normalizeScrumTransfer(t));
});

test('negative: nothing to plan leaves the import as it was; an estimate mapping is kept', () => {
  assert.equal(P.jiraScrumPlanning({ issues: [{ key: 'A-1', fields: { summary: 'x' } }] }).transfer, null);
  const withEstimate = P.jiraScrumPlanning(data, { estimate: { sourceId: 'jira-estimate', unit: 'points' } });
  assert.deepEqual(withEstimate.transfer.settings, { enabled: true, estimateSource: 'customField',
    estimateCustomFieldId: 'jira-estimate', estimateUnit: 'points' });
  // A sprint ending before it starts keeps no planned end.
  const odd = P.jiraScrumPlanning({ names: { customfield_1: 'Sprint' }, issues: [{ key: 'A-1', fields: { customfield_1:
    [{ id: 1, name: 'S', state: 'future', startDate: '2026-09-02', endDate: '2026-09-01' }] } }] });
  assert.equal(odd.transfer.sprints[0].plannedEnd, undefined);
  assert.doesNotThrow(() => normalizeScrumTransfer(odd.transfer));
});

test('wiring: the Jira importer writes the plan as a native Scrum import', () => {
  const src = fs.readFileSync(path.join(__dirname, '../models/jiraCreator.js'), 'utf8');
  assert.match(src, /this\.planning = jiraScrumPlanning\(board, \{ estimate: this\.estimateMapping/);
  assert.match(src, /if \(this\.planning\.transfer\) normalizeScrumTransfer\(this\.planning\.transfer\);/);
  assert.match(src, /await this\.createDependencies\(board\);\n    await this\.createScrumPlanning\(boardId\);/);
  assert.match(src, /\.\.\.this\.planning\.losses,/);
  assert.match(src, /extras\[index\]\.parentKey \|\| \(this\.planning && this\.planning\.epicParents\[issues\[index\]\.key\]\)/);
});

// Closed sprints (2026-10-15): Jira's sprint report has no documented API, so
// the commitment and the close are rebuilt from each issue's change history.
test('a closed sprint: committed at its start, done at its close, from the change history', () => {
  const sprint = { id: 20, name: 'Sprint 20', state: 'closed', startDate: '2026-09-01T09:00:00.000Z',
    endDate: '2026-09-14T17:00:00.000Z', completeDate: '2026-09-14T18:00:00.000Z' };
  const done = { name: 'Done', statusCategory: { key: 'done' } };
  const doing = { name: 'In Progress', statusCategory: { key: 'indeterminate' } };
  const issue = (key, status, histories) => ({ key, fields: { status, customfield_1: [sprint] }, changelog: { histories } });
  const history = (created, items) => ({ created, items });
  const plan = P.jiraScrumPlanning({ names: { customfield_1: 'Sprint' }, issues: [
    // In the sprint from before the start; In Progress, then Done during it.
    issue('A-1', done, [history('2026-08-30T10:00:00.000Z', [{ field: 'Sprint', from: '', to: '20' }]),
      history('2026-09-10T10:00:00.000Z', [{ field: 'status', fromString: 'In Progress', toString: 'Done' }])]),
    // Added after the start: not committed, in at the close, not done then (done later).
    issue('A-2', done, [history('2026-09-05T10:00:00.000Z', [{ field: 'Sprint', from: '', to: '20' }]),
      history('2026-09-20T10:00:00.000Z', [{ field: 'status', fromString: 'In Progress', toString: 'Done' }])]),
    // Committed, then taken out before the close; it no longer names the sprint.
    { key: 'A-3', fields: { status: doing, customfield_1: [] }, changelog: { histories: [
      history('2026-08-31T10:00:00.000Z', [{ field: 'Sprint', from: '', to: '20' }]),
      history('2026-09-08T10:00:00.000Z', [{ field: 'Sprint', from: '20', to: '' }])] } },
    // The issue that keeps In Progress a list on the board.
    issue('A-4', doing, []),
  ] });
  const closed = plan.transfer.sprints.find(s => s._id === 'jira-sprint-20');
  assert.equal(closed.state, 'closed');
  assert.equal(closed.startedAt.toISOString(), '2026-09-01T09:00:00.000Z');
  assert.equal(closed.completedAt.toISOString(), '2026-09-14T18:00:00.000Z', 'completed, not merely the planned end');
  const rows = snap => Object.fromEntries(snap.cards.map(c => [c.cardId, [c.listId, c.done]]));
  assert.deepEqual(rows(closed.startSnapshot), { 'A-1': ['In Progress', false], 'A-3': ['In Progress', false], 'A-4': ['In Progress', false] },
    'committed at the start: A-2 came later');
  assert.deepEqual(rows(closed.closeSnapshot), { 'A-1': ['Done', true], 'A-2': ['In Progress', false], 'A-4': ['In Progress', false] },
    'at the close: A-3 was taken out, A-2 was not done yet');
  assert.equal(closed.startSnapshot.partial, true, 'rebuilt, and says so');
  assert.doesNotThrow(() => normalizeScrumTransfer(plan.transfer), 'a valid native transfer');
});

test('negative: a closed sprint without dates stays out; without history the issues as they are now', () => {
  const noDates = P.jiraScrumPlanning({ names: { customfield_1: 'Sprint' }, issues: [{ key: 'B-1', fields: {
    customfield_1: [{ id: 30, name: 'Undated', state: 'closed' }] } }] });
  assert.equal((noDates.transfer?.sprints || []).some(s => s._id === 'jira-sprint-30'), false);
  // ...and no card names it: a reference to a sprint that is not imported.
  assert.ok(!(noDates.transfer?.cards || []).some(c => (c.scrum.pastSprintIds || []).includes('jira-sprint-30')));
  assert.ok(noDates.losses.some(l => /closed sprint "Undated" is not imported: Jira gives no start and completion date/.test(l.reason)));
  // No change history: committed = naming it now; done = resolved by the close.
  const sprint = { id: 31, name: 'Plain', state: 'closed', startDate: '2026-09-01T00:00:00Z', completeDate: '2026-09-10T00:00:00Z' };
  const plain = P.jiraScrumPlanning({ names: { customfield_1: 'Sprint' }, issues: [
    { key: 'C-1', fields: { status: { name: 'Done' }, resolutiondate: '2026-09-05T00:00:00Z', customfield_1: [sprint] } },
    { key: 'C-2', fields: { status: { name: 'Done' }, resolutiondate: '2026-09-20T00:00:00Z', customfield_1: [sprint] } },
  ] });
  const rec = plain.transfer.sprints.find(s => s._id === 'jira-sprint-31');
  assert.deepEqual(rec.closeSnapshot.cards.map(c => [c.cardId, c.done]), [['C-1', true], ['C-2', false]]);
  assert.deepEqual(rec.startSnapshot.cards.map(c => c.cardId), ['C-1', 'C-2']);
});
