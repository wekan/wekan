'use strict';

// Imported attachments stream into storage, never held whole in memory,
// within only the Admin Panel's upload limit (server/lib/importAttachmentStream.js).
// Run: node tests/importAttachmentStream.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable } = require('node:stream');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const { limitStream } = require('../server/lib/importAttachmentStream');

const collect = stream => new Promise((resolve, reject) => {
  const chunks = [];
  stream.on('data', chunk => chunks.push(chunk));
  stream.on('end', () => resolve(Buffer.concat(chunks)));
  stream.on('error', reject);
});

async function main() {
  let passed = 0;
  const test = async (name, fn) => { await fn(); passed += 1; console.log('  ok -', name); };

  await test('with no limit the stream passes through unchanged, however large', async () => {
    const source = Readable.from([Buffer.alloc(1024, 1), Buffer.alloc(4096, 2)]);
    assert.equal(limitStream(source, 0), source);
    assert.equal((await collect(limitStream(Readable.from([Buffer.alloc(10)]), 0))).length, 10);
  });

  await test('within the limit every byte arrives', async () => {
    const out = await collect(limitStream(Readable.from([Buffer.alloc(600), Buffer.alloc(400)]), 1000));
    assert.equal(out.length, 1000);
  });

  await test('negative: past the limit the stream fails before the rest is read', async () => {
    let produced = 0;
    // 64 KB chunks, a 100 KB limit, 200 chunks on offer: reading stops after a
    // few, not after all 12.5 MB.
    const source = new Readable({ read() { produced += 1; this.push(produced > 200 ? null : Buffer.alloc(64 * 1024)); } });
    await assert.rejects(collect(limitStream(source, 100 * 1024)), /import-attachment-too-large/);
    assert.ok(produced < 20, `stopped early (${produced} chunks read)`);
  });

  await test('every import writer streams through it, with the Admin Panel limit', async () => {
    const helper = read('server/lib/importAttachmentStream.js');
    assert.match(helper, /const \{ getAttachmentUploadMaxBytes \} = require\('\/models\/attachments\.server'\);/);
    assert.match(helper, /if \(max && Number\.isFinite\(declaredSize\) && declaredSize > max\) \{/);
    assert.match(read('models/attachments.server.js'), /^export async function getAttachmentUploadMaxBytes\(\) \{/m);
    for (const file of ['models/wekanCreator.js', 'models/trelloCreator.js', 'models/server/scopedImporter.js']) {
      assert.match(read(file), /require\('\/server\/lib\/importAttachmentStream'\)/, file);
    }
    const wekan = read('models/wekanCreator.js');
    assert.match(wekan, /const stream = !att\.file && this\.attachmentStream \? this\.attachmentStream\(att\) : null;/);
    assert.match(wekan, /const stream = !bg\.file && this\.attachmentStream \? this\.attachmentStream\(bg\) : null;/, 'board backgrounds too');
    const zip = read('models/importZip.js');
    assert.match(zip, /creator\.attachmentStream = attachmentStream;/);
    assert.doesNotMatch(zip, /attachment\.file = bytes\.toString\('base64'\)/, 'negative: no zip attachment is put inline');
  });

  console.log(`\nimportAttachmentStream: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
