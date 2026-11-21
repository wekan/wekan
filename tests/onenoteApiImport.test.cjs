'use strict';
// Microsoft OneNote: notebooks fetched from Microsoft Graph read as a board -
// sections the lists, pages the cards, to-do boxes a checklist, subpages
// subtasks - and a board written as OneNote pages
// (models/lib/onenoteApiFormat.js, models/lib/apiImport/onenote.js).
// Run: node --test tests/onenoteApiImport.test.cjs
const test = require('node:test');
// The export boundary's HTML sanitizer at its strictest: every tag removed,
// to a fixed point (tests/tagStrippingFixedPoint.test.cjs).
function stripEveryTag(value) {
  let out = value;
  let prev;
  do {
    prev = out;
    out = out.replace(/<[^>]*>/g, '');
  } while (out !== prev);
  return out;
}
const assert = require('node:assert');
const { zipSync, strToU8 } = require('fflate');

let one;
let client;
test.before(async () => {
  one = await import('../models/lib/onenoteApiFormat.js');
  client = await import('../models/lib/apiImport/onenote.js');
});

// A page as GET /me/onenote/pages/{id}/content answers it.
const PAGE = `<html lang="en-US">
  <head><title>Kickoff</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="created" content="2026-11-18T09:00:00.0000000" /></head>
  <body data-absolute-enabled="true" style="font-family:Calibri">
    <div id="div:{1}" data-id="_default" style="position:absolute">
      <p id="p:{2}" style="margin-top:0pt">Agenda for <span style="font-weight:bold">Monday</span> &amp; after</p>
      <p data-tag="to-do" id="p:{3}">Book the room</p>
      <p data-tag="to-do:completed" id="p:{4}">Send the invite</p>
      <p data-tag="important">Bring the slides</p>
      <img src="https://graph.microsoft.com/v1.0/users('x')/onenote/resources/1/$value" width="100" />
      <object data-attachment="budget.xlsx" data="https://graph.microsoft.com/v1.0/resources/2/$value" type="application/vnd.ms-excel" />
    </div>
  </body>
</html>`;

const notebook = { onenote: true, notebooks: [{ id: 'nb', displayName: 'Team notes', sections: [
  { id: 's1', displayName: 'Meetings', pages: [
    { id: 'p2', title: 'Actions', level: 1, order: 1, content: '<html><body><p>Follow up</p></body></html>' },
    { id: 'p1', title: 'Kickoff', level: 0, order: 0, createdDateTime: '2026-11-18T09:00:00Z', content: PAGE },
  ] },
  { id: 's2', displayName: 'Ideas', pages: [{ id: 'p3', title: '', level: 0, order: 0, content: '' }] },
] }] };

test('a notebook becomes a board: sections lists, pages cards, to-do boxes a checklist, subpages subtasks', () => {
  const board = one.parseOnenoteApi(notebook);
  assert.strictEqual(board.board.name, 'Team notes');
  assert.deepStrictEqual(board.columns.map(c => c.title), ['Meetings', 'Ideas']);
  const [kickoff, actions, empty] = board.tasks;
  assert.strictEqual(kickoff.title, 'Kickoff');
  assert.strictEqual(kickoff.description, 'Agenda for Monday & after\n\nBring the slides');
  assert.deepStrictEqual(kickoff.checklists, [{ title: 'To-do', items: [{ title: 'Book the room', done: false }, { title: 'Send the invite', done: true }] }]);
  assert.strictEqual(kickoff.date_creation, '2026-11-18T09:00:00.000Z');
  assert.strictEqual(actions.parent_ref, 'p1');
  assert.strictEqual(empty.title, 'Untitled page');
  assert.ok(board.unsupported.some(u => /1 image/.test(u.reason)));
  assert.ok(board.unsupported.some(u => /1 file/.test(u.reason)));
});

test('round trip: the exported pages read back - lists, titles, text, checklist and subpages', () => {
  const items = [
    { cardId: 'a', title: 'Kickoff', listTitle: 'Meetings', description: 'Agenda & <notes>\nline two', createdAt: '2026-11-18T09:00:00.000Z',
      checklists: [{ title: 'Steps', items: [{ title: 'Book the room', done: false }, { title: 'Send', done: true }] }] },
    { cardId: 'b', title: 'Actions', listTitle: 'Meetings', parentCardId: 'a', description: '' },
    { cardId: 'c', title: 'Idea', listTitle: 'Ideas', description: 'Later' },
  ];
  const built = one.formatOnenote({ board: { title: 'Team notes' }, items });
  const files = one.onenoteArchiveFiles(built);
  assert.deepStrictEqual(Object.keys(files).sort(), ['Team-notes/01-Meetings/0001-Kickoff.html', 'Team-notes/01-Meetings/0002-Actions.html',
    'Team-notes/02-Ideas/0001-Idea.html', 'onenote.json']);
  const html = files['Team-notes/01-Meetings/0001-Kickoff.html'];
  assert.ok(html.includes('<title>Kickoff</title>') && html.includes('<meta name="created" content="2026-11-18T09:00:00.000Z" />'));
  assert.ok(html.includes('<p>Agenda &amp; &lt;notes&gt;<br />line two</p>'));
  assert.ok(html.includes('<p data-tag="to-do:completed">Send</p>'));
  const back = one.parseOnenoteApi(JSON.parse(files['onenote.json']));
  assert.deepStrictEqual(back.columns.map(c => c.title), ['Meetings', 'Ideas']);
  const [a, b, c] = back.tasks;
  assert.strictEqual(a.description, 'Agenda & <notes>\nline two');
  assert.deepStrictEqual(a.checklists[0].items, [{ title: 'Book the room', done: false }, { title: 'Send', done: true }]);
  assert.strictEqual(b.parent_ref, a.ref);
  assert.strictEqual(c.description, 'Later');
});

test('negative: the export boundary cannot take the pages apart - they are written after it', async () => {
  const { sanitizeTransferValue } = await import('../models/lib/importExportBoundary.js');
  const built = one.formatOnenote({ board: { title: 'Notes' }, items: [{ cardId: 'a', title: 'Kickoff', listTitle: 'Meetings',
    description: 'Agenda', checklists: [{ items: [{ title: 'Book', done: true }] }] }] });
  const checked = sanitizeTransferValue(built, { direction: 'export', sanitizeHtml: stripEveryTag });
  assert.deepStrictEqual(checked.warnings, [], 'nothing in the document is markup');
  const page = Object.entries(one.onenoteArchiveFiles(checked.value)).find(([path]) => path.endsWith('.html'))[1];
  assert.ok(page.startsWith('<!DOCTYPE html>') && page.includes('<title>Kickoff</title>') && page.includes('<p data-tag="to-do:completed">Book</p>'));
});

test('the zip WeKan exports is read back through onenote.json', async () => {
  const { readOnenoteExport } = require('../server/lib/microsoftArchives');
  const zipBase64 = Buffer.from(zipSync({ 'onenote.json': strToU8(JSON.stringify(notebook)), 'Team/01-A/0001-x.html': strToU8('<html/>') })).toString('base64');
  const data = await readOnenoteExport({ zipBase64 });
  assert.strictEqual(one.parseOnenoteApi(data).tasks.length, 3);
});

test('the API client lists notebooks and fetches one notebook\'s pages with their HTML', async () => {
  const G = 'https://graph.microsoft.com/v1.0';
  const answers = {
    [`${G}/me/onenote/notebooks`]: { value: [{ id: 'nb', displayName: 'Team notes' }] },
    [`${G}/me/onenote/notebooks/nb/sections`]: { value: [{ id: 's1', displayName: 'Meetings' }] },
    [`${G}/me/onenote/sections/s1/pages?$select=id,title,level,order,createdDateTime`]: { value: [{ id: 'p1', title: 'Kickoff', level: 0, order: 0 }] },
    [`${G}/me/onenote/pages/p1/content`]: PAGE,
  };
  const accepts = [];
  const request = async (url, opts) => { accepts.push(opts.headers.Accept); if (!(url in answers)) throw new Error(`no ${url}`); return answers[url]; };
  assert.deepStrictEqual(await client.list({ token: 'T' }, request), [{ id: 'nb', name: 'Team notes' }]);
  const data = await client.fetch({ token: 'T' }, 'nb', request);
  assert.strictEqual(data.notebooks[0].sections[0].pages[0].content, PAGE);
  assert.ok(accepts.includes('text/html'));
  assert.strictEqual(one.parseOnenoteApi(data).tasks[0].checklists[0].items.length, 2);
});

test('negative: not what the import fetched, no such notebook, a next link off Graph, a path the export does not write', async () => {
  assert.throws(() => one.parseOnenoteApi({ notebooks: [] }), /must be what the OneNote import fetched/);
  assert.throws(() => one.parseOnenoteApi('{'), /not valid JSON/);
  assert.throws(() => one.parseOnenoteApi({ onenote: true, notebooks: [] }), /no sections/);
  await assert.rejects(client.fetch({ token: 'T' }, 'missing', async () => ({ value: [] })), /no such notebook/);
  await assert.rejects(client.list({ token: 'T' }, async () => ({ value: [], '@odata.nextLink': 'http://graph.microsoft.com/x' })), /another host/);
  assert.deepStrictEqual(one.onenoteArchiveFiles({ files: { '../x.html': 'a', 'onenote.json': '{}' } }), {});
  assert.ok(Object.keys(one.onenoteArchiveFiles({ onenote: true, title: '../..', sections: [{ name: '../x', pages: [{ title: '../y' }] }] }))
    .every(path => !path.includes('..')));
  // A to-do box with markup inside is its text only.
  assert.deepStrictEqual(one.onenotePage('<p data-tag="to-do"><b>Bold</b> <script>x</script>task</p>').todos, [{ title: 'Bold task', done: false }]);
});
