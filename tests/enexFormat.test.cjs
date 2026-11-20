'use strict';
// Evernote .enex: notes to cards with their to-dos as a checklist, tags as
// labels and the reminder as the due date (models/lib/enexFormat.js, parsed on
// the server by server/lib/enexImport.js), and a board written back as .enex.
// Run: node --test tests/enexFormat.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const { readEnex, enmlText } = require('../server/lib/enexImport');

const ENEX = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE en-export SYSTEM "http://xml.evernote.com/pub/evernote-export4.dtd">
<en-export export-date="20261116T100000Z" application="Evernote" version="10.0">
  <note>
    <title>Shopping &amp; errands</title>
    <created>20261101T080000Z</created>
    <updated>20261102T080000Z</updated>
    <tag>home</tag><tag>weekly</tag>
    <note-attributes><reminder-time>20261120T090000Z</reminder-time><source-url>https://example.com/list</source-url></note-attributes>
    <content><![CDATA[<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd"><en-note><div>Before the weekend.</div><div><en-todo checked="true"/>Milk</div><div><en-todo/>Bread &lt;whole&gt;</div><script>alert(1)</script><en-media hash="abc" type="image/png"/></en-note>]]></content>
    <resource><data encoding="base64">iVBORw0KGgo=</data><mime>image/png</mime></resource>
  </note>
  <note>
    <title>Done one</title>
    <note-attributes><reminder-time>20261110T090000Z</reminder-time><reminder-done-time>20261110T100000Z</reminder-done-time></note-attributes>
    <content><![CDATA[<en-note>ok</en-note>]]></content>
  </note>
</en-export>`;

let enex;
test.before(async () => { enex = await import('../models/lib/enexFormat.js'); });

test('notes become cards with their to-dos, tags, reminder and done state', () => {
  const { notes } = readEnex(ENEX);
  const board = enex.enexBoard(notes);
  assert.deepStrictEqual(board.columns.map(c => c.title), ['Notes', 'Done']);
  const [shop, done] = board.tasks;
  assert.strictEqual(shop.title, 'Shopping & errands');
  assert.strictEqual(shop.description, 'Before the weekend.\n\nhttps://example.com/list');
  assert.deepStrictEqual(shop.checklists, [{ title: 'To-do', items: [{ title: 'Milk', done: true }, { title: 'Bread <whole>', done: false }] }]);
  assert.deepStrictEqual(shop.tags, ['home', 'weekly']);
  assert.strictEqual(shop.date_due, '2026-11-20T09:00:00.000Z');
  assert.strictEqual(shop.date_creation, '2026-11-01T08:00:00.000Z');
  assert.strictEqual(done.column_name, 'Done');
  assert.strictEqual(done.due_complete, true);
  assert.ok(board.unsupported.some(u => /1 attached file/.test(u.reason)));
});

test('negative: no script, no markup and no non-ENEX file', () => {
  assert.doesNotMatch(enmlText('<en-note><div>a</div><script>alert(1)</script></en-note>'), /alert/);
  const { notes } = readEnex(ENEX);
  assert.doesNotMatch(JSON.stringify(enex.enexBoard(notes)), /<script|<div|en-todo/i);
  assert.throws(() => readEnex('<opml/>'), /no <en-export>/);
});

test('a board exported as .enex reads back as the same notes', () => {
  const out = enex.formatEnex({ items: [
    { title: 'Order <valves>', description: 'Two & more\n]]> tricky', labels: ['shop'], listTitle: 'To Do', creator: 'anna',
      createdAt: '2026-11-01T08:00:00.000Z', dueAt: '2026-11-20T09:00:00.000Z',
      checklists: [{ title: 'Steps', items: [{ title: 'Measure', done: true }, { title: 'Fit', done: false }] }],
      comments: [{ author: 'matti', text: 'Ordered' }] },
  ] }, { now: new Date('2026-11-16T10:00:00Z') });
  assert.match(out, /<en-export export-date="20261116T100000Z" application="WeKan"/);
  const { notes } = readEnex(out);
  const [card] = enex.enexBoard(notes).tasks;
  assert.strictEqual(card.title, 'Order <valves>');
  assert.match(card.description, /^Two & more\n\]\]> tricky\nSteps\n/);
  assert.match(card.description, /matti: Ordered/);
  assert.deepStrictEqual(card.checklists[0].items, [{ title: 'Measure', done: true }, { title: 'Fit', done: false }]);
  assert.deepStrictEqual(card.tags, ['shop', 'To Do']);
  assert.strictEqual(card.date_due, '2026-11-20T09:00:00.000Z');
});

test('a large board is exported a page at a time: the pages together are the whole file', async () => {
  const mail = await import('../models/lib/mailFormat.js');
  const items = Array.from({ length: 5 }, (_, i) => ({ cardId: `c${i}`, title: `Card ${i}`, description: `Text ${i}`,
    creator: 'anna', createdAt: `2026-11-0${i + 1}T10:00:00.000Z`, comments: i % 2 ? [{ text: 'ok', author: 'matti' }] : [] }));
  const now = new Date('2026-11-16T10:00:00Z');
  const pages = [items.slice(0, 2), items.slice(2, 4), items.slice(4)];
  assert.strictEqual(enex.enexHead(now) + pages.map(p => enex.enexNotes(p)).join('') + enex.ENEX_TAIL,
    enex.formatEnex({ items }, { now }), 'an .enex: head, the notes page by page, tail');
  assert.strictEqual(pages.map(p => mail.formatMbox({ items: p })).join('\n'), mail.formatMbox({ items }),
    'an .mbox: the messages page by page');
  const fs = require('node:fs');
  const path = require('node:path');
  const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
  const render = read('server/lib/renderExternalExport.js');
  assert.match(render, /for await \(const collected of externalExportPages\(boardId, format, fields\)\)/);
  assert.match(render, /if \(text && !res\.write\(text\)\) await new Promise\(resolve => res\.once\('drain', resolve\)\);/,
    'it waits for the socket, so pages do not pile up in memory');
  assert.match(read('models/lib/externalExporters.js'), /export async function\* externalExportPages\(boardId, format, fields, pageSize = 500\)/);
  assert.match(read('models/export.js'), /streamExternalExport\(res, boardId, format, fields\)\) return;/);
});
