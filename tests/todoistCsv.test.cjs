'use strict';

// Todoist project CSV import/export (models/lib/todoistCsvFormat.js), following
// https://todoist.com/help/articles/360000748525. Run: node tests/todoistCsv.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

const HEADER = 'TYPE,CONTENT,DESCRIPTION,PRIORITY,INDENT,AUTHOR,RESPONSIBLE,DATE,DATE_LANG,TIMEZONE,DURATION,DURATION_UNIT,DEADLINE,DEADLINE_LANG';

async function main() {
  const { parseTodoistCsv, formatTodoistCsv, readCsv, todoistDate, TODOIST_COLUMNS } =
    await import('../models/lib/todoistCsvFormat.js');
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');
  const { planImportedTask } = await import('../models/lib/importedTaskPlan.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

  test('a Todoist template maps to lists, cards, labels, priorities, dates, a checklist and comments', () => {
    const csv = [
      HEADER,
      'meta,view_style=board,,,,,,,,,,,,',
      'task,Loose task @inbox,,4,1,,,,,,,,,',
      'section,To Do,,,,,,,,,,,,',
      'task,Order valves @shop @urgent,"Two of them, DN50\nfrom the usual vendor",1,1,Alice (123),Bob (456),2026-10-10,en,UTC,,,,',
      'task,Check the flange,,4,2,,,,,,,,,',
      'task,Torque the bolts,,4,3,,,,,,,,,',
      'note,"Call the vendor, ask for ""express""",,,,Alice (123),,,,,,,,',
      'section,Doing,,,,,,,,,,,,',
      'task,Replace pump,,2,1,,,2026-10-01,en,UTC,,,2026-10-09,en',
      'task,Inspect,,3,1,,,every monday,en,,30,minute,,',
    ].join('\r\n');
    const { tasks, columns, unsupported } = parseTodoistCsv(csv);
    assert.deepEqual(columns.map(column => column.title), ['No section', 'To Do', 'Doing']);
    assert.deepEqual(tasks.map(task => [task.title, task.column_name]),
      [['Loose task', 'No section'], ['Order valves', 'To Do'], ['Replace pump', 'Doing'], ['Inspect', 'Doing']]);
    const valves = tasks[1];
    assert.deepEqual(valves.tags, ['p1', 'shop', 'urgent'], 'priority 1 is p1, Todoist\'s highest; @labels leave the title');
    assert.equal(valves.description, 'Two of them, DN50\nfrom the usual vendor', 'quoted commas and line breaks');
    assert.equal(valves.owner_username, 'Bob', 'RESPONSIBLE without its id');
    assert.equal(valves.date_due, '2026-10-10T00:00:00.000Z');
    assert.deepEqual(valves.checklists, [{ title: 'Sub-tasks', items: [
      { title: 'Check the flange', done: false }, { title: 'Torque the bolts', done: false }] }]);
    assert.deepEqual(valves.comments, [{ text: 'Call the vendor, ask for "express"', author: 'Alice' }]);
    assert.deepEqual(tasks[0].tags, ['inbox'], 'priority 4 is Todoist\'s "no priority"');
    assert.deepEqual([tasks[2].date_started, tasks[2].date_due], ['2026-10-01T00:00:00.000Z', '2026-10-09T00:00:00.000Z'],
      'DATE with a DEADLINE: scheduled start, deadline due');
    assert.deepEqual(unsupported.map(u => u.path), ['/row/11/DATE', '/row/11/DURATION'],
      'a recurring date in words and a duration are reported');
    const plan = planImportedTask(valves);
    assert.equal(plan.card.dueAt.toISOString(), '2026-10-10T00:00:00.000Z');
    assert.equal(plan.checklists[0].items.length, 2);
  });

  test('dates: calendar dates only, a time only in UTC', () => {
    assert.equal(todoistDate('2026-10-10 14:30', 'UTC'), '2026-10-10T14:30:00.000Z');
    assert.equal(todoistDate('2026-10-10 14:30', ''), '2026-10-10T14:30:00.000Z');
    assert.equal(todoistDate('2026-10-10 14:30', 'US/Eastern'), undefined, 'a local time is not guessed');
    assert.equal(todoistDate('2026-02-30', 'UTC'), undefined);
    assert.equal(todoistDate('tomorrow', 'UTC'), undefined);
  });

  test('a board exports to Todoist and imports back with lists, labels, priority, dates, sub-tasks and notes', () => {
    const collected = { board: { title: 'Plant' }, items: [
      { cardId: 'c1', title: 'Order valves', listTitle: 'To Do', description: 'Two, "DN50"\nnow', labels: ['p2', 'shop floor'],
        startAt: '2026-10-01T00:00:00.000Z', dueAt: '2026-10-10T14:30:00.000Z', owner: 'bob',
        checklists: [{ title: 'Steps', items: [{ title: 'Measure', done: false }, { title: 'Done already', done: true }] }],
        comments: [{ text: 'Call the vendor', author: 'alice' }] },
      { cardId: 'c2', title: 'Replace pump', listTitle: 'Done', labels: [], dueAt: '2026-10-09T00:00:00.000Z' },
    ] };
    const csv = formatters.todoist(collected);
    const rows = readCsv(csv);
    assert.deepEqual(rows[0], TODOIST_COLUMNS);
    assert.equal(rows[0].join(','), HEADER, 'Todoist\'s own header, in its order');
    assert.deepEqual(rows[1].slice(0, 2), ['meta', 'view_style=board']);
    assert.ok(rows.every(row => row.length === TODOIST_COLUMNS.length), 'every row is full width');
    const back = EXTERNAL_PARSERS.todoist(csv);
    assert.deepEqual(back.columns.map(column => column.title), ['To Do', 'Done']);
    const [valves, pump] = back.tasks;
    assert.equal(valves.title, 'Order valves');
    assert.deepEqual(valves.tags, ['p2', 'shop_floor'], 'a Todoist label has no spaces');
    assert.equal(valves.description, 'Two, "DN50"\nnow');
    assert.deepEqual([valves.date_started, valves.date_due], ['2026-10-01T00:00:00.000Z', '2026-10-10T14:30:00.000Z']);
    assert.equal(valves.owner_username, 'bob');
    assert.deepEqual(valves.checklists[0].items, [{ title: 'Measure', done: false }],
      'Todoist exports no completed tasks, so neither does this');
    assert.deepEqual(valves.comments, [{ text: 'Call the vendor', author: 'alice' }]);
    assert.equal(pump.date_due, '2026-10-09T00:00:00.000Z');
    assert.deepEqual(back.unsupported, []);
  });

  test('negative: not a Todoist template, or a broken one, is refused or reported - never guessed', () => {
    assert.throws(() => parseTodoistCsv(''), /empty/);
    assert.throws(() => parseTodoistCsv('Title,Status\nA,open\n'), /TYPE and CONTENT/);
    assert.throws(() => parseTodoistCsv(`${HEADER}\ntask,"unclosed\n`), /unclosed quote/);
    const { tasks, unsupported } = parseTodoistCsv(`${HEADER}\nnote,orphan,,,,,,,,,,,,\ntask,Child,,4,2,,,,,,,,,\nproject,X,,,,,,,,,,,,\n`);
    assert.deepEqual(tasks, []);
    assert.deepEqual(unsupported.map(u => u.reason), [
      'a note with no task above it is not imported',
      'a sub-task with no task above it is not imported',
      'Todoist row type project is not imported',
    ]);
    assert.throws(() => validateImportSourceShape('todoist', '   '), /Invalid todoist/);
    assert.throws(() => validateImportSourceShape('todoist', { rows: [] }), /Invalid todoist/);
  });

  test('wired in: import page, server import, export menu and route', () => {
    assert.match(read('models/lib/importSources.js'), /\{ key: 'todoist', name: 'Todoist'[,}]/); // the one list of sources
    // The page reads every source through one path described in
    // models/lib/importSources.js, not a branch of its own.
    assert.match(read('models/lib/importSources.js'), /\{ key: 'todoist', name: '[^']+', \.\.\.TEXT/, 'read by the one import path');
    assert.match(read('models/import.js'), /case 'todoist':\s*\/\/[^\n]*\n\s*check\(board, String\);/);
    assert.match(read('models/import.js'), /new KanboardCreator\(data, 'todoist'\)/);
    assert.match(read('client/components/boards/exportScope.js'), /key: 'todoist'[^\n]*path: 'export\/todoist', ext: 'csv'/);
    assert.match(read('server/lib/renderExternalExport.js'), /todoist: 'text\/csv'/);
    const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
    assert.match(en['import-board-instruction-todoist'], /Manage data > Export as CSV/);
  });

  console.log(`\ntodoistCsv: ${passed} tests passed`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
