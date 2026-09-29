'use strict';

// Zenkit import field fidelity (models/lib/externalParsers.js parseZenkit).
// Run: node tests/zenkitImport.test.cjs
//
// Zenkit documents no single-file JSON export schema. Two shapes are read:
// the adapter shape the parser always accepted, now with hierarchy, members,
// item-level custom fields, comments, checklists and a report of unknown
// keys; and the Zenkit API's entries and elements, whose value keys
// (`<element uuid>_text`, `_number`, `_date`, `_categories_sort`,
// `_persons_sort`, `_references_sort`) follow the zenkit client's
// deserialization. Element kinds whose value format is not documented
// (files, formulas, cross-list references, ...) are reported, not guessed.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const { parseZenkit } = await import('../models/lib/externalParsers.js');
  const { planImportedTask, planImportedLinks } = await import('../models/lib/importedTaskPlan.js');
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');
  const read = name => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/import-formats', name)));
  const expected = read('expectations.json');

  // Adapter shape.
  const adapter = parseZenkit(read('zenkit-adapter.json'));
  const [item] = adapter.tasks;
  assert.equal(item.title, expected.title);
  assert.equal(item.ref, 'z1');
  assert.equal(item.owner_username, 'zen-a');
  assert.deepEqual(item.assignees, ['zen-b']);
  assert.deepEqual(item.custom_fields, { 'Audit estimate': 3, 'Audit owner team': 'Blue' });
  const plan = planImportedTask(item, { members: { 'zen-user': 'uZ' } });
  assert.deepEqual(plan.comments.map(c => [c.text, c.userId]), [[expected.comment, 'uZ']]);
  assert.deepEqual(plan.checklists[0].items, [{ title: 'Audit item', isFinished: true, sort: 0 }]);
  assert.deepEqual(adapter.unsupported, [{ path: '/items/0', reason: 'unrecognized field(s): vendorOnly' }]);

  // API shape.
  const apiDoc = read('zenkit-api.json');
  assert.doesNotThrow(() => validateImportSourceShape('zenkit', apiDoc));
  assert.throws(() => validateImportSourceShape('zenkit', { elements: [] }), /import document shape/);
  const api = parseZenkit(apiDoc);
  assert.equal(api.board.name, 'Audit Zenkit API list');
  assert.deepEqual(api.columns.map(c => c.title), ['Audit list', 'Done']);
  assert.deepEqual(api.tasks.map(t => t.title), [expected.title, 'Audit child'], 'sorted; the deleted entry is skipped');
  assert.deepEqual(api.warnings, [{ path: '/entries', reason: '1 deleted entr(ies) skipped' }]);
  const [first, child] = api.tasks;
  assert.equal(first.description, expected.description);
  assert.equal(first.column_name, 'Audit list');
  assert.equal(first.date_due, '2026-09-30');
  assert.deepEqual(first.tags, [expected.label]);
  assert.equal(first.owner_username, 'zen-a');
  assert.deepEqual(first.assignees, ['zen-b']);
  assert.deepEqual(first.custom_fields, { 'Audit points': 5 });
  assert.deepEqual(planImportedTask(first).checklists[0].items, [{ title: 'Audit item', isFinished: true, sort: 0 }]);
  assert.equal(planImportedTask(first).card.createdAt.toISOString(), '2026-08-01T10:00:00.000Z');
  assert.equal(child.column_name, 'Done');
  assert.deepEqual(planImportedLinks(api.tasks).parents, [{ index: 1, parent: 0 }]);
  assert.deepEqual(api.unsupported.map(u => u.reason).sort(), [
    '2 comment(s) are fetched separately from Zenkit',
    'Files: files are not part of the export',
    'Score: formula results are computed by Zenkit and not imported',
  ].sort());

  // Negative: odd values and unknown element kinds never throw or invent data.
  const odd = parseZenkit({ elements: [{ uuid: 'n', name: 'N', elementcategory: 2 }, { uuid: 'w', name: 'Weird', elementcategory: 99 }, null],
    entries: [{ uuid: 'a', n_number: 'NaN' }, null] });
  assert.deepEqual(odd.tasks[0].custom_fields, {});
  assert.equal(odd.tasks[0].column_name, 'Inbox');
  assert.deepEqual(odd.unsupported.map(u => u.reason), ['Weird: this field type has no documented value format']);
  assert.deepEqual(parseZenkit({ items: [{ title: 'x', fields: ['not', 'an object'], comments: 'x' }] }).tasks[0].custom_fields, {});

  console.log('  ok - Zenkit adapter and API shapes import hierarchy, members, fields, checklists and losses');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
