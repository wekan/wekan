'use strict';
// Scrum planning from importers other than Jira
// (models/lib/externalScrumPlanning.js): GitLab iterations and milestones,
// OpenProject versions, sprints, position and story points, Asana milestones,
// and what Trello cannot give. Server test:
// server/lib/tests/externalScrumImport.tests.js. Browser test:
// tests/playwright/specs/gitlab-scrum-import.e2e.js.
// Run: node tests/externalScrumPlanning.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const S = require('../models/lib/externalScrumPlanning');
const { normalizeScrumTransfer } = require('../models/lib/scrumTransfer');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const reasons = losses => losses.map(l => l.reason).join('\n');
const byCard = transfer => Object.fromEntries(transfer.cards.map(c => [c._id, c.scrum]));
const fixture = JSON.parse(read('tests/fixtures/import-formats/gitlab-scrum.json'));

test('GitLab: iterations become sprints and milestones releases, with dates and state', () => {
  const { transfer, losses } = S.gitlabScrumPlanning(fixture);
  assert.doesNotThrow(() => normalizeScrumTransfer(transfer), 'a valid native transfer');
  assert.deepEqual(transfer.settings, { enabled: true });
  assert.deepEqual(transfer.sprints.map(s => [s._id, s.name, s.state, s.plannedStart.toISOString().slice(0, 10),
    s.plannedEnd.toISOString().slice(0, 10), s.provenance.system]),
  [['gitlab-sprint-90', 'Sprint 12', 'planned', '2026-10-05', '2026-10-16', 'gitlab']]);
  assert.deepEqual(transfer.releases.map(r => [r._id, r.name, r.state, r.plannedEnd.toISOString().slice(0, 10)]),
    [['gitlab-release-11', 'v3.0', 'planned', '2026-10-30']]);
  assert.deepEqual(byCard(transfer), {
    'task-0': { sprintId: 'gitlab-sprint-90', releaseId: 'gitlab-release-11' },
    'task-1': { releaseId: 'gitlab-release-11' },
  });
  assert.deepEqual(losses, [], 'an upcoming iteration and an active milestone lose nothing');
});

test('GitLab: the parser carries the transfer and keeps the milestone and iteration tags', async () => {
  const { parseGitlab } = await import('../models/lib/externalParsers.js');
  const parsed = parseGitlab(fixture);
  assert.equal(parsed.scrumTransfer.sprints[0].name, 'Sprint 12');
  // List Sync writes tags, not Scrum planning, and older boards filter by them.
  assert.ok(parsed.tasks[0].tags.includes('milestone:v3.0'));
  assert.ok(parsed.tasks[0].tags.includes('iteration:Sprint 12'));
  // A re-imported export that already carries the tag does not get it twice.
  const again = parseGitlab([{ ...fixture[0], labels: ['milestone:v3.0'] }]);
  assert.equal(again.tasks[0].tags.filter(t => t === 'milestone:v3.0').length, 1);
  assert.equal(parseGitlab([{ id: 1, title: 'plain' }]).scrumTransfer, undefined, 'nothing to plan, no transfer');
});

test('GitLab: states as integers and words; started and finished ones are reported, never faked', () => {
  const it = (id, state, extra = {}) => ({ id, iteration: { id, title: `It ${id}`, state, start_date: '2026-10-01', due_date: '2026-10-14', ...extra } });
  const { transfer, losses } = S.gitlabScrumPlanning([it(1, 1), it(2, 'current'), it(3, 3), it(4, 'closed'), it(5, 9),
    { id: 6, milestone: { id: 50, title: 'Shipped', state: 'closed', due_date: '2026-09-01' } }]);
  assert.deepEqual(transfer.sprints.map(s => [s.name, s.state]), [['It 1', 'planned'], ['It 2', 'planned']]);
  assert.deepEqual(transfer.releases.map(r => [r.name, r.state, r.releasedAt]), [['Shipped', 'released', undefined]]);
  const text = reasons(losses);
  for (const expected of ['current iteration "It 2" is imported as planned', 'closed iteration "It 3" is not imported',
    'closed iteration "It 4" is not imported', 'iteration "It 5" has an unknown state and is not imported',
    'closed milestone "Shipped" is imported as released without a release date']) assert.ok(text.includes(expected), expected);
  assert.deepEqual(Object.keys(byCard(transfer)), ['task-0', 'task-1', 'task-5'], 'cards of unimported iterations stay in the backlog');
  assert.doesNotThrow(() => normalizeScrumTransfer(transfer));
});

test('GitLab: an untitled cadence iteration is named by its dates, as GitLab shows it', () => {
  const { transfer } = S.gitlabScrumPlanning([{ iteration: { id: 7, iid: 4, title: null, state: 2,
    start_date: '2022-03-08', due_date: '2022-03-14' } }]);
  assert.equal(transfer.sprints[0].name, '2022-03-08 – 2022-03-14');
  const bare = S.gitlabScrumPlanning([{ iteration: { id: 8, iid: 5, state: 1 } }]);
  assert.equal(bare.transfer.sprints[0].name, 'Iteration 5');
});

test('negative: malformed dates are left out and reported, never stored', () => {
  const { transfer, losses } = S.gitlabScrumPlanning([
    { iteration: { id: 1, title: 'Bad', state: 1, start_date: '2026-02-30', due_date: 'soon' } },
    { iteration: { id: 2, title: 'Backwards', state: 1, start_date: '2026-10-20', due_date: '2026-10-01' } },
    { milestone: { id: 3, title: 'Odd', state: 'active', due_date: 20261001 } },
  ]);
  const [bad, backwards] = transfer.sprints;
  assert.deepEqual([bad.plannedStart, bad.plannedEnd], [undefined, undefined]);
  assert.equal(backwards.plannedStart.toISOString().slice(0, 10), '2026-10-20');
  assert.equal(backwards.plannedEnd, undefined, 'an end before the start is dropped');
  assert.equal(transfer.releases[0].plannedEnd, undefined);
  const text = reasons(losses);
  for (const expected of ['iteration "Bad": its start date is not a date', 'iteration "Bad": its end date is not a date',
    'iteration "Backwards" ends before it starts', 'milestone "Odd": its end date is not a date']) assert.ok(text.includes(expected), expected);
  assert.ok(!/2026-02-30|soon|20261001/.test(text), 'the bad values themselves are not copied into the report');
  assert.doesNotThrow(() => normalizeScrumTransfer(transfer));
  assert.equal(S.sourceDate('2026-13-01'), null);
  assert.equal(S.sourceDate('2026-10-01T09:00:00+02:00').toISOString(), '2026-10-01T07:00:00.000Z');
  assert.equal(S.sourceDate(undefined), undefined);
});

test('negative: duplicate names stay separate records and are reported; one id listed twice is one record', () => {
  const { transfer, losses } = S.gitlabScrumPlanning([
    { iteration: { id: 1, title: 'Sprint 1', state: 1 }, milestone: { id: 10, title: 'v1', state: 'active' } },
    { iteration: { id: 2, title: 'sprint 1', state: 1 }, milestone: { id: 11, title: 'v1', state: 'active' } },
    { iteration: { id: 1, title: 'Sprint 1', state: 1 }, milestone: { id: 10, title: 'v1', state: 'active' } },
  ]);
  assert.equal(transfer.sprints.length, 2);
  assert.equal(transfer.releases.length, 2);
  const cards = byCard(transfer);
  assert.equal(cards['task-0'].sprintId, cards['task-2'].sprintId);
  assert.notEqual(cards['task-0'].sprintId, cards['task-1'].sprintId);
  const text = reasons(losses);
  assert.ok(text.includes('2 iterations are named "Sprint 1": each is imported as its own sprint'));
  assert.ok(text.includes('2 milestones are named "v1": each is imported as its own release'));
  assert.doesNotThrow(() => normalizeScrumTransfer(transfer));
});

test('negative: a card in a missing or unusable iteration stays in the backlog and is reported', () => {
  const { transfer, losses } = S.gitlabScrumPlanning([
    { iteration: { state: 1 } }, { iteration: 'Sprint 3' }, { milestone: { id: 4 } },
    { milestone: { id: 5, title: 'Kept' } },
  ]);
  assert.deepEqual(Object.keys(byCard(transfer)), ['task-3']);
  const text = reasons(losses);
  assert.ok(text.includes('an iteration with neither an id nor a title is not imported; the issue stays in the backlog'));
  assert.ok(text.includes('an iteration in an unknown form is not imported'));
  assert.ok(text.includes('a milestone without a title is not imported'));
  assert.ok(text.includes('milestone "Kept" has no state in the export and is imported as planned'));
  assert.equal(S.gitlabScrumPlanning([]).transfer, null);
  assert.equal(S.gitlabScrumPlanning('nonsense').transfer, null);
});

const wp = (id, links = {}, extra = {}) => ({ id, subject: `WP ${id}`, _links: { status: { title: 'New' }, ...links }, ...extra });
const opDoc = {
  _embedded: {
    versions: { elements: [
      { _type: 'Version', id: 3, name: '1.0', description: { raw: 'First' }, startDate: '2026-10-01', endDate: '2026-11-01', status: 'open' },
      { _type: 'Version', id: 4, name: '0.9', endDate: '2026-09-01', status: 'closed' },
    ] },
    sprints: [
      { _type: 'Sprint', id: 7, name: 'Sprint 11', startDate: '2026-10-05', finishDate: '2026-10-16',
        _links: { status: { href: 'urn:openproject-org:api:v3:sprints:status:in_planning', title: 'In planning' } } },
      { _type: 'Sprint', id: 8, name: 'Sprint 10', startDate: '2026-09-21', finishDate: '2026-10-02',
        _links: { status: { href: 'urn:openproject-org:api:v3:sprints:status:completed' } } },
    ],
    elements: [
      wp(1, { version: { href: '/api/v3/versions/3', title: '1.0' }, sprint: { href: '/api/v3/sprints/7', title: 'Sprint 11' } },
        { position: 2, storyPoints: 5 }),
      wp(2, { version: { href: '/api/v3/versions/4', title: '0.9' }, sprint: { href: '/api/v3/sprints/8', title: 'Sprint 10' } },
        { position: 1, storyPoints: 3 }),
      wp(3, { version: { href: '/api/v3/versions/12', title: 'Linked only' } }),
    ],
  },
};

test('OpenProject: versions become releases, sprints sprints; position ranks and story points estimate', async () => {
  const { transfer, losses } = S.openProjectScrumPlanning(opDoc, opDoc._embedded.elements);
  assert.doesNotThrow(() => normalizeScrumTransfer(transfer));
  assert.deepEqual(transfer.settings, { enabled: true, estimateSource: 'customField',
    estimateCustomFieldId: 'Story points', estimateUnit: 'points' });
  assert.deepEqual(transfer.releases.map(r => [r._id, r.name, r.state, r.notes]),
    [['openproject-release-3', '1.0', 'planned', 'First'], ['openproject-release-4', '0.9', 'released', ''],
      ['openproject-release-12', 'Linked only', 'planned', undefined]]);
  assert.deepEqual(transfer.sprints.map(s => [s.name, s.plannedStart.toISOString().slice(0, 10)]), [['Sprint 11', '2026-10-05']]);
  assert.deepEqual(byCard(transfer), {
    'task-0': { sprintId: 'openproject-sprint-7', releaseId: 'openproject-release-3', backlogRank: 2 },
    'task-1': { releaseId: 'openproject-release-4', backlogRank: 1 },
    'task-2': { releaseId: 'openproject-release-12' },
  });
  const text = reasons(losses);
  for (const expected of ['completed sprint "Sprint 10" is not imported', 'closed version "0.9" is imported as released',
    'version "Linked only": only its title is in the export']) assert.ok(text.includes(expected), expected);
  const { parseOpenProject } = await import('../models/lib/externalParsers.js');
  const parsed = parseOpenProject(opDoc);
  assert.equal(parsed.tasks[0].custom_fields['Story points'], 5, 'story points become the numeric estimate field');
  assert.deepEqual(parsed.scrumTransfer.cards, transfer.cards);
  assert.ok(parsed.scrumLosses.some(u => /Sprint 10/.test(u.reason)), 'reported when Scrum is imported');
  assert.ok(!parsed.unsupported.some(u => /Sprint 10/.test(u.reason)), 'and only then (the creator adds them)');
});

test('OpenProject: a resource embedded on the work package is read; a link with nothing to name is reported', () => {
  const doc = { _embedded: { elements: [
    wp(1, { sprint: { href: '/api/v3/sprints/9' } }, { _embedded: { sprint: { id: 9, name: 'Embedded', startDate: '2026-10-01',
      finishDate: 'next week', _links: { status: { href: 'urn:openproject-org:api:v3:sprints:status:active' } } } } }),
    wp(2, { version: { href: '/api/v3/versions/77' } }),
  ] } };
  const { transfer, losses } = S.openProjectScrumPlanning(doc, doc._embedded.elements);
  assert.deepEqual(transfer.sprints.map(s => [s.name, s.state, s.plannedEnd]), [['Embedded', 'planned', undefined]]);
  assert.deepEqual(transfer.settings, { enabled: true }, 'no story points, no estimate');
  const text = reasons(losses);
  assert.ok(text.includes('active sprint "Embedded" is imported as planned'));
  assert.ok(text.includes('sprint "Embedded": its end date is not a date'));
  assert.ok(text.includes('a version that is neither embedded nor titled is not imported'));
  assert.doesNotThrow(() => normalizeScrumTransfer(transfer));
});

test('Asana: a milestone task is a release for itself and for the tasks it waits for', async () => {
  const data = { data: [
    { gid: '1', name: 'Build', resource_subtype: 'default_task' },
    { gid: '2', name: 'Launch', resource_subtype: 'milestone', due_on: '2026-11-01', notes: 'Go live',
      dependencies: [{ gid: '1' }, { gid: '404' }] },
    { gid: '3', name: 'Docs', dependents: [{ gid: '2' }] },
    { gid: '4', name: 'Beta', resource_subtype: 'milestone', completed: true, completed_at: '2026-09-15T10:00:00.000Z',
      dependencies: [{ gid: '1' }] },
    { gid: '5', name: 'Unrelated' },
  ] };
  const { transfer, losses } = S.asanaScrumPlanning(data.data);
  assert.doesNotThrow(() => normalizeScrumTransfer(transfer));
  assert.deepEqual(transfer.sprints, [], 'Asana has no sprint record');
  assert.deepEqual(transfer.releases.map(r => [r._id, r.name, r.state, r.releasedAt?.toISOString() ?? null,
    r.plannedEnd?.toISOString().slice(0, 10) ?? null]),
  [['asana-release-2', 'Launch', 'planned', null, '2026-11-01'], ['asana-release-4', 'Beta', 'released', '2026-09-15T10:00:00.000Z', null]]);
  assert.deepEqual(byCard(transfer), {
    'task-0': { releaseId: 'asana-release-2' }, 'task-1': { releaseId: 'asana-release-2' },
    'task-2': { releaseId: 'asana-release-2' }, 'task-3': { releaseId: 'asana-release-4' },
  });
  const text = reasons(losses);
  assert.ok(text.includes('task 404 of milestone "Launch" is not part of this import'));
  assert.ok(text.includes('milestone "Beta" is not the card\'s release: a card has one'), 'a second milestone is reported');
  const { parseAsana } = await import('../models/lib/externalParsers.js');
  assert.equal(parseAsana(data).scrumTransfer.releases.length, 2);
  assert.equal(parseAsana({ data: [{ gid: '1', name: 'Plain' }] }).scrumTransfer, undefined);
  const undated = S.asanaScrumPlanning([{ gid: '9', name: 'Done', resource_subtype: 'milestone', completed: true }]);
  assert.ok(reasons(undated.losses).includes('completed milestone "Done" has no completion date'));
});

test('Trello: nothing is invented; Power-Up data is counted in the loss report', () => {
  assert.deepEqual(S.trelloScrumLosses({ cards: [{ id: 'c' }] }), []);
  const losses = S.trelloScrumLosses({ pluginData: [{ idPlugin: 'p', value: '{}' }],
    cards: [{ pluginData: [{ value: '{"sprint":"S1"}' }] }, { pluginData: [] }, {}] });
  assert.deepEqual(losses.map(l => l.path), ['/pluginData', '/cards/pluginData']);
  assert.match(losses[1].reason, /on 1 card\(s\) is not imported: Trello has no native sprints or releases/);
  assert.deepEqual(S.trelloScrumLosses(null), []);
});

test('round trip: GitLab and OpenProject exports carry sprints and releases back', async () => {
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const parsers = await import('../models/lib/externalParsers.js');
  const collected = {
    board: { title: 'Plant', labels: [] }, lists: [{ _id: 'L', title: 'Doing' }], swimlanes: [],
    scrumSprints: [{ _id: 'sA', name: 'Sprint A', goal: 'Pumps', state: 'planned',
      plannedStart: new Date('2026-10-05T00:00:00Z'), plannedEnd: new Date('2026-10-16T00:00:00Z') },
    { _id: 'sX', name: 'Dropped', state: 'cancelled' }],
    scrumReleases: [{ _id: 'r1', name: '1.0', notes: 'First', state: 'planned', plannedEnd: new Date('2026-11-01T00:00:00Z') },
      { _id: 'r0', name: '0.9', state: 'released' }],
    items: [
      { cardId: 'a', title: 'A', description: '', listTitle: 'Doing', labels: [], labelIds: [],
        scrum: { sprintId: 'sA', firstReleaseId: 'r1', backlogRank: 20 } },
      { cardId: 'b', title: 'B', description: '', listTitle: 'Doing', labels: [], labelIds: [],
        scrum: { firstReleaseId: 'r0', backlogRank: 10 } },
      { cardId: 'c', title: 'C', description: '', listTitle: 'Doing', labels: [], labelIds: [], scrum: { sprintId: 'sX' } },
    ],
  };
  const gitlab = formatters.gitlab(collected);
  assert.deepEqual(gitlab[0].iteration, { id: 1, iid: 1, title: 'Sprint A', description: 'Pumps', state: 1,
    start_date: '2026-10-05', due_date: '2026-10-16' });
  assert.equal(gitlab[1].milestone.state, 'closed');
  assert.equal(gitlab[2].iteration, undefined, 'a cancelled sprint has no GitLab equivalent');
  const back = parsers.parseGitlab(JSON.parse(JSON.stringify(gitlab))).scrumTransfer;
  assert.deepEqual(back.sprints.map(s => [s.name, s.goal, s.plannedEnd.toISOString().slice(0, 10)]), [['Sprint A', 'Pumps', '2026-10-16']]);
  assert.deepEqual(back.releases.map(r => [r.name, r.state, r.notes]), [['1.0', 'planned', 'First'], ['0.9', 'released', '']]);
  assert.deepEqual(byCard(back), { 'task-0': { sprintId: back.sprints[0]._id, releaseId: back.releases[0]._id },
    'task-1': { releaseId: back.releases[1]._id } });

  const op = formatters.openproject(collected);
  const opBack = parsers.parseOpenProject(JSON.parse(JSON.stringify(op))).scrumTransfer;
  assert.deepEqual(opBack.sprints.map(s => [s.name, s.goal, s.plannedStart.toISOString().slice(0, 10)]), [['Sprint A', 'Pumps', '2026-10-05']]);
  assert.deepEqual(opBack.releases.map(r => [r.name, r.state]), [['1.0', 'planned'], ['0.9', 'released']]);
  assert.deepEqual(byCard(opBack)['task-0'], { sprintId: opBack.sprints[0]._id, releaseId: opBack.releases[0]._id, backlogRank: 2 });
  assert.deepEqual(byCard(opBack)['task-1'], { releaseId: opBack.releases[1]._id, backlogRank: 1 }, 'rank order survives');
  assert.doesNotThrow(() => normalizeScrumTransfer(opBack));

  // Without the planning records (no Scrum selected), nothing Scrum-shaped is written.
  const plain = { ...collected, scrumSprints: undefined, scrumReleases: undefined };
  assert.equal(formatters.gitlab(plain)[0].iteration, undefined);
  assert.equal(formatters.openproject(plain)._embedded.versions, undefined);
});

test('the importers write it through the shared journaled Scrum stage, validated first', () => {
  const kanboard = read('models/kanboardCreator.js');
  assert.match(kanboard, /require\('\/server\/lib\/scrumTransferImport'\)/, 'the same stage as Jira and WeKan JSON');
  assert.ok(kanboard.indexOf('normalizeScrumTransfer(board.scrumTransfer)') < kanboard.indexOf('await this.createBoard(board)'),
    'checked before any document is written');
  assert.ok(kanboard.indexOf('await this.createScrumPlanning(board, boardId)') > kanboard.indexOf('await this.createCards(board, boardId)'),
    'after the cards it assigns exist');
  assert.doesNotMatch(read('models/lib/externalScrumPlanning.js'), /insertAsync|updateAsync|Random\.id/, 'pure: no parallel writer');
  // Not selecting Scrum settings on the import page leaves the planning and
  // its losses out: raw external documents are not pruned before parsing.
  assert.match(kanboard, /this\.wantsScrum = fields\.length === 0 \|\| fields\.includes\('scrum'\)/);
  assert.match(kanboard, /!this\.wantsScrum \|\| !board\.scrumTransfer/);
  assert.match(kanboard, /this\.wantsScrum && Array\.isArray\(board\.scrumLosses\)/);
  assert.match(read('client/components/import/import.js'), /importFields: selectedFields\(\)/);
  const trello = read('models/trelloCreator.js');
  assert.match(trello, /\{ method: 'recordScrumLosses' \}/);
  const exporters = read('models/lib/externalExporters.js');
  assert.match(exporters, /SCRUM_FORMATS\.has\(format\) && want\('scrum'\)/, 'export follows the Scrum selection');
});
