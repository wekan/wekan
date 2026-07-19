'use strict';

// General file-type detection helpers (models/lib/fileTypeCorrection.js). The core
// primitive is streamHeaderToTemp(): it copies only the first N bytes of a stream
// to a temp file (so a large file is never fully read) and cleans up the partial
// file on error. Detection itself needs the `file` binary + a storage strategy, so
// here we unit-test the bounded-header streaming and temp-dir handling directly.
//
// Run: node tests/fileTypeCorrection.test.cjs

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Readable } = require('stream');
const Module = require('module');

// fileTypeCorrection -> uploadFileName -> '/imports/lib/fileNameDisplay' (Meteor
// absolute path). Map it so this runs under plain Node.
const origResolve = Module._resolveFilename;
Module._resolveFilename = function(request, ...rest) {
  if (request === '/imports/lib/fileNameDisplay') {
    return path.join(__dirname, '..', 'imports', 'lib', 'fileNameDisplay.js');
  }
  return origResolve.call(this, request, ...rest);
};

const { HEADER_BYTES, ensureTempDir, streamHeaderToTemp, sameStoredContent, disambiguateName } =
  require('../models/lib/fileTypeCorrection.js');
const { numberedName } = require('../models/lib/uploadFileName.js');

let passed = 0;
async function check(name, fn) { await fn(); passed += 1; console.log('  ok -', name); }

(async () => {
  console.log('fileTypeCorrection:');

  await check('HEADER_BYTES is a small, bounded header size', () => {
    assert.ok(HEADER_BYTES > 0 && HEADER_BYTES <= 1024 * 1024);
  });

  await check('ensureTempDir creates WRITABLE_PATH/files/temp sibling of storage', () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-ft-'));
    const storage = path.join(base, 'files', 'attachments');
    const tempDir = ensureTempDir(storage);
    assert.strictEqual(tempDir, path.join(base, 'files', 'temp'));
    assert.ok(fs.existsSync(tempDir), 'temp dir created');
  });

  await check('streamHeaderToTemp writes ONLY the first maxBytes, then stops', async () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-ft-'));
    const tempPath = path.join(base, 'head.bin');
    // A stream of 1000 bytes; we only want the first 10.
    const src = Readable.from([Buffer.alloc(400, 1), Buffer.alloc(600, 2)]);
    const out = await streamHeaderToTemp(src, tempPath, 10);
    assert.strictEqual(out, tempPath);
    assert.strictEqual(fs.statSync(tempPath).size, 10, 'only the header was written');
  });

  await check('streamHeaderToTemp removes the partial temp file on read error', async () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-ft-'));
    const tempPath = path.join(base, 'head.bin');
    const src = new Readable({ read() {} });
    // Emit some data then an error.
    process.nextTick(() => { src.push(Buffer.alloc(4, 9)); src.emit('error', new Error('boom')); });
    let threw = false;
    try {
      await streamHeaderToTemp(src, tempPath, 1024);
    } catch (e) {
      threw = true;
    }
    assert.ok(threw, 'rejects on error');
    assert.ok(!fs.existsSync(tempPath), 'partial temp file removed');
  });

  await check('numberedName appends -N before the extension, caps length', () => {
    assert.strictEqual(numberedName('document.pdf', 0), 'document.pdf');
    assert.strictEqual(numberedName('document.pdf', 1), 'document-1.pdf');
    assert.strictEqual(numberedName('document.pdf', 2), 'document-2.pdf');
    assert.ok(numberedName('x'.repeat(40) + '.pdf', 3).length <= 30);
  });

  await check('sameStoredContent: same size (+date) = same file; different = not', () => {
    assert.strictEqual(sameStoredContent({ size: 10 }, { size: 10 }), true);
    assert.strictEqual(sameStoredContent({ size: 10 }, { size: 20 }), false);
    const d = new Date('2020-01-01T00:00:00Z');
    assert.strictEqual(sameStoredContent({ size: 10, updatedAt: d }, { size: 10, updatedAt: d }), true);
    assert.strictEqual(sameStoredContent({ size: 10, updatedAt: d }, { size: 10, updatedAt: new Date('2021-01-01T00:00:00Z') }), false);
  });

  await check('disambiguateName numbers a different-content clash, shares name for same content', async () => {
    // Fake collection: "report.pdf" already taken by a DIFFERENT file (size 999).
    const docs = [{ _id: 'other', name: 'report.pdf', size: 999 }];
    const coll = { findOneAsync: async q => docs.find(d => d._id !== q._id['$ne'] && d.name === q.name) || null };
    const me = { _id: 'me', name: 'report.pdf', size: 10 };
    assert.strictEqual(await disambiguateName(coll, me, 'report.pdf'), 'report-1.pdf');
    // Same content (same size) -> share the name, no numbering.
    const sameColl = { findOneAsync: async q => (q.name === 'report.pdf' ? { _id: 'other', name: 'report.pdf', size: 10 } : null) };
    assert.strictEqual(await disambiguateName(sameColl, me, 'report.pdf'), 'report.pdf');
    // No clash -> unchanged.
    const emptyColl = { findOneAsync: async () => null };
    assert.strictEqual(await disambiguateName(emptyColl, me, 'unique.pdf'), 'unique.pdf');
  });

  console.log(`\nfileTypeCorrection: ${passed} checks passed`);
})().catch(err => { console.error(err); process.exit(1); });
