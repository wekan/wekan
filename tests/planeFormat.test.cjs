'use strict';

// Plane's issue export (Workspace Settings > Exports): import only
// (models/lib/planeFormat.js, server/lib/planeArchive.js). Plane's Community
// Edition has no import for this export, so WeKan writes none.
//
// The fixtures are built the way Plane builds the export, from its source:
// - the fields and values of IssueExportSerializer
//   (apps/api/plane/utils/porters/serializers/issue.py);
// - JSONFormatter, CSVFormatter (prettified headers, lists as json.dumps
//   text, csv.writer with minimal quoting and \r\n) and XLSXFormatter (lists
//   joined with ", ", their items as Python str()) from
//   apps/api/plane/utils/porters/formatters.py, with the ' formula guard of
//   apps/api/plane/utils/csv_utils.py;
// - the zip of export_task.py: <slug>-<projectId>.<ext> per project, or one
//   <slug>-<workspaceId>.<ext>.
// Run: node tests/planeFormat.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { zipSync, strToU8 } = require('fflate');
const ExcelJS = require('@wekanteam/exceljs');
const { readPlaneImport, readPlaneArchive, readPlaneWorkbook, MAX_PLANE_ZIP_BYTES } = require('../server/lib/planeArchive');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

const FIELDS = ['project_name', 'project_identifier', 'parent', 'identifier', 'sequence_id', 'name', 'state_name',
  'priority', 'assignees', 'subscribers', 'created_by_name', 'start_date', 'target_date', 'completed_at', 'created_at',
  'updated_at', 'archived_at', 'estimate', 'labels', 'cycles', 'modules', 'links', 'relations', 'comments',
  'sub_issues_count', 'link_count', 'attachment_count', 'is_draft'];

// One issue as IssueExportSerializer returns it (DRF: dates as text, the
// *_at fields ISO 8601, a missing one null, estimate "" when unset).
function issue(fields) {
  return {
    project_name: 'Website', project_identifier: 'WEB', parent: '', identifier: '', sequence_id: 0, name: '',
    state_name: 'Backlog', priority: 'none', assignees: [], subscribers: [], created_by_name: 'Jane Doe',
    start_date: null, target_date: null, completed_at: null, created_at: '2026-09-27T14:03:00.123456Z',
    updated_at: '2026-10-01T09:15:00.000000Z', archived_at: null, estimate: '', labels: [], cycles: [], modules: [],
    links: [], relations: [], comments: [], sub_issues_count: 0, link_count: 0, attachment_count: 0, is_draft: false,
    ...fields,
  };
}

function websiteIssues() {
  return [
    issue({
      identifier: 'WEB-41', sequence_id: 41, name: 'Fix the API', state_name: 'Todo', priority: 'urgent',
      assignees: ['Mary Major'], relations: [{ type: 'blocked_by', issue: 'WEB-42', direction: 'incoming' }],
    }),
    issue({
      identifier: 'WEB-42', sequence_id: 42, name: 'Login button misaligned', state_name: 'In Progress', priority: 'high',
      assignees: ['John Smith', 'Mary Major'], subscribers: ['Jane Doe'], start_date: '2026-09-28',
      target_date: '2026-10-05', estimate: '3', labels: ['Bug', 'UI'], cycles: ['Sprint 7'], modules: ['Auth', 'Web'],
      links: [{ url: 'https://example.com/spec', title: 'Spec' }, { url: 'ftp://example.com/x', title: 'ftp' }],
      relations: [
        { type: 'blocked_by', issue: 'WEB-41', direction: 'outgoing' },
        { type: 'relates_to', issue: 'WEB-43', direction: 'outgoing' },
        { type: 'start_before', issue: 'WEB-43', direction: 'outgoing' },
      ],
      comments: [{ comment: 'Started', created_by: 'John Smith', created_at: '2026-09-28 08:00:00' }],
      link_count: 2, attachment_count: 2,
    }),
    issue({
      parent: 'WEB-42', identifier: 'WEB-43', sequence_id: 43, name: '-1px offset', state_name: 'Done', priority: 'low',
      completed_at: '2026-10-02T10:00:00Z', archived_at: '2026-10-03T10:00:00Z', estimate: 'XS', is_draft: true,
      relations: [{ type: 'relates_to', issue: 'WEB-42', direction: 'incoming' }, { type: 'start_before', issue: 'WEB-42', direction: 'incoming' }],
    }),
  ];
}

// Python's json.dumps: ", " and ": " separators, non-ASCII escaped.
function pyDumps(value) {
  if (Array.isArray(value)) return `[${value.map(pyDumps).join(', ')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).map(([k, v]) => `${pyDumps(k)}: ${pyDumps(v)}`).join(', ')}}`;
  if (typeof value === 'string') return JSON.stringify(value).replace(/[\u007f-￿]/g, ch => `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`);
  if (value === null) return 'null';
  return JSON.stringify(value);
}
// Python's str() of a value inside a list, as XLSXFormatter joins it.
function pyStr(value) {
  if (value && typeof value === 'object') return `{${Object.entries(value).map(([k, v]) => `'${k}': '${v}'`).join(', ')}}`;
  return String(value);
}
const prettify = key => key.replace(/_/g, ' ').replace(/\b\w+/g, word => word[0].toUpperCase() + word.slice(1).toLowerCase());
const guard = value => (typeof value === 'string' && /^[=+\-@\t\r\n]/.test(value) ? `'${value}` : value);
const pyCell = value => (value === null || value === undefined ? '' : value === true ? 'True' : value === false ? 'False' : String(value));
// csv.writer's QUOTE_MINIMAL.
const csvField = text => (/[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text);

function planeCsv(issues) {
  const rows = [FIELDS.map(prettify).map(guard)];
  for (const row of issues) {
    rows.push(FIELDS.map(key => guard(Array.isArray(row[key]) ? pyDumps(row[key]) : row[key])).map(pyCell));
  }
  return rows.map(cells => cells.map(csvField).join(',')).join('\r\n') + '\r\n';
}

async function planeXlsx(issues) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sheet');
  sheet.addRow(FIELDS.map(prettify));
  for (const row of issues) {
    sheet.addRow(FIELDS.map(key => {
      const value = row[key];
      if (value === null || value === undefined) return '';
      if (Array.isArray(value)) return guard(value.map(pyStr).join(', '));
      return guard(value);
    }));
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

const zip = (files, options) => Buffer.from(zipSync(Object.fromEntries(Object.entries(files)
  .map(([name, value]) => [name, typeof value === 'string' ? strToU8(value) : value])), options));
const jsonText = issues => JSON.stringify(issues, null, 2);

async function main() {
  const { parsePlaneExport, planeDate, PLANE_FIELDS } = await import('../models/lib/planeFormat.js');
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');
  const { planImportedTask, planImportedLinks, planImportedCustomFields, planImportedLabels } = await import('../models/lib/importedTaskPlan.js');
  const { sanitizeTransferValue } = await import('../models/lib/importExportBoundary.js');
  let passed = 0;
  const test = async (name, fn) => { await fn(); passed += 1; console.log('  ok -', name); };
  const reasons = board => board.unsupported.map(u => `${u.path}: ${u.reason}`).join('\n');

  await test('the field list is the serializer\'s, in its order', () => {
    assert.deepEqual(PLANE_FIELDS, FIELDS);
  });

  await test('a JSON export maps states, issues, people, dates, labels, fields, links, comments, parent and relations', () => {
    const board = parsePlaneExport(jsonText(websiteIssues()));
    assert.equal(board.board.name, 'Website', 'one project names the board');
    assert.deepEqual(board.swimlanes, [{ name: 'Default' }]);
    assert.deepEqual(board.columns.map(c => c.title), ['Todo', 'In Progress', 'Done'], 'states in order of appearance');
    const login = board.tasks.find(t => t.ref === 'WEB-42');
    assert.equal(login.title, 'Login button misaligned');
    assert.equal(login.column_name, 'In Progress');
    assert.equal(login.swimlane_name, 'Default');
    assert.equal(login.owner_username, 'John Smith');
    assert.deepEqual(login.assignees, ['Mary Major']);
    assert.deepEqual(login.watchers, ['Jane Doe']);
    assert.equal(login.requested_by, 'Jane Doe');
    assert.deepEqual(login.tags, ['Bug', 'UI']);
    assert.equal(login.date_started, '2026-09-28T00:00:00.000Z');
    assert.equal(login.date_due, '2026-10-05T00:00:00.000Z');
    assert.equal(login.date_creation, '2026-09-27T14:03:00.123Z');
    assert.deepEqual(login.custom_fields, { Priority: 'High', Estimate: 3, Cycle: 'Sprint 7', Module: 'Auth, Web' });
    assert.equal(login.description, 'Links:\n- [Spec](https://example.com/spec)');
    assert.deepEqual(login.comments, [{ text: 'Started', author: 'John Smith', date: '2026-09-28T08:00:00.000Z' }]);
    assert.deepEqual(login.dependencies, [{ ref: 'WEB-43', type: 'related-to' }]);
    assert.equal(login.archived, undefined);
    const api = board.tasks.find(t => t.ref === 'WEB-41');
    // Plane stores "WEB-42 blocked_by WEB-41" and lists it on both issues; the
    // first issue read keeps it, from its own side, and the second skips it.
    assert.deepEqual(api.dependencies, [{ ref: 'WEB-42', type: 'blocks' }]);
    assert.deepEqual(api.custom_fields, { Priority: 'Urgent' });
    const offset = board.tasks.find(t => t.ref === 'WEB-43');
    assert.equal(offset.title, '-1px offset');
    assert.equal(offset.parent_ref, 'WEB-42');
    assert.equal(offset.archived, true);
    assert.equal(offset.date_end, '2026-10-02T10:00:00.000Z');
    assert.deepEqual(offset.custom_fields, { Priority: 'Low', Estimate: 'XS' }, 'a non-numeric estimate stays text');
    assert.equal(offset.dependencies, undefined, 'relates_to listed on both sides is kept once');
    const lost = reasons(board);
    assert.match(lost, /\/description: Plane's export does not include issue descriptions/);
    assert.match(lost, /2 attachment\(s\) are not in Plane's export/);
    assert.match(lost, /"start_before" relations have no WeKan dependency type/);
    assert.match(lost, /ftp:\/\/example\.com\/x" is not an http\(s\) or mailto link/);
    assert.match(lost, /a Plane draft issue is imported as an ordinary card/);
    assert.match(lost, /updated_at has no WeKan place/);
    assert.doesNotMatch(lost, /sequence_id|sub_issues_count|link_count/, 'derived fields are not reported');
  });

  await test('the parsed board plans into cards, labels, custom fields and links', () => {
    const board = parsePlaneExport(websiteIssues());
    const links = planImportedLinks(board.tasks);
    assert.deepEqual(links.unsupported, []);
    const index = ref => board.tasks.findIndex(t => t.ref === ref);
    assert.deepEqual(links.parents, [{ index: index('WEB-43'), parent: index('WEB-42') }]);
    assert.deepEqual(links.dependencies.find(d => d.index === index('WEB-41')).deps,
      [{ target: index('WEB-42'), type: 'blocks' }]);
    assert.deepEqual(links.dependencies.find(d => d.index === index('WEB-42')).deps,
      [{ target: index('WEB-43'), type: 'related-to' }]);
    // Read in the other order, the same relation is kept from WEB-42's side.
    const reversed = parsePlaneExport(websiteIssues().reverse());
    assert.deepEqual(reversed.tasks.find(t => t.ref === 'WEB-42').dependencies, [{ ref: 'WEB-41', type: 'is-blocked-by' }]);
    assert.equal(reversed.tasks.find(t => t.ref === 'WEB-41').dependencies, undefined);
    assert.deepEqual(reversed.tasks.find(t => t.ref === 'WEB-43').dependencies, [{ ref: 'WEB-42', type: 'related-to' }]);
    const fields = planImportedCustomFields(board.tasks).fields;
    assert.deepEqual(fields.map(f => [f.name, f.type]),
      [['Priority', 'text'], ['Estimate', 'text'], ['Cycle', 'text'], ['Module', 'text']]);
    assert.deepEqual(planImportedLabels(board.tasks).map(l => l.name), ['Bug', 'UI']);
    const planned = planImportedTask(board.tasks[index('WEB-42')], { members: { 'John Smith': 'u1' } });
    assert.deepEqual(planned.memberIds, ['u1']);
    assert.equal(planned.comments[0].userId, 'u1');
    assert.equal(planned.card.dueAt.toISOString(), '2026-10-05T00:00:00.000Z');
  });

  await test('the CSV export reads exactly as the JSON export does', () => {
    const csv = planeCsv(websiteIssues());
    assert.match(csv, /^Project Name,Project Identifier,Parent,Identifier,Sequence Id,Name,State Name,Priority,Assignees,/);
    assert.match(csv, /,'-1px offset,/, 'the fixture carries Plane\'s formula guard');
    assert.match(csv, /"\[""Bug"", ""UI""\]"/, 'and lists as JSON text');
    const fromCsv = parsePlaneExport(csv);
    const fromJson = parsePlaneExport(websiteIssues());
    assert.deepEqual(fromCsv.tasks, fromJson.tasks);
    assert.deepEqual(fromCsv.columns, fromJson.columns);
    assert.deepEqual(fromCsv.board, fromJson.board);
  });

  await test('several projects become swimlanes; a shared project name is told apart by its identifier', () => {
    const issues = [
      issue({ identifier: 'WEB-1', sequence_id: 1, name: 'A' }),
      issue({ project_name: 'Mobile', project_identifier: 'MOB', identifier: 'MOB-1', sequence_id: 1, name: 'B', state_name: 'Todo' }),
      issue({ project_name: 'Mobile', project_identifier: 'MOB2', identifier: '', sequence_id: 7, name: 'C' }),
    ];
    const board = parsePlaneExport(issues);
    assert.equal(board.board.name, 'Imported Plane issues');
    assert.deepEqual(board.swimlanes.map(s => s.name), ['Website', 'Mobile (MOB)', 'Mobile (MOB2)']);
    assert.deepEqual(board.tasks.map(t => t.swimlane_name), ['Website', 'Mobile (MOB)', 'Mobile (MOB2)']);
    assert.equal(board.tasks[2].ref, 'MOB2-7', 'the identifier is rebuilt from project_identifier and sequence_id');
  });

  await test('the export .zip is read: one file per project, JSON, CSV or XLSX', async () => {
    const [a, b, c] = websiteIssues();
    const perProject = zip({ 'acme-p1.json': jsonText([a, b]), 'acme-p2.json': jsonText([c]) });
    const board = parsePlaneExport(await readPlaneImport({ zipBase64: perProject.toString('base64') }));
    assert.deepEqual(board.tasks.map(t => t.ref), ['WEB-41', 'WEB-42', 'WEB-43']);
    const csvZip = zip({ 'acme-ws.csv': planeCsv(websiteIssues()) });
    assert.deepEqual(parsePlaneExport(await readPlaneImport({ zipBase64: csvZip.toString('base64') })).tasks,
      parsePlaneExport(websiteIssues()).tasks);
    const xlsxZip = zip({ 'acme-ws.xlsx': await planeXlsx(websiteIssues()) });
    const fromXlsx = parsePlaneExport(await readPlaneImport({ zipBase64: xlsxZip.toString('base64') }));
    const login = fromXlsx.tasks.find(t => t.ref === 'WEB-42');
    assert.equal(login.title, 'Login button misaligned');
    assert.deepEqual(login.tags, ['Bug', 'UI']);
    assert.equal(login.owner_username, 'John Smith');
    assert.deepEqual(login.custom_fields, { Priority: 'High', Estimate: 3, Cycle: 'Sprint 7', Module: 'Auth, Web' });
    assert.equal(fromXlsx.tasks.find(t => t.ref === 'WEB-43').title, '-1px offset', 'the formula guard is removed');
    assert.equal(login.dependencies, undefined);
    assert.match(reasons(fromXlsx), /XLSX export writes links as Python text, not JSON/);
    assert.match(reasons(fromXlsx), /XLSX export writes comments as Python text/);
  });

  await test('an .xlsx from the zip can be uploaded on its own', async () => {
    const xlsx = await planeXlsx(websiteIssues());
    const board = parsePlaneExport(await readPlaneImport({ xlsxBase64: xlsx.toString('base64') }));
    assert.equal(board.tasks.length, 3);
    assert.equal((await readPlaneWorkbook(xlsx))[0][0], 'Project Name');
  });

  await test('pasted text is passed through, and shape validation accepts the three inputs', async () => {
    assert.equal(await readPlaneImport('[]'), '[]');
    for (const value of [{ zipBase64: 'UEsDBA==' }, { xlsxBase64: 'UEsDBA==' }, '[{"name":"x"}]', 'Name,State Name\r\nx,Todo']) {
      assert.doesNotThrow(() => validateImportSourceShape('plane', value));
    }
    for (const value of [{ zipBase64: '' }, { xlsxBase64: 42 }, '   ', {}, []]) {
      assert.throws(() => validateImportSourceShape('plane', value), /Invalid plane/);
    }
  });

  await test('broken and hostile uploads are refused', async () => {
    await assert.rejects(readPlaneImport({}), /empty/);
    await assert.rejects(readPlaneImport({ zipBase64: Buffer.from('not a zip at all').toString('base64') }), /not a \.zip/);
    await assert.rejects(readPlaneArchive(Buffer.concat([Buffer.from([0x50, 0x4b, 3, 4]), Buffer.alloc(64, 7)])), /not a readable \.zip|no \.json/);
    await assert.rejects(readPlaneImport({ zipBase64: zip({ 'readme.txt': 'hi' }).toString('base64') }), /no \.json, \.csv or \.xlsx/);
    await assert.rejects(readPlaneImport({ zipBase64: zip({ '__MACOSX/._a.json': 'x', '.hidden.csv': 'x' }).toString('base64') }),
      /no \.json, \.csv or \.xlsx/, 'metadata files are not export files');
    const xlsx = await planeXlsx(websiteIssues());
    await assert.rejects(readPlaneImport({ zipBase64: xlsx.toString('base64') }), /is an \.xlsx workbook/);
    await assert.rejects(readPlaneImport({ xlsxBase64: Buffer.from('nope').toString('base64') }), /not an \.xlsx/);
    await assert.rejects(readPlaneImport({ xlsxBase64: zip({ 'a.txt': 'x' }).toString('base64') }), /not a readable \.xlsx|has no sheet/);
    await assert.rejects(readPlaneArchive(Buffer.alloc(MAX_PLANE_ZIP_BYTES + 1)), /larger than/);
    await assert.rejects(readPlaneImport({ zipBase64: 'A'.repeat(Math.ceil(MAX_PLANE_ZIP_BYTES / 3) * 4 + 8) }), /larger than/);
    // ZipBombBleed: 70 MB of zeros compress to a few kilobytes.
    const bomb = zip({ 'acme.json': new Uint8Array(70 * 1024 * 1024) }, { level: 9 });
    assert.ok(bomb.length < 1024 * 1024);
    await assert.rejects(readPlaneArchive(bomb), /too large/);
    const many = {};
    for (let i = 0; i < 1001; i++) many[`p${i}.json`] = '[]';
    await assert.rejects(readPlaneArchive(zip(many, { level: 0 })), /more than 1000 files/);
  });

  await test('malformed export content is refused or reported, never guessed', () => {
    assert.throws(() => parsePlaneExport(''), /empty/);
    assert.throws(() => parsePlaneExport('[not json'), /not valid JSON/);
    assert.throws(() => parsePlaneExport({ files: [{ name: 'a.json', format: 'json', content: '{"name":"x"}' }] }), /not a list of issues/);
    assert.throws(() => parsePlaneExport('[]'), /no issues/);
    assert.throws(() => parsePlaneExport('Title,Status\r\nx,Todo\r\n'), /needs the Name and State Name columns/);
    assert.throws(() => parsePlaneExport({ files: [] }), /no \.json, \.csv or \.xlsx/);
    assert.throws(() => parsePlaneExport({ files: [{ name: 'a.pdf', format: 'pdf' }] }), /not JSON, CSV or XLSX/);
    assert.throws(() => parsePlaneExport(42), /not a JSON list/);
    assert.throws(() => parsePlaneExport(new Array(20001).fill(issue({ name: 'x' }))), /more than 20000 issues/);
    const board = parsePlaneExport([
      issue({ name: '' }),
      'not an object',
      issue({ name: 'Odd', priority: 'critical', start_date: '05/10/2026', relations: [{ type: 'implemented_by', issue: 'WEB-1', direction: 'outgoing' }], description_html: '<p>x</p>' }),
    ]);
    assert.equal(board.tasks.length, 1);
    const lost = reasons(board);
    assert.match(lost, /without a name is not imported/);
    assert.match(lost, /not an object is not imported/);
    assert.match(lost, /priority "critical" is not one of urgent, high, medium, low or none/);
    assert.match(lost, /date "05\/10\/2026" is not an ISO 8601 date/);
    assert.match(lost, /"implemented_by" relations have no WeKan dependency type/);
    assert.match(lost, /field "description_html" has no WeKan place/, 'an unknown field is reported, not invented');
    assert.equal(board.tasks[0].custom_fields, undefined);
    const badList = parsePlaneExport('Name,State Name,Labels\r\nx,Todo,[broken\r\n');
    assert.match(reasons(badList), /labels "\[broken" is not a JSON list/);
    assert.deepEqual(badList.tasks[0].tags, []);
  });

  await test('dates follow DRF\'s and the comment format, and nothing else', () => {
    assert.equal(planeDate('2026-02-28'), '2026-02-28T00:00:00.000Z');
    assert.equal(planeDate('2026-02-30'), undefined);
    assert.equal(planeDate('2026-09-27T14:03:00.123456Z'), '2026-09-27T14:03:00.123Z');
    assert.equal(planeDate('2026-09-27T14:03:00+02:00'), '2026-09-27T12:03:00.000Z');
    assert.equal(planeDate('2026-09-28 08:00:00'), '2026-09-28T08:00:00.000Z');
    assert.equal(planeDate('yesterday'), undefined);
    assert.equal(planeDate(null), undefined);
  });

  await test('markup in an issue name survives parsing and is left to the import boundary', () => {
    const board = parsePlaneExport([issue({ name: 'Hi <img src=x onerror=alert(1)>', identifier: 'WEB-9' })]);
    assert.equal(board.tasks[0].title, 'Hi <img src=x onerror=alert(1)>');
    // A stand-in for the server sanitizer, repeated to a fixed point
    // (tests/tagStrippingFixedPoint.test.cjs).
    const stripTags = value => {
      let s = value, prev;
      do {
        prev = s;
        s = s.replace(/<[^>]*>/g, '');
      } while (s !== prev);
      return s;
    };
    const clean = sanitizeTransferValue(board, { direction: 'import', sanitizeHtml: stripTags });
    assert.equal(clean.value.tasks[0].title, 'Hi ');
  });

  await test('the format is wired into import and the import page, and has no export', () => {
    assert.equal(EXTERNAL_PARSERS.plane, parsePlaneExport);
    assert.equal(formatters.plane, undefined, 'Plane CE cannot import its own export, so WeKan writes none');
    const imp = read('models/import.js');
    assert.match(imp, /importSource === 'vikunja'(?: \|\| importSource === '[a-z]+')* \|\| importSource === 'plane'(?: \|\| importSource === '[a-z]+')* \? board\s*: sanitizeImported\(board, importSource, this\)/);
    assert.match(imp, /case 'plane':[\s\S]*?check\(board, Match\.OneOf\(Object, String\)\);[\s\S]*?if \(!Meteor\.isServer\) return undefined;[\s\S]*?readPlaneImport\(importedBoard\);\s*importedBoard = EXTERNAL_PARSERS\.plane\(importedBoard\);[\s\S]*?sanitizeImported\(importedBoard, 'plane', this\);\s*creator = new KanboardCreator\(data, 'plane'\);/);
    const page = read('client/components/import/import.js');
    assert.match(read('models/lib/importSources.js'), /\{ key: 'plane', name: 'Plane'[,}]/); // the one list of sources
    // The page reads every source through one path described in
    // models/lib/importSources.js, not a branch of its own.
    assert.match(read('models/lib/importSources.js'), /\{ key: 'plane', name: '[^']+', \.\.\.TEXT, files: \[[^\]]*'\.zip'[^\]]*\], zipSend: 'zip' \}/, 'one export .zip, read by the one import path');
    assert.match(read('client/components/import/import.jade'), /input\.js-import-file\(id='import-file' type="file" accept="\{\{importAccept\}\}"\)/, 'the one file chooser');
    assert.doesNotMatch(read('client/components/boards/exportScope.js'), /key: 'plane'/);
    assert.doesNotMatch(read('models/export.js') + read('server/lib/renderExternalExport.js'), /'plane'/);
    assert.match(read('README.md'), /Super Productivity, Taiga, Vikunja[^\n]*, Plane\n/);
    // Its details are on its own page, which the coverage index links.
    const docPage = read('docs/Features/ImportExport/Plane/Plane.md');
    assert.match(docPage, /^## Format details$/m);
    assert.match(read('docs/Features/ImportExport/Format-Coverage.md'), /\]\(\.\/Plane\/Plane\.md\)/);
  });

  await test('the archive reader inflates only through the bounded reader and never uses entry names as paths', () => {
    const src = read('server/lib/planeArchive.js');
    assert.match(src, /require\('\.\/boundedZipEntry'\)/);
    assert.match(src, /readZipEntryBounded\(entry, MAX_PLANE_FILE_BYTES, budget\)/);
    assert.doesNotMatch(src, /\.buffer\(\)|entry\.stream\(\)|require\('(?:node:)?fs'\)|require\('(?:node:)?path'\)/);
  });

  console.log(`\nplaneFormat: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
