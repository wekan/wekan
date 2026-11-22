'use strict';
// The slideshow's converted previews (server/lib/attachmentPreviewStore.js):
// an Outlook .msg and an OpenDocument - whose content is scattered through the
// file - are read a piece at a time from their storage and written once as
// rows with an index, which the slideshow reads a screenful at a time
// (client/lib/attachmentRecords.js). Against a file-backed fake storage that
// counts what is read; previews go to a temporary WRITABLE_PATH.
// Run: node --test tests/attachmentPreviewStore.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { zipSync, strToU8 } = require('fflate');
const { sampleMsg, writeCompoundFile } = require('./lib/outlookMsgFixture.cjs');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const TMP = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'wekan-preview-'));
process.env.WRITABLE_PATH = TMP;
test.after(() => fs.rmSync(TMP, { recursive: true, force: true }));

const store = require('../server/lib/attachmentPreviewStore.js');
const { previewPartOf } = require('../models/lib/attachmentPreviewPath.js');

// A storage strategy over bytes: getReadStream({ start, end }) as the real
// ones (inclusive end), counting the bytes and the largest single read.
function storage(bytes) {
  const log = { reads: 0, bytes: 0, largest: 0 };
  return {
    log,
    getReadStream(range) {
      const a = range ? range.start : 0;
      const b = range ? range.end + 1 : bytes.length;
      log.reads += 1;
      log.bytes += b - a;
      log.largest = Math.max(log.largest, b - a);
      return require('node:stream').Readable.from([Buffer.from(bytes.subarray(a, b))]);
    },
  };
}

// The rows of a made preview, read back through its index.
function rowsOf(preview) {
  const index = fs.readFileSync(preview.index);
  const rows = fs.readFileSync(preview.rows);
  const out = [];
  for (let i = 0; i < preview.info.count; i += 1) {
    const a = Number(index.readBigUInt64LE(i * 8));
    const b = Number(index.readBigUInt64LE((i + 1) * 8));
    out.push(JSON.parse(rows.subarray(a, b).toString('utf8')));
  }
  assert.equal(Number(index.readBigUInt64LE(preview.info.count * 8)), rows.length, 'the last offset is the length');
  return out;
}

let n = 0;
const attachment = (bytes, name) => ({ _id: `att${(n += 1)}`, name, size: bytes.length, uploadedAt: '2026-11-22' });

test('Outlook .msg: the same message as the whole-file reader, read a piece at a time, attachment data never read', async () => {
  const msg = sampleMsg({ big: 5 * 1024 * 1024 });
  const s = storage(msg);
  const p = await store.ensurePreview(attachment(msg, 'm.msg'), s, 'outlook');
  const rows = rowsOf(p);
  const { readOutlookMsg } = require('../models/lib/outlookMsgFormat.js');
  const whole = readOutlookMsg(msg);
  const field = l => (rows.find(r => r.k === 'field' && r.l === l) || {}).v;
  assert.equal(field('subject'), whole.subject);
  assert.equal(field('from'), `${whole.from.name} <${whole.from.address}>`);
  assert.match(field('to'), /alex@contoso\.com/);
  assert.match(field('cc'), /lee@contoso\.com/);
  assert.equal(field('date'), whole.date);
  assert.deepEqual(rows.filter(r => r.k === 'file').map(r => r.v).sort(), ['Forwarded.msg', 'notes.txt', 'plan.xlsx']);
  assert.equal(rows.find(r => r.v === 'plan.xlsx').size, 5 * 1024 * 1024);
  assert.deepEqual(rows.filter(r => r.k === 'text').map(r => r.v), ['Here is the plan.', 'Comments welcome.']);
  assert.ok(s.log.bytes < 1024 * 1024, `the 5 MB attachment was not read (${s.log.bytes} of ${msg.length} bytes)`);
  assert.ok(s.log.largest <= store.BLOCK_BYTES, 'every read is one block');
});

test('Outlook .msg: a body of megabytes becomes rows as it streams; an HTML-only body becomes text', async () => {
  const body = Array.from({ length: 60000 }, (_, i) => `Line ${i} of a long message`).join('\r\n');
  const big = sampleMsg({ body, big: 10 });
  const p = await store.ensurePreview(attachment(big, 'b.msg'), storage(big), 'outlook');
  const text = rowsOf(p).filter(r => r.k === 'text').map(r => r.v);
  assert.equal(text.length, 60000);
  assert.equal(text[59999], 'Line 59999 of a long message');
  const html = sampleMsg({ body: null, big: 10,
    html: '<html><head><style>p{}</style><script>bad()</script></head><body><p>Hello &amp; welcome</p><div>Second<br>line</div></body></html>' });
  const h = await store.ensurePreview(attachment(html, 'h.msg'), storage(html), 'outlook');
  const hText = rowsOf(h).filter(r => r.k === 'text').map(r => r.v).filter(Boolean);
  assert.deepEqual(hText, ['Hello & welcome', 'Second', 'line']);
  assert.ok(!hText.join(' ').includes('bad()'), 'script and style are not text');
});

test('negative: what is not a Compound File, or whose sector chain loops, is refused - and leaves nothing behind', async () => {
  const bad = new Uint8Array(4096).fill(7);
  await assert.rejects(store.ensurePreview(attachment(bad, 'x.msg'), storage(bad), 'outlook'), /Compound File/);
  const looped = Buffer.from(sampleMsg());
  // The directory's chain points at itself.
  const dirStart = looped.readUInt32LE(0x30);
  const fatStart = looped.readUInt32LE(0x4c);
  looped.writeUInt32LE(dirStart, (fatStart + 1) * 512 + dirStart * 4);
  await assert.rejects(store.ensurePreview(attachment(looped, 'l.msg'), storage(new Uint8Array(looped)), 'outlook'), /loops/);
  const left = fs.readdirSync(store.previewRoot()).filter(f => f.includes('.tmp'));
  assert.deepEqual(left, [], 'no half-written preview is left');
});

const ODF = body => `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
 xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
 xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
 xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"><office:body>${body}</office:body></office:document-content>`;
const odf = (xml, extra = {}) => zipSync({ mimetype: [strToU8('application/vnd.oasis.opendocument.text'), { level: 0 }],
  ...extra, 'content.xml': strToU8(xml) });

test('OpenDocument: content.xml alone is read and parsed as a stream; paragraphs, headings, sheets and slides become rows', async () => {
  const xml = ODF('<office:text><text:h>Plan</text:h><text:p>One<text:s text:c="3"/>two<text:note><text:p>note</text:p></text:note></text:p>'
    + `<text:p>${'w'.repeat(2500)}</text:p>`
    + '<table:table table:name="Sheet1"><table:table-row><table:table-cell><text:p>a</text:p></table:table-cell>'
    + '<table:table-cell table:number-columns-repeated="16000"/></table:table-row>'
    + '<table:table-row table:number-rows-repeated="1048570"><table:table-cell table:number-columns-repeated="16384"/></table:table-row></table:table>'
    + '<draw:page draw:name="Intro"/></office:text>');
  const file = odf(xml, { 'Pictures/big.png': [new Uint8Array(6 * 1024 * 1024).map((_, i) => (i * 7919) % 251), { level: 0 }] });
  const s = storage(file);
  const rows = rowsOf(await store.ensurePreview(attachment(file, 'a.odt'), s, 'opendocument'));
  assert.deepEqual(rows.slice(0, 2), [{ k: 'h', v: 'Plan' }, { k: 'p', v: 'One   two' }], 'a footnote does not end its paragraph');
  assert.deepEqual(rows.slice(2, 5).map(r => r.v.length), [1000, 1000, 500], 'a long paragraph is display rows');
  assert.deepEqual(rows.slice(5), [{ k: 'page', v: 'Sheet1' }, { k: 'row', c: ['a'] }, { k: 'page', v: 'Intro' }],
    'the empty rest of the grid is not content');
  assert.ok(s.log.bytes < 1024 * 1024, `the 6 MB picture was not read (${s.log.bytes} of ${file.length})`);
});

test('negative: a row repeated past MAX_ROW_REPEAT is written that many times, not a billion', async () => {
  const xml = ODF('<office:spreadsheet><table:table table:name="S"><table:table-row table:number-rows-repeated="1000000000">'
    + '<table:table-cell><text:p>x</text:p></table:table-cell></table:table-row></table:table></office:spreadsheet>');
  const file = odf(xml);
  const p = await store.ensurePreview(attachment(file, 'r.ods'), storage(file), 'opendocument');
  assert.equal(p.info.count, 1 + store.MAX_ROW_REPEAT);
});

test('the disk guard: a preview that reaches the limit stops there and says so', () => {
  const dir = fs.mkdtempSync(path.join(TMP, 'w'));
  const w = new store.RowWriter(path.join(dir, 'r'), path.join(dir, 'i'), 100);
  let added = 0;
  while (w.add({ k: 'text', v: 'x'.repeat(20) })) added += 1;
  w.close();
  assert.ok(added > 0 && w.truncated && w.offset <= 100);
  assert.equal(fs.statSync(path.join(dir, 'i')).size, (added + 1) * 8);
});

test('made once: the second request reuses it; a changed file gets a new one; removal takes them all', async () => {
  const msg = sampleMsg({ big: 10 });
  const doc = attachment(msg, 'once.msg');
  const s = storage(msg);
  const first = await store.ensurePreview(doc, s, 'outlook');
  const reads = s.log.reads;
  const again = await store.ensurePreview(doc, s, 'outlook');
  assert.equal(s.log.reads, reads, 'nothing read again');
  assert.equal(again.key, first.key);
  // Two requests at once make it once.
  const fresh = attachment(msg, 'twice.msg');
  const s2 = storage(msg);
  await Promise.all([store.ensurePreview(fresh, s2, 'outlook'), store.ensurePreview(fresh, s2, 'outlook')]);
  const once = s2.log.reads;
  assert.ok(once > 0);
  const changed = await store.ensurePreview({ ...doc, size: doc.size, uploadedAt: '2026-11-23' }, storage(msg), 'outlook');
  assert.notEqual(changed.key, first.key);
  assert.equal(fs.existsSync(first.rows), false, 'the preview of the earlier file is removed');
  store.removePreviews(doc._id);
  assert.deepEqual(fs.readdirSync(store.previewRoot()).filter(f => f.startsWith(`${doc._id}.`)), []);
  await assert.rejects(store.ensurePreview(doc, s, 'csv'), /No preview conversion/);
});

test('the file server: preview parts only after every check the original has, and served inert', () => {
  assert.equal(previewPartOf('/abc/preview-meta'), 'meta');
  assert.equal(previewPartOf('/abc/preview-index?x=1'), 'index');
  assert.equal(previewPartOf('/abc/preview-rows'), 'rows');
  // Negative: a third segment is Meteor-Files' own path (<id>/<version>/<name>),
  // which never reaches the file server - the reason the parts are one segment.
  for (const bad of ['/abc/preview', '/abc/preview/meta', '/abc/preview-../x', '/abc/preview-rows/more', '/abc/thumbnail', '/abc/preview-other']) {
    assert.equal(previewPartOf(bad), null, bad);
  }
  const src = read('server/routes/universalFileServer.js');
  const at = name => src.indexOf(name);
  const route = at('const previewPart = previewPartOf(');
  assert.ok(route > 0);
  for (const check of ["isAuthorizedForBoard(req, board, attachment, 'file-server:cdn')", 'attachmentDownloadLimits.blocked',
    'attachment.size > attachmentDownloadLimits.maxBytes', 'isStorageReadEnabled(storageName)']) {
    assert.ok(at(check) > 0 && at(check) < route, `${check} comes before the preview`);
  }
  const serve = src.slice(at('async function serveAttachmentPreview'), at('function sendThumbnail('));
  assert.match(serve, /'X-Content-Type-Options': 'nosniff'/);
  assert.match(serve, /"default-src 'none'; sandbox;"/);
  assert.match(serve, /'Content-Type': 'application\/octet-stream'/);
  assert.match(serve, /parseRange\(req\.headers\.range, size\)/);
  assert.match(read('models/attachments.js'), /after\.remove\([\s\S]*?removePreviews\(doc && doc\._id\)/);
});
