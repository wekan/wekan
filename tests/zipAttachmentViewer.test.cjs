'use strict';
// A ZIP attachment's names in the slideshow (client/lib/zipAttachmentViewer.js):
// read through HTTP Range requests - the end of the file, then the central
// directory as far as it is scrolled - with no entry inflated or downloaded,
// and no limit on how many names. ZIP64 too.
// Run: node tests/zipAttachmentViewer.test.cjs
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { zipSync, strToU8 } = require('fflate');
const { rangeServer } = require('./lib/rangeServer.cjs');

const doc = new JSDOM('<!doctype html><body></body>').window.document;

// The same archive with its end records in ZIP64 form, as an archive of more
// than 65535 entries or 4 GB has them.
function asZip64(zip) {
  const view = Buffer.from(zip);
  const at = view.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const count = view.readUInt16LE(at + 10);
  const size = view.readUInt32LE(at + 12);
  const offset = view.readUInt32LE(at + 16);
  const z64 = Buffer.alloc(56);
  z64.writeUInt32LE(0x06064b50, 0); z64.writeBigUInt64LE(44n, 4);
  z64.writeBigUInt64LE(BigInt(count), 24); z64.writeBigUInt64LE(BigInt(count), 32);
  z64.writeBigUInt64LE(BigInt(size), 40); z64.writeBigUInt64LE(BigInt(offset), 48);
  const loc = Buffer.alloc(20);
  loc.writeUInt32LE(0x07064b50, 0); loc.writeBigUInt64LE(BigInt(at), 8); loc.writeUInt32LE(1, 16);
  const eocd = Buffer.from(view.subarray(at));
  eocd.writeUInt16LE(0xffff, 8); eocd.writeUInt16LE(0xffff, 10);
  eocd.writeUInt32LE(0xffffffff, 12); eocd.writeUInt32LE(0xffffffff, 16);
  return new Uint8Array(Buffer.concat([view.subarray(0, at), z64, loc, eocd]));
}

async function open(bytes, extra = {}) {
  const container = doc.createElement('div');
  const { fetchImpl, log } = rangeServer(bytes, extra.server);
  const preview = await openZip({ container, url: '/zip', size: bytes.length, signal: { aborted: false },
    emptyMessage: 'No results', fetchImpl, viewportHeight: 400, ...extra });
  return { container, preview, log, view: preview.view };
}

let openZip;
(async () => {
  ({ openZipAttachment: openZip } = await import('../client/lib/zipAttachmentViewer.js'));
  const { attachmentKind } = await import('../models/lib/attachmentKind.js');
  const names = ['folder/', 'folder/hello.txt', '日本語.txt', '../outside', '<img onerror=alert(1)>'];
  const bytes = zipSync(Object.fromEntries(names.map(name => [name, strToU8('hello')])));

  const shown = c => [...c.querySelectorAll('li')].map(li => li.textContent);
  let o = await open(bytes);
  assert.deepEqual(shown(o.container), names);
  assert.equal(o.container.querySelector('img'), null, 'names are inert text');
  o = await open(asZip64(bytes));
  assert.deepEqual(shown(o.container), names, 'ZIP64 end records are read');
  o = await open(zipSync({}));
  assert.equal(o.container.textContent, 'No results');

  // 20,000 entries beside 8 MB of data: no limit, the data never downloaded,
  // and the directory read only as far as it is scrolled.
  const files = Object.fromEntries(Array.from({ length: 20000 }, (_, i) => [`dir/file-${i}.txt`, strToU8('x')]));
  files['big.bin'] = [new Uint8Array(8 * 1024 * 1024).map((_, i) => (i * 7919) % 251), { level: 0 }];
  const big = zipSync(files);
  o = await open(big);
  assert.equal(shown(o.container)[0], 'dir/file-0.txt');
  // Reads are whole 256 KB chunks (attachmentWindow.js CHUNK_BYTES), so the end
  // records and the directory's start are a few chunks - never the 8 MB.
  assert.ok(o.log.sent < 1024 * 1024, `the data was not downloaded (${o.log.sent} of ${big.length})`);
  for (let i = 0; i < 400 && !o.view.done; i += 1) { o.view.scroller.scrollTop = o.view.totalPx(); await o.view.update(); }
  assert.equal(o.view.rows.length, 20001, 'every name, no limit');
  assert.ok(o.container.querySelectorAll('li').length < 40, 'only the visible names are in the page');
  assert.ok(o.log.sent < 2 * 1024 * 1024, `still only the directory (${o.log.sent})`);
  o.preview.destroy();
  assert.equal(o.container.children.length, 0, 'closing clears it');

  // Negative: not a ZIP, a directory pointing outside the file, a refused download.
  await assert.rejects(open(new Uint8Array(21)), /ZIP/);
  await assert.rejects(open(new Uint8Array(100)), /ZIP/);
  const broken = Buffer.from(bytes);
  broken.writeUInt32LE(0x7fffffff, broken.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06])) + 16);
  await assert.rejects(open(new Uint8Array(broken)), /outside the file/);
  await assert.rejects(open(bytes, { server: { status: 403 } }), /403/);
  // A response finishing after close must not touch the detached viewer.
  const container = doc.createElement('div');
  container.textContent = 'Loading';
  const { fetchImpl } = rangeServer(bytes);
  await openZip({ container, url: '/zip', size: bytes.length, signal: { aborted: true }, fetchImpl });
  assert.equal(container.textContent, 'Loading');

  for (const d of [{ name: 'a.ZIP' }, { type: 'application/zip' },
    { name: 'a.zip', type: 'application/octet-stream' }, { type: 'application/x-zip-compressed' }]) {
    assert.equal(attachmentKind(d).isZIP, true);
  }
  assert.equal(attachmentKind({ name: 'a.zip', type: 'image/png' }).isZIP, false);
  assert.equal(attachmentKind({ name: 'a.docx' }).isZIP, false);
  console.log('zipAttachmentViewer: Range listing, ZIP64, no limit, inert names, authorization and cancellation pass');
})().catch(error => { console.error(error); process.exitCode = 1; });
