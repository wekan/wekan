'use strict';

// "Import many boards" (models/lib/importManyFiles.js): several export files,
// or one .zip of them, each imported as its own board, for every import
// source; the documents match what a single import sends
// (models/lib/importSourceShape.js). Run: node tests/importManyFiles.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { zipSync, strToU8 } = require('fflate');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

async function main() {
  const many = await import('../models/lib/importManyFiles.js');
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };
  const file = (name, text) => ({ name, bytes: strToU8(text) });

  test('a .zip of exports is opened into its files; Mac and hidden entries are skipped', () => {
    const zip = zipSync({ 'a.csv': strToU8('Title\nA'), 'dir/b.csv': strToU8('Title\nB'), '__MACOSX/._a.csv': strToU8('x'), '.DS_Store': strToU8('x') });
    const { files, skipped } = many.expandFiles('todoist', [{ name: 'all.zip', bytes: zip }, file('c.csv', 'Title\nC')]);
    assert.deepEqual(files.map(f => f.name), ['all.zip/a.csv', 'all.zip/dir/b.csv', 'c.csv']);
    assert.deepEqual(skipped, []);
  });

  test('a .zip that is itself one export stays one board', () => {
    const zip = zipSync({ 'data.json': strToU8('{}') });
    for (const source of ['vikunja', 'notion', 'plane', 'wekan']) {
      const { files } = many.expandFiles(source, [{ name: 'export.zip', bytes: zip }]);
      assert.deepEqual(files.map(f => f.name), ['export.zip'], source);
    }
    assert.deepEqual(many.documentForFile('vikunja', 'export.zip', zip), { zipBase64: Buffer.from(zip).toString('base64') });
  });

  test('every source gets the document a single import sends, and it passes the shape check', () => {
    const cases = [
      ['planner', 'p.xlsx', 'PK', { excelBase64: 'UEs=' }],
      ['wrike', 'w.xlsx', 'PK', { excelBase64: 'UEs=' }],
      ['plane', 'p.xlsx', 'PK', { xlsxBase64: 'UEs=' }],
      ['csv', 'b.csv', 'Title;Stage\nA;Doing\n\n', [['Title', 'Stage'], ['A', 'Doing']]],
      ['csv', 'b.tsv', 'Title\tStage\nA\tDoing', [['Title', 'Stage'], ['A', 'Doing']]],
      ['markdown', 'b.md', '﻿# B\n- [ ] x', '# B\n- [ ] x'],
      ['opml', 'b.opml', '<opml version="2.0"></opml>', '<opml version="2.0"></opml>'],
      ['trello', 'b.json', '{"cards":[],"lists":[]}', { cards: [], lists: [] }],
      ['kanri', 'b.json', '{"columns":[]}', { columns: [] }],
    ];
    for (const [source, name, text, expected] of cases) {
      const doc = many.documentForFile(source, name, strToU8(text));
      assert.deepEqual(doc, expected, `${source} ${name}`);
      assert.doesNotThrow(() => validateImportSourceShape(source, doc), source);
    }
  });

  test('negative: limits, a broken .zip and broken JSON are reported, not imported', () => {
    const tooMany = Array.from({ length: many.MAX_MANY_FILES + 2 }, (_, i) => file(`f${i}.md`, 'x'));
    const { files, skipped } = many.expandFiles('markdown', tooMany);
    assert.equal(files.length, many.MAX_MANY_FILES);
    assert.equal(skipped.length, 2);
    assert.match(skipped[0], /more than 500 files/);
    const broken = many.expandFiles('todoist', [file('bad.zip', 'not a zip')]);
    assert.deepEqual(broken.files, []);
    assert.match(broken.skipped[0], /bad\.zip: not a readable \.zip/);
    assert.throws(() => many.documentForFile('trello', 'b.json', strToU8('{nope')));
  });

  test('which sources may split, and the lists agree with the import method', () => {
    for (const source of ['wekan', 'trello', 'csv', 'excel', 'jira']) assert.equal(many.isGeneralizedSource(source), false, source);
    for (const source of ['vikunja', 'plane', 'clickup', 'kanri', 'leo', 'opml']) assert.equal(many.isGeneralizedSource(source), true, source);
    const shape = read('models/lib/importSourceShape.js');
    for (const source of many.EXCEL_SOURCES) assert.match(shape, new RegExp(`case '${source}':[^\\n]*excelBase64`), source);
    for (const source of many.TEXT_SOURCES) assert.match(shape, new RegExp(`case '${source}':[^;]*typeof value === 'string'|case '${source}':[\\s\\S]{0,400}typeof value === 'string'`), source);
  });

  test('the import page and api.py import many boards through the single-import paths', () => {
    const page = read('client/components/import/import.js');
    assert.match(page, /const manyEl = this\.find\('\.js-import-many-files'\);\s*if \(manyEl && manyEl\.files && manyEl\.files\.length\) \{\s*await this\.importMany\(dataSource, manyEl\.files\);/);
    assert.match(page, /const \{ files, skipped \} = expandFiles\(source, chosen\);/);
    assert.match(page, /await Meteor\.callAsync\('importBoard', pruneImportDocument\(doc, selectedFields\(\)\),/);
    assert.match(page, /if \(source === 'trello'\) \{\s*const result = await postTrelloImport\(/);
    assert.match(page, /if \(source === 'wekan' && \/\\\.zip\$\/i\.test\(name\)\) \{[\s\S]*?await postWekanZipAsNewBoard\(bytes, membersMode\);/);
    assert.match(read('client/components/import/import.jade'), /input\.js-import-many-files\(id='import-many-files' type="file" multiple\)/);
    const api = read('api.py');
    assert.match(api, /sys\.argv\[1\] == 'importboardsfrom'/);
    assert.match(api, /EXCEL_IMPORT_SOURCES = \{'excel', 'planner', 'monday', 'wrike', 'teamwork', 'businessmap'\}/);
    const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
    for (const key of ['import-many-boards', 'import-many-boards-hint', 'import-one-board-per-project', 'import-many-results-heading']) assert.ok(en[key], key);
    assert.ok(en['import-many-progress'].includes('__done__') && en['import-many-progress'].includes('__total__'));
  });

  test('a WeKan .zip becomes a new board on the server, its attachments streamed', () => {
    const route = read('models/importZip.js');
    assert.match(route, /const newBoard = req\.query && req\.query\.newBoard === '1';/);
    assert.match(route, /if \(board && \(!board\.isVisibleBy\(user\) \|\| !memberCan\(board\.members \|\| \[\], user\._id, 'write'\)\)\) \{/,
      'an existing board still needs write access');
    // Each attachment streams from the archive into storage as the importer
    // reaches it; nothing is put inline in memory.
    assert.match(route, /creator\.attachmentStream = attachmentStream;/);
    assert.doesNotMatch(route, /MAX_NEW_BOARD_ATTACHMENT_BYTES|toString\('base64'\)/);
    assert.match(route, /validateImportSourceShape\('wekan', doc\);/);
    // Every check before it - login, the import switch - still runs first.
    assert.ok(route.indexOf('await assertImportEnabled()') < route.indexOf('new WekanCreator('));
  });

  console.log(`\nimportManyFiles: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
