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
  assert.deepEqual(t.sprints.map(s => [s._id, s.state, s.goal]), [['jira-sprint-9', 'planned', 'Pumps'],
    ['jira-sprint-10', 'planned', '']]);
  assert.equal(t.sprints[0].plannedStart.toISOString(), '2026-08-15T09:00:00.000Z');
  assert.deepEqual(t.releases.map(r => [r._id, r.state, r.releasedAt?.toISOString().slice(0, 10) ?? null]),
    [['jira-version-100', 'released', '2026-08-30'], ['jira-version-101', 'planned', null]]);
  const byKey = Object.fromEntries(t.cards.map(c => [c._id, c.scrum]));
  assert.deepEqual(byKey['P-2'], { issueType: 'Story', sprintId: 'jira-sprint-9', releaseId: 'jira-version-100',
    backlogRank: 1 }, 'the open sprint, the first version, and the rank before P-1\'s');
  assert.deepEqual(byKey['P-1'], { issueType: 'Epic', backlogRank: 2 });
  assert.deepEqual(byKey['P-3'], { sprintId: 'jira-sprint-10', releaseId: 'jira-version-101' });
  assert.deepEqual(plan.epicParents, { 'P-2': 'P-1' });
  assert.deepEqual(t.settings, { enabled: true });
  assert.deepEqual(plan.skipFields.sort(), ['customfield_10014', 'customfield_10019', 'customfield_10020']);
  // Reported, never invented: the closed sprint, the active one's snapshot, the
  // second version and the epic outside the import.
  const reasons = plan.losses.map(l => l.reason).join('\n');
  for (const text of ['closed sprint "Sprint 8, the old one" is not imported', 'active sprint "Sprint 9" is imported as planned',
    'fix version "1.1" is not the card\'s release', 'epic X-9 is not part of this import']) assert.ok(reasons.includes(text), text);
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
