'use strict';

// Wrike Excel import template import/export (models/lib/wrikeFormat.js,
// server/lib/wrikeWorkbook.js), in the structure of Wrike's official sample
// excel_import_sample.xls (sheet "Tasks"). Run: node tests/wrikeFormat.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ExcelJS = require('@wekanteam/exceljs');
const { readWrikeWorkbook, writeWrikeWorkbook } = require('../server/lib/wrikeWorkbook');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const day = text => new Date(`${text}T00:00:00.000Z`);

async function workbook(rows, name = 'Tasks') {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(name);
  rows.forEach(row => ws.addRow(row));
  return Buffer.from(await wb.xlsx.writeBuffer()).toString('base64');
}

// The sample's header and rows, with its real date cells; key 4 adds the
// documented Parent Task column, key 15 an extra custom field to the right
// of Description.
const PERSON = 'Name Surname <name@company.com>';
const SAMPLE = [
  ['Key', 'Parent Task', 'Title', 'Status', 'Priority', 'Assigned To', 'Start Date', 'Duration', 'End Date', 'Depends On', 'Start Date Constraint', 'Description', 'Budget'],
  [1, '', '/Folder 1/'],
  [2, '', 'Task 1', 'Active', 'Normal', PERSON, day('2015-09-24'), '2 days', day('2015-09-25'), '', '', 'task description'],
  [3, '', 'Task 2', 'Active', 'Normal', `${PERSON}, Other Person <other@company.com>`, day('2015-09-24'), '3 days', day('2015-09-26'), '2SS', '', 'task description'],
  [4, 3, 'Subtask of Task 2', 'Completed', 'Low', '', '', '', '', '', '', ''],
  [6, '', '/Folder 2/Subfolder 1/'],
  [13, '', 'Task 9', 'Deferred', 'High', '', day('2015-10-01'), '5 days 1 hour 30 minutes', day('2015-10-02'), '', '', ''],
  [14, '', 'Task 10', 'Active', 'Normal', PERSON, day('2015-10-03'), '4 days', day('2015-10-08'), '13FS', day('2015-10-03'), 'task description'],
  [15, 1, 'Task in Folder 1', 'Active', '', '', '', '', '', '', '', '', 1200],
  [16, '', '/Project/', 'Green', '', PERSON, day('2015-09-24'), '8 days', day('2015-10-10')],
];

async function main() {
  const { parseWrikeRows, formatWrikeRows, wrikeDate, wrikePeople, WRIKE_EXPORT_COLUMNS, WRIKE_WORKFLOW_COLUMNS } = await import('../models/lib/wrikeFormat.js');
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');
  const { planImportedLinks } = await import('../models/lib/importedTaskPlan.js');
  let passed = 0;
  const test = async (name, fn) => { await fn(); passed += 1; console.log('  ok -', name); };

  await test('the sample maps folders, Status, Key, parent, people, dates, dependencies and columns', async () => {
    const board = parseWrikeRows(await readWrikeWorkbook(await workbook(SAMPLE)));
    assert.deepEqual(board.columns.map(c => c.title), ['Active', 'Completed', 'Deferred'], 'Status values are the lists');
    assert.deepEqual(board.swimlanes.map(s => s.name), ['Folder 1', 'Folder 2/Subfolder 1'], 'folder paths are swimlanes');
    const [task1, task2, sub, task9, task10, inFolder] = board.tasks;
    assert.equal(board.tasks.length, 6, 'folder and project rows are not cards');
    assert.equal(task1.ref, '2');
    assert.equal(task1.owner_username, 'Name Surname', 'Assigned To "Name <email>" is the name');
    assert.equal(task1.date_started, '2015-09-24T00:00:00.000Z');
    assert.equal(task1.date_due, '2015-09-25T00:00:00.000Z', 'End Date is the due date');
    assert.deepEqual(task1.custom_fields, { Priority: 'Normal', Duration: '2 days' });
    assert.equal(task1.description, 'task description');
    assert.equal(task1.swimlane_name, 'Folder 1');
    assert.deepEqual(task2.assignees, ['Other Person']);
    assert.deepEqual(task2.dependencies, [{ ref: '2', type: 'is-blocked-by' }]);
    assert.equal(sub.parent_ref, '3');
    assert.equal(sub.column_name, 'Completed');
    assert.equal(task9.swimlane_name, 'Folder 2/Subfolder 1');
    assert.deepEqual(task10.dependencies, [{ ref: '13', type: 'is-blocked-by' }], '13FS: Task 9 must finish before Task 10');
    assert.equal(inFolder.swimlane_name, 'Folder 1', 'a folder Key as Parent Task places the task in that folder');
    assert.equal(inFolder.parent_ref, undefined);
    assert.deepEqual(inFolder.custom_fields, { Budget: 1200 }, 'a column right of Description is a custom field');
    const links = planImportedLinks(board.tasks);
    assert.deepEqual(links.parents, [{ index: 2, parent: 1 }]);
    assert.deepEqual(links.dependencies.map(d => [d.index, d.deps.length]), [[1, 1], [4, 1]]);
    assert.deepEqual(links.unsupported, []);
    const reasons = board.unsupported.map(u => `${u.path} ${u.reason}`).join('\n');
    assert.match(reasons, /\/row\/4\/Depends On the SS kind of Wrike dependency "2SS" is kept as is-blocked-by/);
    assert.match(reasons, /\/row\/8\/Start Date Constraint a Wrike start date constraint \(2015-10-03\) is not imported/);
    assert.match(reasons, /\/row\/10 a Wrike folder or project's own Status, Assigned To, Start Date, Duration, End Date is not imported/);
  });

  await test('custom workflows, lower-case headers and repeated rows', async () => {
    const board = parseWrikeRows([
      ['Exported from somewhere'],
      ['key', 'title', 'default task workflow', 'workflow', 'status', 'custom status', 'description', 'effort'],
      ['1', 'Design', '', 'Product', 'Active', 'In Review', 'Spec it', '1h 30m'],
      ['1', 'Design', '', 'Product', 'Active', 'In Review', 'Spec it', '1h 30m'],
      ['2', 'Ship', '', 'Product', 'Completed', 'Shipped', '', ''],
      ['3', 'Drop', 'Product', 'Product', 'Cancelled', 'Shipped', '', ''],
    ]);
    assert.deepEqual(board.columns.map(c => c.title), ['In Review', 'Shipped'], 'Custom Status wins over its group');
    assert.equal(board.board.name, 'Product', 'the one workflow every task names is the board');
    assert.equal(board.tasks.length, 3, 'a task repeated for another folder is imported once');
    assert.deepEqual(board.tasks[0].custom_fields, { effort: '1h 30m' }, 'the workflow columns are not custom fields');
    const reasons = board.unsupported.map(u => `${u.path} ${u.reason}`).join('\n');
    assert.match(reasons, /\/row\/1 a row above the header row is not imported/);
    assert.match(reasons, /\/row\/4 a repeated row of the task with Key 1/);
    assert.match(reasons, /\/row\/6\/status the Cancelled status group of "Shipped" is not kept by the list: import the Wrike workflow in Rules/);
    assert.match(reasons, /\/row\/6\/default task workflow the Wrike default task workflow "Product" of a task is not imported/);
    assert.doesNotMatch(reasons, /\/row\/[35]\/status/, 'a group the status name implies is not a loss');
    assert.doesNotMatch(reasons, /\/workflow /, 'the Workflow cell is read, not lost');
    // The column of the previous WeKan export is an ordinary custom field now.
    const old = parseWrikeRows([['Title', 'Status', 'WeKan list'], ['A', 'Active', 'Doing']]);
    assert.equal(old.tasks[0].column_name, 'Active');
    assert.deepEqual(old.tasks[0].custom_fields, { 'WeKan list': 'Doing' });
    const two = parseWrikeRows([['Title', 'Workflow'], ['A', 'One'], ['B', 'Two']]);
    assert.equal(two.board.name, 'Imported Wrike board', 'two workflows name no board');
  });

  await test('negative: bad keys, dates, dependencies, missing titles and non-template workbooks', async () => {
    const board = parseWrikeRows([
      ['Key', 'Title', 'Start Date', 'End Date', 'Depends On', 'Parent Task'],
      ['abc', 'A', '24.09.2015', '2015-02-30', 'X1, 9XX, 5FS, 99', ''],
      ['', '', '2015-09-24'],
      ['', 'B', '', '', '', '77'],
      ['1', '/Folder/'],
      ['5', 'C', '', '', '1FS'],
    ]);
    const reasons = board.unsupported.map(u => `${u.path} ${u.reason}`).join('\n');
    assert.match(reasons, /\/row\/2\/Key Wrike Key "abc" is not an integer between 1 and 999999/);
    assert.match(reasons, /\/row\/2\/Start Date Wrike date "24\.09\.2015" is not a date/);
    assert.match(reasons, /\/row\/2\/End Date Wrike date "2015-02-30" is not a date/);
    assert.match(reasons, /\/row\/2\/Depends On Wrike dependency "X1" is not <Key><FS\|SS\|FF\|SF>/);
    assert.match(reasons, /\/row\/2\/Depends On Wrike dependency "9XX"/);
    assert.match(reasons, /\/row\/3 a Wrike row without a Title is not imported/);
    assert.match(reasons, /\/row\/4 a Wrike task without a Key cannot be a parent or a dependency/);
    assert.match(reasons, /\/row\/6\/Depends On a dependency on the folder with Key 1 is not imported/);
    assert.deepEqual(board.tasks.map(t => t.title), ['A', 'B', 'C']);
    assert.equal(board.tasks[0].date_started, undefined);
    assert.deepEqual(board.tasks[0].dependencies, [{ ref: '5', type: 'is-blocked-by' }, { ref: '99', type: 'is-blocked-by' }], 'a bare Key is FS');
    assert.deepEqual(planImportedLinks(board.tasks).unsupported.map(u => u.reason).sort(),
      ['linked item is not part of this import', 'parent is not part of this import']);
    assert.equal(wrikeDate('2015-09-24'), '2015-09-24T00:00:00.000Z');
    assert.equal(wrikeDate('42271'), '2015-09-24T00:00:00.000Z', 'an Excel serial day');
    assert.equal(wrikeDate('2015-13-01'), undefined);
    assert.equal(wrikeDate('next week'), undefined);
    assert.deepEqual(wrikePeople('A B <a@b.c>, <c@d.e>, Plain'), ['A B', 'c@d.e', 'Plain']);
    assert.deepEqual(wrikePeople(''), []);
    assert.throws(() => parseWrikeRows([]), /empty/);
    assert.throws(() => parseWrikeRows([['Name', 'Status'], ['a', 'b']]), /no header row with a "Title" column/);
    assert.throws(() => parseWrikeRows(new Array(65001).fill([])), /more than 65000 rows/);
    await assert.rejects(readWrikeWorkbook(''), /empty/);
    assert.throws(() => validateImportSourceShape('wrike', 'text'), /Invalid wrike/);
    assert.doesNotThrow(() => validateImportSourceShape('wrike', { excelBase64: 'UEsDBA==' }));
  });

  await test('the Tasks sheet is preferred over the first sheet', async () => {
    const wb = new ExcelJS.Workbook();
    wb.addWorksheet('Notes').addRow(['not the template']);
    const tasks = wb.addWorksheet('Tasks');
    [['Key', 'Title', 'Status'], [1, 'Only task', 'Active']].forEach(row => tasks.addRow(row));
    const rows = await readWrikeWorkbook(Buffer.from(await wb.xlsx.writeBuffer()).toString('base64'));
    assert.deepEqual(parseWrikeRows(rows).tasks.map(t => t.title), ['Only task']);
  });

  await test('export writes the import template, and it imports back', async () => {
    const built = formatters.wrike({
      board: { title: 'Launch' },
      lists: [{ title: 'Backlog' }, { title: 'Doing', color: 'orange' }, { title: 'Review' }],
      // A list whose move rule marks a card complete is a Completed status.
      workflowRules: [{ trigger: { activityType: 'moveCard', listName: 'Review' }, action: { actionType: 'markCardComplete' } }],
      items: [
        { cardId: 'c1', title: 'Order valves', listTitle: 'Doing', swimlaneTitle: 'Sprint 1', owner: 'alice', assignees: ['bob'],
          dueAt: '2026-10-20T00:00:00.000Z', startAt: '2026-10-01T00:00:00.000Z', description: 'Two of them',
          customFields: { Priority: 'urgent', Duration: '3 days', Vendor: 'ACME' } },
        { cardId: 'c2', title: 'Fit valves', listTitle: 'Review', swimlaneTitle: 'Sprint 1', parentCardId: 'c1' },
        { cardId: 'c3', title: 'Plan', listTitle: 'Backlog', swimlaneTitle: 'Default', endAt: '2026-09-01T00:00:00.000Z', dueComplete: true },
      ],
    });
    assert.equal(built.sheet, 'Tasks');
    assert.deepEqual(built.rows[0], [...WRIKE_EXPORT_COLUMNS, 'Vendor']);
    assert.ok(!built.rows[0].includes('WeKan list'), 'the list is a custom status, not a WeKan-only column');
    // Workflow left of Status, Custom Status right of it, as Wrike requires.
    const h = built.rows[0];
    assert.deepEqual(WRIKE_WORKFLOW_COLUMNS.map(name => h.indexOf(name)), [3, 4, 5, 6, 7]);
    const titles = built.rows.slice(1).map(row => row[2]);
    assert.deepEqual(titles, ['Plan', '/Sprint 1/', 'Order valves', 'Fit valves'], 'Default first, then a folder row per swimlane');
    assert.deepEqual(built.rows.slice(1).map(row => row[0]), [1, 2, 3, 4], 'sequential Keys');
    assert.equal(built.rows[4][1], 3, 'Parent Task by Key');
    const column = name => built.rows.slice(1).map(row => row[h.indexOf(name)]);
    assert.deepEqual(column('Default task workflow'), ['', 'Launch', '', ''], 'a folder makes the workflow its tasks\' default');
    assert.deepEqual(column('Default project workflow'), ['', '', '', '']);
    assert.deepEqual(column('Workflow'), ['Launch', '', 'Launch', 'Launch'], 'the workflow is named after the board');
    assert.deepEqual(column('Status'), ['Active', '', 'Active', 'Completed'], 'the list\'s status group, from its rule or name');
    assert.deepEqual(column('Custom Status'), ['Backlog', '', 'Doing', 'Review'], 'the list is the custom status');
    assert.equal(built.rows[1][h.indexOf('Status')], 'Active', 'a finished card in an Active list keeps its list\'s group');
    assert.equal(built.rows[3][h.indexOf('Priority')], 'High', 'urgent is written as High');
    const xlsx = await writeWrikeWorkbook(built);
    const check = new ExcelJS.Workbook();
    await check.xlsx.load(xlsx);
    assert.ok(check.getWorksheet('Tasks').getRow(4).getCell(h.indexOf('Start Date') + 1).value instanceof Date, 'dates are real date cells, as in the sample');
    const back = parseWrikeRows(await readWrikeWorkbook(xlsx.toString('base64')));
    assert.deepEqual(back.columns.map(c => c.title), ['Backlog', 'Doing', 'Review'], 'the custom statuses bring the lists back');
    assert.equal(back.board.name, 'Launch', 'and the workflow the board\'s title');
    assert.deepEqual(back.swimlanes.map(s => s.name), ['Default', 'Sprint 1']);
    const [plan, order, fit] = back.tasks;
    assert.equal(plan.swimlane_name, 'Default');
    assert.equal(order.owner_username, 'alice');
    assert.deepEqual(order.assignees, ['bob']);
    assert.equal(order.date_due, '2026-10-20T00:00:00.000Z');
    assert.equal(order.date_started, '2026-10-01T00:00:00.000Z');
    assert.equal(order.description, 'Two of them');
    assert.deepEqual(order.custom_fields, { Priority: 'High', Duration: '3 days', Vendor: 'ACME' });
    assert.equal(fit.parent_ref, order.ref);
    assert.deepEqual(planImportedLinks(back.tasks).parents, [{ index: 2, parent: 1 }]);
    // Review's Completed group came from a rule, which a workbook cannot carry.
    assert.deepEqual(back.unsupported.map(u => u.reason), ['the Completed status group of "Review" is not kept by the list: import the Wrike workflow in Rules to add the rule that does what it does']);
  });

  await test('wired into import, export, the import page and the export menu', async () => {
    assert.equal(EXTERNAL_PARSERS.wrike, parseWrikeRows);
    assert.equal(formatters.wrike, formatWrikeRows);
    assert.match(read('models/import.js'), /case 'wrike':[\s\S]*?readWrikeWorkbook\(importedBoard\.excelBase64\);\s*importedBoard = EXTERNAL_PARSERS\.wrike\(importedBoard\);[\s\S]*?sanitizeImported\(importedBoard, 'wrike', this\);\s*creator = new KanboardCreator\(data, 'wrike'\);/);
    assert.match(read('server/lib/renderExternalExport.js'), /wrike: \(\) => require\('\/server\/lib\/wrikeWorkbook'\)\.writeWrikeWorkbook,/);
    const page = read('client/components/import/import.js');
    assert.match(read('models/lib/importSources.js'), /\{ key: 'wrike', name: 'Wrike'[,}]/); // the one list of sources
    // The workbook sources share one branch and one list; later ones follow.
    // The page reads every source through one path described in
    // models/lib/importSources.js, not a branch of its own.
    assert.match(read('models/lib/importSources.js'), /\{ key: 'wrike', name: '[^']+', \.\.\.EXCEL/, 'read by the one import path');
    assert.match(read('client/components/boards/exportScope.js'), /key: 'wrike'[^}]*path: 'export\/wrike', ext: 'xlsx'/);
    // The instruction is added to en.i18n.json in English, pending Transifex.
    const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
    if (en['import-board-instruction-wrike'] !== undefined) {
      assert.match(en['import-board-instruction-wrike'], /Excel/);
    }
  });

  console.log(`\nwrikeFormat: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
