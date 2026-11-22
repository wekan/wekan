'use strict';
// The attachment slideshow's own viewers (client/lib/attachmentRichViewer.js):
// text, Markdown, CSV/TSV, source code and JSON, iCalendar, Outlook .msg, tar
// and OpenDocument, each loaded only when such a file is opened, each reading
// only what is on the screen (HTTP Range) or as far as it is scrolled, with no
// limit on rows. Driven end to end - fetch, parse, render - in a jsdom
// document, against a fake server that counts what it sent.
// Run: node --test tests/attachmentRichViewer.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { gzipSync, zipSync, strToU8 } = require('fflate');
const { sampleMsg } = require('./lib/outlookMsgFixture.cjs');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// DOMPurify binds to the window it finds when it is first imported.
const dom = new JSDOM('<!doctype html><body></body>');
global.window = dom.window;
global.document = dom.window.document;
global.DOMParser = dom.window.DOMParser;

let viewer;
let kind;
test.before(async () => {
  viewer = await import('../client/lib/attachmentRichViewer.js');
  kind = await import('../models/lib/attachmentKind.js');
});

const LABELS = { title: 'Title', start: 'Start', end: 'End', due: 'Due', description: 'Description',
  from: 'From', to: 'To', cc: 'Cc', subject: 'Subject', date: 'Date', attachments: 'Attachments', empty: 'No results' };

const { rangeServer } = require('./lib/rangeServer.cjs');
const bytesOf = body => (typeof body === 'string' ? new TextEncoder().encode(body) : new Uint8Array(body));

async function open(rich, body, extra = {}) {
  const container = dom.window.document.createElement('div');
  const bytes = bytesOf(body);
  const { fetchImpl, log } = rangeServer(bytes, extra.server);
  const preview = await viewer.openRichAttachment({ container, rich, url: '/f', size: bytes.length, signal: { aborted: false },
    labels: LABELS, fetchImpl, viewportHeight: 400, ...extra });
  return { container, preview, log, view: preview.view, bytes };
}

const texts = nodes => [...nodes].map(n => n.textContent);
async function scrollTo(view, px) { view.scroller.scrollTop = px; await view.update(); }

// ---- which files ---------------------------------------------------------------

test('each kind is recognised by name, and by the types browsers and systems give it', () => {
  const cases = [
    [{ name: 'notes.md' }, 'markdown'], [{ name: 'README.markdown', type: 'text/plain' }, 'markdown'],
    [{ name: 'x', type: 'text/markdown' }, 'markdown'],
    [{ name: 'a.csv' }, 'csv'], [{ name: 'a.csv', type: 'application/vnd.ms-excel' }, 'csv'],
    [{ name: 'a.tsv', type: 'text/tab-separated-values' }, 'csv'],
    [{ name: 'app.py', type: 'text/x-python' }, 'code'], [{ name: 'main.go' }, 'code'],
    [{ name: 'a.js', type: 'application/javascript' }, 'code'], [{ name: 'page.html', type: 'text/html' }, 'code'],
    [{ name: 'a.json', type: 'application/json' }, 'code'],
    [{ name: 'meet.ics', type: 'text/calendar' }, 'calendar'], [{ name: 'meet.ics' }, 'calendar'],
    [{ name: 'mail.msg', type: 'application/vnd.ms-outlook' }, 'outlook'], [{ name: 'mail.msg' }, 'outlook'],
    [{ name: 'src.tar.gz', type: 'application/gzip' }, 'tar'], [{ name: 'src.tgz' }, 'tar'],
    [{ name: 'src.tar', type: 'application/x-tar' }, 'tar'],
    [{ name: 'a.odt' }, 'opendocument'], [{ name: 'a.ods', type: 'application/vnd.oasis.opendocument.spreadsheet' }, 'opendocument'],
    [{ name: 'a.odp', type: 'application/zip' }, 'opendocument'],
  ];
  for (const [doc, expected] of cases) {
    assert.equal(kind.attachmentRichKind(doc), expected, JSON.stringify(doc));
    assert.equal(kind.attachmentCanPreview(doc), true, JSON.stringify(doc));
  }
  assert.equal(kind.attachmentCodeLanguage({ name: 'a.py' }), 'python');
  assert.equal(kind.attachmentCodeLanguage({ name: 'a.json' }), 'json');
});

test('negative: a stated type of something else wins over the name, and other files get no viewer', () => {
  for (const doc of [{ name: 'a.md', type: 'image/png' }, { name: 'clip.ts', type: 'video/mp2t' },
    { name: 'a.gz', type: 'application/gzip' }, { name: 'a.msg', type: 'text/plain' },
    { name: 'a.odt', type: 'application/pdf' }, { name: 'a.txt' }, { name: 'a.png' }, { name: 'a.exe' }]) {
    assert.equal(kind.attachmentRichKind(doc), null, JSON.stringify(doc));
  }
  assert.equal(kind.attachmentCanPreview({ name: 'a.exe' }), false);
  assert.equal(kind.attachmentCanPreview({ name: 'a.gz', type: 'application/gzip' }), false);
});

test('one answer for what opens: the card, version control, history and the viewer share it', () => {
  for (const file of ['client/components/cards/attachments.js', 'client/components/boards/versionControlView.js',
    'client/components/history/historyTable.js']) {
    assert.match(read(file), /attachmentCanPreview\(/, file);
  }
  // Negative: no other copy of the list, anywhere in the client, to fall behind
  // (the history table's copy had already lost ZIP).
  const offenders = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) { walk(rel); continue; }
      if (/\.js$/.test(rel) && /kind\.isPDF\s*\|\|\s*kind\.isText/.test(read(rel))) offenders.push(rel);
    }
  };
  walk('client');
  assert.deepEqual(offenders, []);
});

test('lazy: the slideshow loads the viewer, and the viewer its libraries, only when such a file opens', () => {
  const card = read('client/components/cards/attachments.js');
  assert.doesNotMatch(card, /^import .*attachmentRichViewer/m);
  assert.match(card, /import\('\/client\/lib\/attachmentRichViewer'\)/);
  const src = read('client/lib/attachmentRichViewer.js');
  assert.doesNotMatch(src, /^import .*(papaparse|highlight\.js|dompurify|fflate|htmlparser2|icalendarFormat|outlookMsgFormat)/m);
  // Outlook .msg and OpenDocument are converted on the server: the client
  // loads no parser for them.
  assert.doesNotMatch(src, /htmlparser2|outlookMsgFormat/);
  for (const lib of ['papaparse', 'highlight.js/lib/common', 'dompurify', 'fflate']) {
    assert.ok(src.includes(`import('${lib}')`), lib);
  }
  const jade = read('client/components/cards/attachments.jade');
  assert.match(jade, /#rich-viewer\.hidden/);
  assert.match(jade, /template\(name="attachmentMarkdownPreview"\)\n {2}\+viewer\n {4}= text/);
  // Closing or moving on clears it like the ZIP and Office viewers.
  assert.match(card, /richPreviewAbortController\?\.abort\(\);[\s\S]*?richPreview\.destroy\(\);/);
});

// ---- the viewers ---------------------------------------------------------------

test('CSV: every row of a large file, no row limit - only the screen is fetched and drawn, the header pinned', async () => {
  const rows = ['Name,Note', ...Array.from({ length: 150000 }, (_, i) => `row ${i},"note, ${i}"`)];
  const csv = `${rows.join('\n')}\n`;
  const { container, view, log, bytes } = await open('csv', csv);
  const cells = row => texts(row.querySelectorAll('.attachment-csv-cell'));
  assert.deepEqual(cells(container.querySelector('.attachment-csv-header')), ['Name', 'Note']);
  assert.deepEqual(cells(container.querySelectorAll('.attachment-csv-row')[1]), ['row 0', 'note, 0']);
  assert.ok(container.querySelectorAll('.attachment-csv-row').length < 40, 'only the visible rows are in the page');
  await scrollTo(view, view.maxScroll);
  const shown = [...container.querySelectorAll('.attachment-csv-row')].map(cells);
  assert.deepEqual(shown[shown.length - 1], ['row 149999', 'note, 149999'], 'the last row of the file, no limit');
  assert.deepEqual(shown[0], ['Name', 'Note'], 'the header stays pinned');
  assert.ok(log.sent < bytes.length / 4, `only windows were fetched (${log.sent} of ${bytes.length})`);
  const tsv = await open('csv', 'a\tb\n1\t2\n', { extension: 'tsv' });
  assert.deepEqual(texts(tsv.container.querySelectorAll('.attachment-csv-row')[1].children), ['1', '2']);
  const html = await open('csv', 'a\n"<img src=x onerror=alert(1)>"\n');
  assert.equal(html.container.querySelector('img'), null, 'a cell is text, not HTML');
});

test('text: a .txt of any size is read windowed; a line longer than a row is many rows', async () => {
  const body = `${'start\n'}${'x'.repeat(20000)}\n${Array.from({ length: 50000 }, (_, i) => `t${i}`).join('\n')}`;
  const { container, view } = await open('text', body);
  // Rows are cut at the file's own multiples of MAX_ROW_BYTES, so the long line's
  // first row ends at byte 4096: 4090 x's after the 6 bytes of "start\n".
  assert.deepEqual(texts(container.querySelectorAll('.attachment-window-row')).slice(0, 3),
    ['start', 'x'.repeat(4090), 'x'.repeat(4096)]);
  await scrollTo(view, view.maxScroll);
  assert.equal(texts(container.querySelectorAll('.attachment-window-row')).pop(), 't49999');
});

test('code: coloured by highlight.js, as text - an HTML file is shown, never run', async () => {
  const { container } = await open('code', '<script>alert(1)</script><img src=x onerror=alert(2)>', { language: 'xml' });
  const row = container.querySelector('.attachment-window-row');
  assert.equal(row.textContent, '<script>alert(1)</script><img src=x onerror=alert(2)>');
  assert.equal(container.querySelector('script, img'), null);
  assert.ok(row.querySelector('span.hljs-tag'), 'coloured');
  for (const el of row.querySelectorAll('*')) {
    assert.equal(el.tagName, 'SPAN');
    assert.ok([...el.attributes].every(a => a.name === 'class'));
    assert.ok(String(el.className).split(/\s+/).filter(Boolean).every(c => /^hljs-/.test(c)));
  }
  assert.ok(container.querySelector('.viewer'), 'the card viewer\'s code colours apply');
  const json = await open('code', '{"a":[1,2]}', { language: 'json' });
  assert.deepEqual(texts(json.container.querySelectorAll('.attachment-window-row')), ['{', '  "a": [', '    1,', '    2', '  ]', '}']);
  // A large minified JSON is not parsed whole: it is shown as its text, windowed.
  const big = JSON.stringify(Array.from({ length: 60000 }, (_, i) => ({ i })));
  const minified = await open('code', big, { language: 'json' });
  assert.ok(minified.log.sent < big.length, 'not read whole');
  assert.equal(minified.container.querySelector('.attachment-window-row').textContent, big.slice(0, 4096));
  await assert.rejects(open('code', new Uint8Array([0x4d, 0x5a, 0, 0, 1]), { language: 'javascript' }), /Binary/);
});

test('Markdown: a file of one chunk is formatted by WeKan\'s +viewer; a larger one is shown windowed as its text', async () => {
  let given;
  let destroyed = false;
  const { preview, container } = await open('markdown', '# Title\n\n**bold**', {
    renderMarkdown(holder, text) { given = { holder, text }; return { destroy() { destroyed = true; } }; } });
  assert.equal(given.text, '# Title\n\n**bold**');
  assert.ok(container.contains(given.holder));
  preview.destroy();
  assert.equal(destroyed, true);
  let called = false;
  const large = `# Big\n\n${'para\n\n'.repeat(60000)}`;
  const big = await open('markdown', large, { renderMarkdown() { called = true; return { destroy() {} }; } });
  assert.equal(called, false);
  assert.equal(big.container.querySelector('.attachment-window-row').textContent, '# Big');
  assert.ok(big.log.sent < large.length);
});

function tarEntry(name, data = '', type = '0', prefix = '') {
  const header = new Uint8Array(512);
  const put = (text, at) => header.set(strToU8(text), at);
  const bytes = strToU8(data);
  put(name, 0); put('0000644', 100); put(bytes.length.toString(8).padStart(11, '0'), 124);
  put(type, 156); put('ustar', 257); put('00', 263); put(prefix, 345);
  put('        ', 148);
  const sum = header.reduce((a, b) => a + b, 0);
  put(`${sum.toString(8).padStart(6, '0')}\0 `, 148);
  const body = new Uint8Array(Math.ceil(bytes.length / 512) * 512);
  body.set(bytes);
  return [header, body];
}
const tar = entries => {
  const parts = entries.flatMap(e => tarEntry(...e));
  parts.push(new Uint8Array(1024));
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
};

test('tar and tar.gz: names as inert text, with GNU long names and pax paths, read as far as scrolled', async () => {
  const long = `deep/${'d'.repeat(150)}/file.txt`;
  const archive = tar([['src/', '', '5'], ['src/a.js', 'x = 1'], ['././@LongLink', `${long}\0`, 'L'], ['ignored', 'y'],
    ['PaxHeader', '28 path=pax/ünïcode.txt\n', 'x'], ['short', 'z'], ['b.txt', '', '0', 'pre/fix'], ['<img src=x onerror=alert(1)>', '']]);
  const small = await open('tar', gzipSync(archive));
  assert.deepEqual(texts(small.container.querySelectorAll('li')),
    ['src/', 'src/a.js', long, 'pax/ünïcode.txt', 'pre/fix/b.txt', '<img src=x onerror=alert(1)>']);
  assert.equal(small.container.querySelector('img'), null);
  // 30,000 members of 4 KB: no limit, and read only as far as scrolled.
  const many = tar(Array.from({ length: 30000 }, (_, i) => [`f${i}`, 'z'.repeat(4000)]));
  const big = await open('tar', many);
  assert.equal(big.container.querySelector('li').textContent, 'f0');
  assert.ok(big.log.sent < many.length / 10, `only the start was read (${big.log.sent} of ${many.length})`);
  for (let i = 0; i < 400 && big.view.rows.length < 30000; i += 1) await scrollTo(big.view, big.view.totalPx());
  assert.equal(big.view.rows.length, 30000, 'every name, no limit');
  assert.ok(big.container.querySelectorAll('li').length < 40, 'only the visible names are in the page');
  const empty = await open('tar', tar([]));
  assert.equal(empty.container.textContent, 'No results');
});

test('negative: a gzip bomb is not inflated past the screen, a damaged header ends the list, a non-tar is refused', async () => {
  const bomb = gzipSync(new Uint8Array(200 * 1024 * 1024)); // 200 MB of zeros: an empty tar
  const opened = await open('tar', bomb);
  assert.equal(opened.container.textContent, 'No results');
  const damaged = tar([['a', ''], ['b', '']]);
  damaged[512 + 1] ^= 1;
  const cut = await open('tar', damaged);
  assert.deepEqual(texts(cut.container.querySelectorAll('li')), ['a']);
  await assert.rejects(open('tar', new Uint8Array(1024).fill(65)), /tar/);
});

test('iCalendar: events and tasks as rows, read as far as scrolled', async () => {
  const event = n => ['BEGIN:VEVENT', `UID:e${n}`, `SUMMARY:Planning ${n} <b>`, 'DTSTART:20261201T090000Z',
    'DTEND:20261201T100000Z', 'BEGIN:VALARM', 'TRIGGER:-PT15M', 'END:VALARM', 'END:VEVENT'].join('\r\n');
  const ics = ['BEGIN:VCALENDAR', event(0), 'BEGIN:VTODO', 'UID:t1', 'SUMMARY:Write', '  report', 'DUE:20261205T170000Z',
    'END:VTODO', ...Array.from({ length: 20000 }, (_, i) => event(i + 1)), 'END:VCALENDAR'].join('\r\n');
  const { container, view, log } = await open('calendar', ics);
  const rows = () => [...container.querySelectorAll('.attachment-csv-row')].map(r => texts(r.children));
  assert.deepEqual(rows()[0], ['Title', 'Start', 'End', 'Due', 'Description']);
  assert.equal(rows()[1][0], 'Planning 0 <b>');
  assert.ok(rows()[1][2] && !rows()[1][3], 'an event has an end, not a due date');
  assert.equal(rows()[2][0], 'Write report', 'a folded line is unfolded: its first space is the fold (RFC 5545)');
  assert.ok(!rows()[2][2] && rows()[2][3], 'a task has a due date');
  assert.equal(container.querySelector('b'), null);
  assert.ok(log.sent < ics.length / 4, 'read only as far as scrolled');
  for (let i = 0; i < 400 && !view.done; i += 1) await scrollTo(view, view.totalPx());
  assert.equal(view.rows.length, 20002, 'every event, no limit');
  await assert.rejects(open('calendar', 'not a calendar\r\n'), /iCalendar/);
});

// Outlook .msg and OpenDocument are converted on the server
// (server/lib/attachmentPreviewStore.js); the slideshow reads the converted rows
// through <link>/preview-meta, -index and -rows, with Range.
const os = require('node:os');
const PREVIEW_TMP = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'wekan-richpreview-'));
process.env.WRITABLE_PATH = PREVIEW_TMP;
test.after(() => fs.rmSync(PREVIEW_TMP, { recursive: true, force: true }));
const previewStore = require('../server/lib/attachmentPreviewStore.js');
let previews = 0;

async function openPreview(rich, bytes, extra = {}) {
  const strategy = { getReadStream: r => require('node:stream').Readable.from([Buffer.from(bytes.subarray(r.start, r.end + 1))]) };
  const made = await previewStore.ensurePreview({ _id: `p${(previews += 1)}`, size: bytes.length }, strategy, rich);
  const log = { requests: 0, sent: 0 };
  const fetchImpl = async (url, { headers = {} } = {}) => {
    log.requests += 1;
    const part = /\/preview-(meta|index|rows)$/.exec(url)[1];
    if (part === 'meta') return new Response(JSON.stringify({ kind: made.info.kind, count: made.info.count, truncated: made.info.truncated }));
    const file = fs.readFileSync(part === 'index' ? made.index : made.rows);
    const m = /^bytes=(\d+)-(\d+)$/.exec(headers.Range || '');
    const slice = file.subarray(Number(m[1]), Number(m[2]) + 1);
    log.sent += slice.length;
    return new Response(slice, { status: 206 });
  };
  const container = dom.window.document.createElement('div');
  const preview = await viewer.openRichAttachment({ container, rich, url: '/cdn/storage/attachments/x', size: bytes.length,
    signal: { aborted: false }, labels: LABELS, fetchImpl, viewportHeight: 400, ...extra });
  return { container, preview, view: preview.view, log, made };
}

test('Outlook .msg: who, what and when, the attachments\' names, and the text, from the server\'s converted rows', async () => {
  const { container } = await openPreview('outlook', sampleMsg());
  const rows = [...container.querySelectorAll('.attachment-preview-field')].map(r => texts(r.children));
  assert.ok(rows.some(([l, v]) => l === 'Subject' && v === 'Quarterly plan'), JSON.stringify(rows));
  assert.ok(rows.some(([l, v]) => l === 'From' && /megan@contoso\.com/i.test(v)));
  assert.ok(rows.some(([l, v]) => l === 'Attachments' && v === 'plan.xlsx'));
  assert.ok(texts(container.querySelectorAll('.attachment-window-row')).includes('Here is the plan.'));
});

test('a converted preview of any length: the scrollbar is exactly its rows, and only the visible ones are fetched', async () => {
  const body = Array.from({ length: 200000 }, (_, i) => `Line ${i}`).join('\r\n');
  const { container, view, log, made } = await openPreview('outlook', sampleMsg({ body, big: 10 }));
  assert.equal(view.count, made.info.count);
  const shown = () => texts(container.querySelectorAll('.attachment-window-row'));
  assert.ok(container.querySelectorAll('.attachment-window-row').length <= view.visibleCount(), 'only the visible rows are drawn');
  const rowsFile = fs.statSync(made.rows).size;
  view.scroller.scrollTop = Math.round(view.maxScroll / 2);
  await view.update();
  const middle = view.first;
  assert.ok(Math.abs(middle - (made.info.count - view.visibleCount() + 1) / 2) <= 2, `the middle of the scrollbar is the middle row (${middle})`);
  assert.ok(shown().some(t => /^Line \d+$/.test(t)));
  view.scroller.scrollTop = view.maxScroll;
  await view.update();
  assert.equal(shown().pop(), 'Line 199999', 'the end is the last row');
  assert.ok(log.sent < rowsFile / 20, `only windows of the rows were fetched (${log.sent} of ${rowsFile})`);
});

const ODF = (body, prefix = 'text') => `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
 xmlns:${prefix}="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
 xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
 xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"><office:body>${body}</office:body></office:document-content>`;
const odfFile = xml => zipSync({ mimetype: [strToU8('application/vnd.oasis.opendocument.text'), { level: 0 }], 'content.xml': strToU8(xml) });

test('OpenDocument: headings, paragraphs, sheets and slides as rows - text, never markup', async () => {
  const xml = ODF('<office:text><text:h>Plan</text:h><text:p>&lt;b&gt;four&lt;/b&gt;</text:p>'
    + '<table:table table:name="Sheet1"><table:table-row><table:table-cell><text:p>a</text:p></table:table-cell>'
    + '<table:table-cell table:number-columns-repeated="2"><text:p>b</text:p></table:table-cell></table:table-row></table:table>'
    + '<draw:page draw:name="Intro"/></office:text>');
  const { container } = await openPreview('opendocument', odfFile(xml));
  assert.equal(container.querySelector('.attachment-preview-heading').textContent, 'Plan');
  assert.ok(texts(container.querySelectorAll('.attachment-window-row')).includes('<b>four</b>'));
  assert.equal(container.querySelector('b'), null);
  assert.deepEqual(texts(container.querySelectorAll('.attachment-csv-row')[0].children), ['a', 'b', 'b']);
  assert.deepEqual(texts(container.querySelectorAll('.attachment-preview-page')), ['Sheet1', 'Intro']);
  const renamed = await openPreview('opendocument', odfFile(ODF('<office:text><t:p>Renamed</t:p></office:text>', 't')));
  assert.ok(texts(renamed.container.querySelectorAll('.attachment-window-row')).includes('Renamed'), 'another prefix, the same namespace');
});

test('negative: a preview the server cannot make, or refuses, is an error - not a blank slide', async () => {
  const container = dom.window.document.createElement('div');
  const fetchImpl = async () => new Response('', { status: 422 });
  await assert.rejects(viewer.openRichAttachment({ container, rich: 'opendocument', url: '/x', size: 10, fetchImpl,
    signal: { aborted: false }, labels: LABELS }), /422/);
  await assert.rejects(previewStore.ensurePreview({ _id: 'bad', size: 100 },
    { getReadStream: () => require('node:stream').Readable.from([Buffer.alloc(100)]) }, 'opendocument'), /ZIP/);
});

test('negative: a refused download, and a slide already left, are not rendered', async () => {
  await assert.rejects(open('csv', 'a,b', { server: { status: 403 } }), /403/);
  const container = dom.window.document.createElement('div');
  const { fetchImpl } = rangeServer(new TextEncoder().encode('a,b'));
  container.textContent = 'Loading';
  await viewer.openRichAttachment({ container, rich: 'csv', url: '/f', size: 3, fetchImpl, signal: { aborted: true } });
  assert.equal(container.textContent, 'Loading', 'a slide already left is not touched');
});

test('negative: no row, entry or size limit is left in the viewers', () => {
  const src = read('client/lib/attachmentRichViewer.js') + read('client/lib/zipAttachmentViewer.js');
  assert.doesNotMatch(src, /MAX_TABLE_ROWS|MAX_ARCHIVE_ENTRIES|MAX_ZIP_ENTRIES|MORE_MARK|readBoundedResponse/);
  // Nothing reads a file whole any more: the scattered formats are converted on the server.
  assert.equal((src.match(/assertSourceSize\(/g) || []).length, 0);
});
