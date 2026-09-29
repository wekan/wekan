'use strict';

// Asana import field fidelity (models/lib/externalParsers.js parseAsana).
// Run: node tests/asanaImport.test.cjs
//
// The Asana parser used to keep name, notes, section, due date, assignee and
// tags. It now keeps start, completion and creation dates, custom-field
// values of every Asana kind, comment stories, subtasks (as child cards when
// fetched as tasks, as a checklist when only embedded) and dependencies.
// Followers and attachment metadata are reported as losses.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const { parseAsana } = await import('../models/lib/externalParsers.js');
  const { planImportedTask, planImportedCustomFields, planImportedLinks } = await import('../models/lib/importedTaskPlan.js');
  const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/import-formats/asana.json')));
  const expected = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/import-formats/expectations.json')));

  const parsed = parseAsana(fixture);
  assert.equal(parsed.board.name, 'Audit Asana', 'the project name from memberships');
  const [task] = parsed.tasks;
  assert.equal(task.title, expected.title);
  assert.ok(task.description.startsWith(expected.description));
  assert.ok(task.description.endsWith('Source: https://app.asana.com/0/2/1'));
  assert.equal(task.column_name, 'Audit list');
  assert.equal(task.owner_username, 'asana-a@example.com');
  assert.deepEqual(task.tags, [expected.label]);
  assert.deepEqual(task.custom_fields, { 'Audit points': 5, 'Audit stage': 'Review' });
  assert.deepEqual(task.checklists, [{ title: 'Subtasks', items: [{ title: 'Audit subtask', done: true }] }]);
  // Followers are no longer a parser loss: they become card watchers when
  // mapped to a board member, and the importer reports the rest.
  assert.deepEqual(parsed.unsupported.map(u => u.path), ['/data/0/attachments']);
  assert.deepEqual(task.watchers, ['Asana Assignee']);
  const watched = planImportedTask(task, { members: { 'Asana Assignee': 'u1' }, boardMemberIds: ['u1'] });
  assert.deepEqual([watched.watcherIds, watched.unwatchedCount], [['u1'], 0]);
  const outsider = planImportedTask(task, { members: { 'Asana Assignee': 'u2' }, boardMemberIds: ['u1'] });
  assert.deepEqual([outsider.watcherIds, outsider.unwatchedCount], [[], 1], 'a non-member never watches');

  const plan = planImportedTask(task, { members: {} });
  assert.equal(plan.card.startAt.toISOString(), '2026-09-01T00:00:00.000Z');
  assert.equal(plan.card.createdAt.toISOString(), '2026-08-01T10:00:00.000Z');
  assert.equal(plan.card.endAt, undefined, 'an open task has no completion date');
  assert.deepEqual(plan.comments.map(c => [c.text, c.createdAt.toISOString()]),
    [[`asana-user: ${expected.comment}`, '2026-09-30T12:34:56.000Z']]);
  assert.deepEqual(planImportedCustomFields(parsed.tasks).fields,
    [{ name: 'Audit points', type: 'number' }, { name: 'Audit stage', type: 'text' }]);

  // Every custom-field kind.
  const kinds = parseAsana({ data: [{ gid: 'k', name: 'K', custom_fields: [
    { name: 'Text', text_value: 'hello' },
    { name: 'Zero', number_value: 0 },
    { name: 'Multi', multi_enum_values: [{ name: 'a' }, { name: 'b' }] },
    { name: 'Date', date_value: { date: '2026-09-30', date_time: null } },
    { name: 'People', people_value: [{ name: 'Ann' }] },
    { name: 'Formula', display_value: '42 %' },
    { name: 'Blank', text_value: '', display_value: null },
    { number_value: 1 },
  ] }] }).tasks[0].custom_fields;
  assert.deepEqual(kinds, { Text: 'hello', Zero: 0, Multi: ['a', 'b'], Date: '2026-09-30', People: ['Ann'], Formula: '42 %' });

  // Subtasks fetched as tasks become child cards, not checklist items;
  // dependencies block; completion carries its date.
  const tree = parseAsana({ data: [
    { gid: '1', name: 'Parent', subtasks: [{ gid: '2', name: 'Child' }, { gid: '9', name: 'Only embedded' }] },
    { gid: '2', name: 'Child', parent: { gid: '1' }, completed: true, completed_at: '2026-09-30T12:34:56.000Z', dependencies: [{ gid: '3' }] },
    { gid: '3', name: 'Blocker', dependents: [{ gid: '2' }] },
  ] });
  assert.deepEqual(tree.tasks[0].checklists, [{ title: 'Subtasks', items: [{ title: 'Only embedded', done: false }] }]);
  assert.equal(tree.tasks[1].column_name, 'Done');
  assert.equal(planImportedTask(tree.tasks[1]).card.endAt.toISOString(), '2026-09-30T12:34:56.000Z');
  const links = planImportedLinks(tree.tasks);
  assert.deepEqual(links.parents, [{ index: 1, parent: 0 }]);
  assert.deepEqual(links.dependencies, [{ index: 1, deps: [{ target: 2, type: 'is-blocked-by' }] }]);
  assert.deepEqual(tree.tasks[2].dependencies, [], 'dependents are the other side of the same link');

  // Negative: malformed values never throw or invent content.
  const odd = parseAsana({ data: [{ custom_fields: 'x', stories: [{ text: 'no subtype' }, null], subtasks: [null], dependencies: [null, {}] }] });
  assert.deepEqual(odd.tasks[0].custom_fields, {});
  assert.deepEqual(odd.tasks[0].comments, []);
  assert.deepEqual(odd.tasks[0].dependencies, []);
  assert.deepEqual(planImportedTask(odd.tasks[0]).checklists, []);
  assert.deepEqual(parseAsana({}).tasks, []);

  console.log('  ok - Asana dates, custom fields, comments, subtasks and dependencies import');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
