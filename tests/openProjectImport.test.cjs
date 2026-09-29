'use strict';

// OpenProject import field fidelity and the shared relationship planner.
// Run: node tests/openProjectImport.test.cjs
//
// The OpenProject parser used to keep subject, description, due date,
// status, assignee and type. It now also reads start and creation dates,
// spent/estimated time (ISO 8601 durations), progress, priority, category,
// version, responsible and author, schema-named custom fields, embedded
// comments, the parent hierarchy and relations. Watchers and attachment
// metadata are reported as losses. Parent and dependency links resolve only
// between items of the same import (models/lib/importedTaskPlan.js).

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const { parseOpenProject, isoDurationHours } = await import('../models/lib/externalParsers.js');
  const {
    planImportedTask, planImportedCustomFields, importedCustomFieldValues, planImportedLinks,
    MAX_IMPORTED_CUSTOM_FIELDS,
  } = await import('../models/lib/importedTaskPlan.js');
  const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/import-formats/openproject.json')));
  const expected = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/import-formats/expectations.json')));

  // Durations.
  assert.equal(isoDurationHours('PT1H30M'), 1.5);
  assert.equal(isoDurationHours('P1DT2H'), 26);
  assert.equal(isoDurationHours('PT45S'), 0.01);
  for (const bad of ['P', 'PT', '1H', 'PT1X', 5, null]) assert.equal(isoDurationHours(bad), undefined);

  const parsed = parseOpenProject(fixture);
  assert.equal(parsed.board.name, 'Audit project');
  const [task] = parsed.tasks;
  assert.equal(task.title, expected.title);
  assert.equal(task.description, expected.description);
  assert.equal(task.ref, '1');
  assert.deepEqual(task.tags, ['Task', 'priority:High']);
  assert.equal(task.owner_username, 'op-assignee');
  assert.deepEqual(task.assignees, ['op-responsible']);
  assert.equal(task.requested_by, 'op-author');
  assert.deepEqual(task.custom_fields, {
    'Audit text field': 'Audit value', 'Audit list field': 'Option B',
    'Estimated time (hours)': 3, 'Progress (%)': 40,
  });
  assert.deepEqual(task.comments, [{ text: expected.comment, author: 'op-user', date: '2026-09-30T12:34:56Z' }]);
  // Watchers are no longer a parser loss: they become card watchers when
  // mapped to a board member, and the importer reports the rest.
  assert.deepEqual(parsed.unsupported.map(u => u.path), ['/_embedded/elements/0/attachments']);
  assert.deepEqual(task.watchers, ['op-assignee']);
  const watched = planImportedTask(task, { members: { 'op-assignee': 'u1' }, boardMemberIds: ['u1'] });
  assert.deepEqual([watched.watcherIds, watched.unwatchedCount], [['u1'], 0]);
  const unmapped = planImportedTask(task, { members: {}, boardMemberIds: ['u1'] });
  assert.deepEqual([unmapped.watcherIds, unmapped.unwatchedCount], [[], 1], 'an unmapped watcher is counted');

  const plan = planImportedTask(task, { members: {} });
  assert.equal(plan.card.startAt.toISOString(), '2026-09-01T00:00:00.000Z');
  assert.equal(plan.card.createdAt.toISOString(), '2026-08-01T10:00:00.000Z');
  assert.equal(plan.card.spentTime, 1.5);
  assert.deepEqual(plan.comments.map(c => c.text), [`op-user: ${expected.comment}`]);

  // Custom fields are typed from their values.
  const { fields } = planImportedCustomFields(parsed.tasks);
  assert.deepEqual(fields, [
    { name: 'Audit text field', type: 'text' }, { name: 'Audit list field', type: 'text' },
    { name: 'Estimated time (hours)', type: 'number' }, { name: 'Progress (%)', type: 'number' },
  ]);
  assert.deepEqual(importedCustomFieldValues(task, fields).map(v => v.value), ['Audit value', 'Option B', 3, 40]);
  const mixed = planImportedCustomFields([
    { custom_fields: { Points: 3, Done: true, Mixed: 1, Tags: ['a', 'b'], Empty: '', Obj: { name: 'X' } } },
    { custom_fields: { Points: 5, Done: false, Mixed: 'x' } },
  ]).fields;
  assert.deepEqual(mixed, [
    { name: 'Points', type: 'number' }, { name: 'Done', type: 'checkbox' }, { name: 'Mixed', type: 'text' },
    { name: 'Tags', type: 'text' }, { name: 'Obj', type: 'text' },
  ]);
  assert.deepEqual(importedCustomFieldValues({ custom_fields: { Mixed: 1, Tags: ['a', 'b'] } }, mixed),
    [{ name: 'Mixed', value: '1' }, { name: 'Tags', value: 'a, b' }]);
  const many = { custom_fields: Object.fromEntries(Array.from({ length: MAX_IMPORTED_CUSTOM_FIELDS + 5 }, (_, i) => [`f${i}`, i])) };
  const capped = planImportedCustomFields([many]);
  assert.equal(capped.fields.length, MAX_IMPORTED_CUSTOM_FIELDS);
  assert.equal(capped.unsupported.length, 1, 'the overflow is reported once');

  // Hierarchy and relations across work packages.
  const tree = parseOpenProject({ _embedded: { elements: [
    { id: 10, subject: 'Epic', _links: { status: { title: 'Open' } } },
    { id: 11, subject: 'Child', _links: { status: { title: 'Open' }, parent: { href: '/api/v3/work_packages/10' } },
      _embedded: { relations: { elements: [
        { type: 'blocks', _links: { from: { href: '/api/v3/work_packages/11' }, to: { href: '/api/v3/work_packages/12' } } },
        { type: 'follows', _links: { from: { href: '/api/v3/work_packages/11' }, to: { href: '/api/v3/work_packages/10' } } },
        { type: 'relates', _links: { from: { href: '/api/v3/work_packages/99' }, to: { href: '/api/v3/work_packages/11' } } },
      ] } } },
    { id: 12, subject: 'Blocked', _links: { status: { title: 'Open' }, parent: { href: '/api/v3/work_packages/404' } } },
  ] } });
  assert.deepEqual(tree.tasks[1].dependencies, [{ ref: '12', type: 'blocks' }, { ref: '10', type: 'related-to' }]);
  const links = planImportedLinks(tree.tasks);
  assert.deepEqual(links.parents, [{ index: 1, parent: 0 }]);
  assert.deepEqual(links.dependencies, [{ index: 1, deps: [{ target: 2, type: 'blocks' }, { target: 0, type: 'related-to' }] }]);
  assert.deepEqual(links.unsupported, [{ path: '/tasks/2/parent_ref', reason: 'parent is not part of this import' }]);

  // Negative: cycles, self links, duplicates and unknown targets never link.
  const bad = planImportedLinks([
    { ref: 'a', parent_ref: 'b', dependencies: [{ ref: 'a' }, { ref: 'b', type: 'weird' }, { ref: 'b' }, { ref: 'zz' }] },
    { ref: 'b', parent_ref: 'a' },
    { ref: 'a', parent_ref: 'a' },
    { ref: 'c', parent_ref: 'c' },
  ]);
  assert.deepEqual(bad.parents, []);
  assert.deepEqual(bad.dependencies, [{ index: 0, deps: [{ target: 1, type: 'related-to' }] }]);
  assert.deepEqual(bad.unsupported.map(u => u.reason).sort(), [
    'duplicate source id; links resolve to the first item', 'linked item is not part of this import',
    'parent link would form a cycle', 'parent link would form a cycle', 'parent link would form a cycle',
    'parent link would form a cycle',
  ].sort());
  assert.deepEqual(planImportedLinks(undefined), { parents: [], dependencies: [], unsupported: [] });

  // The creator applies the planned fields and links.
  const creator = fs.readFileSync(path.join(__dirname, '../models/kanboardCreator.js'), 'utf8');
  assert.match(creator, /planImportedCustomFields\(tasks\)/);
  assert.match(creator, /importedCustomFieldValues\(task, this\.customFieldPlan\)/);
  assert.match(creator, /await this\.createLinks\(tasks, cardIds\)/);
  assert.match(creator, /\$set: \{ parentId: cardIds\[parent\] \}/);
  assert.match(creator, /normalizeDependency\(\{ cardId: cardIds\[dep\.target\], type: dep\.type \}\)/);

  console.log('  ok - OpenProject fields, comments, custom fields, hierarchy and relations import');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
