'use strict';

// Businessmap (formerly Kanbanize) Excel import/export
// (models/lib/businessmapFormat.js, server/lib/businessmapWorkbook.js), with
// the column headers of Businessmap's knowledge base on importing and
// exporting cards. Run: node tests/businessmapFormat.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ExcelJS = require('@wekanteam/exceljs');
const { readBusinessmapWorkbook, writeBusinessmapWorkbook } = require('../server/lib/businessmapWorkbook');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

async function workbook(sheets) {
  const wb = new ExcelJS.Workbook();
  for (const { name, rows } of sheets) {
    const ws = wb.addWorksheet(name);
    rows.forEach(row => ws.addRow(row));
  }
  return Buffer.from(await wb.xlsx.writeBuffer()).toString('base64');
}

// An Advanced Search export with the documented headers, in Businessmap's
// own order-independent layout, and the extra Links tab the export adds.
const CARDS_SHEET = {
  name: 'Sheet1',
  rows: [
    ['Card ID', 'Title', 'Description', 'Board name', 'Workflow name', 'Column', 'Lane', 'Owner', 'Co-Owners', 'Priority',
      'Color', 'Size', 'Tags', 'Deadline', 'Type', 'Links', 'Comment', 'Comment', 'Created at', 'Start Date', 'End Date', 'Track', 'Customer'],
    [1234, 'Team Discussion', 'Agree on scope', 'Product', 'Development', 'Requested', 'Expedite', 'tom', 'anna, ben', 'average',
      '#067DB7', 3, 'meeting, q4 plan', '10/28/2026', 'Task', 'Children: 1235; Successors: 1236', 'Kick-off booked', 'Room 2', '2026-10-01', '13-10-2026', '', 'Roadmap', 'ACME'],
    [1235, 'System Requirements', '', 'Product', 'Development', 'In Progress', '', 'tom', '', 'high',
      '', '', 'spec review', '2026-12-28', '', '', '', '', '', '', '', '', 'ACME'],
    [1236, 'Release', '', 'Product', 'Development', 'Done', 'Standard', '', '', 'critical',
      '', '', '', new Date(Date.UTC(2026, 11, 31)), '', 'Predecessors: 1234; Relatives: 1235', '', '', '', '', '', '', 42],
  ],
};
const LINKS_SHEET = { name: 'Links', rows: [['Card ID', 'Linked card', 'Type'], [1234, 1235, 'child']] };

async function main() {
  const fmt = await import('../models/lib/businessmapFormat.js');
  const { parseBusinessmapSheets, formatBusinessmapSheets, businessmapDate, businessmapTags, businessmapLinks } = fmt;
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');
  const { planImportedLinks, planImportedCustomFields } = await import('../models/lib/importedTaskPlan.js');
  let passed = 0;
  const test = async (name, fn) => { await fn(); passed += 1; console.log('  ok -', name); };

  await test('an export maps the documented columns, links, comments and custom fields', async () => {
    const board = parseBusinessmapSheets(await readBusinessmapWorkbook(await workbook([CARDS_SHEET, LINKS_SHEET])));
    assert.equal(board.board.name, 'Product', 'Board name is the title');
    assert.deepEqual(board.columns.map(c => c.title), ['Requested', 'In Progress', 'Done'], 'Column values are the lists');
    assert.deepEqual(board.swimlanes.map(s => s.name), ['Expedite', 'Development', 'Standard'], 'Lane, else Workflow name, is the swimlane');
    const [talk, spec, release] = board.tasks;
    assert.equal(talk.title, 'Team Discussion');
    assert.equal(talk.description, 'Agree on scope');
    assert.equal(talk.ref, '1234');
    assert.equal(talk.owner_username, 'tom');
    assert.deepEqual(talk.assignees, ['anna', 'ben']);
    assert.equal(talk.color, '#067db7');
    assert.deepEqual(talk.tags, ['meeting', 'q4 plan'], 'a comma splits tags');
    assert.deepEqual(spec.tags, ['spec', 'review'], 'without a comma, spaces split tags');
    assert.equal(talk.date_due, '2026-10-28T00:00:00.000Z', 'MM/DD/YYYY');
    assert.equal(spec.date_due, '2026-12-28T00:00:00.000Z', 'YYYY-MM-DD');
    assert.equal(release.date_due, '2026-12-31T00:00:00.000Z', 'an Excel date cell');
    assert.equal(talk.date_creation, '2026-10-01T00:00:00.000Z');
    assert.equal(talk.date_started, '2026-10-13T00:00:00.000Z', 'DD-MM-YYYY');
    assert.deepEqual(talk.comments, [{ text: 'Kick-off booked' }, { text: 'Room 2' }], 'Comment repeats');
    assert.deepEqual(talk.custom_fields, {
      'Card ID': 1234, 'Workflow name': 'Development', Priority: 'average', Size: 3, Type: 'Task', Track: 'Roadmap', Customer: 'ACME',
    });
    assert.equal(release.custom_fields.Customer, 42);
    assert.equal(spec.parent_ref, '1234', 'Children: makes subtasks');
    assert.deepEqual(talk.dependencies, undefined, 'the successor link is kept on the blocked card');
    assert.deepEqual(release.dependencies, [{ ref: '1234', type: 'is-blocked-by' }, { ref: '1235', type: 'related-to' }],
      'Successors on one card and Predecessors on the other are one dependency');
    const links = planImportedLinks(board.tasks);
    assert.deepEqual(links.parents, [{ index: 1, parent: 0 }]);
    assert.deepEqual(links.dependencies.map(d => d.index), [2]);
    assert.deepEqual(links.unsupported, []);
    assert.equal(planImportedCustomFields(board.tasks).fields.find(f => f.name === 'Size').type, 'number');
    assert.ok(board.unsupported.some(u => u.path === '/sheet/Links'), 'the Links tab is reported');
  });

  await test('the knowledge base example table, and the loss report', async () => {
    const board = parseBusinessmapSheets([{ name: 'Import', rows: [
      ['Title', 'Owner', 'Deadline', 'Priority', 'Column'],
      ['Team Discussion', 'Tom', '10/28/21', 'average', 'Requested'],
      ['System Requirements', 'Tom', '12/28/21', 'high', 'Requested'],
    ] }]);
    assert.equal(board.board.name, 'Import');
    assert.deepEqual(board.tasks.map(t => [t.title, t.owner_username, t.date_due, t.custom_fields.Priority, t.column_name]), [
      ['Team Discussion', 'Tom', '2021-10-28T00:00:00.000Z', 'average', 'Requested'],
      ['System Requirements', 'Tom', '2021-12-28T00:00:00.000Z', 'high', 'Requested'],
    ]);
    assert.deepEqual(board.unsupported, []);
  });

  await test('negative: bad values are reported, not guessed', async () => {
    const board = parseBusinessmapSheets([{ name: 'x', rows: [
      ['Notes from the team'],
      ['Card ID', 'Title', 'Deadline', 'Color', 'Size', 'Priority', 'Template', 'Board ID', 'Links', 'Archived at', 'Parent'],
      [1, 'A', '2040-01-01', 'blue', 'XL', 'urgent', 'Bug', 7, 'Parents: 2, 3; Cousins: 4; Children: 99', '2026-01-01', ''],
      [2, '', '13/13/2026', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', 'low', '', '', '', '', ''],
      [3, 'C', '', '', '', '', '', '', '', '', '2'],
    ] }]);
    const reasons = board.unsupported.map(u => `${u.path} ${u.reason}`).join('\n');
    assert.match(reasons, /\/row\/1 1 row\(s\) above the header/);
    assert.match(reasons, /Board ID names a Businessmap board/);
    assert.match(reasons, /\/row\/3\/Deadline Businessmap deadline "2040-01-01"/, 'past 2037');
    assert.match(reasons, /\/row\/4\/Deadline Businessmap deadline "13\/13\/2026"/);
    assert.match(reasons, /color "blue" is not a hex color/);
    assert.match(reasons, /size "XL" is not a number/);
    assert.match(reasons, /priority "urgent" is not low, average, high or critical; kept as written/);
    assert.match(reasons, /card template "Bug" is not imported/);
    assert.match(reasons, /link "Cousins: 4" is not Parents/);
    assert.match(reasons, /a further parent 3/);
    assert.match(reasons, /child card 99 is not part of this import/);
    assert.match(reasons, /archive date is not kept/);
    assert.match(reasons, /\/row\/4 a blank Title .* named "Card 2"/);
    assert.match(reasons, /\/row\/5 a Businessmap row without a Title or Card ID/);
    const [a, two, c] = board.tasks;
    assert.equal(board.tasks.length, 3);
    assert.equal(a.archived, true);
    assert.equal(a.parent_ref, '2');
    assert.equal(a.color, undefined);
    assert.equal(a.date_due, undefined);
    assert.equal(a.custom_fields.Priority, 'urgent');
    assert.equal(two.title, 'Card 2');
    assert.equal(c.parent_ref, '2');
    assert.equal(board.board.name, 'x');
    assert.equal(businessmapDate('1969-12-31', { deadline: true }), undefined);
    assert.equal(businessmapDate('2037-12-31', { deadline: true }), '2037-12-31T00:00:00.000Z');
    assert.equal(businessmapDate('02/30/2026'), undefined);
    assert.equal(businessmapDate('next week'), undefined);
    assert.deepEqual(businessmapTags('a b,c'), ['a b', 'c']);
    assert.deepEqual(businessmapLinks('parent: 5').parents, ['5']);
    assert.throws(() => parseBusinessmapSheets([]), /empty/);
    // A file from an account in another language: the headers are localized.
    assert.throws(() => parseBusinessmapSheets([{ name: 'x', rows: [['Titel', 'Spalte'], ['a', 'b']] }]),
      /no header row with Title or Card ID.*English/);
    await assert.rejects(readBusinessmapWorkbook(''), /empty/);
    await assert.rejects(readBusinessmapWorkbook(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]).toString('base64')), /\.xls file/);
    assert.throws(() => validateImportSourceShape('businessmap', 'text'), /Invalid businessmap/);
    assert.doesNotThrow(() => validateImportSourceShape('businessmap', { excelBase64: 'UEsDBA==' }));
  });

  await test('export writes the documented import columns, and it imports back', async () => {
    const built = formatters.businessmap({
      board: { title: 'Launch' },
      items: [
        { cardId: 'w1', title: 'Order valves', listTitle: 'In Progress', swimlaneTitle: 'Expedite', owner: 'alice', assignees: ['bob', 'carol'],
          dueAt: '2026-10-20T00:00:00.000Z', startAt: '2026-10-01T00:00:00.000Z', endAt: '2026-10-21T00:00:00.000Z', color: 'green',
          labels: ['urgent', 'a,b'], description: 'Two of them', comments: [{ text: 'Called them', author: 'alice' }],
          customFields: { 'Card ID': 501, Priority: 'High', Size: 2, Type: 'Task', Vendor: 'ACME', Picked: ['x', 'y'] } },
        { cardId: 'w2', title: 'Fit valves', listTitle: 'Requested', swimlaneTitle: 'Default', labels: ['high risk'], parentCardId: 'w1',
          color: '#ABCDEF', customFields: { 'Card ID': 502, Priority: 'Medium' } },
        { cardId: 'w3', title: 'Paint', listTitle: 'Requested', swimlaneTitle: 'Default', parentCardId: 'w1', customFields: { Priority: 'whenever' } },
      ],
    });
    assert.equal(built.sheets.length, 1);
    const [header, first, second, third] = built.sheets[0].rows;
    assert.deepEqual(header, ['Card ID', 'Title', 'Description', 'Column', 'Lane', 'Owner', 'Co-Owners', 'Priority', 'Color', 'Size', 'Tags',
      'Deadline', 'Start Date', 'End Date', 'Type', 'Parent', 'Comment', 'Vendor', 'Picked']);
    assert.ok(!header.includes('Workflow name') && !header.includes('Custom Card ID'), 'columns with no value are left out');
    const cell = (row, name) => row[header.indexOf(name)];
    assert.equal(cell(first, 'Color'), '#3CB500', 'a palette color is written as hex');
    assert.equal(cell(first, 'Priority'), 'high');
    assert.equal(cell(second, 'Priority'), 'average', 'Medium is average');
    assert.equal(cell(third, 'Priority'), '', 'a priority Businessmap does not have is left out');
    assert.equal(cell(second, 'Tags'), 'high risk,', 'a lone tag with a space is not split');
    assert.equal(cell(second, 'Parent'), 501, 'the parent by its Businessmap Card ID');
    assert.equal(cell(third, 'Parent'), 501);
    assert.equal(cell(third, 'Card ID'), '', 'a WeKan card has no Businessmap Card ID');
    assert.equal(cell(first, 'Picked'), 'x, y');
    const back = parseBusinessmapSheets(await readBusinessmapWorkbook((await writeBusinessmapWorkbook(built)).toString('base64')));
    assert.equal(back.board.name, 'Launch');
    assert.deepEqual(back.columns.map(c => c.title), ['In Progress', 'Requested']);
    assert.deepEqual(back.swimlanes.map(s => s.name), ['Expedite', 'Default']);
    const [order, fit, paint] = back.tasks;
    assert.equal(order.ref, '501');
    assert.equal(order.owner_username, 'alice');
    assert.deepEqual(order.assignees, ['bob', 'carol']);
    assert.equal(order.date_due, '2026-10-20T00:00:00.000Z');
    assert.equal(order.date_started, '2026-10-01T00:00:00.000Z');
    assert.equal(order.date_end, '2026-10-21T00:00:00.000Z');
    assert.equal(order.color, '#3cb500');
    assert.deepEqual(order.tags, ['urgent', 'a b']);
    assert.deepEqual(fit.tags, ['high risk']);
    assert.equal(fit.color, '#abcdef');
    assert.equal(order.description, 'Two of them');
    assert.deepEqual(order.comments, [{ text: 'alice: Called them' }]);
    assert.deepEqual(order.custom_fields, { 'Card ID': 501, Priority: 'high', Size: 2, Type: 'Task', Vendor: 'ACME', Picked: 'x, y' });
    assert.equal(fit.parent_ref, '501');
    assert.equal(paint.parent_ref, '501');
    assert.deepEqual(planImportedLinks(back.tasks).parents, [{ index: 1, parent: 0 }, { index: 2, parent: 0 }]);
    assert.deepEqual(back.unsupported, []);
  });

  await test('wired into import, export, the import page and the export menu', async () => {
    assert.equal(EXTERNAL_PARSERS.businessmap, parseBusinessmapSheets);
    assert.equal(formatters.businessmap, formatBusinessmapSheets);
    assert.match(read('models/import.js'), /case 'businessmap':[\s\S]*?readBusinessmapWorkbook\(importedBoard\.excelBase64\);\s*importedBoard = EXTERNAL_PARSERS\.businessmap\(importedBoard\);[\s\S]*?sanitizeImported\(importedBoard, 'businessmap', this\);\s*creator = new KanboardCreator\(data, 'businessmap'\);/);
    assert.match(read('server/lib/renderExternalExport.js'), /businessmap: \(\) => require\('\/server\/lib\/businessmapWorkbook'\)\.writeBusinessmapWorkbook,/);
    const page = read('client/components/import/import.js');
    assert.match(read('models/lib/importSources.js'), /\{ key: 'businessmap', name: 'Businessmap \(Kanbanize\)'[,}]/); // the one list of sources
    // The workbook sources share one branch; their order there is not the point.
    // The page reads every source through one path described in
    // models/lib/importSources.js, not a branch of its own.
    assert.match(read('models/lib/importSources.js'), /\{ key: 'businessmap', name: '[^']+', \.\.\.EXCEL/, 'read by the one import path');
    assert.match(read('client/components/boards/exportScope.js'), /key: 'businessmap'[^}]*path: 'export\/businessmap', ext: 'xlsx'/);
    // Its details are on its own page, which the coverage index links.
    const docPage = read('docs/Features/ImportExport/Businessmap/Businessmap.md');
    assert.match(docPage, /^## Format details$/m);
    assert.match(docPage, /100 cards per run/);
    assert.match(read('docs/Features/ImportExport/Format-Coverage.md'), /\]\(\.\/Businessmap\/Businessmap\.md\)/);
    // No URLs in the module's comments (the docs carry the sources).
    assert.doesNotMatch(read('models/lib/businessmapFormat.js'), /https?:\/\//);
    assert.doesNotMatch(read('server/lib/businessmapWorkbook.js'), /https?:\/\//);
  });

  console.log(`\nbusinessmapFormat: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
