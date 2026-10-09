'use strict';

// Taskwarrior import/export (models/lib/taskwarriorFormat.js), following
// https://taskwarrior.org/docs/design/task/. Run: node tests/taskwarrior.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

async function main() {
  const { parseTaskwarrior, formatTaskwarrior, taskwarriorDate, taskwarriorUuid, MAX_TASKWARRIOR_TASKS } =
    await import('../models/lib/taskwarriorFormat.js');
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');
  const { planImportedTask, planImportedLinks } = await import('../models/lib/importedTaskPlan.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

  test('a task export maps to cards: status, project, priority, tags, dates, annotations, depends', () => {
    const { tasks, columns, unsupported } = parseTaskwarrior(JSON.stringify([
      { id: 1, uuid: 'u1', status: 'pending', entry: '20260901T120000Z', description: 'Order valves', project: 'Plant.Pumps',
        priority: 'H', tags: ['shop', 'urgent'], due: '20261010T000000Z', scheduled: '20261001T000000Z', urgency: 9.1,
        annotations: [{ entry: '20260902T080000Z', description: 'Call the vendor' }] },
      { uuid: 'u2', status: 'completed', entry: '20260901T120000Z', end: '20261009T120000Z', description: 'Replace pump',
        depends: ['u1'] },
      { uuid: 'u3', status: 'pending', start: '20261002T090000Z', description: 'Fit seals', depends: 'u1,u2' },
      { uuid: 'u4', status: 'waiting', wait: '20261101T000000Z', description: 'Inspect' },
    ]));
    assert.deepEqual(tasks.map(task => task.column_name), ['To Do', 'Done', 'In Progress', 'Waiting']);
    assert.deepEqual(columns.map(column => column.title), ['To Do', 'Done', 'In Progress', 'Waiting']);
    assert.deepEqual(tasks[0].tags, ['project:Plant.Pumps', 'priority:H', 'shop', 'urgent']);
    assert.deepEqual([tasks[0].date_creation, tasks[0].date_due, tasks[0].date_started],
      ['2026-09-01T12:00:00.000Z', '2026-10-10T00:00:00.000Z', '2026-10-01T00:00:00.000Z']);
    assert.deepEqual(tasks[0].comments, [{ text: 'Call the vendor', date: '2026-09-02T08:00:00.000Z' }]);
    assert.equal(tasks[1].date_end, '2026-10-09T12:00:00.000Z');
    assert.deepEqual(tasks[2].dependencies, [{ ref: 'u1', type: 'is-blocked-by' }, { ref: 'u2', type: 'is-blocked-by' }],
      'the older comma-separated form too');
    assert.deepEqual(unsupported, [{ path: '/3/wait', reason: 'Taskwarrior attribute wait has no WeKan field' }],
      'computed attributes (id, urgency, start) are not losses; wait is');
    const links = planImportedLinks(tasks);
    assert.deepEqual(links.dependencies.map(row => [row.index, row.deps.map(dep => dep.target)]), [[1, [0]], [2, [0, 1]]]);
    assert.equal(planImportedTask(tasks[1]).card.endAt.toISOString(), '2026-10-09T12:00:00.000Z');
  });

  test('one task object per line, as versions before 2.4 export', () => {
    const { tasks } = parseTaskwarrior('{"uuid":"a","status":"pending","description":"One"},\n{"uuid":"b","status":"pending","description":"Two"}\n');
    assert.deepEqual(tasks.map(task => task.title), ['One', 'Two']);
  });

  test('a board exports to Taskwarrior and imports back with lists, descriptions, dates, labels and comments', () => {
    const collected = { board: { title: 'Plant' }, items: [
      { cardId: 'card-1', title: 'Order valves', listTitle: 'Doing', description: 'Two of them\nDN50',
        labels: ['priority:H', 'project:Plant', 'shop floor'], dueAt: '2026-10-10T00:00:00.000Z',
        startAt: '2026-10-01T00:00:00.000Z', createdAt: '2026-09-01T12:00:00.000Z',
        comments: [{ text: 'Call the vendor', author: 'alice', date: '2026-09-02T08:00:00.000Z' }] },
      { cardId: 'card-2', title: 'Replace   pump', listTitle: 'Done', labels: [], createdAt: '2026-09-02T00:00:00.000Z',
        endAt: '2026-10-09T12:00:00.000Z' },
    ] };
    assert.equal(formatters.taskwarrior, formatTaskwarrior);
    const text = formatters.taskwarrior(collected);
    const exported = JSON.parse(text);
    assert.deepEqual(exported[0], { uuid: taskwarriorUuid('card-1'), status: 'pending', description: 'Order valves',
      entry: '20260901T120000Z', due: '20261010T000000Z', scheduled: '20261001T000000Z', project: 'Plant', priority: 'H',
      tags: ['shop_floor'], annotations: [{ entry: '20260902T080000Z', description: 'alice: Call the vendor' }],
      wekanlist: 'Doing', wekandescription: 'Two of them\nDN50' });
    assert.deepEqual([exported[1].status, exported[1].end, exported[1].description], ['completed', '20261009T120000Z', 'Replace pump']);
    const [a, b] = EXTERNAL_PARSERS.taskwarrior(text).tasks;
    assert.deepEqual([a.title, a.column_name, a.description, a.tags, a.date_due],
      ['Order valves', 'Doing', 'Two of them\nDN50', ['project:Plant', 'priority:H', 'shop_floor'], '2026-10-10T00:00:00.000Z']);
    assert.deepEqual([b.column_name, b.date_end], ['Done', '2026-10-09T12:00:00.000Z']);
    // A uuid is an RFC 4122 version-4 shape, and the same card always gets the same one.
    assert.match(taskwarriorUuid('card-1'), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.equal(taskwarriorUuid('card-1'), taskwarriorUuid('card-1'));
    assert.notEqual(taskwarriorUuid('card-1'), taskwarriorUuid('card-2'));
  });

  test('negative: deleted tasks, recurring templates, bad dates and malformed input', () => {
    const { tasks, unsupported } = parseTaskwarrior(JSON.stringify([
      { uuid: 'd', status: 'deleted', description: 'Gone' },
      { uuid: 'r', status: 'recurring', recur: 'weekly', description: 'Template' },
      { uuid: 'p', status: 'pending', description: 'Bad date', due: 'tomorrow', myuda: 'x' },
      'not a task',
    ]));
    assert.deepEqual(tasks.map(task => task.title), ['Bad date']);
    assert.equal(tasks[0].date_due, undefined, 'a bad date is reported, not guessed');
    assert.deepEqual(unsupported.map(row => row.path), ['/0/status', '/1/status', '/2/myuda', '/2/due', '/3']);
    assert.throws(() => parseTaskwarrior('{"description": "x"'), /line 1 is not a JSON object/);
    assert.throws(() => parseTaskwarrior(JSON.stringify(Array.from({ length: MAX_TASKWARRIOR_TASKS + 1 }, () => ({})))),
      /more than/);
    assert.equal(taskwarriorDate('2026-13-45T00:00:00Z'), undefined);
    assert.equal(taskwarriorDate(20260901), undefined);
    assert.deepEqual(parseTaskwarrior('').tasks, []);
  });

  test('wiring: parser, formatter, page, method, export type and shape check know the format', () => {
    assert.equal(EXTERNAL_PARSERS.taskwarrior, parseTaskwarrior);
    assert.equal(validateImportSourceShape('taskwarrior', '[]'), undefined);
    assert.throws(() => validateImportSourceShape('taskwarrior', { tasks: [] }));
    assert.match(read('models/lib/importSources.js'), /\{ key: 'taskwarrior', name: 'Taskwarrior'[,}]/); // the one list of sources
    // The page reads every source through one path described in
    // models/lib/importSources.js, not a branch of its own.
    assert.match(read('models/lib/importSources.js'), /\{ key: 'taskwarrior', name: '[^']+', \.\.\.TEXT/, 'read by the one import path');
    assert.match(read('models/import.js'), /case 'taskwarrior':[\s\S]*?check\(board, String\);[\s\S]*?new KanboardCreator\(data, 'taskwarrior'\)/);
    assert.match(read('server/lib/renderExternalExport.js'), /taskwarrior: 'application\/json'/);
    assert.match(read('client/components/boards/exportScope.js'), /key: 'taskwarrior'.*path: 'export\/taskwarrior', ext: 'json'/);
    // Its details are on its own page, which the coverage index links.
    const docPage = read('docs/Features/ImportExport/Taskwarrior/Taskwarrior.md');
    assert.match(docPage, /^## Format details$/m);
    assert.match(read('docs/Features/ImportExport/Format-Coverage.md'), /\]\(\.\/Taskwarrior\/Taskwarrior\.md\)/);
    const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
    assert.match(en['import-board-instruction-taskwarrior'], /task export/);
  });

  console.log(`\ntaskwarrior: ${passed} passed`);
}
main().catch(error => { console.error(error); process.exit(1); });
