'use strict';

// monday.com "Export board to Excel" import/export (models/lib/mondayFormat.js,
// server/lib/mondayWorkbook.js), in the layout of monday's help-article
// screenshots. Run: node tests/mondayFormat.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ExcelJS = require('@wekanteam/exceljs');
const { readMondayWorkbook, writeMondayWorkbook } = require('../server/lib/mondayWorkbook');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

async function workbook(sheets) {
  const wb = new ExcelJS.Workbook();
  for (const { name, rows } of sheets) {
    const ws = wb.addWorksheet(name);
    rows.forEach(row => ws.addRow(row));
  }
  return Buffer.from(await wb.xlsx.writeBuffer()).toString('base64');
}

// The export's layout: board name, then group blocks with a repeated header.
const BOARD_SHEET = {
  name: 'ice cream flavors',
  rows: [
    ['Ice Cream Flavors', '', '', '', '', 'Powered by monday.com'],
    ['New Flavor Ideas'],
    ['Name', 'Ice Cream Maker', 'Status', 'In Stores', 'Rating', 'Tags'],
    ['Honey Apricot', 'Alice Example, Bob Example', 'Working on it', '', '', 'sweet, summer'],
    ['', 'Subitems', 'Owner', 'Status'],
    ['', 'Taste test', 'Carol Example', 'Done'],
    ['Caramel apple', '', 'Testing', '', '', ''],
    ['', '', '', '', '0/5'],
    [],
    ['Existing Flavors'],
    ['Name', 'Ice Cream Maker', 'Status', 'In Stores', 'Rating', 'Tags'],
    ['Pistachio', '', 'In Stores', '2024-07-18', 4, ''],
  ],
};
const UPDATES_SHEET = {
  name: 'ice cream flavors-updates',
  rows: [
    ['Ice Cream Flavors', 'Updates'],
    ['Item ID', 'Item Name', 'Content Type', 'Content Type', 'User', 'Created At', 'Update Content', 'Likes Count'],
    ['', 'Honey Apricot', 'Update', '', 'Danielle Levine', '27/May/2025 03:26:42 PM', 'flavor still being tested', 0],
    ['', 'Mint', 'Update', '', 'Danielle Levine', '27/May/2025 03:27:00 PM', 'no such item', 0],
  ],
};

async function main() {
  const { parseMondaySheets, formatMondaySheets, mondayDate, MONDAY_COLUMNS } = await import('../models/lib/mondayFormat.js');
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');
  const { planImportedLinks } = await import('../models/lib/importedTaskPlan.js');
  let passed = 0;
  const test = async (name, fn) => { await fn(); passed += 1; console.log('  ok -', name); };

  await test('an export maps groups, Status, people, tags, dates, other columns, subitems and updates', async () => {
    const board = parseMondaySheets(await readMondayWorkbook(await workbook([BOARD_SHEET, UPDATES_SHEET])));
    assert.equal(board.board.name, 'Ice Cream Flavors');
    assert.deepEqual(board.columns.map(c => c.title), ['Working on it', 'Done', 'Testing', 'In Stores'], 'Status values are the lists');
    assert.deepEqual(board.swimlanes.map(s => s.name), ['New Flavor Ideas', 'Existing Flavors'], 'groups are swimlanes');
    const [honey, taste, caramel, pistachio] = board.tasks;
    assert.equal(honey.title, 'Honey Apricot');
    assert.deepEqual(honey.custom_fields, { 'Ice Cream Maker': 'Alice Example, Bob Example' }, 'an unknown column is a custom field');
    assert.deepEqual(honey.tags, ['sweet', 'summer']);
    assert.deepEqual(honey.comments, [{ text: 'flavor still being tested', author: 'Danielle Levine', date: '2025-05-27T15:26:42.000Z' }]);
    assert.equal(taste.title, 'Taste test');
    assert.equal(taste.owner_username, 'Carol Example', 'the subitem header has its own columns');
    assert.equal(taste.column_name, 'Done');
    assert.equal(taste.parent_ref, honey.ref, 'a subitem is a subtask of the item above it');
    assert.deepEqual(planImportedLinks(board.tasks).parents, [{ index: 1, parent: 0 }]);
    assert.equal(caramel.swimlane_name, 'New Flavor Ideas');
    assert.equal(pistachio.swimlane_name, 'Existing Flavors');
    assert.deepEqual(pistachio.custom_fields, { 'In Stores': '2024-07-18', Rating: 4 });
    assert.equal(board.tasks.length, 4, 'the summary row is not an item');
    assert.ok(board.unsupported.some(u => /an update for an item that is not in the board sheet/.test(u.reason)));
  });

  await test('people and date columns are matched by meaning; a board without Status lists its groups', async () => {
    const board = parseMondaySheets(await readMondayWorkbook(await workbook([{ name: 'plan', rows: [
      ['Plan'],
      ['Sprint 1'],
      ['Name', 'Person', 'Due date', 'Timeline', 'Item ID', 'Notes'],
      ['Design', 'Alice, Bob', '2026-10-10', '2026-10-01 - 2026-10-09', '123', 'Two of them'],
      ['Sprint 2'],
      ['Name', 'Person', 'Due date', 'Timeline', 'Item ID', 'Notes'],
      ['Build', '', '', '', '124', ''],
    ] }])));
    assert.deepEqual(board.columns.map(c => c.title), ['Sprint 1', 'Sprint 2']);
    const [design, build] = board.tasks;
    assert.equal(design.owner_username, 'Alice');
    assert.deepEqual(design.assignees, ['Bob']);
    assert.equal(design.date_due, '2026-10-10T00:00:00.000Z', 'Due date wins over the timeline\'s end');
    assert.equal(design.date_started, '2026-10-01T00:00:00.000Z');
    assert.equal(design.ref, '123');
    assert.equal(design.description, 'Two of them');
    assert.equal(build.column_name, 'Sprint 2');
  });

  await test('negative: bad dates, nameless items and a non-export workbook', async () => {
    const board = parseMondaySheets([{ name: 'x', rows: [
      ['Name', 'Date', 'Timeline'],
      ['A', '10/10/2026', '2026-10-01'],
      ['', 'only a value'],
    ] }]);
    const reasons = board.unsupported.map(u => `${u.path} ${u.reason}`).join('\n');
    assert.match(reasons, /\/row\/2\/Date monday\.com date "10\/10\/2026"/);
    assert.match(reasons, /\/row\/2\/Timeline monday\.com timeline "2026-10-01"/);
    assert.equal(board.tasks.length, 1);
    assert.equal(mondayDate('2026-02-30'), undefined);
    assert.equal(mondayDate('31/Foo/2025 01:00:00 PM'), undefined);
    assert.throws(() => parseMondaySheets([]), /empty/);
    assert.throws(() => parseMondaySheets([{ name: 'x', rows: [['Title', 'Status'], ['a', 'b']] }]), /header row starting with "Name"/);
    await assert.rejects(readMondayWorkbook(''), /empty/);
    assert.throws(() => validateImportSourceShape('monday', 'text'), /Invalid monday/);
    assert.doesNotThrow(() => validateImportSourceShape('monday', { excelBase64: 'UEsDBA==' }));
  });

  await test('export writes the flat import table, and it imports back', async () => {
    const built = formatters.monday({
      board: { title: 'Launch' },
      items: [
        { cardId: 'c1', title: 'Order valves', listTitle: 'Working on it', swimlaneTitle: 'Sprint 1', owner: 'alice', assignees: ['bob'],
          dueAt: '2026-10-20T00:00:00.000Z', startAt: '2026-10-01T00:00:00.000Z', labels: ['urgent', 'a,b'], description: 'Two of them',
          customFields: { Priority: 'High', Vendor: 'ACME' } },
        { cardId: 'c2', title: 'Ship it', listTitle: 'Done', swimlaneTitle: 'Default' },
      ],
    });
    assert.equal(built.sheets.length, 1);
    assert.deepEqual(built.sheets[0].rows[0], [...MONDAY_COLUMNS, 'Vendor']);
    const back = parseMondaySheets(await readMondayWorkbook((await writeMondayWorkbook(built)).toString('base64')));
    assert.deepEqual(back.columns.map(c => c.title), ['Working on it', 'Done']);
    assert.deepEqual(back.swimlanes.map(s => s.name), ['Sprint 1', 'Default']);
    const [order, ship] = back.tasks;
    assert.equal(order.ref, 'c1');
    assert.equal(order.owner_username, 'alice');
    assert.deepEqual(order.assignees, ['bob']);
    assert.equal(order.date_due, '2026-10-20T00:00:00.000Z');
    assert.equal(order.date_started, '2026-10-01T00:00:00.000Z');
    assert.deepEqual(order.tags, ['urgent', 'a b']);
    assert.equal(order.description, 'Two of them');
    assert.deepEqual(order.custom_fields, { Priority: 'High', Vendor: 'ACME' });
    assert.equal(ship.swimlane_name, 'Default');
    assert.deepEqual(planImportedLinks(back.tasks).parents, []);
  });

  await test('wired into import, export, the import page and the export menu', async () => {
    assert.equal(EXTERNAL_PARSERS.monday, parseMondaySheets);
    assert.equal(formatters.monday, formatMondaySheets);
    assert.match(read('models/import.js'), /case 'monday':[\s\S]*?readMondayWorkbook\(importedBoard\.excelBase64\);\s*importedBoard = EXTERNAL_PARSERS\.monday\(importedBoard\);[\s\S]*?sanitizeImported\(importedBoard, 'monday', this\);\s*creator = new KanboardCreator\(data, 'monday'\);/);
    assert.match(read('server/lib/renderExternalExport.js'), /monday: \(\) => require\('\/server\/lib\/mondayWorkbook'\)\.writeMondayWorkbook,/);
    const page = read('client/components/import/import.js');
    assert.match(read('models/lib/importSources.js'), /\{ key: 'monday', name: 'monday\.com'[,}]/); // the one list of sources
    // The page reads every source through one path described in
    // models/lib/importSources.js, not a branch of its own.
    assert.match(read('models/lib/importSources.js'), /\{ key: 'monday', name: '[^']+', \.\.\.EXCEL/, 'read by the one import path');
    // Later workbook sources (Wrike) share the file input after these three.
    // The page reads every source through one path described in
    // models/lib/importSources.js, not a branch of its own.
    assert.match(read('models/lib/importSources.js'), /\{ key: 'monday', name: '[^']+', \.\.\.EXCEL/, 'read by the one import path');
    assert.match(read('client/components/boards/exportScope.js'), /key: 'monday'[^}]*path: 'export\/monday', ext: 'xlsx'/);
    assert.match(JSON.parse(read('imports/i18n/data/en.i18n.json'))['import-board-instruction-monday'], /Export board to Excel/);
  });

  console.log(`\nmondayFormat: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
