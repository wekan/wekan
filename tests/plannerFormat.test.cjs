'use strict';

// Microsoft Planner's "Export plan to Excel" workbook: import and export
// (models/lib/plannerFormat.js, server/lib/plannerWorkbook.js). The layout and
// column names follow a real Planner export, the fixture of
// https://github.com/program--/plannr (tests/testdata/test_plan.xlsx).
// Run: node tests/plannerFormat.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ExcelJS = require('@wekanteam/exceljs');
const { readPlannerWorkbook, writePlannerWorkbook } = require('../server/lib/plannerWorkbook');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

// The 2020 header of the real export; newer exports add "Is Recurring".
const HEADER = ['Task ID', 'Task Name', 'Bucket Name', 'Progress', 'Priority', 'Assigned To', 'Created By',
  'Created Date', 'Start Date', 'Due Date', 'Late', 'Completed Date', 'Completed By', 'Description',
  'Completed Checklist Items', 'Checklist Items', 'Labels'];

// A workbook laid out exactly as Planner writes it: plan name, plan id and
// export date, a blank row, the header, then one row per task.
async function plannerWorkbook(rows, { header = HEADER, plan = 'Release plan', sheet = 'Tasks' } = {}) {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet(sheet);
  ws.addRow(['Plan name', plan]);
  ws.addRow(['Plan ID', '11aa22bb33cc']);
  ws.addRow(['Date of export', '10/06/2020']);
  ws.addRow([]);
  ws.addRow(header);
  rows.forEach(values => ws.addRow(header.map(name => (values[name] === undefined ? '' : values[name]))));
  return Buffer.from(await workbook.xlsx.writeBuffer()).toString('base64');
}

async function main() {
  const { parsePlannerRows, formatPlannerRows, plannerDate, plannerDateOrder, PLANNER_COLUMNS } =
    await import('../models/lib/plannerFormat.js');
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');
  const { planImportedTask } = await import('../models/lib/importedTaskPlan.js');
  let passed = 0;
  const test = async (name, fn) => { await fn(); passed += 1; console.log('  ok -', name); };
  const parse = async (rows, options) => parsePlannerRows(await readPlannerWorkbook(await plannerWorkbook(rows, options)));

  await test('a Planner export maps buckets, tasks, people, dates, labels, checklist and custom fields', async () => {
    const board = await parse([
      { 'Task ID': 't1', 'Task Name': 'Order valves', 'Bucket Name': 'To do', Progress: 'In progress', Priority: 'Urgent',
        'Assigned To': 'Alice Example;Bob Example', 'Created By': 'Carol Example', 'Created Date': '10/02/2020',
        'Start Date': '10/03/2020', 'Due Date': '10/20/2020', Late: 'false', Description: 'Two of them',
        'Completed Checklist Items': '0/2', 'Checklist Items': 'Get quote;Order', Labels: 'Purchasing;Blue' },
      { 'Task ID': 't2', 'Task Name': 'Ship it', 'Bucket Name': 'Done', Progress: 'Completed', Priority: 'Medium',
        'Created Date': '10/02/2020', 'Completed Date': '10/07/2020', 'Completed By': 'Alice Example' },
      { 'Task ID': 't3', 'Task Name': 'Plan next', 'Bucket Name': 'To do', Progress: 'Not started', Priority: 'Low' },
    ]);
    assert.equal(board.board.name, 'Release plan');
    assert.deepEqual(board.columns.map(c => c.title), ['To do', 'Done'], 'buckets in the order they first appear');
    const [first, second, third] = board.tasks;
    assert.equal(first.title, 'Order valves');
    assert.equal(first.column_name, 'To do');
    assert.equal(first.description, 'Two of them');
    assert.equal(first.ref, 't1');
    assert.equal(first.owner_username, 'Alice Example');
    assert.deepEqual(first.assignees, ['Bob Example']);
    assert.equal(first.requested_by, 'Carol Example');
    assert.equal(first.date_creation, '2020-10-02T00:00:00.000Z');
    assert.equal(first.date_started, '2020-10-03T00:00:00.000Z');
    assert.equal(first.date_due, '2020-10-20T00:00:00.000Z');
    assert.deepEqual(first.tags, ['Purchasing', 'Blue']);
    assert.deepEqual(first.custom_fields, { Progress: 'In progress', Priority: 'Urgent' });
    assert.deepEqual(first.checklists, [{ title: 'Checklist', items: [{ title: 'Get quote', done: false }, { title: 'Order', done: false }] }]);
    assert.equal(second.date_end, '2020-10-07T00:00:00.000Z');
    assert.deepEqual(second.custom_fields, { Progress: 'Completed', Priority: 'Medium', 'Completed By': 'Alice Example' });
    assert.equal(third.column_name, 'To do');
    // The 20th of October settles the order: month first, nothing guessed.
    assert.deepEqual(board.unsupported, []);
    // What KanboardCreator then writes for the first task.
    const plan = planImportedTask(first, { members: { 'Alice Example': 'u1', 'Bob Example': 'u2' } });
    assert.deepEqual(plan.memberIds, ['u1', 'u2']);
    assert.equal(plan.card.requestedBy, 'Carol Example');
    assert.equal(plan.card.dueAt.toISOString(), '2020-10-20T00:00:00.000Z');
  });

  await test('the real Planner export of the plannr package imports whole', async () => {
    const base64 = fs.readFileSync(path.join(__dirname, 'fixtures', 'planner', 'plannr-test_plan.xlsx')).toString('base64');
    const board = parsePlannerRows(await readPlannerWorkbook(base64));
    assert.equal(board.board.name, 'Test Plan');
    assert.equal(board.tasks.length, 32);
    assert.equal(board.columns.length, 32, 'one bucket per task in this plan');
    const done = board.tasks.filter(task => task.custom_fields && task.custom_fields.Progress === 'Completed');
    assert.equal(done.length, 4);
    assert.ok(done.every(task => task.date_end === '2020-10-07T00:00:00.000Z' && task.custom_fields['Completed By']));
    const first = board.tasks[0];
    assert.equal(first.title, 'Task 1');
    assert.equal(first.owner_username, 'Other Person 2');
    assert.equal(first.date_creation, '2020-10-02T00:00:00.000Z');
    assert.deepEqual(first.checklists[0].items.map(i => i.title), ['Important Task 2', 'Important Task 1', 'Important Task 3']);
    assert.ok(board.tasks.some(task => task.date_due === '2020-10-04T00:00:00.000Z'));
    // Every date in it could be read either way: that is said, once.
    assert.deepEqual(board.unsupported.map(u => u.path), ['/dates']);
  });

  await test('columns are found by name: a newer export with Is Recurring and real date cells', async () => {
    const header = [...HEADER.slice(0, 10), 'Is Recurring', ...HEADER.slice(10)];
    const board = await parse([{ 'Task Name': 'Weekly report', 'Bucket Name': 'Routine', 'Is Recurring': 'true',
      'Due Date': new Date(Date.UTC(2026, 9, 9)), Progress: 'Not started', Priority: 'Important' }], { header });
    assert.equal(board.tasks[0].date_due, '2026-10-09T00:00:00.000Z', 'a date cell keeps its day');
    assert.deepEqual(board.tasks[0].custom_fields, { Progress: 'Not started', Priority: 'Important' });
    assert.ok(board.unsupported.some(u => u.path.endsWith('/Is Recurring') && /recurring/.test(u.reason)));
  });

  await test('day/month exports are recognised, and dotted dates are day first', async () => {
    assert.deepEqual(plannerDateOrder(['13/02/2020', '01/03/2020']), { order: 'dmy' });
    assert.deepEqual(plannerDateOrder(['02/13/2020']), { order: 'mdy', guessed: false });
    assert.deepEqual(plannerDateOrder(['02.03.2020']), { order: 'dmy' });
    assert.equal(plannerDate('01/03/2020', 'dmy'), '2020-03-01T00:00:00.000Z');
    assert.equal(plannerDate('01/03/2020', 'mdy'), '2020-01-03T00:00:00.000Z');
    assert.equal(plannerDate('2026-10-09'), '2026-10-09T00:00:00.000Z');
    const board = await parse([{ 'Task Name': 'A', 'Bucket Name': 'B', 'Due Date': '13/02/2020', 'Start Date': '01/02/2020' }]);
    assert.equal(board.tasks[0].date_due, '2020-02-13T00:00:00.000Z');
    assert.equal(board.tasks[0].date_started, '2020-02-01T00:00:00.000Z');
  });

  await test('negative: what has no WeKan place is reported, never invented', async () => {
    const board = await parse([
      { 'Task Name': 'Ambiguous', 'Bucket Name': 'B', 'Due Date': '01/02/2020', Progress: 'Blocked', Priority: 'Critical',
        'Completed Checklist Items': '1/2', 'Checklist Items': 'x;y' },
      { 'Bucket Name': 'B', Description: 'no name' },
      { 'Task Name': 'Bad date', 'Bucket Name': 'B', 'Start Date': 'next week' },
    ]);
    const reasons = board.unsupported.map(u => `${u.path} ${u.reason}`).join('\n');
    assert.match(reasons, /\/dates .*could be day\/month or month\/day/);
    assert.match(reasons, /Progress Planner progress "Blocked"/);
    assert.match(reasons, /Priority Planner priority "Critical"/);
    assert.match(reasons, /Completed Checklist Items .*\(1\/2\), not which/);
    // Row numbers are the ones Excel shows: the header is row 5, data from row 6.
    assert.match(reasons, /\/row\/6\/Progress /);
    assert.match(reasons, /\/row\/7 a Planner row without a task name/);
    assert.match(reasons, /\/row\/8\/Start Date Planner date "next week"/);
    // An impossible date is refused, not rolled over into March.
    assert.equal(plannerDate('02/31/2020'), undefined);
    assert.equal(board.tasks.length, 2);
    assert.equal(board.tasks[0].custom_fields, undefined, 'unknown values are not stored');
    assert.ok(board.tasks[0].checklists[0].items.every(item => item.done === false), 'which item was done is not guessed');
    assert.equal(board.tasks[1].date_started, undefined);
  });

  await test('negative: a workbook that is not a Planner export is refused', async () => {
    assert.throws(() => parsePlannerRows([]), /empty/);
    assert.throws(() => parsePlannerRows([['Title', 'Description'], ['a', 'b']]), /Task Name and Bucket Name/);
    await assert.rejects(readPlannerWorkbook(''), /empty/);
    assert.throws(() => validateImportSourceShape('planner', 'text'), /Invalid planner/);
    assert.throws(() => validateImportSourceShape('planner', { excelBase64: '' }), /Invalid planner/);
    assert.doesNotThrow(() => validateImportSourceShape('planner', { excelBase64: 'UEsDBA==' }));
  });

  await test('export writes the same workbook, and it imports back', async () => {
    const collected = {
      board: { _id: 'b1', title: 'Launch' },
      items: [
        { cardId: 'c1', title: 'Order valves', listTitle: 'To do', description: 'Two of them', owner: 'alice', assignees: ['bob'],
          creator: 'carol', createdAt: '2026-10-01T00:00:00.000Z', startAt: '2026-10-02T00:00:00.000Z', dueAt: '2026-10-20T00:00:00.000Z',
          labels: ['Purchasing', 'a;b'], customFields: { Progress: 'In progress', Priority: 'Urgent' },
          checklists: [{ title: 'One', items: [{ title: 'Quote', done: true }] }, { title: 'Two', items: [{ title: 'Order', done: false }] }] },
        { cardId: 'c2', title: 'Ship it', listTitle: 'Done', endAt: '2026-10-07T00:00:00.000Z' },
      ],
    };
    const { sheet, rows } = formatters.planner(collected, new Date(Date.UTC(2026, 9, 8)));
    assert.equal(sheet, 'Tasks');
    assert.deepEqual(rows.slice(0, 5), [['Plan name', 'Launch'], ['Plan ID', 'b1'], ['Date of export', '10/08/2026'], [], PLANNER_COLUMNS]);
    const back = parsePlannerRows(await readPlannerWorkbook((await writePlannerWorkbook({ sheet, rows })).toString('base64')));
    assert.equal(back.board.name, 'Launch');
    assert.deepEqual(back.columns.map(c => c.title), ['To do', 'Done']);
    const [first, second] = back.tasks;
    assert.equal(first.ref, 'c1');
    assert.equal(first.owner_username, 'alice');
    assert.deepEqual(first.assignees, ['bob']);
    assert.equal(first.requested_by, 'carol');
    assert.equal(first.date_due, '2026-10-20T00:00:00.000Z');
    assert.equal(first.date_started, '2026-10-02T00:00:00.000Z');
    assert.equal(first.date_creation, '2026-10-01T00:00:00.000Z');
    assert.deepEqual(first.tags, ['Purchasing', 'a,b'], 'a ; inside a label cannot split it');
    assert.deepEqual(first.custom_fields, { Progress: 'In progress', Priority: 'Urgent' });
    assert.deepEqual(first.checklists[0].items.map(i => i.title), ['Quote', 'Order'], 'checklists flatten into Planner\'s one list');
    assert.ok(back.unsupported.some(u => /\(1\/2\), not which/.test(u.reason)));
    // A card with an end date and no Progress field exports as Completed.
    assert.equal(second.custom_fields.Progress, 'Completed');
    assert.equal(second.date_end, '2026-10-07T00:00:00.000Z');
    const late = rows[5][PLANNER_COLUMNS.indexOf('Late')];
    assert.equal(late, 'false', 'not late: due after the export date');
  });

  await test('the format is wired into import, export, the import page and the export menu', async () => {
    assert.equal(EXTERNAL_PARSERS.planner, parsePlannerRows);
    assert.equal(typeof formatters.planner, 'function');
    const imp = read('models/import.js');
    assert.match(imp, /case 'planner':[\s\S]*?check\(board, Object\);[\s\S]*?readPlannerWorkbook\(importedBoard\.excelBase64\);\s*importedBoard = EXTERNAL_PARSERS\.planner\(importedBoard\);[\s\S]*?sanitizeImported\(importedBoard, 'planner', this\);\s*creator = new KanboardCreator\(data, 'planner'\);/);
    // The bytes of each format are made in server/lib/renderExternalExport.js,
    // shared by the board export route and "Export all boards".
    const exp = read('server/lib/renderExternalExport.js');
    assert.match(exp, /planner: \(\) => require\('\/server\/lib\/plannerWorkbook'\)\.writePlannerWorkbook,/);
    assert.match(exp, /spreadsheetml\.sheet/);
    const page = read('client/components/import/import.js');
    assert.match(read('models/lib/importSources.js'), /\{ key: 'planner', name: 'Microsoft Planner'[,}]/); // the one list of sources
    // The page reads every source through one path described in
    // models/lib/importSources.js, not a branch of its own.
    assert.match(read('models/lib/importSources.js'), /\{ key: 'planner', name: '[^']+', \.\.\.EXCEL/, 'read by the one import path');
    // Other workbook sources (monday.com) share the file input after these two.
    // The page reads every source through one path described in
    // models/lib/importSources.js, not a branch of its own.
    assert.match(read('models/lib/importSources.js'), /\{ key: 'planner', name: '[^']+', \.\.\.EXCEL/, 'read by the one import path');
    assert.match(read('client/components/boards/exportScope.js'),
      /\{ key: 'planner', icon: 'fa-th-list', label: 'Microsoft Planner', path: 'export\/planner', ext: 'xlsx', scopes: BOARD_ONLY \}/);
    const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
    assert.match(en['import-board-instruction-planner'], /Export plan to Excel/);
  });

  console.log(`\nplannerFormat: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
