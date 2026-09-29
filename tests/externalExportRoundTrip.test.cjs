'use strict';

// Export to other tools round-trips through WeKan's own importers
// (models/lib/externalExportFormatters.js -> externalParsers.js /
// jiraIssueExtras.js). Run: node tests/externalExportRoundTrip.test.cjs
//
// The formatters used to emit title, description, due date and labels only,
// while the importers read comments, checklists, parents, people, several
// dates and custom fields - so a board exported to Kanboard, Deck,
// OpenProject, Asana, Zenkit or Jira and imported back lost all of that.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

const collected = {
  board: { title: 'Plant', labels: [{ _id: 'l1', name: 'urgent', color: 'red' }] },
  lists: [{ _id: 'L1', title: 'Doing' }, { _id: 'L2', title: 'Done' }],
  swimlanes: [{ _id: 'S1', title: 'Default' }],
  jiraEstimateMapping: null,
  items: [
    { cardId: 'P', listId: 'L1', title: 'Parent', description: 'Top', listTitle: 'Doing', swimlaneTitle: 'Default',
      labelIds: [], labels: [] },
    { cardId: 'C', listId: 'L2', title: 'Child', description: 'Do it', listTitle: 'Done', swimlaneTitle: 'Default',
      dueAt: '2026-10-10T00:00:00.000Z', startAt: '2026-10-01T00:00:00.000Z', endAt: '2026-10-09T00:00:00.000Z',
      createdAt: '2026-09-01T00:00:00.000Z', labelIds: ['l1'], labels: ['urgent'],
      owner: 'alice', assignees: ['bob'], creator: 'carol', requestedBy: 'Dave',
      parentCardId: 'P',
      comments: [{ text: 'Looks good', author: 'bob', date: '2026-09-02T00:00:00.000Z' }],
      checklists: [{ title: 'Steps', items: [{ title: 'Check valve', done: true }, { title: 'Test pump', done: false }] }],
      customFields: { Pressure: 42, Room: 'B12' } },
  ],
};

async function main() {
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const parsers = await import('../models/lib/externalParsers.js');
  const { jiraIssueExtras } = await import('../models/lib/jiraIssueExtras.js');
  const child = tasks => tasks.find(t => t.title === 'Child');
  const parentRef = tasks => tasks.find(t => t.title === 'Parent').ref;

  // Kanboard.
  {
    const t = child(parsers.parseKanboard(formatters.kanboard(collected)).tasks);
    assert.deepEqual([t.column_name, t.date_started, t.date_end, t.date_creation, t.owner_username, t.requested_by],
      ['Done', '2026-10-01T00:00:00.000Z', '2026-10-09T00:00:00.000Z', '2026-09-01T00:00:00.000Z', 'alice', 'carol']);
    assert.deepEqual(t.checklists[0].items, [{ title: 'Check valve', done: true }, { title: 'Test pump', done: false }]);
    assert.deepEqual(t.comments, [{ text: 'Looks good', author: 'bob', date: '2026-09-02T00:00:00.000Z' }]);
    assert.ok(t.tags.includes('urgent'));
  }
  // Nextcloud Deck.
  {
    const t = child(parsers.parseNextcloudDeck(formatters.deck(collected)).tasks);
    assert.deepEqual([t.date_end, t.date_creation, t.owner_username, t.assignees, t.requested_by],
      ['2026-10-09T00:00:00.000Z', '2026-09-01T00:00:00.000Z', 'alice', ['bob'], 'carol']);
    assert.deepEqual(t.comments, [{ text: 'Looks good', author: 'bob', date: '2026-09-02T00:00:00.000Z' }]);
  }
  // OpenProject.
  {
    const parsed = parsers.parseOpenProject(formatters.openproject(collected));
    const t = child(parsed.tasks);
    assert.equal(t.parent_ref, parentRef(parsed.tasks), 'the parent link survives');
    assert.deepEqual([t.date_started, t.date_creation, t.owner_username, t.assignees, t.requested_by],
      ['2026-10-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z', 'alice', ['bob'], 'carol']);
    assert.deepEqual(t.custom_fields, { Pressure: 42, Room: 'B12' });
    assert.deepEqual(t.comments, [{ text: 'Looks good', author: 'bob', date: '2026-09-02T00:00:00.000Z' }]);
  }
  // GitLab (#2698).
  {
    const t = child(parsers.parseGitlab(formatters.gitlab(collected)).tasks);
    assert.deepEqual([t.column_name, t.date_end, t.date_creation, t.owner_username, t.assignees, t.requested_by],
      ['Closed', '2026-10-09T00:00:00.000Z', '2026-09-01T00:00:00.000Z', 'alice', ['bob'], 'carol']);
    assert.deepEqual(t.comments, [{ text: 'Looks good', author: 'bob', authorName: undefined, date: '2026-09-02T00:00:00.000Z' }]);
    assert.equal(t.description, 'Do it', 'no source line is invented on a round trip');
    assert.ok(t.tags.includes('urgent'));
  }
  // Asana.
  {
    const parsed = parsers.parseAsana(formatters.asana(collected));
    const t = child(parsed.tasks);
    assert.equal(t.parent_ref, parentRef(parsed.tasks));
    assert.deepEqual([t.date_started, t.date_end, t.date_creation, t.owner_username],
      ['2026-10-01T00:00:00.000Z', '2026-10-09T00:00:00.000Z', '2026-09-01T00:00:00.000Z', 'alice']);
    assert.deepEqual(t.custom_fields, { Pressure: 42, Room: 'B12' });
    assert.deepEqual(t.checklists[0].items, [{ title: 'Check valve', done: true }, { title: 'Test pump', done: false }]);
    assert.deepEqual(t.comments, [{ text: 'Looks good', author: 'bob', date: '2026-09-02T00:00:00.000Z' }]);
  }
  // Zenkit (adapter shape): and no key of ours is reported as unrecognized.
  {
    const parsed = parsers.parseZenkit(formatters.zenkit(collected));
    const t = child(parsed.tasks);
    assert.deepEqual(parsed.unsupported, []);
    assert.equal(t.parent_ref, parentRef(parsed.tasks));
    assert.deepEqual([t.date_started, t.date_creation, t.owner_username, t.assignees],
      ['2026-10-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z', 'alice', ['bob']]);
    assert.deepEqual(t.custom_fields, { Pressure: 42, Room: 'B12' });
    assert.deepEqual(t.checklists, [{ title: 'Steps', items: [{ title: 'Check valve', done: true }, { title: 'Test pump', done: false }] }]);
    assert.deepEqual(t.comments.map(c => c.text), ['Looks good']);
  }
  // Jira.
  {
    const exported = formatters.jira(collected);
    const issue = exported.issues.find(i => i.fields.summary === 'Child');
    const parentKey = exported.issues.find(i => i.fields.summary === 'Parent').key;
    const extras = jiraIssueExtras(issue, { names: exported.names, importedKeys: new Set(exported.issues.map(i => i.key)) });
    assert.equal(extras.parentKey, parentKey);
    assert.deepEqual(extras.custom_fields, { Pressure: 42, Room: 'B12' });
    assert.deepEqual(extras.checklists[0].items, [{ title: 'Check valve', done: true }, { title: 'Test pump', done: false }]);
    assert.deepEqual(extras.comments.map(c => [c.text, c.author, c.date]), [['Looks good', 'bob', '2026-09-02T00:00:00.000Z']]);
    assert.deepEqual([issue.fields.created, issue.fields.assignee.name, issue.fields.reporter.displayName],
      ['2026-09-01T00:00:00.000Z', 'alice', 'Dave']);
  }
  console.log('  ok - Kanboard, Deck, OpenProject, Asana, Zenkit and Jira exports import back with their extras');

  // Negative: an item with none of the extras emits none of their keys, so
  // an export without comments or people says nothing about them.
  const bare = { ...collected, items: [collected.items[0]] };
  for (const format of ['kanboard', 'deck', 'openproject', 'asana', 'zenkit', 'jira']) {
    const text = JSON.stringify(formatters[format](bare));
    for (const key of ['comments', 'stories', 'subtasks', 'checklists', 'assignee', 'parent', 'custom_fields', 'names']) {
      assert.ok(!text.includes(`"${key}"`), `${format}: ${key}`);
    }
  }
  console.log('  ok - a card without extras exports without them');

  // Wiring: the collector gathers them only when selected, and Kanboard is
  // served by the shared route with the admin-only field check.
  const collector = read('models/lib/externalExporters.js');
  for (const key of ['comments', 'checklists', 'custom-fields', 'people', 'subtasks', 'dates']) {
    assert.match(collector, new RegExp(`want\\('${key}'\\)`), key);
  }
  const route = read('models/export.js');
  assert.doesNotMatch(route, /buildKanboardExport|\/export\/kanboard', safeRoute/, 'one Kanboard route, the shared one');
  assert.match(route, /await require\('\/server\/lib\/adminOnlyCustomFields'\)\.assertFieldExport\(boardId, user\?\._id\);\s*const built = await buildExternalExport/);
  console.log('  ok - extras are selected by the export selection; Kanboard uses the shared route');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
