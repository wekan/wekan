#!/usr/bin/env node
// migration-checkpoint-stale.mjs — a MongoDB -> FerretDB resume checkpoint is only
// good while the SOURCE has not moved on. When MongoDB has been written to since
// the checkpoint was saved, the collections it lists as "already migrated" are
// copies of an older database, so drop that half of the checkpoint and let them be
// copied again. The file half is kept.
//
// WHY THIS EXISTS (wekan/wekan#6585: "Data Lost in DB after Update 10.81 to 10.85").
//
// The reporter's snap refreshed overnight and came up serving data from two to
// three weeks earlier - "many cards and work is lost". Nothing was lost: the
// MongoDB data is in $SNAP_COMMON and untouched. What they were looking at was a
// FerretDB whose text collections were copied weeks ago.
//
// The migration is resumable, and has to be: it can run for hours, and a snap
// refresh, a `snap stop` or a reboot part-way through is normal rather than
// exceptional (migration-control's interrupted_keep_progress). So the importer
// records every collection it finishes in $SNAP_COMMON/migration-progress.json and
// skips those on the next start - which is what makes an interrupted migration
// cheap instead of starting from nothing every time.
//
// That checkpoint was only ever checked against the TARGET. migration-control
// deletes it whenever it discards a partial SQLite (discard_partial_ferretdb), so
// it can never describe collections that are not there. Nothing checked it against
// the SOURCE - and between an interrupted migration and its resume, the snap hands
// WeKan back to MongoDB (fail_3x_keep_progress, resume_next_start) and people go on
// using it. A migration interrupted in July and resumed in August therefore skipped
// every collection it had finished in July, copied only the rest, and reported
// success: boards and cards as they were in July, and three weeks of work missing
// from the copy while still sitting in MongoDB.
//
// A new snap revision is what usually sets the resume going again - the per-revision
// failure counter starts at zero (snap-src/bin/stale-marker), so the refresh that
// brings a fix also re-attempts the migration. That is why this reads as "the
// update lost my data": the update is when the weeks-old copy finally got served.
//
// WHAT IT COMPARES. mongod rewrites its WiredTiger files whenever it commits, so
// the newest mtime among them is when MongoDB was last written to - the same
// evidence snap-src/bin/ferretdb-migration-stale uses for the finished-migration
// case (#6583). This has to run BEFORE the migration starts its own temporary
// mongod to read the source, because starting one writes to those files too;
// migration-control calls it as its first step for that reason.
//
// The checkpoint's own age is the OLDER of its `updatedAt` field and the file's
// mtime. Older, not newer, because the two disagreeing is a reason to doubt the
// checkpoint, and the safe direction is always to copy again: a needless re-copy of
// the text collections costs minutes, and skipping one that should have been
// re-copied is the bug this exists for.
//
// WHAT IT KEEPS. Only `completedCollections` (and the per-collection counters that
// go with them) are dropped. `completedFiles` stays: attachments and avatars are
// written once and never rewritten in place, each entry is re-verified against the
// file on disk at the recorded size before it is trusted, and re-extracting
// gigabytes of unchanged binaries is the slowest part of the whole migration. Files
// added since the checkpoint are not in it and are extracted normally.
//
// Re-copying a collection UPSERTS by _id over what the earlier run inserted, so
// every document ends up as the source has it now. Documents DELETED from MongoDB
// since the checkpoint stay in the copy - that is the pre-existing behaviour of a
// resumed migration, and a document that is present when it should be absent is a
// far smaller wrong than three weeks of work that is absent.
//
// Usage:  migration-checkpoint-stale.mjs [dbpath] [--check]
//         --check reports without rewriting anything.
// Exit:   0 = the source has moved on (collection progress dropped, or would be)
//         1 = the checkpoint is current, absent, or nothing can be told
// Env:    MIGRATION_CHECKPOINT_MARGIN_SECONDS   default 600

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const argv = process.argv.slice(2);
const checkOnly = argv.includes('--check');
const positional = argv.filter(a => !a.startsWith('--'));
const DBPATH = positional[0] || process.env.SNAP_COMMON ||
  `/var/snap/${process.env.SNAP_INSTANCE_NAME || process.env.SNAP_NAME || 'wekan'}/common`;
const CHECKPOINT_FILE = path.join(DBPATH, 'migration-progress.json');
const MARGIN = Number(process.env.MIGRATION_CHECKPOINT_MARGIN_SECONDS || 600) * 1000;

const mtime = (p) => { try { return fs.statSync(p).mtimeMs; } catch { return 0; } };
const fmt = (ms) => { try { return new Date(ms).toISOString().slice(0, 16).replace('T', ' '); }
                      catch { return String(ms); } };

// The MongoDB data files, and only those: mongodb.log and mongodb.pid are touched by
// starting the snap and say nothing about whether the DATABASE was written to.
function sourceLastWrite(dir) {
  const named = ['WiredTiger', 'WiredTiger.wt', 'WiredTiger.turtle', '_mdb_catalog.wt',
                 'sizeStorer.wt'];
  let newest = 0;
  const consider = (p) => { const m = mtime(p); if (m > newest) newest = m; };
  for (const f of named) consider(path.join(dir, f));
  let entries = [];
  try { entries = fs.readdirSync(dir); } catch { /* unreadable: newest stays 0 */ }
  for (const e of entries) {
    if (/^(collection|index)-.*\.wt$/.test(e)) consider(path.join(dir, e));
  }
  let journal = [];
  try { journal = fs.readdirSync(path.join(dir, 'journal')); } catch { /* no journal dir */ }
  for (const e of journal) {
    if (e.startsWith('WiredTigerLog.')) consider(path.join(dir, 'journal', e));
  }
  return newest;
}

// When the checkpoint was saved. `updatedAt` is written on every save; the file's
// mtime says the same thing independently. Take the older of the two.
function checkpointSavedAt(file, cp) {
  const fileAt = mtime(file);
  const parsed = Date.parse(cp && cp.updatedAt ? cp.updatedAt : '');
  const stated = Number.isFinite(parsed) ? parsed : 0;
  if (!stated) return fileAt;
  if (!fileAt) return stated;
  return Math.min(stated, fileAt);
}

let cp;
try {
  cp = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
} catch {
  process.exit(1);   // no checkpoint (or an unreadable one): nothing to be stale
}
const collections = Array.isArray(cp.completedCollections) ? cp.completedCollections : [];
if (collections.length === 0) process.exit(1);   // nothing skipped, nothing to drop

const sourceAt = sourceLastWrite(DBPATH);
if (!sourceAt) process.exit(1);                  // no MongoDB data files to compare against
const savedAt = checkpointSavedAt(CHECKPOINT_FILE, cp);
if (!savedAt) process.exit(1);                   // cannot tell when it was made
if (sourceAt <= savedAt + MARGIN) process.exit(1);

const days = Math.floor((sourceAt - savedAt) / 86400000);
console.log(`The MongoDB -> FerretDB resume checkpoint was saved ${fmt(savedAt)} and lists ` +
            `${collections.length} collection(s) as already migrated,`);
console.log(`but MongoDB was written to as recently as ${fmt(sourceAt)}` +
            `${days >= 1 ? ` - about ${days} day(s) later` : ''}. Those copies are of the older`);
console.log('database, so resuming onto them would leave every change made since out of the ' +
            'migration.');

if (checkOnly) process.exit(0);

const next = { ...cp, updatedAt: new Date().toISOString() };
delete next.completedCollections;
delete next.collections;
next.collectionsResetAt = new Date().toISOString();
next.collectionsResetReason = 'source-newer-than-checkpoint';
try {
  const tmp = CHECKPOINT_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(next));
  fs.renameSync(tmp, CHECKPOINT_FILE);           // atomic replace
} catch (e) {
  console.log(`Could not rewrite ${CHECKPOINT_FILE}: ${e.message}`);
  process.exit(1);
}
console.log('Dropped the collection half of the checkpoint; every text collection is copied ' +
            'again from the current MongoDB. Already-extracted attachments and avatars are ' +
            'kept and are not extracted twice.');
process.exit(0);
