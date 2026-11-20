'use strict';
// The Jira export carries the cards' dependencies as Jira issue links
// (2026-11-20, the import/export coverage review): the Jira import reads
// fields.issuelinks back into dependencies (models/jiraCreator.js
// createDependencies), but the export wrote none, so they were lost.
// Run: node --test tests/exportDependencies.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

let fmt;
test.before(async () => { fmt = (await import('../models/lib/externalExportFormatters.js')).formatters; });
const items = [
  { cardId: 'a', title: 'A', labels: [], dependencies: [{ cardId: 'b', type: 'blocks' }, { cardId: 'c', type: 'is-duplicated-by' }, { cardId: 'gone', type: 'blocks' }] },
  { cardId: 'b', title: 'B', labels: [], dependencies: [{ cardId: 'a', type: 'related-to' }] },
  { cardId: 'c', title: 'C', labels: [], dependencies: [{ cardId: 'a', type: 'is-blocked-by' }] },
];

test('each dependency is an issue link in the direction the import reads', () => {
  const doc = fmt.jira({ board: { title: 'B' }, items });
  const links = Object.fromEntries(doc.issues.map(issue => [issue.fields.summary, issue.fields.issuelinks]));
  assert.deepStrictEqual(links.A, [
    { type: { name: 'Blocks' }, outwardIssue: { key: 'WEKAN-2' } },
    { type: { name: 'Duplicate' }, inwardIssue: { key: 'WEKAN-3' } },
  ], 'a dependency on a card not exported is left out');
  assert.deepStrictEqual(links.B, [{ type: { name: 'Relates' }, outwardIssue: { key: 'WEKAN-1' } }]);
  assert.deepStrictEqual(links.C, [{ type: { name: 'Blocks' }, inwardIssue: { key: 'WEKAN-1' } }]);
  // A link to a card on another page uses the whole board's key.
  const page = fmt.jira({ board: { title: 'B' }, items: [items[2]], page: { all: items, offset: 2, first: false, last: true } });
  assert.deepStrictEqual(page.issues[0].fields.issuelinks, [{ type: { name: 'Blocks' }, inwardIssue: { key: 'WEKAN-1' } }]);
});

test('negative: no dependencies, no issuelinks; and the import still reads these link shapes', () => {
  const doc = fmt.jira({ board: { title: 'B' }, items: [{ cardId: 'x', title: 'X', labels: [] }] });
  assert.ok(!('issuelinks' in doc.issues[0].fields));
  const creator = fs.readFileSync(path.join(__dirname, '..', 'models/jiraCreator.js'), 'utf8');
  for (const part of ["typeName.includes('block')", "depType = 'is-blocked-by'", "depType = 'is-duplicated-by'", 'link.outwardIssue', 'link.inwardIssue']) {
    assert.ok(creator.includes(part), part);
  }
});

test('Taskwarrior: a card waits for what blocks it, as depends, whichever card the dependency is stored on', async () => {
  const { taskwarriorUuid } = await import('../models/lib/taskwarriorFormat.js');
  const tasks = JSON.parse(fmt.taskwarrior({ items: [
    { cardId: 'a', title: 'A', labels: [], dependencies: [{ cardId: 'b', type: 'blocks' }] },
    { cardId: 'b', title: 'B', labels: [] },
    { cardId: 'c', title: 'C', labels: [], dependencies: [{ cardId: 'a', type: 'is-blocked-by' }, { cardId: 'gone', type: 'is-blocked-by' }] },
  ] }));
  const byTitle = Object.fromEntries(tasks.map(task => [task.description, task]));
  assert.deepStrictEqual(byTitle.B.depends, [taskwarriorUuid('a')], 'A blocks B: B waits for A');
  assert.deepStrictEqual(byTitle.C.depends, [taskwarriorUuid('a')], 'C is blocked by A; a card not exported is left out');
  assert.ok(!('depends' in byTitle.A), 'negative: A waits for nothing');
});

// Asana, OpenProject, Obsidian and Wrike say what a task waits for; each
// export writes it the way its import reads it (2026-11-20).
const waiting = [
  { cardId: 'a', title: 'A', listTitle: 'To Do', labels: [], dependencies: [{ cardId: 'b', type: 'blocks' }] },
  { cardId: 'b', title: 'B', listTitle: 'To Do', labels: [] },
  { cardId: 'c', title: 'C', listTitle: 'To Do', labels: [], dependencies: [{ cardId: 'a', type: 'is-blocked-by' }, { cardId: 'gone', type: 'is-blocked-by' }] },
];

test('Asana, OpenProject, Obsidian and Wrike write what each card waits for', async () => {
  const asana = fmt.asana({ items: waiting });
  assert.deepStrictEqual(asana.data.map(t => t.dependencies || []), [[], [{ gid: 'a' }], [{ gid: 'a' }]]);

  const op = fmt.openproject({ items: waiting });
  const relations = op._embedded.elements.map(wp => ((wp._embedded || {}).relations || [])
    .map(r => [r.type, r._links.from.href, r._links.to.href]));
  assert.deepStrictEqual(relations, [[], [['blocked', '/api/v3/work_packages/2', '/api/v3/work_packages/1']],
    [['blocked', '/api/v3/work_packages/3', '/api/v3/work_packages/1']]]);

  const md = fmt.obsidian({ lists: [{ title: 'To Do' }], items: waiting });
  assert.match(md, /- \[ \] A .*🆔 a/, 'A is waited for: its id');
  assert.match(md, /- \[ \] B .*⛔ a/, 'B waits for A');
  assert.doesNotMatch(md.split('\n').find(line => line.includes('] B')), /🆔/, 'negative: nobody waits for B');

  const { formatWrikeRows } = await import('../models/lib/wrikeFormat.js');
  const sheet = formatWrikeRows({ board: { title: 'T' }, items: waiting });
  const at = name => sheet.rows[0].indexOf(name);
  const byTitle = Object.fromEntries(sheet.rows.slice(1).map(row => [row[at('Title')], row]));
  assert.strictEqual(byTitle.B[at('Depends On')], `${byTitle.A[at('Key')]}FS`);
  assert.strictEqual(byTitle.C[at('Depends On')], `${byTitle.A[at('Key')]}FS`);
  assert.strictEqual(byTitle.A[at('Depends On')], '', 'negative: A waits for nothing');
});

test('Vikunja: what a task waits for is its "blocked" relation, by task id', async () => {
  const { formatVikunja } = await import('../models/lib/vikunjaFormat.js');
  const doc = formatVikunja({ board: { title: 'T' }, lists: [{ title: 'To Do' }], swimlanes: [{ title: 'Default' }], items: waiting });
  const byTitle = Object.fromEntries(doc.projects[0].tasks.map(task => [task.title, task]));
  assert.deepStrictEqual(byTitle.B.related_tasks.blocked, [{ id: byTitle.A.id }]);
  assert.deepStrictEqual(byTitle.C.related_tasks.blocked, [{ id: byTitle.A.id }]);
  assert.ok(!byTitle.A.related_tasks.blocked, 'negative: A waits for nothing');
});
