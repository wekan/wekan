'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Readable, PassThrough } = require('node:stream');
const { snapshotRuleEmailAttachments: snapshot, validateRuleEmailAttachments: validate, MAX_ATTACHMENT_BYTES } = require('../server/lib/ruleEmailAttachments');

test('snapshots preserve binary bytes and survive JSON without paths or streams', async () => {
  const bytes = Buffer.from([0, 255, 128, 10, 13]);
  const files = [{ name: '../unsafe\nname.bin', type: 'application/octet-stream' }, { name: 'empty.txt', type: 'text/plain' }];
  const opened = [];
  const result = await snapshot(files, file => { const stream = Readable.from(file === files[0] ? [bytes.subarray(0, 2), bytes.subarray(2)] : []); opened.push(stream); return stream; });
  assert.equal(result[0].filename, 'unsafename.bin');
  assert.deepEqual(Buffer.from(result[0].content, 'base64'), bytes);
  assert.equal(result[1].content, '');
  assert.deepEqual(validate(JSON.parse(JSON.stringify(result))), result);
  bytes.fill(0); assert.equal(result[0].content, 'AP+ACg0=');
  assert.ok(opened.every(stream => stream.destroyed));
});
test('missing, failing, oversized and stalled reads reject the whole snapshot and close streams', async () => {
  await assert.rejects(snapshot([{}], () => null), /unavailable/);
  const broken = Readable.from((async function* () { yield Buffer.from('partial'); throw new Error('backend failed'); })());
  await assert.rejects(snapshot([{}], () => broken), /backend failed/); assert.ok(broken.destroyed);
  const large = Readable.from([Buffer.alloc(MAX_ATTACHMENT_BYTES), Buffer.from('one byte too many')]);
  await assert.rejects(snapshot([{}], () => large), /too-large/); assert.ok(large.destroyed);
  const stalled = new PassThrough();
  await assert.rejects(snapshot([{}], () => stalled, { timeoutMs: 10 }), /timeout/); assert.ok(stalled.destroyed);
  let opened = false;
  await assert.rejects(snapshot(Array(101).fill({}), () => { opened = true; }), /too-many/); assert.equal(opened, false);
});
test('durable attachments reject paths, URLs, headers, noncanonical data and aggregate overflow', () => {
  const item = { filename: 'a', contentType: 'text/plain', encoding: 'base64', content: 'YQ==' };
  for (const changes of [{ path: '/secret' }, { href: 'https://example.org' }, { filename: '../a' },
    { filename: 'a\r\nBcc: x' }, { contentType: 'text/plain\nHeader' }, { encoding: 'utf8' }, { content: 'YQ' }, { content: '%' }]) {
    assert.throws(() => validate([{ ...item, ...changes }]), /invalid/);
  }
  const content = Buffer.alloc(MAX_ATTACHMENT_BYTES / 2 + 1).toString('base64');
  assert.throws(() => validate([{ ...item, content }, { ...item, content }]), /too-large/);
});
