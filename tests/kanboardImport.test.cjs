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

  // The estimate is a custom field now, not a loss (models/lib/kanboardFields.js).
  assert.deepEqual(parsed.unsupported.map(u => u.path).sort(), ['/tasks/0/files', '/tasks/0/links/0']);
  assert.ok(Number(task.custom_fields['Time estimate (hours)']) > 0);
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

  // Recurrence, score, reference and external links, both ways.
  {
    const { formatters } = await import('../models/lib/externalExportFormatters.js');
    const back = parseKanboard({ tasks: [
      { id: 1, title: 'Weekly', recurrence_status: 1, recurrence_factor: 7, recurrence_timeframe: 0, score: 5, reference: 'TCK-1',
        external_links: [{ url: 'https://example.org/spec', title: 'Spec' }, { url: 'https://example.org/x', title: 'https://example.org/x' }] },
      { id: 2, title: 'Monthly', recurrence_status: 1, recurrence_factor: 1, recurrence_timeframe: 1 },
      { id: 3, title: 'Every 2 days', recurrence_status: 1, recurrence_factor: 2, recurrence_timeframe: 0 },
      { id: 4, title: 'Off', recurrence_status: 0, recurrence_factor: 1 },
    ] });
    assert.deepEqual(back.tasks.map(t => t.recurrence), ['weekly', 'monthly', undefined, undefined]);
    assert.deepEqual(back.tasks[0].custom_fields, { Score: 5, Reference: 'TCK-1' });
    assert.match(back.tasks[0].description, /^Spec: https:\/\/example\.org\/spec\nhttps:\/\/example\.org\/x$/);
    // Negative: a repeat WeKan cannot keep is reported; external links are not.
    assert.deepEqual(back.unsupported.map(u => u.path), ['/tasks/2/recurrence_factor']);
    const out = formatters.kanboard({ board: { title: 'B' }, lists: [{ title: 'L' }], swimlanes: [{ title: 'Default' }], items: [
      { title: 'Weekly', listTitle: 'L', swimlaneTitle: 'Default', labels: [], recurrence: 'weekly', spentTime: 2,
        customFields: { 'Time estimate (hours)': 3, Score: 5, Reference: 'TCK-1' } },
      { title: 'Done', listTitle: 'L', swimlaneTitle: 'Default', labels: [], recurrence: 'daily', endAt: '2026-11-01T00:00:00Z' }] });
    const [w, d] = out.tasks;
    assert.deepEqual([w.recurrence_status, w.recurrence_factor, w.recurrence_timeframe, w.time_spent, w.time_estimated, w.score, w.reference],
      [1, 7, 0, 2, 3, 5, 'TCK-1']);
    assert.equal(d.recurrence_status, undefined, 'a finished card does not repeat');
    const again = parseKanboard(out).tasks[0];
    assert.equal(again.recurrence, 'weekly');
    assert.deepEqual(again.custom_fields, { 'Time estimate (hours)': 3, Score: 5, Reference: 'TCK-1' });
  }

  console.log('  ok - Kanboard subtasks, comments, categories, colors, dates and losses import');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
