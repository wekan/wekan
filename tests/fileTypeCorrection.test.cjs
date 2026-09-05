'use strict';

// General file-type detection helpers (models/lib/fileTypeCorrection.js). The core
// primitive is streamHeaderToTemp(): it copies only the first N bytes of a stream
// to a temp file (so a large file is never fully read) and cleans up the partial
// file on error. Detection uses JavaScript `file-type` first and the `file`
// binary as its fallback; both need a storage strategy, so
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

const { HEADER_BYTES, ensureTempDir, streamHeaderToTemp, detectedFileMime,
  sameStoredContent, disambiguateName } =
  require('../models/lib/fileTypeCorrection.js');
const { numberedName } = require('../models/lib/uploadFileName.js');

let passed = 0;
async function check(name, fn) { await fn(); passed += 1; console.log('  ok -', name); }

(async () => {
  console.log('fileTypeCorrection:');

  await check('HEADER_BYTES is a small, bounded header size', () => {
    assert.ok(HEADER_BYTES > 0 && HEADER_BYTES <= 1024 * 1024);
  });

  await check('the maintained JavaScript detector runs before libmagic fallback', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'models', 'lib',
      'fileTypeCorrection.js'), 'utf8');
    assert.match(source, /import\('file-type'\)/);
    assert.ok(source.indexOf("import('file-type')") < source.indexOf("execFile('file'"));
    assert.strictEqual(require('../package.json').dependencies['file-type'], '^22.0.2');
  });

  await check('JavaScript magic-byte detection identifies PNG content', async () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-ft-'));
    const png = path.join(base, 'wrong.txt');
    fs.writeFileSync(png, Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    ));
    assert.strictEqual(await detectedFileMime(png), 'image/png');
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

  // The strategy factory's storage decision, replayed. From the dev-server log:
  //
  //   [onAfterUpload] filename hardening failed: TypeError: Cannot read
  //   properties of undefined (reading 'gridFsFileId')
  //       at FileStoreStrategyFactory.getFileStrategy (fileStoreStrategy.js:112)
  //       at detectStoredFileMime (fileTypeCorrection.js:120)
  //
  // A freshly uploaded file has no `meta` on its version - only a GridFS one
  // does - so EVERY upload threw there. onAfterUpload caught it and logged
  // "filename hardening failed", so the upload looked fine while the mime
  // detection and the filename correction were skipped for every new file.
  const storageOf = (fileObj, versionName, storage) => {
    if (!storage) {
      const version = (fileObj && fileObj.versions && fileObj.versions[versionName]) || {};
      const versionMeta = version.meta || {};
      const fileMeta = (fileObj && fileObj.meta) || {};
      storage = version.storage;
      if (!storage) {
        storage = (fileMeta.source === 'import' || versionMeta.gridFsFileId)
          ? 'gridfs' : 'filesystem';
      }
    }
    return storage;
  };

  await check('a freshly uploaded file resolves to filesystem instead of throwing', () => {
    assert.strictEqual(storageOf({ versions: { original: {} } }, 'original'), 'filesystem');
    assert.strictEqual(storageOf({ meta: {}, versions: { original: {} } }, 'original'), 'filesystem');
  });

  await check('the storage the document states still wins', () => {
    assert.strictEqual(storageOf({ versions: { original: { storage: 's3' } } }, 'original'), 's3');
    assert.strictEqual(storageOf({ versions: { original: {} } }, 'original', 'gridfs'), 'gridfs');
  });

  await check('an imported or GridFS file is still recognised', () => {
    assert.strictEqual(storageOf({ meta: { source: 'import' }, versions: { original: {} } }, 'original'), 'gridfs');
    assert.strictEqual(storageOf({ versions: { original: { meta: { gridFsFileId: 'abc' } } } }, 'original'), 'gridfs');
  });

  await check('a missing version, or no file at all, does not throw', () => {
    assert.strictEqual(storageOf({ versions: {} }, 'original'), 'filesystem');
    assert.strictEqual(storageOf({}, 'original'), 'filesystem');
    assert.strictEqual(storageOf(null, 'original'), 'filesystem');
  });

  await check('and the source reads those three places defensively', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'models/lib/fileStoreStrategy.js'), 'utf8');
    const fn = src.slice(src.indexOf('getFileStrategy(fileObj, versionName, storage)'), src.indexOf('getFileStrategy(fileObj, versionName, storage)') + 1600);
    assert.ok(fn.includes('const version = (fileObj && fileObj.versions && fileObj.versions[versionName]) || {};'));
    assert.ok(fn.includes('const versionMeta = version.meta || {};'));
    assert.ok(fn.includes('const fileMeta = (fileObj && fileObj.meta) || {};'));
    assert.ok(!src.includes('fileObj.versions[versionName].meta.gridFsFileId'),
      'the unguarded read that threw on every upload must not come back');
  });

  console.log(`\nfileTypeCorrection: ${passed} checks passed`);
})().catch(err => { console.error(err); process.exit(1); });
