'use strict';

// ZipBleed — arbitrary file write when restoring a backup archive (CWE-22, zip-slip).
//
// A zip entry carries its own path, chosen by whoever built the archive, and
// `path.join()` RESOLVES `..` segments instead of rejecting them. The restore in
// server/methods/backup.js checked only that the first path segment was `attachments`
// or `avatars`:
//
//   const rel = entry.path.split('/').slice(1);         // drop the <stamp> folder
//   const kind = rel[0];
//   if (kind !== 'attachments' && kind !== 'avatars') continue;
//   const destPath = path.join(attachmentsDir(), ...rel.slice(1));   // <-- escapes
//
// so an entry named
//
//   2026-07-25_12-00-00/attachments/../../../../etc/cron.d/wekan
//
// passed that check - its first segment really is `attachments` - and then joined its
// way clean out of the files directory. The stream was written to whatever path came
// out, so a crafted backup.zip could drop or overwrite a file anywhere the WeKan
// process could write. Restoring a backup is exactly the moment you are least
// inclined to inspect the file you were handed.
//
// Reachable by an admin restoring an archive (restoreBackup is behind
// requireAdmin()), which is the normal way a hostile archive arrives: it is offered
// as a backup to restore.
//
// The fix is the only rule that holds: resolve the candidate to an absolute path and
// require it to sit under the target directory. The data half of the archive names
// the Mongo collection to restore into, so that is constrained to a plain name too.
//
// Run: node tests/zipbleed.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const root = path.join(__dirname, '..');
const { safeEntryPath, safeCollectionName } = require(
  path.join(root, 'models/lib/backupPaths'));

// How the restore splits an entry path, reproduced exactly so the test feeds the
// helper what the real code feeds it.
function segmentsFor(entryPath) {
  const rel = entryPath.split('/').slice(1);
  return rel.slice(1);
}

const BASE = '/data/files/attachments';

console.log('zipbleed:');

test('a normal entry restores where it belongs', () => {
  assert.strictEqual(
    safeEntryPath(BASE, segmentsFor('2026-07-25_12-00-00/attachments/abc123/photo.png')),
    '/data/files/attachments/abc123/photo.png');
  // Nested directories are fine.
  assert.strictEqual(
    safeEntryPath(BASE, segmentsFor('stamp/attachments/a/b/c/d.bin')),
    '/data/files/attachments/a/b/c/d.bin');
});

test('the traversal that made this a vulnerability is refused', () => {
  // The entry that motivated the fix: first segment is `attachments`, so the
  // kind check passes, and then it climbs out.
  const attack = '2026-07-25_12-00-00/attachments/../../../../etc/cron.d/wekan';
  assert.strictEqual(safeEntryPath(BASE, segmentsFor(attack)), null);
  // What the OLD code did with it, shown so the test states the actual danger.
  const oldBehaviour = path.join(BASE, ...segmentsFor(attack));
  assert.strictEqual(oldBehaviour, '/etc/cron.d/wekan');
  assert.ok(!oldBehaviour.startsWith(BASE),
    'path.join resolved the .. segments straight out of the target directory');
});

test('every other way out is refused too', () => {
  for (const entryPath of [
    'stamp/attachments/../evil',                     // one level up
    'stamp/attachments/a/../../evil',                // up through a real subdirectory
    'stamp/attachments/../../files/../../evil',      // back and forth
    'stamp/attachments/./../evil',                   // with a . thrown in
    'stamp/attachments//../evil',                    // empty segment
  ]) {
    assert.strictEqual(safeEntryPath(BASE, segmentsFor(entryPath)), null,
      `${entryPath} must be refused`);
  }
  // An ABSOLUTE segment: path.resolve discards everything before it.
  assert.strictEqual(safeEntryPath(BASE, ['/etc/passwd']), null);
  assert.strictEqual(safeEntryPath(BASE, ['sub', '/etc/passwd']), null);
});

test('a sibling directory with a matching prefix is not "inside"', () => {
  // The reason the check compares against base + separator: a bare
  // startsWith(base) also accepts /data/files/attachments-evil/x.
  assert.strictEqual(safeEntryPath('/data/files/attachments', ['..', 'attachments-evil', 'x']),
    null);
  // And the base itself is not a destination - you cannot overwrite the directory.
  assert.strictEqual(safeEntryPath(BASE, ['.']), null);
  assert.strictEqual(safeEntryPath(BASE, []), null);
});

test('junk input is refused rather than throwing (negative)', () => {
  assert.strictEqual(safeEntryPath('', ['a']), null);
  assert.strictEqual(safeEntryPath(null, ['a']), null);
  assert.strictEqual(safeEntryPath(BASE, null), null);
  assert.strictEqual(safeEntryPath(BASE, [null, undefined, '']), null);
  assert.strictEqual(safeEntryPath(BASE, [42]), null);
});

test('the data half only restores into a plain collection name', () => {
  assert.strictEqual(safeCollectionName('cards'), 'cards');
  assert.strictEqual(safeCollectionName('card_comments'), 'card_comments');
  assert.strictEqual(safeCollectionName('cfs-gridfs-attachments'), 'cfs-gridfs-attachments');
  // Anything that is not a plain name is refused.
  for (const bad of ['../../etc/passwd', 'a/b', 'a\\b', 'a$b', 'a.b',
    'system.indexes', 'system.users', '', null, undefined, 42]) {
    assert.strictEqual(safeCollectionName(bad), null, `${bad} must be refused`);
  }
});

test('the restore actually uses both guards', () => {
  // A helper nothing calls fixes nothing.
  const src = fs.readFileSync(path.join(root, 'server/methods/backup.js'), 'utf8');
  assert.ok(/safeEntryPath\(/.test(src), 'the file write must go through safeEntryPath');
  assert.ok(/safeCollectionName\(/.test(src), 'and the collection through safeCollectionName');
  // The unchecked join that was the bug must be gone from the restore.
  const restore = src.slice(src.indexOf('async function doRestore'));
  assert.ok(!/path\.join\((?:attachmentsDir|avatarsDir)/.test(restore),
    'no unchecked join back into the target directory');
  assert.ok(!/const destPath = path\.join\(/.test(restore),
    'the destination must not be built with a bare path.join again');
  // A refused entry is skipped, not written, and not fatal to the whole restore.
  assert.ok(/if \(!destPath\) \{ skipped\.push/.test(restore), 'refused entries are skipped');
  assert.ok(/if \(!coll\) \{ skipped\.push/.test(restore), 'and so are refused collections');
  assert.ok(/console\.warn\(/.test(restore), 'and the admin is told it happened');
});

console.log(`\nzipbleed: ${passed} tests passed`);
