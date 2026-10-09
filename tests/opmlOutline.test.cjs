'use strict';

// OPML outline import/export (models/lib/opmlOutline.js, opmlOutlineFormat.js),
// following http://opml.org/spec2.opml and the _note / _complete attributes
// Workflowy, Dynalist and Logseq write. Run: node tests/opmlOutline.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

let passed = 0;
async function test(name, fn) { await fn(); passed += 1; console.log('  ok -', name); }

async function main() {
  const { parseOpml, MAX_OPML_NODES } = await import('../models/lib/opmlOutline.js');
  const { formatOpml } = await import('../models/lib/opmlOutlineFormat.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');

  await test('a Workflowy / Dynalist export maps to lists, cards, notes, done state and checklists', () => {
    const { board, columns, tasks, unsupported } = parseOpml(`<?xml version="1.0"?>
<opml version="2.0"><head><title>Plant &amp; Pumps</title></head><body>
  <outline text="To Do" _note="list note">
    <outline text="Order valves" _note="Two of them&#10;DN50">
      <outline text="Measure" _complete="true"/>
      <outline text="Call vendor"/>
      <outline text="Fitting"><outline text="Seal"/><outline text="Bolts" complete="true"><outline text="M12"/></outline></outline>
    </outline>
    <outline text="Read manual" url="https://example.com/manual"/>
  </outline>
  <outline text="Done"><outline text="Replace pump" _complete="true"/></outline>
</body></opml>`);
    assert.equal(board.name, 'Plant & Pumps');
    assert.deepEqual(columns.map(column => column.title), ['To Do', 'Done']);
    assert.deepEqual(tasks.map(task => [task.title, task.column_name, task.tags]),
      [['Order valves', 'To Do', []], ['Read manual', 'To Do', []], ['Replace pump', 'Done', ['done']]]);
    assert.equal(tasks[0].description, 'Two of them\nDN50', 'an encoded line break in _note survives');
    assert.deepEqual(tasks[0].checklists, [
      { title: 'Order valves', items: [{ title: 'Measure', done: true }, { title: 'Call vendor', done: false }] },
      { title: 'Fitting', items: [{ title: 'Seal', done: false }, { title: 'Bolts', done: true }, { title: 'M12', done: false }] },
    ], 'Workflowy\'s _complete and Dynalist\'s complete');
    assert.deepEqual(unsupported.map(u => u.reason), ['OPML url has no WeKan field', 'a list note has no WeKan field']);
  });

  await test('a board exported to OPML imports back with lists, cards, notes, done state and checklists', () => {
    const collected = { board: { title: 'Plant <B>' }, lists: [{ title: 'Doing' }, { title: 'Done' }], items: [
      { cardId: 'a', listTitle: 'Doing', title: 'Order "valves" & seals', description: 'line one\nline two\ttab', labels: [],
        checklists: [{ title: 'Steps', items: [{ title: 'Open', done: true }, { title: 'Close', done: false }] }] },
      { cardId: 'b', listTitle: 'Done', title: 'Ship it', description: '', labels: [] },
    ] };
    const xml = formatters.opml(collected);
    assert.equal(formatters.opml, formatOpml);
    assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>\n<opml version="2.0">/);
    const back = parseOpml(xml);
    assert.equal(back.board.name, 'Plant <B>');
    assert.deepEqual(back.columns.map(c => c.title), ['Doing', 'Done']);
    assert.equal(back.tasks[0].title, 'Order "valves" & seals');
    assert.equal(back.tasks[0].description, 'line one\nline two\ttab');
    assert.deepEqual(back.tasks[0].checklists, [{ title: 'Steps', items: [{ title: 'Open', done: true }, { title: 'Close', done: false }] }]);
    assert.deepEqual(back.tasks[1].tags, ['done'], 'a card in a finished list is written complete');
    assert.deepEqual(back.unsupported, []);
  });

  await test('negative: not OPML, oversized or a node bomb is refused; entities stay inert', () => {
    assert.throws(() => parseOpml('<html><body><outline text="x"/></body></html>'), /Not an OPML outline/);
    assert.throws(() => parseOpml('x'.repeat(16 * 1024 * 1024 + 1)), /too large/);
    const many = `<opml><body>${'<outline text="x"/>'.repeat(MAX_OPML_NODES + 1)}</body></opml>`;
    assert.throws(() => parseOpml(many), /too many items/);
    const xxe = parseOpml('<?xml version="1.0"?><!DOCTYPE x [<!ENTITY e SYSTEM "file:///etc/passwd">]><opml><body><outline text="L"><outline text="&e;"/></outline></body></opml>');
    assert.doesNotMatch(JSON.stringify(xxe), /root:/, 'an external entity is never read');
    assert.throws(() => validateImportSourceShape('opml', '{"lists":[]}'), /Invalid opml/);
    assert.doesNotThrow(() => validateImportSourceShape('opml', '<opml version="2.0"><body/></opml>'));
  });

  await test('wired in, and the XML parser stays on the server', () => {
    const src = read('models/import.js');
    const opmlCase = src.slice(src.indexOf("case 'opml':"), src.indexOf('default:', src.indexOf("case 'opml':")));
    assert.match(opmlCase, /check\(board, String\)/);
    assert.match(opmlCase, /if \(!Meteor\.isServer\) return undefined;/);
    assert.match(opmlCase, /require\('\/server\/lib\/opmlImport'\)\.parseOpml\(board\)[\s\S]*sanitizeImported\(importedBoard, 'opml', this\)/);
    assert.doesNotMatch(read('models/lib/opmlOutlineFormat.js'), /htmlparser2/);
    assert.doesNotMatch(read('models/lib/externalParsers.js'), /opmlOutline/);
    assert.match(read('models/lib/importSources.js'), /\{ key: 'opml', name: 'OPML'[,}]/); // the one list of sources
    assert.match(read('client/components/boards/exportScope.js'), /key: 'opml'[^\n]*path: 'export\/opml', ext: 'opml'/);
    assert.match(read('server/lib/renderExternalExport.js'), /opml: 'text\/x-opml'/);
    const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
    assert.match(en['import-board-instruction-opml'], /Workflowy/);
  });

  console.log(`\nopmlOutline: ${passed} tests passed`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
