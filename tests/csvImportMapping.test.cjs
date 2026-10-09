'use strict';

// The column mapping of the CSV/TSV and Excel imports
// (models/lib/csvImportMapping.js), and the reading of WeKan's own CSV and
// Excel exports back in. Run: node tests/csvImportMapping.test.cjs
//
// The CSV import used to guess the columns from a short list of English names
// only, made one "Imported List <date>" list per row when the file had no
// Stage/Status/State column (and put every card in the last of them), never
// applied the Owner column, did not know WeKan's own export column names, and
// split a TSV value at its commas. The Excel import read only the first sheet,
// only a header in row 1, and turned formula and rich text cells into
// "[object Object]".

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ExcelJS = require('@wekanteam/exceljs');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
let passed = 0;
async function test(name, fn) {
  await fn();
  passed += 1;
  console.log(`  ok - ${name}`);
}

async function main() {
  const m = await import('../models/lib/csvImportMapping.js');
  const { documentForFile } = await import('../models/lib/importManyFiles.js');

  // Every language's names for the export columns, as the server loads them
  // (server/lib/importHeaderNames.js).
  const translations = {};
  const dataDir = path.join(root, 'imports/i18n/data');
  for (const file of fs.readdirSync(dataDir)) {
    translations[file.replace(/\.i18n\.json$/, '')] =
      m.pickHeaderTranslations(JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8')));
  }
  const fi = translations.fi;
  const fieldOf = key => (m.CSV_IMPORT_FIELDS.find(f => f.exportKeys.includes(key)) || {}).field;

  await test('a confirmed mapping is used instead of the header names', () => {
    const rows = [
      ['Name', 'Column', 'Notes', 'Who'],
      ['Buy milk', 'Shop', 'two litres', 'alice'],
      ['Fix bike', 'Garage', '', 'bob'],
    ];
    const mapping = m.validateCsvMapping({ columns: { title: 0, list: 1, description: 2, owner: 3 } }, 4);
    const plan = m.planCsvBoard(rows, mapping);
    assert.deepEqual(plan.lists, ['Shop', 'Garage']);
    assert.deepEqual(plan.cards.map(c => [c.title, c.list, c.description, c.owner]),
      [['Buy milk', 'Shop', 'two litres', 'alice'], ['Fix bike', 'Garage', undefined, 'bob']]);
    // The same file read by names alone: "Column" is the list, "Name" the title.
    const guess = m.guessCsvMapping(rows[0], translations);
    assert.equal(guess.columns.title, 0);
    assert.equal(guess.columns.list, 1);
  });

  await test('no list column: every card goes into ONE list, the typed name or the default', () => {
    const rows = [['Title', 'Description'], ['A', ''], ['B', ''], ['C', '']];
    const typed = m.planCsvBoard(rows, m.validateCsvMapping({ columns: { title: 0 }, listName: '  Inbox ' }, 2));
    assert.deepEqual(typed.lists, ['Inbox']);
    assert.ok(typed.cards.every(card => card.list === 'Inbox'));
    const guessed = m.planCsvBoard(rows, m.guessCsvMapping(rows[0], translations), { defaultListName: 'Tehtävät' });
    assert.deepEqual(guessed.lists, ['Tehtävät']);
    // Negative: never one list per row, and a row with an empty list cell
    // joins the one list rather than making its own.
    const mixed = m.planCsvBoard([['Title', 'Status'], ['A', 'Doing'], ['B', ''], ['C', '']],
      m.validateCsvMapping({ columns: { title: 0, list: 1 }, listName: 'Later' }, 2));
    assert.deepEqual(mixed.lists, ['Doing', 'Later']);
    assert.equal(m.planCsvBoard([['Title']], { columns: { title: 0 } }).lists.length, 1);
    assert.doesNotMatch(read('models/csvCreator.js'), /Imported List/);
  });

  await test('Owner, people, dates, labels and the other columns reach the plan', () => {
    const header = ['Title', 'Owner', 'Members', 'Assignee', 'Requested By', 'Assigned By', 'Labels',
      'Received', 'Start', 'Due', 'End', 'Parent card', 'Spent time (hours)', 'Overtime (hours)', 'Archived',
      'Swimlane'];
    const rows = [header, ['Child', 'alice', 'bob carol', 'dave', 'erin, Customer X', 'frank', 'Bug-red Feature',
      '2026-09-01T00:00:00.000Z', '2026-09-02', '2026-09-03', '2026-09-04', 'Parent', '1,5', 'true', 'true', 'Team A']];
    const mapping = m.guessCsvMapping(header, translations);
    for (const [field, index] of Object.entries({ title: 0, owner: 1, members: 2, assignees: 3, requestedBy: 4,
      assignedBy: 5, labels: 6, receivedAt: 7, startAt: 8, dueAt: 9, endAt: 10, parentCard: 11, spentTime: 12,
      isOvertime: 13, archived: 14, swimlane: 15 })) {
      assert.equal(mapping.columns[field], index, field);
    }
    const [card] = m.planCsvBoard(rows, mapping).cards;
    assert.equal(card.owner, 'alice');
    assert.deepEqual(card.members, ['bob', 'carol']);
    assert.deepEqual(card.assignees, ['dave']);
    assert.deepEqual(card.requestedBy, ['erin', 'Customer X']);
    assert.deepEqual(card.labels, [{ name: 'Bug', color: 'red' }, { name: 'Feature', color: 'black' }]);
    assert.equal(card.dueAt.toISOString().slice(0, 10), '2026-09-03');
    assert.equal(card.parentTitle, 'Parent');
    assert.equal(card.spentTime, 1.5);
    assert.equal(card.isOvertime, true);
    assert.equal(card.archived, true);
    assert.equal(card.swimlane, 'Team A');
    // The creator applies Owner: the card's userId is the mapped owner.
    const creator = read('models/csvCreator.js');
    assert.match(creator, /userId: this\._userIdOf\(card\.owner\) \|\| this\._user\(\)/);
    // Negative: unknown names are not looked up among all users.
    assert.doesNotMatch(creator, /getUser\(\{\s*username/);
  });

  await test('WeKan CSV and Excel export headers are recognised in every language', () => {
    const csvLayout = m.CSV_EXPORT_LAYOUT;
    const excelLayout = m.EXCEL_EXPORT_LAYOUT;
    // The layouts are the exporters' own column orders.
    const exporter = read('models/exporter.js');
    assert.ok(exporter.includes(`const columnKeys = [\n      ${csvLayout.slice(0, 7).map(k => `'${k}'`).join(',')},`));
    const excel = read('models/server/ExporterExcel.js');
    const excelKeys = [...excel.slice(excel.indexOf("ws.addRow().values = [\n      TAPi18n.__('number'"))
      .matchAll(/TAPi18n\.__\('([a-z-A-Z]+)','',this\.userLanguage\)/g)].map(match => match[1]).slice(0, excelLayout.length);
    assert.deepEqual(excelKeys, excelLayout);
    for (const [lang, names] of Object.entries(translations)) {
      for (const layout of [csvLayout, excelLayout]) {
        const header = layout.map(key => names[key] || translations.en[key]);
        const { columns } = m.guessCsvMapping(header, translations);
        layout.forEach((key, i) => {
          const field = fieldOf(key);
          if (field) assert.equal(columns[field], i, `${lang}: ${key} (${header[i]})`);
        });
      }
    }
  });

  await test('the column numbers of a mapping are checked; a wrong one is refused', () => {
    assert.equal(m.isCsvMappingShape({ columns: { title: 0, list: 3 }, listName: 'To do', customFieldColumns: [4] }), true);
    for (const bad of [null, [], 'x', { columns: { nope: 0 } }, { columns: { title: -1 } }, { columns: { title: '0' } },
      { columns: { title: 1.5 } }, { columns: [] }, { listName: 5 }, { listName: 'x'.repeat(256) },
      { customFieldColumns: ['1'] }, { customFieldColumns: 3 }, { extra: true }, { columns: { title: 0 }, __proto__: { a: 1 } }]) {
      assert.equal(m.isCsvMappingShape(bad), false, JSON.stringify(bad));
      assert.throws(() => m.validateCsvMapping(bad, 10));
    }
    assert.throws(() => m.validateCsvMapping({ columns: { title: 4 } }, 4), /no column 5/);
    assert.throws(() => m.validateCsvMapping({ columns: { title: 0 }, customFieldColumns: [1, 1] }, 4), /twice/);
    assert.throws(() => m.validateCsvMapping({ columns: { title: 0 }, customFieldColumns: [0] }, 4), /already/);
    assert.throws(() => m.resolveCsvMapping(['Title'], { columns: { list: 2 } }, translations));
    // The method checks the shape before anything else runs, the REST route
    // before calling it, and the creator against the header before writing.
    const method = read('models/import.js');
    const shapeCheck = method.indexOf('check(data.csvMapping, Match.Maybe(Match.Where(isCsvMappingShape)));');
    assert.ok(shapeCheck !== -1 && shapeCheck < method.indexOf('await assertImportEnabled()'));
    const rest = read('server/models/boards.js');
    assert.match(rest, /if \(!isCsvMappingShape\(body\.csvMapping\)\) \{\s*throw new Meteor\.Error\('invalid-import-mapping'/);
    assert.match(rest, /additionalData\.csvMapping = body\.csvMapping;/);
    const creator = read('models/csvCreator.js');
    assert.ok(creator.indexOf('resolveCsvMapping(rows[0], this.csvMapping') < creator.indexOf('await this.createBoard(plan)'));
  });

  await test('a TSV value with a comma stays one value', () => {
    assert.equal(m.csvSeparatorOf('Title\tList\nA, b\tDoing'), '\t');
    assert.equal(m.csvSeparatorOf('Title;List\nA;B'), ';');
    assert.equal(m.csvSeparatorOf('Title,List'), ',');
    const rows = documentForFile('csv', 'board.tsv', Buffer.from('Title\tDescription\nBuy milk, eggs\tA, B, C\n'));
    assert.deepEqual(rows, [['Title', 'Description'], ['Buy milk, eggs', 'A, B, C']]);
    // Negative: nothing turns tabs into commas before parsing any more.
    for (const file of ['client/components/import/import.js', 'client/components/import/csvMapping.js',
      'models/lib/importManyFiles.js']) {
      assert.doesNotMatch(read(file), /replace\(\/\(?\\t\)?\/g, ','\)/, file);
    }
    assert.doesNotMatch(read('api.py'), /text\.replace\('\\t', ','\)/);
    assert.match(read('client/components/import/csvMapping.js'), /Papa\.parse\(input, \{ delimiter: csvSeparatorOf\(input\)/);
  });

  // The streaming table ExporterExcel writes, with Finnish headers: the
  // board's title in A1, description, dates and members above, the header
  // in row 7, an Activity sheet after it.
  function wekanSheet(workbook, sheetName, title, cards) {
    const ws = workbook.addWorksheet(sheetName);
    ws.mergeCells('A1:H1');
    ws.getCell('A1').value = title;
    ws.addRow(['', '', '', '', '', '']);
    ws.addRow([fi.description, 'Board description']);
    ws.addRow(['', '', '', '', '', '']);
    ws.addRow([fi.createdAt, new Date('2026-01-01T00:00:00Z'), fi['last-modified-at'], new Date('2026-01-02T00:00:00Z'),
      fi.members, 'alice,bob']);
    ws.addRow(['', '', '', '', '', '']);
    ws.addRow(m.EXCEL_EXPORT_LAYOUT.map(key => fi[key]));
    cards.forEach((card, i) => ws.addRow([String(i + 1), card.title, card.description, card.parent || '', 'alice',
      new Date('2026-09-01T10:00:00Z'), new Date('2026-09-02T10:00:00Z'), ' ', new Date('2026-09-03T00:00:00Z'),
      new Date('2026-09-10T00:00:00Z'), ' ', card.list, 'Default', 'bob ', 'alice bob ', '', '', 'Bug ,Feature ',
      'false', 2]));
    return ws;
  }
  function activitySheet(workbook, name) {
    const ws = workbook.addWorksheet(name);
    ws.getCell('A1').value = 'Board';
    ws.addRow(['', '', '', '', '', '']);
    ws.addRow([fi.number, fi.activity, fi.card, fi.owner, fi.createdAt, fi['last-modified-at']]);
    ws.addRow(['1', 'A comment', 'Card one', 'alice', new Date(), new Date()]);
  }
  async function reopen(workbook) {
    const loaded = new ExcelJS.Workbook();
    await loaded.xlsx.load(Buffer.from(await workbook.xlsx.writeBuffer()));
    return loaded.worksheets.map(worksheet => ({ name: worksheet.name, rows: m.worksheetRows(worksheet) }));
  }

  await test('a WeKan Excel export in Finnish imports: header in row 7, Activity sheet skipped', async () => {
    const workbook = new ExcelJS.Workbook();
    wekanSheet(workbook, 'Projekti', 'Projekti X', [
      { title: 'Kortti yksi', description: 'Kuvaus', list: 'Tehtävät' },
      { title: 'Kortti kaksi', description: '', list: 'Valmis', parent: 'Kortti yksi' },
    ]);
    activitySheet(workbook, fi.activity);
    const { boards, skipped } = m.excelSheetsToBoards(await reopen(workbook), translations);
    assert.equal(boards.length, 1);
    assert.deepEqual(skipped, [fi.activity]);
    assert.equal(boards[0].title, 'Projekti X');
    assert.deepEqual(boards[0].rows[0], m.EXCEL_EXPORT_LAYOUT.map(key => fi[key]));
    const mapping = m.guessCsvMapping(boards[0].rows[0], translations);
    assert.equal(mapping.columns.list, 11);
    assert.equal(mapping.columns.title, 1);
    const plan = m.planCsvBoard(boards[0].rows, mapping);
    assert.deepEqual(plan.lists, ['Tehtävät', 'Valmis']);
    assert.deepEqual(plan.cards.map(c => c.title), ['Kortti yksi', 'Kortti kaksi']);
    assert.equal(plan.cards[0].owner, 'alice');
    assert.deepEqual(plan.cards[0].members, ['alice', 'bob']);
    assert.deepEqual(plan.cards[0].labels.map(l => l.name), ['Bug', 'Feature']);
    assert.equal(plan.cards[0].dueAt.toISOString(), '2026-09-10T00:00:00.000Z');
    assert.equal(plan.cards[0].receivedAt, undefined);
    assert.equal(plan.cards[1].parentTitle, 'Kortti yksi');
    assert.equal(plan.cards[0].spentTime, 2);
  });

  await test('a workbook with a sheet per board ("Export all boards") is several boards', async () => {
    const workbook = new ExcelJS.Workbook();
    wekanSheet(workbook, 'First board', 'First board', [{ title: 'One', description: '', list: 'Doing' }]);
    wekanSheet(workbook, 'Second board', 'Second board, with a long title', [{ title: 'Two', description: '', list: 'Done' }]);
    workbook.addWorksheet('Empty');
    const { boards, skipped } = m.excelSheetsToBoards(await reopen(workbook), translations);
    assert.deepEqual(boards.map(b => b.title), ['First board', 'Second board, with a long title']);
    assert.deepEqual(boards.map(b => b.sheet), ['First board', 'Second board']);
    assert.deepEqual(skipped, ['Empty'], 'a sheet with no header is named as not imported');
    // The confirmed mapping applies to sheets with the first sheet's header.
    const mapping = { columns: { title: 1, list: 11 } };
    assert.equal(m.mappingForSheet(mapping, boards, 1), mapping);
    const other = [...boards, { title: 'x', sheet: 'x', rows: [['Name', 'Stage']] }];
    assert.equal(m.mappingForSheet(mapping, other, 2), undefined);
    // The method imports each board through its own creator and returns the first.
    const method = read('models/import.js');
    assert.match(method, /if \(Meteor\.isServer && excelBoards && excelBoards\.length > 1\) \{/);
    assert.match(method, /const partCreator = new CsvCreator\(partData, \{ title: part\.title \}\);/);
    assert.match(method, /if \(!firstBoardId\) firstBoardId = boardId;\s*\}\s*return firstBoardId;/);
    // Negative: a plain sheet still has its header in row 1, and the first
    // sheet is the board when no sheet has a recognised header.
    const plain = new ExcelJS.Workbook();
    const ws = plain.addWorksheet('Tasks');
    ws.addRow(['Task', 'Owner']);
    ws.addRow(['Paint', 'alice']);
    const read1 = m.excelSheetsToBoards(await reopen(plain), translations);
    assert.equal(read1.boards.length, 1);
    assert.deepEqual(read1.boards[0].rows, [['Task', 'Owner'], ['Paint', 'alice']]);
  });

  await test('formula, rich text, hyperlink and date cells are read as their values', async () => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Board');
    ws.addRow(['Title', 'Description', 'Due date', 'List']);
    ws.addRow(['', '', new Date('2026-10-10T00:00:00Z'), 'Doing']);
    ws.getCell('A2').value = { formula: 'CONCATENATE("Buy ","milk")', result: 'Buy milk' };
    ws.getCell('B2').value = { richText: [{ text: 'Bold ' }, { font: { bold: true }, text: 'part' }] };
    ws.addRow([{ text: 'Linked', hyperlink: 'https://example.com' }, { error: '#N/A' }, '', 'Doing']);
    const [sheet] = await reopen(workbook);
    const { boards } = m.excelSheetsToBoards([sheet], translations);
    assert.deepEqual(boards[0].rows[1], ['Buy milk', 'Bold part', '2026-10-10T00:00:00.000Z', 'Doing']);
    assert.deepEqual(boards[0].rows[2].slice(0, 2), ['Linked', '']);
    // Negative: no cell becomes "[object Object]".
    assert.ok(boards[0].rows.flat().every(cell => !String(cell).includes('[object')));
    // The server reads the workbook with these functions, not String(value).
    const reader = read('server/lib/excelBoardWorkbook.js');
    assert.match(reader, /worksheetRows\(worksheet\)/);
    assert.doesNotMatch(read('models/import.js'), /parseXlsxToRows|String\(v\)/);
  });

  await test('the import page shows the mapping step for CSV/TSV and Excel', () => {
    const page = read('client/components/import/import.js');
    assert.match(page, /await startCsvMapping\(this, \{ rows: doc, membersStep: !skipMapping \}\);/);
    assert.match(page, /await startCsvMapping\(this, \{ excelBase64: doc\.excelBase64 \}\);/);
    assert.match(page, /\.\.\.csvMappingData\(this\)/);
    const jade = read('client/components/import/csvMapping.jade');
    assert.match(jade, /template\(name="importCsvMapping"\)/);
    assert.match(jade, /input\.js-csv-map-list-name/);
    assert.match(read('client/features/importing.js'), /csvMapping\.jade[\s\S]*csvMapping\.js[\s\S]*csvMapping\.css/);
    const methods = read('server/methods/csvImportMapping.js');
    // Both questions need a signed-in user and import enabled.
    assert.equal((methods.match(/if \(!this\.userId\) throw new Meteor\.Error\('error-notAuthorized'\);/g) || []).length, 2);
    assert.equal((methods.match(/await assertImportEnabled\(\);/g) || []).length, 2);
    assert.match(read('server/imports.js'), /import '\/server\/methods\/csvImportMapping';/);
  });

  console.log(`csvImportMapping: ${passed} tests passed`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
