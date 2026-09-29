'use strict';

// Leo .leo outline import/export (models/lib/leoOutline.js,
// leoOutlineFormat.js). Run: node tests/leoOutline.test.cjs
//
// Lists, cards, card bodies, marked (done) nodes and checklists round-trip
// through WeKan's own export and import; a hand-written Leo file with clones
// imports; hostile XML (external entities, self-cloning nodes, a clone bomb)
// is inert or refused; and the format is wired into every place Markdown is.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
let passed = 0;
async function test(name, fn) { await fn(); passed += 1; console.log('  ok -', name); }

const collected = {
  board: { title: 'Plant & "Pumps"' },
  lists: [{ _id: 'L1', title: 'Doing' }, { _id: 'L2', title: 'Done' }, { _id: 'L3', title: 'Empty' }],
  swimlanes: [{ _id: 'S1', title: 'Default' }],
  items: [
    { cardId: 'A', listTitle: 'Doing', title: 'Check <valve>', description: 'Line 1\nif a < b && c > d',
      labels: [], checklists: [{ title: 'Steps', items: [{ title: 'Open', done: true }, { title: 'Close', done: false }] }] },
    { cardId: 'B', listTitle: 'Done', title: 'Ship it', description: '', labels: [] },
  ],
};

async function main() {
  const { parseLeo, MAX_LEO_NODES } = await import('../models/lib/leoOutline.js');
  const { formatLeo } = await import('../models/lib/leoOutlineFormat.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');

  await test('a board exported to .leo imports back with lists, cards, bodies, done state and checklists', () => {
    const xml = formatters.leo(collected);
    assert.equal(formatters.leo, formatLeo);
    assert.match(xml, /^<\?xml version="1.0" encoding="utf-8"\?>\n<leo_file /);
    const parsed = parseLeo(xml);
    assert.equal(parsed.board.name, 'Plant & "Pumps"');
    assert.deepEqual(parsed.columns.map(c => c.title), ['Doing', 'Done', 'Empty']);
    const [a, b] = parsed.tasks;
    assert.deepEqual([a.title, a.description, a.column_name, a.tags], ['Check <valve>', 'Line 1\nif a < b && c > d', 'Doing', []]);
    assert.deepEqual(a.checklists, [{ title: 'Steps', items: [{ title: 'Open', done: true }, { title: 'Close', done: false }] }]);
    assert.deepEqual([b.title, b.column_name, b.tags, b.checklists], ['Ship it', 'Done', ['done'], undefined]);
    assert.deepEqual(parsed.unsupported, []);
    validateImportSourceShape('leo', xml);
  });

  await test('a hand-written Leo file: clones, loose children and deep nodes', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<leo_file xmlns:leo="http://leoeditor.com/namespaces/leo-python-editor/1.1" >
<leo_header file_format="2"/>
<vnodes>
<v t="ekr.1"><vh>Backlog</vh>
<v t="ekr.2" a="M"><vh>Write docs</vh>
<v t="ekr.3"><vh>Intro</vh></v>
<v t="ekr.4"><vh>Chapters</vh><v t="ekr.5" a="M"><vh>One</vh><v t="ekr.6"><vh>One.a</vh></v></v></v>
</v>
</v>
<v t="ekr.7"><vh>Later</vh><v t="ekr.2"></v></v>
</vnodes>
<tnodes>
<t tx="ekr.1">notes about the list</t>
<t tx="ekr.2">@language rest
Body &amp; more</t>
</tnodes>
</leo_file>`;
    const parsed = parseLeo(xml);
    assert.equal(parsed.board.name, 'Imported Leo outline');
    assert.equal(parsed.tasks.length, 2, 'the clone under Later is a card too');
    const [docs, clone] = parsed.tasks;
    assert.deepEqual([docs.title, docs.description, docs.tags], ['Write docs', '@language rest\nBody & more', ['done']]);
    assert.deepEqual(docs.checklists, [
      { title: 'Write docs', items: [{ title: 'Intro', done: false }] },
      { title: 'Chapters', items: [{ title: 'One', done: true }, { title: 'One.a', done: false }] },
    ]);
    assert.deepEqual([clone.column_name, clone.checklists], ['Later', docs.checklists], 'a clone keeps its children');
    assert.deepEqual(parsed.unsupported, [{ path: 'Backlog', reason: 'list body text has no WeKan field' }]);
  });

  // Negative: hostile or wrong input.
  await test('external entities and a DOCTYPE are inert text, never read', () => {
    const xml = `<?xml version="1.0"?><!DOCTYPE leo_file [<!ENTITY x SYSTEM "file:///etc/passwd">]>
<leo_file><vnodes><v t="a"><vh>L</vh><v t="b"><vh>&x;</vh></v></v></vnodes><tnodes/></leo_file>`;
    const title = parseLeo(xml).tasks[0].title;
    assert.ok(!/root:/.test(title), 'no file content');
    assert.equal(title, '&x;');
  });
  await test('a node cloned inside itself does not loop, and a clone bomb is refused', () => {
    const selfClone = '<leo_file><vnodes><v t="a"><vh>L</vh><v t="b"><vh>C</vh><v t="b"></v></v></v></vnodes></leo_file>';
    assert.deepEqual(parseLeo(selfClone).tasks[0].checklists, [{ title: 'C', items: [{ title: 'C', done: false }] }]);
    // Each level holds two clones of the next: 2^30 nodes described in ~2 KB.
    let inner = '<v t="n30"><vh>x</vh></v>';
    for (let i = 29; i >= 1; i -= 1) inner = `<v t="n${i}"><vh>x</vh>${inner}<v t="n${i + 1}"></v></v>`;
    assert.throws(() => parseLeo(`<leo_file><vnodes>${inner}</vnodes></leo_file>`), /too many nodes/);
    assert.ok(MAX_LEO_NODES <= 100000);
  });
  await test('text that is not a Leo outline is refused before and by the parser', () => {
    for (const bad of ['', '# Markdown\n- [ ] x', '<html><body/></html>', { vnodes: [] }]) {
      assert.throws(() => validateImportSourceShape('leo', bad), /Invalid leo/);
    }
    assert.throws(() => parseLeo('<leo_file></leo_file>'), /no <leo_file><vnodes>/);
    assert.throws(() => parseLeo('<leo_file>'.padEnd(16 * 1024 * 1024 + 1, ' ')), /too large/);
  });
  await test('exported headlines and bodies are escaped, so a title cannot inject nodes', () => {
    const xml = formatLeo({ board: { title: 'B' }, lists: [{ title: 'L' }],
      items: [{ listTitle: 'L', title: '</vh></v><v t="x"><vh>Injected', description: '</t><t tx="wekan.1.1">x' }] });
    const parsed = parseLeo(xml);
    assert.equal(parsed.tasks.length, 1);
    assert.equal(parsed.tasks[0].title, '</vh></v><v t="x"><vh>Injected');
    assert.equal(parsed.tasks[0].description, '</t><t tx="wekan.1.1">x');
  });

  // Wiring: the same places Markdown is registered.
  await test('Leo is offered on the import page and in the export menu, served as XML', () => {
    const importJs = read('client/components/import/import.js');
    assert.match(importJs, /\{ key: 'leo', name: 'Leo' \}/);
    assert.match(importJs, /dataSource === 'markdown' \|\| dataSource === 'leo'/);
    assert.match(read('client/components/boards/exportScope.js'), /key: 'leo'.*path: 'export\/leo', ext: 'leo', scopes: BOARD_ONLY/);
    assert.match(read('models/export.js'), /leo: 'application\/xml'/);
    const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
    const keys = Object.keys(en);
    assert.equal(keys[keys.indexOf('import-board-instruction-markdown') + 1], 'import-board-instruction-leo');
  });
  await test('the import parses the raw XML server-side and sanitizes the parsed tasks', () => {
    const src = read('models/import.js');
    assert.match(src, /importSource === 'leo' \? board : sanitizeImported\(board, importSource, this\)/);
    const leoCase = src.slice(src.indexOf("case 'leo':"), src.indexOf('default:', src.indexOf("case 'leo':")));
    assert.match(leoCase, /check\(board, String\)/);
    assert.match(leoCase, /if \(!Meteor\.isServer\) return undefined;/);
    assert.match(leoCase, /require\('\/server\/lib\/leoImport'\)\.parseLeo\(board\)[\s\S]*sanitizeImported\(importedBoard, 'leo', this\)/);
    // htmlparser2 stays out of the client bundle: only the server entry loads it.
    assert.doesNotMatch(read('models/lib/leoOutlineFormat.js'), /htmlparser2/);
    assert.doesNotMatch(read('models/lib/externalParsers.js'), /leoOutline/);
  });

  console.log(`\n${passed} tests passed`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
