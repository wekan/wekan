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

import { MongoClient, GridFSBucket, ObjectId } from 'mongodb';
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
  if (!allColls.includes(filesCollName)) return;

  console.log(`[gridfs-migrate] Processing ${bucketPrefix} → ${destDir}`);
  const bucket = new GridFSBucket(db, { bucketName: bucketPrefix });

  // Try CFS filerecord collection first, then fall back to Meteor-Files docs
  const sources = [];
  if (allColls.includes(`cfs.${collName}.filerecord`)) {
    const cursor = db.collection(`cfs.${collName}.filerecord`).find({});
    for await (const rec of cursor) {
      sources.push({ id: rec._id, gridFsId: rec.original?.gridFsFileId, name: rec.original?.name });
    }
    await cursor.close();
  }
  // Also handle Meteor-Files docs already in target that are marked storage:'gridfs'
  const mfCursor = db.collection(collName).find({ 'versions.original.storage': 'gridfs' });
  for await (const doc of mfCursor) {
    sources.push({ id: doc._id, gridFsId: doc.versions?.original?.meta?.gridFsFileId, name: doc.name });
  }
  await mfCursor.close();

  for (const src of sources) {
    if (!src.gridFsId) { skipped++; continue; }

    const originalName = src.name || String(src.id);
    const { fullPath, basename } = uniquePath(destDir, String(src.id), originalName);

    // Already extracted
    if (fs.existsSync(fullPath)) { skipped++; continue; }

    // Disk space check
    let fileSize = 0;
    try {
      const meta = await db.collection(filesCollName).findOne({ _id: new ObjectId(src.gridFsId) });
      fileSize = meta?.length || 0;
    } catch {}
    if (!hasEnoughSpace(destDir, fileSize)) {
      console.error(`[gridfs-migrate] Not enough disk space for ${originalName} — skipping`);
      errors++;
      continue;
    }

    try {
      const bytes = await extractFile(bucket, src.gridFsId, fullPath);
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
