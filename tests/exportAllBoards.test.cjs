'use strict';

// "Export all boards" (models/lib/exportAllBoards.js, server/routes/exportAllBoards.js):
// every board a user may export, in one format, in one download - Excel as one
// workbook with a sheet per board named after the board, every other format
// as a .zip with a file per board. Run: node tests/exportAllBoards.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

async function main() {
  const lib = await import('../models/lib/exportAllBoards.js');
  const { EXTERNAL_EXPORT_FORMATS } = await import('../models/lib/externalExportFormatters.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

  test('Excel sheet names are the board titles, as Excel allows them, and unique', () => {
    const names = lib.uniqueSheetNames(['Sprint: 1/2', 'Roadmap', 'ROADMAP', "'Quoted'", '', 'A very long board title that goes past the limit',
      'A very long board title that goes past the limit']);
    assert.deepEqual(names.slice(0, 5), ['Sprint 1 2', 'Roadmap', 'ROADMAP (2)', 'Quoted', 'Board']);
    assert.equal(names[5], 'A very long board title that go');
    assert.equal(names[6], 'A very long board title tha (2)');
    for (const name of names) {
      assert.ok(name.length >= 1 && name.length <= 31, name);
      assert.doesNotMatch(name, /[\\/?*[\]:]|^'|'$/, name);
    }
    assert.equal(new Set(names.map(n => n.toLowerCase())).size, names.length, 'Excel compares sheet names without case');
  });

  test('zip file names are the board titles, unique, with the format\'s extension', () => {
    assert.deepEqual(lib.uniqueFileNames(['Launch plan', 'launch plan', '../etc', ''], 'csv'),
      ['Launch-plan.csv', 'launch-plan-2.csv', 'etc.csv', 'board.csv']);
    assert.equal(lib.extensionOf('wrike'), 'xlsx');
    assert.equal(lib.extensionOf('vikunja'), 'zip');
    assert.equal(lib.extensionOf('trello'), 'json');
    assert.equal(lib.massExportFilename('excel'), 'wekan-boards.xlsx');
    assert.equal(lib.massExportFilename('trello'), 'wekan-boards-trello.zip');
  });

  test('every tool format, WeKan JSON, CSV/TSV and Excel are offered; one-board documents are not', () => {
    for (const key of ['wekan', 'csv', 'scsv', 'tsv', 'excel', ...EXTERNAL_EXPORT_FORMATS]) assert.ok(lib.MASS_EXPORT_FORMATS.includes(key), key);
    for (const key of ['pdf', 'html', 'ical', 'dep-json', 'dep-svg']) assert.ok(!lib.MASS_EXPORT_FORMATS.includes(key), key);
    // The extension of each tool format matches the export menu's.
    const menu = read('client/components/boards/exportScope.js');
    for (const match of menu.matchAll(/key: '([a-z]+)'[^}]*path: 'export\/[a-z]+', ext: '([a-z]+)'/g)) {
      if (match[1] === 'csv' || match[1] === 'scsv' || match[1] === 'tsv') continue;
      assert.equal(lib.extensionOf(match[1]), match[2], match[1]);
    }
  });

  test('negative: board ids are filtered and capped', () => {
    assert.equal(lib.parseBoardIds(undefined), null);
    assert.equal(lib.parseBoardIds(''), null);
    assert.deepEqual(lib.parseBoardIds('a1,b2,a1,../x,$where,c_3'), ['a1', 'b2', 'c_3']);
    assert.equal(lib.parseBoardIds(Array.from({ length: 1200 }, (_, i) => `b${i}`).join(',')).length, lib.MAX_MASS_EXPORT_BOARDS);
  });

  test('the route checks every board as its own export does, and writes one workbook or one .zip', () => {
    const route = read('server/routes/exportAllBoards.js');
    assert.match(route, /WebApp\.handlers\.get\('\/api\/export-all-boards\/:format'/);
    assert.match(route, /if \(!MASS_EXPORT_FORMATS\.includes\(format\)\)/);
    assert.match(route, /await require\('\/models\/lib\/importExportSecurity'\)\.assertExportEnabled\(\);/);
    assert.match(route, /members: \{ \$elemMatch: \{ userId: user\._id, isActive: true \} \}/);
    assert.match(route, /archived: false,\s*type: 'board',/, 'not archived boards, not templates');
    assert.match(route, /if \(!canExportBoardData\(board, user\)\) throw/);
    assert.match(route, /await assertFieldExport\(board\._id, user\._id\);/);
    assert.match(route, /redactFields\(data, user\._id, board\._id\)/, 'admin-only fields are redacted as in the JSON route');
    assert.match(route, /await exporter\.build\(res, \{ workbook, sheetName: names\[i\], activities: false \}\);/);
    assert.match(route, /if \(skipped\.length\) add\('skipped\.txt'/);
    // A WeKan JSON board streams into its entry, paced by the response; no
    // board is built whole in memory (the export's base64 attachments with it).
    assert.match(route, /if \(format === 'wekan'\) await streamWekanBoard\(names\[i\], boards\[i\]\);/);
    assert.match(route, /await exporter\.buildStream\(sink\);/);
    assert.match(route, /return !res\.writableNeedDrain;/);
    assert.doesNotMatch(route, /exporter\.build\(\)/, 'negative: no whole-board build');
    assert.match(read('server/imports.js'), /import '\/server\/routes\/exportAllBoards';/);
    // The Excel exporter adds one sheet to a shared workbook and leaves its
    // sending to the caller.
    const excel = read('models/server/ExporterExcel.js');
    assert.match(excel, /const workbook = shared \|\| createWorkbookWriter\(res\);/);
    assert.match(excel, /if \(options\.activities === false\) return;/);
    assert.match(excel, /if \(!shared\) await workbook\.commit\(\);/);
  });

  test('All Boards offers it for every board and for the selected ones; api.py too', () => {
    const jade = read('client/components/boards/allBoardsSidebar.jade');
    assert.match(jade, /a\.sidebar-btn\.js-export-all-boards/);
    // The page's own bar has it: the sidebar's home view that holds the row is
    // opened by nothing on All Boards since the page lost its hamburger.
    const list = read('client/components/boards/boardsList.jade');
    const buttons = list.slice(list.indexOf('template(name="allBoardsHeaderButtons")'),
      list.indexOf('template(name="allBoardsViewMenu")'));
    assert.match(buttons, /a\.board-header-btn\.js-export-all-boards\(title="\{\{_ 'export-all-boards'\}\}"\)/);
    assert.match(read('client/components/boards/boardsList.js'),
      /'click \.js-export-all-boards'\(evt\) \{\s*evt\.preventDefault\(\);\s*Popup\.open\('exportAllBoards'\)\.call\(\{ boardIds: null \}, evt\);/);
    assert.match(jade, /a\.sidebar-btn\.js-export-selected-boards/);
    assert.match(jade, /template\(name="exportAllBoardsPopup"\)/);
    const js = read('client/components/boards/allBoardsSidebar.js');
    assert.match(js, /Popup\.open\('exportAllBoards'\)\.call\(\{ boardIds: null \}, evt\);/);
    assert.match(js, /Popup\.open\('exportAllBoards', \{ titleKey: 'export-selected-boards' \}\)\.call\(\{ boardIds \}, evt\);/);
    assert.match(read('client/components/boards/exportScope.js'), /return `\/api\/export-all-boards\/\$\{format\}\?\$\{params\.toString\(\)\}`;/);
    const api = read('api.py');
    assert.match(api, /sys\.argv\[1\] == 'exportallboards'/);
    assert.match(api, /wekanurl \+ 'api\/export-all-boards\/' \+ fmt/);
    const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
    for (const key of ['export-all-boards', 'export-selected-boards', 'export-all-boards-hint', 'exportAllBoardsPopup-title']) assert.ok(en[key], key);
  });

  test('negative: server code requires its modules by a literal path the bundle can resolve', () => {
    // renderExternalExport required each workbook writer through a variable,
    // require(path); rspack cannot resolve that, and every Excel-based tool
    // export (Planner, Wrike, monday.com, Teamwork.com, Businessmap) answered
    // 500. No server or model file may require a module by an expression.
    const { execFileSync } = require('node:child_process');
    const files = execFileSync('git', ['ls-files', 'server', 'models', 'imports', 'config'], { cwd: path.join(__dirname, '..'),
      encoding: 'utf8' }).split('\n').filter(file => /\.(c|m)?js$/.test(file) && !file.includes('/tests/') && fs.existsSync(path.join(__dirname, '..', file)));
    const offenders = [];
    for (const file of files) {
      read(file).split('\n').forEach((line, i) => {
        if (/^\s*(\/\/|\*)/.test(line)) return;
        if (/\brequire\(\s*[^'"`)\s]/.test(line)) offenders.push(`${file}:${i + 1}: ${line.trim()}`);
      });
    }
    assert.deepEqual(offenders, []);
    assert.match(read('server/lib/renderExternalExport.js'), /body: await WORKBOOKS\[format\]\(\)\(built\)/);
  });

  console.log(`\nexportAllBoards: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
