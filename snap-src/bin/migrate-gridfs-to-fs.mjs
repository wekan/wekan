#!/usr/bin/env node
/**
 * WeKan snap: GridFS / CollectionFS binary files → filesystem
 *
 * Reads GridFS chunks from the running FerretDB (MongoDB wire protocol),
 * writes files to $SNAP_COMMON/files/attachments/ and
 *                 $SNAP_COMMON/files/avatars/
 * then updates the path fields in the attachments/avatars collections.
 *
 * Called by mongodb-control after mongorestore is complete.
 * Safe to re-run (skips files that already exist at destination).
 *
 * Environment:
 *   SOURCE_MONGO_URL  mongodb://127.0.0.1:27017/wekan  (FerretDB, already populated)
 *   WRITABLE_PATH     $SNAP_COMMON
 */

// Resolve the mongodb driver via createRequire (CommonJS): Node's ESM loader ignores
// NODE_PATH, which this tool is documented to set, so a bare `import ... from 'mongodb'`
// resolves nothing. createRequire's require() honors NODE_PATH and the node_modules walk.
import { createRequire } from 'node:module';
const { MongoClient, GridFSBucket, ObjectId } = createRequire(import.meta.url)('mongodb');
import fs from 'node:fs';
import path from 'node:path';
import { statfsSync } from 'node:fs';

const MONGO_URL  = process.env.SOURCE_MONGO_URL || 'mongodb://127.0.0.1:27017/wekan';
const WRITABLE   = process.env.WRITABLE_PATH || process.env.SNAP_COMMON || '/data';
const ATTACH_DIR = path.join(WRITABLE, 'files', 'attachments');
const AVATAR_DIR = path.join(WRITABLE, 'files', 'avatars');

fs.mkdirSync(ATTACH_DIR, { recursive: true });
fs.mkdirSync(AVATAR_DIR, { recursive: true });

// ── Helpers ────────────────────────────────────────────────────────────────
function hasEnoughSpace(dir, bytes) {
  try {
    const st = statfsSync(dir);
    return Number(st.bavail) * Number(st.bsize) > bytes + 10 * 1024 * 1024;
  } catch { return true; }
}

function sanitizeFilename(name) {
  try { name = decodeURIComponent(name); } catch {}
  name = name
    .replace(/[\x00-\x1f\x7f]/g, '')
    .replace(/[/\\]/g, '_')
    .replace(/[:<>"|?*]/g, '_')
    .replace(/^\.+/, '')
    .replace(/\s+/g, ' ')
    .replace(/_+/g, '_')
    .trim();
  if (name.length > 180) name = name.slice(0, 180);
  return name || 'file';
}

/**
 * Resolve the GridFS ObjectId of a CollectionFS filerecord (#6473). Real
 * CollectionFS (old WeKan, FS.Store.GridFS named after the bucket) stores it at
 * `copies.<storeName>.key` where the store name equals the bucket name —
 * `copies.attachments.key` / `copies.avatars.key`. The old lookup only tried
 * `original.gridFsFileId`, which does not exist in that layout, so every
 * CollectionFS attachment was silently skipped.
 */
function resolveCfsGridFsId(record, bucketName) {
  if (!record || typeof record !== 'object') return null;
  const original = record.original || {};
  if (original.gridFsFileId) return original.gridFsFileId;
  if (record.gridFsFileId) return record.gridFsFileId;
  const copies = record.copies;
  if (copies && typeof copies === 'object') {
    if (copies[bucketName] && copies[bucketName].key) return copies[bucketName].key;
    if (copies.gridfs && copies.gridfs.key) return copies.gridfs.key;
    for (const copy of Object.values(copies)) {
      if (copy && copy.key) return copy.key;
    }
  }
  return null;
}

function uniquePath(dir, idHex, originalName) {
  const safe = sanitizeFilename(originalName);
  let base = `${idHex}_${safe}`;
  let fullPath = path.join(dir, base);
  let counter = 0;
  while (fs.existsSync(fullPath)) {
    counter++;
    base = `${idHex}_${counter}_${safe}`;
    fullPath = path.join(dir, base);
  }
  return { fullPath, basename: base };
}

async function extractFile(bucket, gridFsId, destPath) {
  return new Promise((resolve, reject) => {
    const oid = typeof gridFsId === 'string' ? new ObjectId(gridFsId) : gridFsId;
    const src  = bucket.openDownloadStream(oid);
    const dst  = fs.createWriteStream(destPath);
    let bytes  = 0;
    src.on('data', chunk => { bytes += chunk.length; });
    src.on('error', reject);
    dst.on('error', reject);
    src.pipe(dst);
    dst.on('finish', () => resolve(bytes));
  });
}

// ── Main ───────────────────────────────────────────────────────────────────
const client = await MongoClient.connect(MONGO_URL, {
  serverSelectionTimeoutMS: 30_000,
  directConnection: true,
});
const dbName = new URL(MONGO_URL.replace('mongodb://', 'http://')).pathname.slice(1) || 'wekan';
const db = client.db(dbName);

let done = 0, skipped = 0, errors = 0;

async function migrateCollection(collName, destDir, bucketPrefix) {
  const filesCollName = `${bucketPrefix}.files`;
  const allColls = (await db.listCollections().toArray()).map(c => c.name);
  // #6473: do NOT return early when the CollectionFS bucket is missing — a pure
  // Meteor-Files database (any install born >= v6.10) has only <coll>.files,
  // and returning here made this tool a silent no-op for it.
  const haveCfsBucket = allColls.includes(filesCollName);
  const haveMfBucket = allColls.includes(`${collName}.files`);
  if (!haveCfsBucket && !haveMfBucket) return;

  console.log(`[gridfs-migrate] Processing ${collName} → ${destDir}`);
  // #6473: each source remembers WHICH GridFS bucket holds its binary —
  // CollectionFS filerecords point into cfs_gridfs.<coll>, Meteor-Files records
  // point into the <coll> bucket. Reading them all through the CFS bucket made
  // every Meteor-Files extraction fail.
  const cfsBucket = haveCfsBucket ? new GridFSBucket(db, { bucketName: bucketPrefix }) : null;
  const mfBucket = haveMfBucket ? new GridFSBucket(db, { bucketName: collName }) : null;

  // Try CFS filerecord collection first, then fall back to Meteor-Files docs
  const sources = [];
  if (haveCfsBucket && allColls.includes(`cfs.${collName}.filerecord`)) {
    const cursor = db.collection(`cfs.${collName}.filerecord`).find({});
    for await (const rec of cursor) {
      // #6473: resolve the GridFS id from copies.<bucket>.key too (real
      // CollectionFS layout), not just original.gridFsFileId.
      sources.push({ id: rec._id, gridFsId: resolveCfsGridFsId(rec, collName), name: rec.original?.name, bucket: cfsBucket, filesCollName });
    }
    await cursor.close();
  }
  // Also handle Meteor-Files docs marked storage:'gridfs' OR carrying a
  // meta.gridFsFileId reference (#6473: the same rule WeKan's getFileStrategy
  // uses — records with only the reference were previously missed).
  if (mfBucket) {
    const mfCursor = db.collection(collName).find({ $or: [
      { 'versions.original.storage': 'gridfs' },
      { 'versions.original.meta.gridFsFileId': { $exists: true, $ne: null } },
    ] });
    for await (const doc of mfCursor) {
      sources.push({ id: doc._id, gridFsId: doc.versions?.original?.meta?.gridFsFileId, name: doc.name, bucket: mfBucket, filesCollName: `${collName}.files` });
    }
    await mfCursor.close();
  }

  for (const src of sources) {
    if (!src.gridFsId) {
      // #6473: report — a GridFS-flagged record with no locatable binary is
      // exactly how attachments go silently missing.
      console.error(`[gridfs-migrate] ${collName}/${src.id}: GridFS reference missing; cannot extract.`);
      errors++;
      continue;
    }

    const originalName = src.name || String(src.id);
    const { fullPath, basename } = uniquePath(destDir, String(src.id), originalName);

    // Already extracted
    if (fs.existsSync(fullPath)) { skipped++; continue; }

    // Disk space check (#6473: look the size up in the SOURCE's own files
    // collection — CFS and Meteor-Files binaries live in different buckets)
    let fileSize = 0;
    try {
      const meta = await db.collection(src.filesCollName).findOne({ _id: new ObjectId(src.gridFsId) });
      fileSize = meta?.length || 0;
    } catch {}
    if (!hasEnoughSpace(destDir, fileSize)) {
      console.error(`[gridfs-migrate] Not enough disk space for ${originalName} — skipping`);
      errors++;
      continue;
    }

    try {
      const bytes = await extractFile(src.bucket, src.gridFsId, fullPath);
      done++;
      console.log(`[gridfs-migrate] ${basename} (${(bytes/1024).toFixed(1)} KB)`);

      // Update DB record with new filesystem path and original filename for download
      await db.collection(collName).updateOne(
        { _id: src.id },
        {
          $set: {
            path: fullPath,
            'meta.storedBasename':    basename,
            'meta.originalFilename':  originalName,
            'versions.original.path':    fullPath,
            'versions.original.storage': 'fs',
            'versions.original.meta':    {},
          },
        },
        { upsert: false },
      );
    } catch (err) {
      console.error(`[gridfs-migrate] Error extracting ${src.id}: ${err.message}`);
      errors++;
      try { fs.unlinkSync(fullPath); } catch {}
    }
  }
}

await migrateCollection('attachments', ATTACH_DIR, 'cfs_gridfs.attachments');
await migrateCollection('avatars',     AVATAR_DIR, 'cfs_gridfs.avatars');

await client.close();

console.log(`[gridfs-migrate] Done. extracted=${done} skipped=${skipped} errors=${errors}`);
process.exit(errors > 0 ? 1 : 0);

