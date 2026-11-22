'use strict';
// The attachment slideshow's own viewers (client/lib/attachmentRichViewer.js):
// Markdown, CSV/TSV, source code and JSON, iCalendar, Outlook .msg, tar and
// OpenDocument, each loaded only when such a file is opened. Driven here end
// to end - download, parse, render - in a jsdom document, with a fake fetch.
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

async function open(rich, body, extra = {}) {
  const container = dom.window.document.createElement('div');
  const originalFetch = global.fetch;
  global.fetch = async () => new Response(body);
  try {
    const preview = await viewer.openRichAttachment({ container, rich, url: '/f', signal: { aborted: false },
      labels: LABELS, ...extra });
    return { container, preview };
  } finally { global.fetch = originalFetch; }
}

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
  assert.doesNotMatch(src, /^import .*(papaparse|highlight\.js|dompurify|fflate|icalendarFormat|outlookMsgFormat)/m);
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

test('CSV and TSV: a table of text, with quoted cells, cut off with a mark', async () => {
  const { container } = await open('csv', 'Name,Note\n"Smith, Jo","<img src=x onerror=alert(1)>"\n');
  const cells = [...container.querySelectorAll('th, td')].map(c => c.textContent);
  assert.deepEqual(cells, ['Name', 'Note', 'Smith, Jo', '<img src=x onerror=alert(1)>']);
  assert.equal(container.querySelector('img'), null, 'a cell is text, not HTML');
  const tsv = await open('csv', 'a\tb\n1\t2\n', { extension: 'tsv' });
  assert.deepEqual([...tsv.container.querySelectorAll('td')].map(c => c.textContent), ['1', '2']);
  const big = await open('csv', Array.from({ length: viewer.MAX_TABLE_ROWS + 50 }, (_, i) => `${i},x`).join('\n'));
  const rows = big.container.querySelectorAll('tr');
  assert.equal(rows.length, viewer.MAX_TABLE_ROWS + 1);
  assert.equal(rows[rows.length - 1].textContent, viewer.MORE_MARK);
});

test('code: coloured by highlight.js, as text - an HTML file is shown, never run', async () => {
  const { container } = await open('code', '<script>alert(1)</script><img src=x onerror=alert(2)>', { language: 'xml' });
  const code = container.querySelector('code');
  assert.equal(code.textContent, '<script>alert(1)</script><img src=x onerror=alert(2)>');
  assert.equal(container.querySelector('script, img'), null);
  assert.ok(code.querySelector('span.hljs-tag'), 'coloured');
  for (const el of code.querySelectorAll('*')) {
    assert.equal(el.tagName, 'SPAN');
    assert.ok([...el.attributes].every(a => a.name === 'class'));
    assert.ok(String(el.className).split(/\s+/).filter(Boolean).every(c => /^hljs-/.test(c)));
  }
  assert.ok(container.querySelector('.viewer'), 'the card viewer\'s code colours apply');
  const json = await open('code', '{"a":[1,2]}', { language: 'json' });
  assert.equal(json.container.querySelector('code').textContent, '{\n  "a": [\n    1,\n    2\n  ]\n}');
  const plain = await open('code', 'FROM node', { language: 'plaintext' });
  assert.equal(plain.container.querySelector('code').textContent, 'FROM node');
  assert.equal(plain.container.querySelector('code span'), null);
  // Negative: a binary file is not shown as text.
  await assert.rejects(open('code', new Uint8Array([0x4d, 0x5a, 0, 0, 1]), { language: 'javascript' }), /Binary/);
});

test('Markdown: handed to the caller\'s renderer (WeKan\'s +viewer), and destroyed with the slide', async () => {
  let given;
  let destroyed = false;
  const { container, preview } = await open('markdown', '# Title\n\n**bold**', {
    renderMarkdown(holder, text) { given = { holder, text }; return { destroy() { destroyed = true; } }; } });
  assert.equal(given.text, '# Title\n\n**bold**');
  assert.ok(container.contains(given.holder));
  preview.destroy();
  assert.equal(destroyed, true);
  assert.equal(container.childNodes.length, 0);
});

test('iCalendar: events and tasks as a table, with their own dates', async () => {
  const ics = ['BEGIN:VCALENDAR', 'BEGIN:VEVENT', 'UID:e1', 'SUMMARY:Planning <b>', 'DTSTART:20261201T090000Z',
    'DTEND:20261201T100000Z', 'END:VEVENT', 'BEGIN:VTODO', 'UID:t1', 'SUMMARY:Write report', 'DUE:20261205T170000Z',
    'END:VTODO', 'END:VCALENDAR'].join('\r\n');
  const { container } = await open('calendar', ics);
  const rows = [...container.querySelectorAll('tr')].map(r => [...r.children].map(c => c.textContent));
  assert.deepEqual(rows[0], ['Title', 'Start', 'End', 'Due', 'Description']);
  assert.equal(rows[1][0], 'Planning <b>');
  assert.ok(rows[1][2] && !rows[1][3], 'an event has an end, not a due date');
  assert.equal(rows[2][0], 'Write report');
  assert.ok(!rows[2][2] && rows[2][3], 'a task has a due date');
  assert.equal(container.querySelector('b'), null);
  await assert.rejects(open('calendar', 'not a calendar'), /iCalendar/);
});

test('Outlook .msg: who, what and when, the text, and the names of its attachments', async () => {
  const { container } = await open('outlook', sampleMsg());
  const fields = [...container.querySelectorAll('dt, dd')].map(c => c.textContent);
  assert.ok(fields.includes('Subject') && fields.includes('Quarterly plan'), fields.join('|'));
  assert.ok(fields.some(f => f.includes('Megan@Contoso.com') || f.includes('megan@contoso.com')), fields.join('|'));
  assert.match(container.querySelector('.attachment-preview-mail-body').textContent, /Here is the plan/);
  assert.ok(container.querySelector('h3').textContent === 'Attachments');
  await assert.rejects(open('outlook', new Uint8Array(1024)));
});

// A tar header, as POSIX ustar writes one.
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

test('tar and tar.gz: the names, with GNU long names and pax paths, as inert text', async () => {
  const long = `deep/${'d'.repeat(150)}/file.txt`;
  const archive = tar([['src/', '', '5'], ['src/a.js', 'x = 1'], ['././@LongLink', `${long}\0`, 'L'], ['ignored', 'y'],
    ['PaxHeader', '28 path=pax/ünïcode.txt\n', 'x'], ['short', 'z'],
    ['b.txt', '', '0', 'pre/fix'], ['<img src=x onerror=alert(1)>', '']]);
  assert.deepEqual(viewer.listTarEntries(archive).names,
    ['src/', 'src/a.js', long, 'pax/ünïcode.txt', 'pre/fix/b.txt', '<img src=x onerror=alert(1)>']);
  const { container } = await open('tar', gzipSync(archive));
  assert.equal(container.querySelectorAll('li').length, 6);
  assert.equal(container.querySelector('img'), null);
  const empty = await open('tar', tar([]));
  assert.equal(empty.container.textContent, 'No results');
});

test('negative: a gzip bomb stops at the limit, and too many entries are cut off with a mark', () => {
  const { Gunzip } = require('fflate');
  const bomb = gzipSync(new Uint8Array(4 * 1024 * 1024));
  assert.throws(() => viewer.gunzipBounded(Gunzip, bomb, 1024 * 1024), RangeError);
  assert.equal(viewer.gunzipBounded(Gunzip, bomb).length, 4 * 1024 * 1024);
  const many = tar(Array.from({ length: viewer.MAX_ARCHIVE_ENTRIES + 5 }, (_, i) => [`f${i}`, '']));
  const listed = viewer.listTarEntries(many);
  assert.equal(listed.names.length, viewer.MAX_ARCHIVE_ENTRIES);
  assert.equal(listed.truncated, true);
  assert.throws(() => viewer.listTarEntries(new Uint8Array(512).fill(65)), /tar/);
  // A header whose checksum is wrong ends the listing: the rest is not trusted.
  const damaged = tar([['a', ''], ['b', '']]);
  damaged[512 + 1] ^= 1;
  assert.deepEqual(viewer.listTarEntries(damaged), { names: ['a'], truncated: true });
});

const ODF = (body, ns = '') => `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
 xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
 xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
 xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" ${ns}><office:body>${body}</office:body></office:document-content>`;
const odfFile = xml => zipSync({ mimetype: strToU8('application/vnd.oasis.opendocument.text'), 'content.xml': strToU8(xml) });

test('OpenDocument: text, spreadsheets and presentations, as headings, paragraphs and tables', async () => {
  const odt = ODF('<office:text><text:h>Plan</text:h><text:p>One<text:s text:c="3"/>two<text:tab/>three'
    + '<text:line-break/>&lt;b&gt;four&lt;/b&gt;</text:p><text:p/></office:text>');
  const text = await open('opendocument', odfFile(odt));
  assert.equal(text.container.querySelector('h3').textContent, 'Plan');
  assert.equal(text.container.querySelector('p').textContent, 'One   two\tthree\n<b>four</b>');
  assert.equal(text.container.querySelector('b'), null);

  const ods = ODF('<office:spreadsheet><table:table table:name="Sheet1"><table:table-row>'
    + '<table:table-cell><text:p>a</text:p></table:table-cell><table:table-cell table:number-columns-repeated="2"><text:p>b</text:p></table:table-cell>'
    + '<table:table-cell table:number-columns-repeated="16000"/></table:table-row>'
    + '<table:table-row table:number-rows-repeated="1048570"><table:table-cell table:number-columns-repeated="16384"/></table:table-row>'
    + '</table:table></office:spreadsheet>');
  const sheet = await open('opendocument', odfFile(ods));
  assert.equal(sheet.container.querySelector('h2').textContent, 'Sheet1');
  assert.deepEqual([...sheet.container.querySelectorAll('tr')].map(r => [...r.children].map(c => c.textContent)),
    [['a', 'b', 'b']], 'the empty rest of the grid is not content');

  const odp = ODF('<office:presentation><draw:page draw:name="Intro"><draw:frame><draw:text-box>'
    + '<text:p>Welcome</text:p></draw:text-box></draw:frame></draw:page><draw:page draw:name="Next"/></office:presentation>');
  const slides = await open('opendocument', odfFile(odp));
  assert.deepEqual([...slides.container.querySelectorAll('h2')].map(h => h.textContent), ['Intro', 'Next']);
  assert.equal(slides.container.querySelector('p').textContent, 'Welcome');
});

test('negative: an OpenDocument without content.xml, or with one past the limit, is refused', async () => {
  await assert.rejects(open('opendocument', zipSync({ mimetype: strToU8('x') })), /content\.xml/);
  const { unzipSync } = require('fflate');
  const huge = zipSync({ 'content.xml': new Uint8Array(viewer.MAX_INFLATED_BYTES + 1) });
  assert.throws(() => viewer.odfContentXml(unzipSync, huge), RangeError);
});

test('negative: a refused download, an oversized file and a slide already left are not rendered', async () => {
  const container = dom.window.document.createElement('div');
  const originalFetch = global.fetch;
  try {
    global.fetch = async () => new Response('', { status: 403 });
    await assert.rejects(viewer.openRichAttachment({ container, rich: 'csv', url: '/private', signal: {} }), /403/);
    await assert.rejects(viewer.openRichAttachment({ container, rich: 'csv', url: '/f', size: 33 * 1024 * 1024 }), RangeError);
    global.fetch = async () => new Response('a,b');
    container.textContent = 'Loading';
    await viewer.openRichAttachment({ container, rich: 'csv', url: '/f', signal: { aborted: true } });
    assert.equal(container.textContent, 'Loading', 'a slide already left is not touched');
  } finally { global.fetch = originalFetch; }
});
