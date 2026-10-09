'use strict';

// Notion's "Markdown & CSV" export: import of a database (its CSV, or the
// export .zip with the row pages) and export of the CSV Notion's own CSV
// import reads (models/lib/notionFormat.js, server/lib/notionArchive.js).
// Notion documents a CSV per full-page database and a Markdown file per page;
// the 32-hex id ending each file name, the _all.csv beside a view's CSV, the
// date and checkbox texts and the "# Title" / "Property: value" head of a row
// page are only observed by third-party converters. The fixtures below follow
// that observed layout; values are invented.
// Run: node tests/notionFormat.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { zipSync, strToU8 } = require('fflate');
const { readNotionImport, readNotionArchive, MAX_NOTION_ZIP_BYTES } = require('../server/lib/notionArchive');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const ID = '1a2b3c4d5e6f47a8b9c0d1e2f3a4b5c6';
const PID = '0f1e2d3c4b5a49687766554433221100';
const zip = (files, options) => Buffer.from(zipSync(Object.fromEntries(Object.entries(files)
  .map(([name, value]) => [name, typeof value === 'string' ? strToU8(value) : value])), options));

const VIEW_CSV = '﻿Name,Status,Assignee,Due,Tags,Done,Estimate,Related\r\n'
  + 'Write report,In progress,"Jane Doe, Bob Ray","October 8, 2026","docs, q4",No,3,\r\n';
const ALL_CSV = `${VIEW_CSV}Ship it,Done,,"October 1, 2026 → October 10, 2026",,Yes,5,"Write report (Tasks%20${ID}/Write%20report%20${PID}.md)"\r\n`;
const PAGE = `# Write report

Status: In progress
Assignee: Jane Doe, Bob Ray
Due: October 8, 2026
Tags: docs, q4
Done: No
Estimate: 3

Body text of the page.
- [ ] checklist item
`;
function exportZip(extra = {}) {
  return zip({
    [`Tasks ${ID}.csv`]: VIEW_CSV,
    [`Tasks ${ID}_all.csv`]: ALL_CSV,
    [`Tasks ${ID}/Write report ${PID}.md`]: PAGE,
    [`Tasks ${ID}/Ship it 99999999999999999999999999999999.md`]: '# Ship it\n\nStatus: Done\n\nSee ![chart](Ship%20it/chart.png)\n',
    [`Tasks ${ID}/Ship it/chart.png`]: new Uint8Array([137, 80, 78, 71]),
    [`Tasks ${ID}/Write report/Notes aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.md`]: '# Notes\n\nA subpage.\n',
    ...extra,
  });
}

async function main() {
  const { parseNotionExport, formatNotionCsv, notionDate, notionDateRange, stripNotionId, notionPageBody } =
    await import('../models/lib/notionFormat.js');
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');
  const { planImportedCustomFields } = await import('../models/lib/importedTaskPlan.js');
  let passed = 0;
  const test = async (name, fn) => { await fn(); passed += 1; console.log('  ok -', name); };
  const importZip = async buffer => parseNotionExport(await readNotionImport({ zipBase64: buffer.toString('base64') }));

  await test('names, dates, ranges and page heads are read as the export writes them', () => {
    assert.equal(stripNotionId(`Tasks ${ID}.csv`), 'Tasks');
    assert.equal(stripNotionId(`folder/Tasks ${ID}_all.csv`), 'Tasks');
    assert.equal(stripNotionId(`Write report ${PID}.md`), 'Write report');
    assert.equal(stripNotionId('Plain name.csv'), 'Plain name', 'no id: nothing removed');
    assert.equal(notionDate('October 8, 2026'), '2026-10-08T00:00:00.000Z');
    assert.equal(notionDate('Oct 8, 2026 3:04 PM'), '2026-10-08T15:04:00.000Z');
    assert.equal(notionDate('October 8, 2026 12:30 AM'), '2026-10-08T00:30:00.000Z');
    assert.equal(notionDate('October 8, 2026 3:00 PM (GMT+3)'), '2026-10-08T12:00:00.000Z');
    assert.equal(notionDate('2026-10-08'), '2026-10-08T00:00:00.000Z');
    assert.equal(notionDate('10/08/2026'), '2026-10-08T00:00:00.000Z', 'MM/DD/YYYY, what Notion\'s CSV import reads');
    assert.deepEqual(notionDateRange('October 1, 2026 → October 10, 2026'),
      { start: '2026-10-01T00:00:00.000Z', end: '2026-10-10T00:00:00.000Z' });
    assert.deepEqual(notionDateRange('October 1, 2026 3:00 PM → 5:00 PM'),
      { start: '2026-10-01T15:00:00.000Z', end: '2026-10-01T17:00:00.000Z' });
    const page = notionPageBody(PAGE, ['Name', 'Status', 'Assignee', 'Due', 'Tags', 'Done', 'Estimate']);
    assert.equal(page.heading, 'Write report');
    assert.equal(page.body, 'Body text of the page.\n- [ ] checklist item');
    // A body line that only looks like a property, but is not one, stays.
    assert.equal(notionPageBody('# T\n\nStatus: x\n\nNote: keep me', ['Status']).body, 'Note: keep me');
  });

  await test('a pasted database CSV: Status as lists, people, labels, dates, checkbox and number fields', () => {
    const board = EXTERNAL_PARSERS.notion(ALL_CSV);
    assert.equal(board.board.name, 'Imported Notion database');
    assert.deepEqual(board.columns.map(c => c.title), ['In progress', 'Done']);
    assert.deepEqual(board.swimlanes, [{ name: 'Default' }]);
    const [write, ship] = board.tasks;
    assert.equal(write.title, 'Write report');
    assert.equal(write.column_name, 'In progress');
    assert.equal(write.owner_username, 'Jane Doe');
    assert.deepEqual(write.assignees, ['Bob Ray']);
    assert.deepEqual(write.tags, ['docs', 'q4']);
    assert.equal(write.date_due, '2026-10-08T00:00:00.000Z');
    assert.deepEqual(write.custom_fields, { Done: false, Estimate: 3 });
    assert.equal(ship.date_started, '2026-10-01T00:00:00.000Z', 'a range is start and due');
    assert.equal(ship.date_due, '2026-10-10T00:00:00.000Z');
    assert.deepEqual(ship.custom_fields, { Done: true, Estimate: 5 });
    assert.ok(board.unsupported.some(u => /relation column "Related"/.test(u.reason)), 'relations are reported');
    assert.equal(write.description, undefined, 'a CSV alone has no page bodies');
    const fields = planImportedCustomFields(board.tasks).fields;
    assert.deepEqual(fields.map(f => [f.name, f.type]), [['Done', 'checkbox'], ['Estimate', 'number']]);
  });

  await test('without Status, the first select-like column is the list, and the choice is reported', () => {
    const board = parseNotionExport('Task name,Notes,Stage,Owner\nA,"long text, with a comma",Doing,ann\nB,,Doing,bob\nC,,Review,\n');
    assert.deepEqual(board.columns.map(c => c.title), ['Doing', 'Review']);
    assert.deepEqual(board.tasks.map(t => t.title), ['A', 'B', 'C']);
    assert.equal(board.tasks[0].description, 'long text, with a comma', 'Notes is the description');
    assert.equal(board.tasks[0].owner_username, 'ann');
    assert.ok(board.warnings.some(w => /no Status column; "Stage" looks like a select/.test(w.reason)));
    const none = parseNotionExport('Name,Body\nA,"one, two"\n');
    assert.deepEqual(none.columns.map(c => c.title), ['No Status']);
    assert.ok(none.warnings.some(w => /no select-like column/.test(w.reason)));
    // The title is the first column when none is called Name or Title.
    assert.equal(parseNotionExport('Thing,Status\nX,Open\n').tasks[0].title, 'X');
  });

  await test('the export .zip: _all.csv preferred, page bodies as descriptions, the rest reported', async () => {
    const board = await importZip(exportZip());
    assert.equal(board.board.name, 'Tasks', 'the database name without its id');
    assert.deepEqual(board.tasks.map(t => t.title), ['Write report', 'Ship it'], 'every row of _all.csv');
    assert.equal(board.tasks[0].description, 'Body text of the page.\n- [ ] checklist item');
    assert.equal(board.tasks[1].description, 'See ![chart](Ship%20it/chart.png)');
    const reasons = board.unsupported.map(u => u.reason).join('\n');
    assert.match(reasons, /1 view CSV\(s\) were left out for the _all\.csv/);
    assert.match(reasons, /1 image\(s\) or other file\(s\)/);
    assert.match(reasons, /1 nested subpage file\(s\)/);
    assert.match(reasons, /page of "Ship it" links to files or pages inside the export/);
    assert.match(reasons, /relation column "Related"/);
  });

  await test('the export .zip: several databases are swimlanes, flat folders and zip parts are read', async () => {
    const two = await importZip(zip({
      [`Tasks ${ID}.csv`]: 'Name,Status\nA,Open\n',
      [`Bugs ${PID}.csv`]: 'Name,Status\nB,Closed\n',
      [`Bugs ${PID}/B ${ID}.md`]: '# B\n\nStatus: Closed\n\nCrash on start.\n',
      [`Readme ${ID}.md`]: '# Readme\n\nNot a row.\n',
    }));
    assert.equal(two.board.name, 'Imported Notion database');
    assert.deepEqual(two.swimlanes.map(s => s.name).sort(), ['Bugs', 'Tasks']);
    assert.equal(two.tasks.find(t => t.title === 'B').description, 'Crash on start.');
    // Create folders for subpages off: the pages sit beside the CSV.
    const flat = await importZip(zip({
      [`Tasks ${ID}.csv`]: 'Name,Status\nA,Open\n',
      [`A ${PID}.md`]: '# A\n\nStatus: Open\n\nFlat body.\n',
    }));
    assert.equal(flat.tasks[0].description, 'Flat body.');
    // A workspace export that arrives as zip parts is opened one level down.
    const parts = await importZip(zip({ 'Export-1-Part-1.zip': exportZip() }));
    assert.deepEqual(parts.tasks.map(t => t.title), ['Write report', 'Ship it']);
  });

  await test('negative: what is not a Notion export is refused', async () => {
    assert.throws(() => validateImportSourceShape('notion', '  '), /Invalid notion/);
    assert.throws(() => validateImportSourceShape('notion', { zipBase64: '' }), /Invalid notion/);
    assert.throws(() => validateImportSourceShape('notion', { excelBase64: 'x' }), /Invalid notion/);
    assert.throws(() => parseNotionExport(''), /empty/);
    assert.throws(() => parseNotionExport({ databases: [] }), /no database CSV/);
    assert.throws(() => parseNotionExport({ pages: [] }), /database CSV or the Markdown & CSV export/);
    assert.throws(() => parseNotionExport('Name,Status\n"unclosed,Open\n'), /unclosed quote/);
    await assert.rejects(readNotionImport({}), /empty/);
    await assert.rejects(readNotionImport({ zipBase64: Buffer.from('not a zip at all').toString('base64') }), /not a \.zip/);
    await assert.rejects(readNotionArchive(Buffer.concat([Buffer.from([0x50, 0x4b, 3, 4]), Buffer.alloc(64, 7)])), /not a readable \.zip|no database CSV/);
    await assert.rejects(importZip(zip({ 'page.md': '# Only a page\n' })), /no database CSV/);
    await assert.rejects(importZip(zip({ 'a.zip': zip({ 'b.zip': zip({ 'c.csv': 'Name\nx\n' }) }) })), /no database CSV/,
      'zip parts are opened one level down, no deeper');
    const untitled = parseNotionExport('Name,Status\n,Open\nok,Open\n');
    assert.equal(untitled.tasks.length, 1);
    assert.ok(untitled.unsupported.some(u => /without a title/.test(u.reason)));
    const reserved = parseNotionExport('Name,__proto__,constructor\nx,a,b\n');
    assert.equal(reserved.tasks[0].custom_fields, undefined, 'reserved names never become fields');
    assert.equal(Object.getPrototypeOf(reserved.tasks[0]), Object.prototype);
    assert.equal(reserved.unsupported.filter(u => /reserved/.test(u.reason)).length, 2);
    assert.equal(notionDate('Smarch 8, 2026'), undefined);
    assert.equal(notionDate('February 30, 2026'), undefined);
    assert.equal(notionDate('October 8, 2026 13:00 PM'), undefined);
    assert.equal(notionDateRange('October 8, 2026 → whenever'), undefined);
    // A column with one date and one non-date is text, not a date.
    assert.deepEqual(parseNotionExport('Name,Status,When\na,x,"October 8, 2026"\nb,x,soon\n').tasks[1].custom_fields, { When: 'soon' });
  });

  await test('negative: oversized uploads, inflating entries and too many files are refused', async () => {
    await assert.rejects(readNotionArchive(Buffer.alloc(MAX_NOTION_ZIP_BYTES + 1)), /larger than/);
    await assert.rejects(readNotionImport({ zipBase64: 'A'.repeat(Math.ceil(MAX_NOTION_ZIP_BYTES / 3) * 4 + 8) }), /larger than/);
    // 40 MB of zeros deflates to a few dozen KB: a small upload, a large inflate.
    const bomb = zip({ 'Tasks.csv': new Uint8Array(40 * 1024 * 1024) }, { level: 9 });
    assert.ok(bomb.length < 1024 * 1024, 'a small archive');
    await assert.rejects(readNotionArchive(bomb), /too large/);
    // The same inside a zip part counts against the same budget.
    await assert.rejects(readNotionArchive(zip({ 'part.zip': bomb })), /too large/);
    const many = { 'Tasks.csv': 'Name\nx\n' };
    for (let i = 0; i < 20001; i += 1) many[`f/${i}.png`] = 'x';
    await assert.rejects(readNotionArchive(zip(many, { level: 0 })), /more than 20000 files/);
    const src = read('server/lib/notionArchive.js');
    assert.match(src, /readZipEntryBounded\(entry, max, budget\)/);
    assert.match(src, /require\('\.\/boundedZipEntry'\)/, 'the shared guarded zip helpers, not new ones');
    assert.doesNotMatch(src, /createWriteStream|writeFile|path\.join|entry\.buffer\(\)|entry\.vars/);
  });

  await test('export writes the CSV Notion\'s CSV import reads, and it imports back', () => {
    const collected = {
      board: { _id: 'b1', title: 'Launch' },
      lists: [{ title: 'To do' }, { title: 'Done' }],
      swimlanes: [{ title: 'Default' }],
      items: [
        { cardId: 'c1', title: 'Order valves', listTitle: 'To do', swimlaneTitle: 'Default', description: 'Two of them\n"DN50", fast',
          owner: 'alice', assignees: ['bob'], startAt: '2026-10-02T00:00:00.000Z', dueAt: '2026-10-20T00:00:00.000Z',
          labels: ['Purchasing', 'Urgent'], customFields: { Approved: true, Cost: 120, Vendor: 'ACME' } },
        { cardId: 'c2', title: 'Ship it', listTitle: 'Done', swimlaneTitle: 'Default', customFields: { Approved: false } },
      ],
    };
    const csv = formatters.notion(collected);
    const lines = csv.split('\r\n');
    assert.equal(lines[0], 'Name,Status,Assignee,Tags,Start,Due,Description,Approved,Cost,Vendor');
    assert.equal(lines[1], 'Order valves,To do,"alice, bob","Purchasing, Urgent",10/02/2026,10/20/2026,"Two of them\n""DN50"", fast",Yes,120,ACME');
    assert.equal(lines[2], 'Ship it,Done,,,,,,No,,');
    const back = parseNotionExport(csv);
    assert.deepEqual(back.columns.map(c => c.title), ['To do', 'Done']);
    const [first, second] = back.tasks;
    assert.equal(first.title, 'Order valves');
    assert.equal(first.owner_username, 'alice');
    assert.deepEqual(first.assignees, ['bob']);
    assert.deepEqual(first.tags, ['Purchasing', 'Urgent']);
    assert.equal(first.date_started, '2026-10-02T00:00:00.000Z');
    assert.equal(first.date_due, '2026-10-20T00:00:00.000Z');
    assert.equal(first.description, 'Two of them\n"DN50", fast');
    assert.deepEqual(first.custom_fields, { Approved: true, Cost: 120, Vendor: 'ACME' });
    assert.deepEqual(second.custom_fields, { Approved: false });
    assert.deepEqual(back.warnings, []);
    // Several swimlanes: a Swimlane column, which comes back as swimlanes.
    const lanes = formatNotionCsv({ items: [
      { title: 'a', listTitle: 'L', swimlaneTitle: 'Web' }, { title: 'b', listTitle: 'L', swimlaneTitle: 'Mail' }] });
    assert.match(lanes, /^Name,Status,Assignee,Tags,Start,Due,Description,Swimlane\r\n/);
    assert.deepEqual(parseNotionExport(lanes).swimlanes.map(s => s.name), ['Web', 'Mail']);
  });

  await test('the format is wired into import, export, the import page and the export menu', () => {
    assert.equal(EXTERNAL_PARSERS.notion, parseNotionExport);
    assert.equal(formatters.notion, formatNotionCsv);
    const imp = read('models/import.js');
    assert.match(imp, /importSource === 'vikunja'(?: \|\| importSource === '[a-z]+')* \|\| importSource === 'notion'(?: \|\| importSource === '[a-z]+')* \? board/);
    assert.match(imp, /case 'notion':[\s\S]*?check\(board, Match\.OneOf\(Object, String\)\);[\s\S]*?readNotionImport\(importedBoard\);\s*importedBoard = EXTERNAL_PARSERS\.notion\(importedBoard\);[\s\S]*?sanitizeImported\(importedBoard, 'notion', this\);\s*creator = new KanboardCreator\(data, 'notion'\);/);
    assert.match(read('server/lib/renderExternalExport.js'), /notion: 'text\/csv'/);
    const page = read('client/components/import/import.js');
    assert.match(read('models/lib/importSources.js'), /\{ key: 'notion', name: 'Notion'[,}]/); // the one list of sources
    // The page reads every source through one path described in
    // models/lib/importSources.js, not a branch of its own.
    assert.match(read('models/lib/importSources.js'), /\{ key: 'notion', name: '[^']+', \.\.\.TEXT, files: \[[^\]]*'\.zip'[^\]]*\], zipSend: 'zip' \}/, 'one export .zip, read by the one import path');
    assert.match(read('client/components/import/import.jade'), /input\.js-import-file\(id='import-file' type="file" accept="\{\{importAccept\}\}"\)/, 'the one file chooser');
    assert.match(read('client/components/boards/exportScope.js'),
      /\{ key: 'notion', icon: 'fa-table', label: 'Notion', path: 'export\/notion', ext: 'csv', scopes: BOARD_ONLY \}/);
    // Its details are on its own page, which the coverage index links.
    const docPage = read('docs/Features/ImportExport/Notion/Notion.md');
    assert.match(docPage, /^## Format details$/m);
    assert.match(read('docs/Features/ImportExport/Format-Coverage.md'), /\]\(\.\/Notion\/Notion\.md\)/);
    // No web addresses in the code comments of this format.
    for (const file of ['models/lib/notionFormat.js', 'server/lib/notionArchive.js']) {
      assert.doesNotMatch(read(file), /https?:\/\/[a-z]/i, file);
    }
  });

  console.log(`\nnotionFormat: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
