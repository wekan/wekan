'use strict';
const assert = require('node:assert/strict');
const { zipSync, strToU8 } = require('fflate');

(async () => {
  const { listZipEntries, openZipAttachment, MAX_ZIP_ENTRIES } = await import('../client/lib/zipAttachmentViewer.js');
  const { attachmentKind } = await import('../models/lib/attachmentKind.js');
  const names = ['folder/', 'folder/hello.txt', '日本語.txt', '../outside', '<img onerror=alert(1)>'];
  const bytes = zipSync(Object.fromEntries(names.map(name => [name, strToU8('hello')])));
  assert.deepEqual(listZipEntries(bytes), names);
  assert.deepEqual(listZipEntries(zipSync({})), []);
  assert.throws(() => listZipEntries(new Uint8Array(21)));
  assert.throws(() => listZipEntries(new Uint8Array(100)));
  assert.throws(() => listZipEntries(new Uint8Array(32 * 1024 * 1024 + 1)), RangeError);
  assert.throws(() => listZipEntries(zipSync(Object.fromEntries(
    Array.from({ length: MAX_ZIP_ENTRIES + 1 }, (_, i) => [`${i}`, new Uint8Array()])))), RangeError);
  // Corrupt DEFLATE bytes: listing must never attempt to inflate the payload.
  const corrupt = zipSync({ bomb: strToU8('a'.repeat(10000)) });
  corrupt.fill(255, 34, 40);
  assert.deepEqual(listZipEntries(corrupt), ['bomb']);
  for (const doc of [{ name: 'a.ZIP' }, { type: 'application/zip' },
    { name: 'a.zip', type: 'application/octet-stream' }, { type: 'application/x-zip-compressed' }]) {
    assert.equal(attachmentKind(doc).isZIP, true);
  }
  assert.equal(attachmentKind({ name: 'a.zip', type: 'image/png' }).isZIP, false);
  assert.equal(attachmentKind({ name: 'a.docx' }).isZIP, false);
  const originalFetch = global.fetch;
  try {
    global.fetch = async () => new Response('', { status: 403 });
    await assert.rejects(openZipAttachment({ size: 0, url: '/private' }), /403/);
    global.fetch = async () => new Response(bytes);
    // A response finishing after close must not touch the detached viewer.
    await openZipAttachment({ url: '/zip', signal: { aborted: true } });
    const node = () => ({ children: [], appendChild(child) { this.children.push(child); },
      replaceChildren() { this.children = []; } });
    const container = node();
    container.ownerDocument = { createElement: node };
    await openZipAttachment({ container, url: '/zip', signal: { aborted: false } });
    assert.deepEqual(container.children[0].children.map(item => item.textContent), names);
    assert.ok(container.children[0].children.every(item => !('innerHTML' in item)));
  } finally { global.fetch = originalFetch; }
  console.log('zipAttachmentViewer: listing, limits, inert names, authorization and cancellation pass');
})().catch(error => { console.error(error); process.exitCode = 1; });
