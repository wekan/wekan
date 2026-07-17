'use strict';

// Plain-Node regression guard (no Meteor) for issue #6473: after the snap's
// MongoDB -> FerretDB migration ALL attachments were missing, even though the
// migration reported success.
//
// Root causes covered here:
//  1. Real CollectionFS (old WeKan) stores the GridFS file id at
//     copies.<bucketName>.key (store named after the bucket). The importers
//     only looked at original.gridFsFileId / gridFsFileId / copies.gridfs.key,
//     NONE of which exist in that layout — so every filerecord resolved to "no
//     GridFS id" and was silently skipped (modern importer) or extracted
//     without ever creating an attachment record (mongo3 importer).
//  2. The modern importer's CollectionFS phase iterated cfs.<bucket>.filerecord
//     and never noticed when that collection was missing — nothing at all was
//     extracted while cfs_gridfs.<bucket>.files was full of data.
//  3. The modern importer's Meteor-Files phase only matched
//     versions.original.storage === 'gridfs', missing records that carry only
//     a versions.*.meta.gridFsFileId reference — the same records WeKan's own
//     getFileStrategy serves from GridFS.
//  4. The mongo3 importer created records without meta.cardId/boardId
//     (CollectionFS keeps them at the record's top level), so even created
//     records were attached to no card.
//
// The resolveCfsGridFsId helper is extracted from each importer's source text
// and exercised BEHAVIORALLY (positive and negative cases) in a VM, so these
// tests fail if the function regresses, not only if it is renamed.
// Run: node tests/migrationAttachmentExtraction.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const IMPORTERS = {
  modern: 'releases/migrate-mongodb-to-ferretdb.mjs',
  mongo3: 'snap-src/bin/migrate-mongo3-to-ferretdb.mjs',
  gridfsToFs: 'snap-src/bin/migrate-gridfs-to-fs.mjs',
};

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// Extract the resolveCfsGridFsId function from an importer's source and compile
// it standalone (the importers are side-effectful scripts that cannot be
// imported directly — they start HTTP servers and connect to databases).
function loadResolver(rel) {
  const src = read(rel);
  const m = src.match(/function resolveCfsGridFsId\(record, bucketName\) \{[\s\S]*?\n\}/);
  assert.ok(m, `resolveCfsGridFsId found in ${rel}`);
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${m[0]}; __resolve = resolveCfsGridFsId;`, context);
  assert.strictEqual(typeof context.__resolve, 'function');
  return context.__resolve;
}

for (const [label, rel] of Object.entries(IMPORTERS)) {
  const resolve = loadResolver(rel);

  test(`[${label}] resolves the REAL CollectionFS layout: copies.<bucket>.key`, () => {
    // This is the exact shape old WeKan's FS.Store.GridFS('attachments') wrote.
    const fr = {
      _id: 'rec1',
      original: { name: 'photo.png', size: 123, type: 'image/png' },
      copies: { attachments: { key: '507f1f77bcf86cd799439011', name: 'photo.png' } },
    };
    assert.strictEqual(resolve(fr, 'attachments'), '507f1f77bcf86cd799439011');
  });

  test(`[${label}] resolves copies.avatars.key for the avatars bucket`, () => {
    const fr = { copies: { avatars: { key: 'av1' } } };
    assert.strictEqual(resolve(fr, 'avatars'), 'av1');
  });

  test(`[${label}] the bucket-named copy wins over other copies`, () => {
    const fr = { copies: { thumbs: { key: 'thumb-key' }, attachments: { key: 'main-key' } } };
    assert.strictEqual(resolve(fr, 'attachments'), 'main-key');
  });

  test(`[${label}] original.gridFsFileId still has top priority`, () => {
    const fr = {
      original: { gridFsFileId: 'direct-id' },
      copies: { attachments: { key: 'copy-id' } },
    };
    assert.strictEqual(resolve(fr, 'attachments'), 'direct-id');
  });

  test(`[${label}] legacy copies.gridfs.key still resolves`, () => {
    const fr = { copies: { gridfs: { key: 'legacy-id' } } };
    assert.strictEqual(resolve(fr, 'attachments'), 'legacy-id');
  });

  test(`[${label}] falls back to any copies.*.key for renamed stores`, () => {
    const fr = { copies: { myStore: { key: 'renamed-id' } } };
    assert.strictEqual(resolve(fr, 'attachments'), 'renamed-id');
  });

  test(`[${label}] negative: record with no GridFS reference resolves to null`, () => {
    assert.strictEqual(resolve({ _id: 'x', original: { name: 'a' } }, 'attachments'), null);
    assert.strictEqual(resolve({ copies: {} }, 'attachments'), null);
    assert.strictEqual(resolve({ copies: { attachments: { name: 'no key here' } } }, 'attachments'), null);
  });

  test(`[${label}] negative: null/undefined/non-object records resolve to null`, () => {
    assert.strictEqual(resolve(null, 'attachments'), null);
    assert.strictEqual(resolve(undefined, 'attachments'), null);
    assert.strictEqual(resolve('nonsense', 'attachments'), null);
  });
}

// --- modern importer: extraction must be driven by the GridFS files collection ---

const modern = read(IMPORTERS.modern);

test('modern importer drives CollectionFS extraction from cfs_gridfs.<bucket>.files', () => {
  const fn = modern.match(/async function migrateGridFs\(bucketName, destDir, fileStateKey\) \{[\s\S]*?\n  \}/);
  assert.ok(fn, 'migrateGridFs found');
  // The loop must iterate the files collection, not the filerecords.
  assert.ok(fn[0].includes('const gfCursor = haveBucket ? filesCol.find({}) : null'),
    'extraction is driven by the GridFS files collection');
  // The filerecord join must be optional (the collection can be missing).
  assert.ok(fn[0].includes('if (haveFilerecords) {'),
    'a missing cfs.<bucket>.filerecord collection must not skip extraction');
  assert.ok(fn[0].includes('resolveCfsGridFsId(record, bucketName)'));
  // Orphan binaries (no filerecord) are still saved to disk, not dropped.
  assert.ok(fn[0].includes('orphanFiles'));
});

test('modern importer no longer skips filerecords silently on an unresolved id', () => {
  const fn = modern.match(/async function migrateGridFs\(bucketName, destDir, fileStateKey\) \{[\s\S]*?\n  \}/);
  assert.ok(!/if \(!gridFsId\) \{\s*\n\s*state\.files\[fileStateKey\]\.skipped\+\+;\s*\n\s*continue;/.test(fn[0]),
    'the silent skipped++/continue on missing GridFS id was the #6473 data loss');
  assert.ok(fn[0].includes('danglingRecords'),
    'filerecords with no locatable binary must be REPORTED');
});

test('modern importer Meteor-Files phase matches meta.gridFsFileId without a storage flag', () => {
  assert.ok(modern.includes('MF_GRIDFS_QUERY'), 'shared gridfs-detection query exists');
  const q = modern.match(/const MF_GRIDFS_QUERY = \{ \$or: \[[\s\S]*?\] \};/);
  assert.ok(q, 'MF_GRIDFS_QUERY is an $or');
  assert.ok(q[0].includes("'versions.original.storage': 'gridfs'"));
  assert.ok(q[0].includes("'versions.original.meta.gridFsFileId'"));
  // and the phase actually uses it
  assert.ok(modern.includes('col.find(MF_GRIDFS_QUERY)'));
});

test('modern importer sweeps <bucket>.files by metadata.fileId (pass B)', () => {
  assert.ok(modern.includes('allColls.includes(`${collName}.files`)'),
    'bucket-driven sweep exists');
  assert.ok(modern.includes('md.fileId'), 'sweep resolves the record via metadata.fileId');
  assert.ok(modern.includes('seenByRecordPass'),
    'pass A results must not be double-counted by the sweep');
});

test('modern importer clears versions.*.meta after the move (WeKan would keep reading GridFS)', () => {
  assert.ok(modern.includes('[`versions.${versionName}.meta`]:    {}') ||
            modern.includes('[`versions.${versionName}.meta`]: {}'),
    'gridFsFileId must be dropped or getFileStrategy keeps choosing the gone GridFS backend');
});

test('modern importer reports GridFS-flagged versions whose binary was never found', () => {
  assert.ok(modern.includes('unresolved'), 'unresolved tracking exists');
  assert.ok(/unresolved\.size > 0/.test(modern), 'leftovers are reported, not silently dropped');
});

test('modern importer covers the CFS FileSystem-store era (ATTACHMENTS_STORE_PATH, v3.12-v6.09)', () => {
  const fn = modern.match(/async function migrateGridFs\(bucketName, destDir, fileStateKey\) \{[\s\S]*?\n  \}/);
  assert.ok(fn[0].includes('haveFilerecords'),
    'a database with filerecords but NO cfs_gridfs collections must still be processed');
  assert.ok(!/if \(!allColls\.includes\(filesCollName\)\) return;/.test(fn[0]),
    'the CFS-bucket-only gate silently dropped every FileSystem-store attachment');
  assert.ok(fn[0].includes('HEX24'), 'non-ObjectId keys are FILENAMES, not GridFS ids');
  assert.ok(fn[0].includes('fsStoreRecords'), 'FileSystem-store filerecords are handled');
  assert.ok(fn[0].includes('ATTACHMENTS_STORE_PATH'),
    'the old store dir is searched via its historical env var');
  assert.ok(fn[0].includes('fsStoreMissing'), 'unfound FS-store binaries are REPORTED');
});

test('modern importer reports CFS filerecords whose GridFS binary vanished', () => {
  assert.ok(modern.includes('matchedGridIds'), 'hex filerecords are matched against actual GridFS files');
  assert.ok(/missingBinaries > 0/.test(modern), 'unmatched ones are reported, never silently dropped');
});

// --- mongo3 importer: created records must be attached to their cards ----------

const mongo3 = read(IMPORTERS.mongo3);

test('mongo3 importer copies top-level CollectionFS boardId/cardId into meta', () => {
  assert.ok(/cardId:\s*frMeta\.cardId\s*\|\|\s*fr\.cardId\s*\|\|\s*''/.test(mongo3),
    'CollectionFS keeps cardId at the record top level; without meta.cardId the attachment shows on no card');
  assert.ok(/boardId:\s*frMeta\.boardId\s*\|\|\s*fr\.boardId\s*\|\|\s*''/.test(mongo3));
});

test('mongo3 importer accounts for GridFS files that have no filerecord', () => {
  assert.ok(mongo3.includes('orphanFiles'));
});

// --- migrate-gridfs-to-fs: widened Meteor-Files match ---------------------------

const g2f = read(IMPORTERS.gridfsToFs);

test('migrate-gridfs-to-fs matches meta.gridFsFileId without a storage flag', () => {
  assert.ok(/\$or: \[[\s\S]*?'versions\.original\.storage': 'gridfs'[\s\S]*?'versions\.original\.meta\.gridFsFileId'/.test(g2f));
});

test('migrate-gridfs-to-fs reads each source from its OWN GridFS bucket', () => {
  assert.ok(g2f.includes('extractFile(src.bucket'),
    'Meteor-Files binaries live in <coll>, CFS binaries in cfs_gridfs.<coll> — one bucket for all extracted nothing');
  assert.ok(g2f.includes('haveMfBucket'),
    'a pure Meteor-Files database (no cfs_gridfs collections) must not be a silent no-op');
  assert.ok(!/\{ skipped\+\+; continue; \}\s*\n?\s*$/m.test(g2f.split('for (const src of sources)')[1].split('\n').slice(0, 8).join('\n')),
    'a GridFS-flagged record with no reference is reported as an error, not silently skipped');
});

// --- snap wekan-database: point lost users at the actual re-migration ----------

const wekanDatabase = read('snap-src/bin/wekan-database');

test('wekan.database ferretdb explains it does not migrate and names wekan.migrate', () => {
  assert.ok(wekanDatabase.includes('does NOT migrate data'));
  assert.ok(wekanDatabase.includes('snap run ${svc}.migrate'));
});

test('wekan.database ferretdb says when nothing was switched', () => {
  assert.ok(wekanDatabase.includes('already using FerretDB'));
});

console.log(`migrationAttachmentExtraction.test.cjs: ${passed} tests passed`);
