'use strict';

// Kanboard import field fidelity (models/lib/externalParsers.js parseKanboard).
// Run: node tests/kanboardImport.test.cjs
//
// The assembled JSON-RPC document used to reach KanboardCreator unparsed, so
// only the fields Kanboard happens to spell like the shared task shape
// survived: subtasks, comments, categories, colors, closed state, start dates
// and time spent were dropped, and a task with only column_id landed in the
// first list. Estimates and files have no WeKan equivalent here and are
// listed in the `unsupported` loss report instead of vanishing; task links
// become parent cards and dependencies (tests/kanboardLinksGithubComments.test.cjs),
// and a link to a task outside the file is reported.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const { parseKanboard } = await import('../models/lib/externalParsers.js');
  const { planImportedTask } = await import('../models/lib/importedTaskPlan.js');
  const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/import-formats/kanboard.json')));
  const expected = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/import-formats/expectations.json')));

  const parsed = parseKanboard(fixture);
  assert.equal(parsed.board.name, 'Audit Kanboard');
  assert.deepEqual(parsed.columns, [{ title: 'Audit list' }]);
  const [task] = parsed.tasks;
  assert.equal(task.title, expected.title);
  assert.ok(task.description.startsWith(expected.description));
  assert.ok(task.description.endsWith('Source: https://kanboard.example/task/1'));
  assert.deepEqual(task.tags, ['Audit label', 'Audit category', 'priority:2']);
  assert.equal(task.requested_by, 'kanboard-creator');

  const plan = planImportedTask(task, { members: {}, allowedColors: ['crimson'] });
  assert.equal(plan.card.color, 'crimson', 'deep_orange maps onto the WeKan palette');
  assert.equal(plan.card.archived, false);
  assert.equal(plan.card.spentTime, 1.5);
  assert.equal(plan.card.dueAt.toISOString(), '2026-09-30T12:34:56.000Z');
  assert.equal(plan.card.startAt.toISOString(), '2026-09-01T00:00:00.000Z');
  assert.deepEqual(plan.checklists, [{
    title: 'Subtasks', sort: 0, items: [
      { title: 'Audit subtask done', isFinished: true, sort: 0 },
      { title: 'Audit subtask open', isFinished: false, sort: 1 },
    ],
  }]);
  assert.deepEqual(plan.comments.map(c => c.text), [`kanboard-user: ${expected.comment}`]);
  assert.equal(planImportedTask(task, { members: { 'kanboard-user': 'uK' } }).comments[0].text, expected.comment);

  assert.deepEqual(parsed.unsupported.map(u => u.path).sort(), ['/tasks/0/files', '/tasks/0/links/0', '/tasks/0/time_estimated']);
  assert.match(parsed.unsupported.find(u => u.path === '/tasks/0/links/0').reason, /linked task #2 is not part of this import/);
  assert.equal(task.ref, '1');
  assert.equal(task.dependencies, undefined, 'a link to a missing task is not emitted');
  assert.match(parsed.unsupported.find(u => u.path.endsWith('files')).reason, /1 file\(s\)/);

  // Ids resolve through the sibling arrays; getTaskTags' object form works.
  const byIds = parseKanboard({
    columns: [{ id: 7, title: 'Doing' }, { id: 8, title: 'Done' }],
    swimlanes: [{ id: 3, name: 'Team B' }],
    tasks: [{ title: 'T', column_id: '8', swimlane_id: 3, is_active: '0', tags: { 11: 'x', 12: 'y' }, date_completed: '1790771696' }],
  });
  assert.equal(byIds.tasks[0].column_name, 'Done');
  assert.equal(byIds.tasks[0].swimlane_name, 'Team B');
  assert.equal(byIds.tasks[0].archived, true, 'a closed Kanboard task is archived');
  assert.deepEqual(byIds.tasks[0].tags, ['x', 'y']);
  assert.equal(planImportedTask(byIds.tasks[0]).card.endAt.toISOString(), '2026-09-30T12:34:56.000Z');

  // Negative: minimal and malformed input neither throws nor invents content.
  const minimal = parseKanboard({ tasks: [{ title: 'Only a title', is_active: '1', color_id: 'not-a-color', priority: '0', subtasks: 'junk', comments: {} }] });
  assert.deepEqual(minimal.tasks[0].checklists, []);
  assert.deepEqual(minimal.tasks[0].comments, []);
  assert.deepEqual(minimal.tasks[0].tags, []);
  assert.equal(minimal.tasks[0].color, undefined);
  assert.equal(minimal.tasks[0].archived, false);
  assert.deepEqual(minimal.unsupported, []);
  assert.deepEqual(minimal.swimlanes, [{ name: 'Default' }]);
  assert.deepEqual(parseKanboard({}).tasks, []);
  // A bare task array (getAllTasks output) is accepted too.
  assert.equal(parseKanboard([{ title: 'bare' }]).tasks[0].title, 'bare');

  // The import method routes Kanboard through this parser.
  const importJs = fs.readFileSync(path.join(__dirname, '../models/import.js'), 'utf8');
  assert.match(importJs, /case 'kanboard':[\s\S]*?importedBoard = EXTERNAL_PARSERS\.kanboard\(importedBoard\);[\s\S]*?new KanboardCreator/);

  console.log('  ok - Kanboard subtasks, comments, categories, colors, dates and losses import');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
