#!/usr/bin/env node
/**
 * WeKan MongoDB → FerretDB + PostgreSQL Migration Script
 *
 * Runs BEFORE WeKan starts. Connects to an existing MongoDB instance (any
 * version ≥ 3.0), migrates all data to a FerretDB instance (which speaks
 * the MongoDB wire protocol), upgrades the schema to v8.43, and extracts
 * GridFS/CollectionFS binary files to the local filesystem.
 *
 * Served at ROOT_URL (or MIGRATION_PORT) while running so operators can
 * watch progress in a browser.
 *
 * Usage:
 *   node releases/migrate-mongodb-to-ferretdb.mjs
 *   # – or –
 *   node releases/migrate-mongodb-to-ferretdb.mjs --help
 *
 * Key environment variables (all optional, sensible defaults shown):
 *   SOURCE_MONGO_URL   mongodb://localhost:27017/wekan   Old MongoDB
 *   TARGET_MONGO_URL   mongodb://localhost:27018/wekan   FerretDB
 *   WRITABLE_PATH      /data                            File-storage root
 *   MIGRATION_PORT     8080                             HTTP progress port
 *   BATCH_SIZE         200                              Docs per batch
 *   DRY_RUN            false                            Log only, no writes
 */

import { MongoClient, GridFSBucket, ObjectId } from 'mongodb';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { statfsSync } from 'node:fs';

// ── Configuration ──────────────────────────────────────────────────────────
const SOURCE_URL   = process.env.SOURCE_MONGO_URL || process.env.MONGO_URL || 'mongodb://localhost:27017/wekan';
const TARGET_URL   = process.env.TARGET_MONGO_URL || 'mongodb://localhost:27018/wekan';
const WRITABLE     = process.env.WRITABLE_PATH || '/data';
const PORT         = parseInt(process.env.MIGRATION_PORT || process.env.PORT || '8080', 10);
const BATCH_SIZE   = parseInt(process.env.BATCH_SIZE || '200', 10);
const DRY_RUN      = process.env.DRY_RUN === 'true';
const ATTACH_DIR   = path.join(WRITABLE, 'files', 'attachments');
const AVATAR_DIR   = path.join(WRITABLE, 'files', 'avatars');
const MARKER_COLL  = '_wekan_migration';   // written to target when done
const SCHEMA_VER   = 843;                  // v8.43

// ── Progress state (shared between HTTP server and migration logic) ─────────
const state = {
  phase:        'starting',        // string label
  phase_detail: '',                // extra context
  collections: {                   // per-collection progress
    // collName: { total, done, skipped, errors }
  },
  files: {
    attachments: { total: 0, done: 0, skipped: 0, errors: 0, bytes: 0 },
    avatars:     { total: 0, done: 0, skipped: 0, errors: 0, bytes: 0 },
  },
  errors:    [],                   // up to 200 recent errors
  startedAt: new Date().toISOString(),
  finishedAt: null,
  success:   null,
  dryRun:    DRY_RUN,
};

function pushError(msg) {
  console.error('[ERROR]', msg);
  state.errors.push({ ts: new Date().toISOString(), msg: String(msg).slice(0, 400) });
  if (state.errors.length > 200) state.errors.shift();
}

// ── HTTP progress server ───────────────────────────────────────────────────
const HTML_TEMPLATE = `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><meta http-equiv="refresh" content="3">
<title>WeKan Migration Progress</title>
<style>
  body{font-family:monospace;background:#111;color:#ddd;padding:1em 2em}
  h1{color:#7bf}  .ok{color:#7f7}  .fail{color:#f77}  .warn{color:#fb7}
  .bar-wrap{background:#333;border-radius:4px;height:18px;width:100%;max-width:600px}
  .bar{background:#4a9;height:18px;border-radius:4px;transition:width .4s}
  table{border-collapse:collapse;width:100%}
  td,th{padding:4px 10px;border-bottom:1px solid #333;text-align:left}
  th{color:#aaa;font-size:.85em}
  .phase{font-size:1.3em;margin:1em 0}
</style></head><body>
<h1>WeKan Migration: MongoDB → FerretDB + PostgreSQL</h1>
<div class="phase">Phase: <strong id="phase">…</strong> <span id="detail" style="color:#aaa"></span></div>
<p>Started: __STARTED__  &nbsp; Elapsed: <span id="elapsed"></span></p>
<div id="files_section">
  <h2>Files</h2>
  <table>
    <tr><th>Type</th><th>Done</th><th>Skipped</th><th>Errors</th><th>Bytes moved</th></tr>
    __FILES__
  </table>
</div>
<h2>Collections</h2>
<table><tr><th>Collection</th><th>Progress</th><th>Done</th><th>Total</th><th>Errors</th></tr>
__COLLS__
</table>
<h2>Recent Errors</h2><div id="errs">__ERRORS__</div>
<script>
const started = new Date("__STARTED__");
setInterval(()=>{
  const s = Math.floor((Date.now()-started)/1000);
  document.getElementById('elapsed').textContent = s+'s';
},1000);
</script>
</body></html>`;

function buildHtml() {
  const colRows = Object.entries(state.collections).map(([name, c]) => {
    const pct = c.total > 0 ? Math.round(100 * c.done / c.total) : 0;
    return `<tr><td>${name}</td><td><div class="bar-wrap"><div class="bar" style="width:${pct}%"></div></div>${pct}%</td>`
         + `<td>${c.done}</td><td>${c.total}</td><td class="${c.errors>0?'fail':''}">${c.errors}</td></tr>`;
  }).join('');

  const fRows = Object.entries(state.files).map(([type, f]) =>
    `<tr><td>${type}</td><td>${f.done}</td><td>${f.skipped}</td><td class="${f.errors>0?'fail':''}">${f.errors}</td><td>${(f.bytes/1024/1024).toFixed(2)} MB</td></tr>`
  ).join('');

  const errHtml = state.errors.length === 0 ? '<p style="color:#aaa">None</p>'
    : state.errors.slice(-20).reverse().map(e => `<div class="fail">${e.ts} — ${escHtml(e.msg)}</div>`).join('');

  let phaseColor = '';
  if (state.success === true) phaseColor = ' class="ok"';
  if (state.success === false) phaseColor = ' class="fail"';

  return HTML_TEMPLATE
    .replace(/__STARTED__/g, state.startedAt)
    .replace('__FILES__',   fRows)
    .replace('__COLLS__',   colRows)
    .replace('__ERRORS__',  errHtml)
    .replace('id="phase">…', `id="phase"${phaseColor}>${escHtml(state.phase)}`)
    .replace('id="detail" style="color:#aaa">', `id="detail" style="color:#aaa">${escHtml(state.phase_detail)}`);
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

const server = http.createServer((req, res) => {
  if (req.url === '/migration-status' || req.url === '/migration-status.json') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(state, null, 2));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(buildHtml());
  }
});

server.listen(PORT, () => {
  console.log(`[migrate] Progress dashboard: http://localhost:${PORT}/`);
  console.log(`[migrate] JSON status:        http://localhost:${PORT}/migration-status`);
});

// ── Filesystem helpers ─────────────────────────────────────────────────────
function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

/**
 * Return true if the directory has at least `neededBytes` + 10 MB free.
 * Falls back to true (proceed) if statfsSync is unavailable or throws.
 */
function hasEnoughSpace(dir, neededBytes) {
  try {
    const st = statfsSync(dir);
    const available = Number(st.bavail) * Number(st.bsize);
    return available > neededBytes + 10 * 1024 * 1024;
  } catch {
    return true;
  }
}

/**
 * Produce a safe, cross-platform filename from a (potentially URL-encoded,
 * special-char-rich) original name.  The ObjectId prefix guarantees uniqueness.
 * The original name is preserved in the database for download headers.
 *
 * Rules applied (in order):
 *  1. URI-decode percent-encoded sequences
 *  2. Strip null bytes and ASCII control chars
 *  3. Replace directory separators (/ \) with _
 *  4. Replace Windows-forbidden chars (: * ? " < > |) with _
 *  5. Collapse leading dots (hidden-file trap on Unix)
 *  6. Collapse runs of underscores/spaces
 *  7. Trim and truncate to 180 chars (leaves room for the id prefix)
 *  8. Fallback to "file" if result is empty
 */
function sanitizeFilename(original) {
  let name = original || 'file';
  try { name = decodeURIComponent(name); } catch { /* keep raw */ }
  name = name
    .replace(/[\x00-\x1f\x7f]/g, '')   // control chars
    .replace(/[/\\]/g, '_')             // path separators
    .replace(/[:<>"|?*]/g, '_')         // Windows-forbidden
    .replace(/^\.+/, '')                // leading dots
    .replace(/\s+/g, ' ')              // collapse whitespace
    .replace(/_+/g, '_')               // collapse underscores
    .trim();
  if (name.length > 180) name = name.slice(0, 180);
  if (!name) name = 'file';
  return name;
}

/**
 * Pick a collision-free path under dir.
 * Returns the full path and the relative basename used.
 */
function uniqueFilePath(dir, idHex, originalName) {
  const safe = sanitizeFilename(originalName);
  let base = `${idHex}_${safe}`;
  let candidate = path.join(dir, base);
  let counter = 0;
  while (fs.existsSync(candidate)) {
    counter++;
    base = `${idHex}_${counter}_${safe}`;
    candidate = path.join(dir, base);
  }
  return { fullPath: candidate, basename: base };
}

// ── Schema upgrade helpers ─────────────────────────────────────────────────
/**
 * During the copy phase we call this on every document of a given collection
 * and return the (possibly transformed) document to insert into the target.
 *
 * Each transformer is pure: takes a doc, returns a doc (or null to skip).
 */
function upgradeBoard(doc) {
  return {
    ...doc,
    migrationVersion: SCHEMA_VER,
    comprehensiveMigrationCompleted: true,
    fixMissingListsCompleted:        true,
  };
}

function upgradeList(doc, defaultSwimlaneIdFor) {
  const swimlaneId = doc.swimlaneId || defaultSwimlaneIdFor[doc.boardId] || '';
  return { ...doc, swimlaneId };
}

function upgradeCard(doc, listSwimlaneMap, defaultSwimlaneIdFor) {
  let swimlaneId = doc.swimlaneId;
  if (!swimlaneId && doc.listId && listSwimlaneMap[doc.listId]) {
    swimlaneId = listSwimlaneMap[doc.listId];
  }
  if (!swimlaneId) {
    swimlaneId = defaultSwimlaneIdFor[doc.boardId] || '';
  }
  return { ...doc, swimlaneId };
}

/**
 * Convert a CollectionFS filerecord to a Meteor-Files (ostrio:files) document.
 * Keeps the same _id so existing card.coverId / attachment URL refs still work.
 */
function cfsRecordToMeteorFile(doc, type /* 'attachments' | 'avatars' */, storedBasename) {
  const original = doc.original || {};
  const meta = doc.meta || {};
  const now = new Date();
  return {
    _id:      doc._id,
    name:     original.name || doc.filename || 'file',
    size:     original.size || 0,
    type:     original.type || 'application/octet-stream',
    extension: (original.name || '').split('.').pop() || '',
    extensionWithDot: original.name && original.name.includes('.') ? '.' + original.name.split('.').pop() : '',
    meta: {
      boardId:    meta.boardId    || doc.boardId    || '',
      cardId:     meta.cardId     || doc.cardId     || '',
      listId:     meta.listId     || doc.listId     || '',
      swimlaneId: meta.swimlaneId || doc.swimlaneId || '',
      userId:     meta.userId     || doc.userId     || '',
      source:     'cfs-migration',
      cfsOriginalId: String(doc._id),
    },
    path: path.join(WRITABLE, 'files', type, storedBasename || String(doc._id)),
    versions: {
      original: {
        path:    path.join(WRITABLE, 'files', type, storedBasename || String(doc._id)),
        size:    original.size || 0,
        type:    original.type || 'application/octet-stream',
        storage: 'fs',
      },
    },
    userId:         meta.userId || doc.userId || '',
    uploadedAt:     doc.uploadedAt || doc.createdAt || now,
    uploadedAtOstrio: doc.uploadedAt || doc.createdAt || now,
    updatedAt:      now,
    public:         false,
    collectionName: type,
  };
}

// ── GridFS extraction ──────────────────────────────────────────────────────
/**
 * Read one GridFS file by its ObjectId and stream it to destPath.
 * Returns the number of bytes written, or throws.
 */
async function extractGridFsFile(bucket, fileId, destPath) {
  return new Promise((resolve, reject) => {
    const oid  = typeof fileId === 'string' ? new ObjectId(fileId) : fileId;
    const stream = bucket.openDownloadStream(oid);
    const out   = fs.createWriteStream(destPath);
    let bytes = 0;
    stream.on('data', chunk => { bytes += chunk.length; });
    stream.on('error', reject);
    out.on('error', reject);
    stream.pipe(out);
    out.on('finish', () => resolve(bytes));
  });
}

// ── Generic collection copy ────────────────────────────────────────────────
async function copyCollection(srcDb, tgtDb, collName, transformer) {
  const src = srcDb.collection(collName);
  const tgt = tgtDb.collection(collName);

  const total = await src.countDocuments().catch(() => 0);
  state.collections[collName] = { total, done: 0, skipped: 0, errors: 0 };

  if (total === 0) return;

  const cursor = src.find({});
  let batch = [];

  const flush = async () => {
    if (batch.length === 0) return;
    if (!DRY_RUN) {
      for (const doc of batch) {
        try {
          await tgt.replaceOne({ _id: doc._id }, doc, { upsert: true });
          state.collections[collName].done++;
        } catch (err) {
          state.collections[collName].errors++;
          pushError(`${collName}/${doc._id}: ${err.message}`);
        }
      }
    } else {
      state.collections[collName].done += batch.length;
    }
    batch = [];
  };

  for await (const doc of cursor) {
    let out = doc;
    if (transformer) {
      try { out = transformer(doc); }
      catch (err) {
        pushError(`transform ${collName}/${doc._id}: ${err.message}`);
        state.collections[collName].errors++;
        continue;
      }
    }
    if (out === null) { state.collections[collName].skipped++; continue; }
    batch.push(out);
    if (batch.length >= BATCH_SIZE) await flush();
  }
  await flush();
  await cursor.close();
}

// ── Main migration logic ───────────────────────────────────────────────────
async function run() {
  // ── 0. Check if already migrated ────────────────────────────────────────
  state.phase = 'connecting';
  state.phase_detail = `source=${SOURCE_URL} target=${TARGET_URL}`;
  console.log('[migrate] Connecting to source:', SOURCE_URL);
  console.log('[migrate] Connecting to target:', TARGET_URL);
  if (DRY_RUN) console.log('[migrate] DRY_RUN mode — no writes to target or filesystem');

  let srcClient, tgtClient;
  try {
    srcClient = await MongoClient.connect(SOURCE_URL, {
      serverSelectionTimeoutMS: 15_000,
      directConnection: true,
    });
  } catch (err) {
    pushError(`Cannot connect to source MongoDB: ${err.message}`);
    console.log('[migrate] Source MongoDB not reachable — assuming fresh install, nothing to migrate.');
    state.phase = 'skipped';
    state.phase_detail = 'Source not reachable — no migration needed';
    state.success = true;
    state.finishedAt = new Date().toISOString();
    setTimeout(() => process.exit(0), 3000);
    return;
  }

  try {
    tgtClient = await MongoClient.connect(TARGET_URL, {
      serverSelectionTimeoutMS: 15_000,
      directConnection: true,
    });
  } catch (err) {
    await srcClient.close();
    pushError(`Cannot connect to target FerretDB: ${err.message}`);
    state.phase = 'error';
    state.success = false;
    state.finishedAt = new Date().toISOString();
    setTimeout(() => process.exit(1), 3000);
    return;
  }

  const srcDbName = new URL(SOURCE_URL.replace('mongodb://', 'http://')).pathname.slice(1) || 'wekan';
  const tgtDbName = new URL(TARGET_URL.replace('mongodb://', 'http://')).pathname.slice(1) || 'wekan';
  const srcDb = srcClient.db(srcDbName);
  const tgtDb = tgtClient.db(tgtDbName);

  // Check idempotency marker
  const markerColl = tgtDb.collection(MARKER_COLL);
  const marker = await markerColl.findOne({ _id: 'completed' });
  if (marker && marker.schemaVersion >= SCHEMA_VER && !process.env.FORCE_MIGRATE) {
    console.log('[migrate] Already migrated (schema v' + marker.schemaVersion + '). Exiting.');
    state.phase = 'already-migrated';
    state.phase_detail = 'Schema v' + marker.schemaVersion + ' already present in target';
    state.success = true;
    state.finishedAt = new Date().toISOString();
    await srcClient.close();
    await tgtClient.close();
    setTimeout(() => process.exit(0), 3000);
    return;
  }

  // ── 1. Build lookup maps needed for schema upgrades ────────────────────
  state.phase = 'analyzing';
  state.phase_detail = 'Building swimlane/list lookup maps…';
  console.log('[migrate] Analyzing source schema…');

  // boardId → first swimlaneId (for orphaned lists/cards)
  const defaultSwimlaneIdFor = {};
  const swimlaneCursor = srcDb.collection('swimlanes').find({ archived: false }, {
    projection: { _id: 1, boardId: 1, sort: 1 }, sort: { sort: 1 },
  });
  for await (const sw of swimlaneCursor) {
    if (!defaultSwimlaneIdFor[sw.boardId]) {
      defaultSwimlaneIdFor[sw.boardId] = String(sw._id);
    }
  }
  await swimlaneCursor.close();

  // listId → swimlaneId  (so orphaned cards can inherit from their list)
  const listSwimlaneMap = {};
  const listCursor = srcDb.collection('lists').find({}, { projection: { _id: 1, swimlaneId: 1 } });
  for await (const ls of listCursor) {
    listSwimlaneMap[String(ls._id)] = ls.swimlaneId || '';
  }
  await listCursor.close();

  // ── 2. Ensure target filesystem directories exist ───────────────────────
  if (!DRY_RUN) {
    ensureDir(ATTACH_DIR);
    ensureDir(AVATAR_DIR);
  }

  // ── 3. Discover all collection names in source ─────────────────────────
  state.phase = 'listing-collections';
  const allColls = (await srcDb.listCollections().toArray()).map(c => c.name);
  console.log('[migrate] Source collections:', allColls.join(', '));

  // Collections that get special schema treatment
  const specialCols = new Set([
    'boards', 'lists', 'cards', 'swimlanes',
    'cfs.attachments.filerecord', 'cfs.avatars.filerecord',
  ]);
  // GridFS meta-collections — handled separately
  const gridFsCols = new Set([
    'cfs_gridfs.attachments.files', 'cfs_gridfs.attachments.chunks',
    'cfs_gridfs.avatars.files',     'cfs_gridfs.avatars.chunks',
    'cfs_gridfs.attachments.files', // duplicated intentionally for clarity
  ]);

  // ── 4. Copy all plain collections ─────────────────────────────────────
  state.phase = 'migrating-collections';
  for (const name of allColls) {
    if (gridFsCols.has(name)) continue; // handled in file phase

    let transformer = null;
    if (name === 'boards') {
      transformer = doc => upgradeBoard(doc);
    } else if (name === 'lists') {
      transformer = doc => upgradeList(doc, defaultSwimlaneIdFor);
    } else if (name === 'cards') {
      transformer = doc => upgradeCard(doc, listSwimlaneMap, defaultSwimlaneIdFor);
    } else if (name === 'cfs.attachments.filerecord') {
      // Convert CFS attachment records to Meteor-Files format.
      // Actual binary data is handled in the file-extraction phase.
      transformer = doc => cfsRecordToMeteorFile(doc, 'attachments', null);
    } else if (name === 'cfs.avatars.filerecord') {
      transformer = doc => cfsRecordToMeteorFile(doc, 'avatars', null);
    }

    state.phase_detail = name;
    console.log(`[migrate] Copying collection: ${name}`);
    await copyCollection(srcDb, tgtDb, name, transformer);
  }

  // ── 5. Also ensure boards without a swimlane have one in the target ────
  state.phase = 'ensuring-swimlanes';
  state.phase_detail = 'Creating default swimlanes for boards that have none…';
  if (!DRY_RUN) {
    const tgtBoards = await tgtDb.collection('boards').find({}).toArray();
    for (const board of tgtBoards) {
      const boardId = String(board._id);
      const hasSwim = await tgtDb.collection('swimlanes')
        .countDocuments({ boardId });
      if (hasSwim === 0) {
        const newId = new ObjectId();
        await tgtDb.collection('swimlanes').insertOne({
          _id:      newId,
          title:    'Default',
          boardId,
          archived: false,
          sort:     0,
          type:     'swimlane',
          createdAt: new Date(),
          modifiedAt: new Date(),
          updatedAt: new Date(),
        });
        // Patch lists and cards that had no swimlane
        await tgtDb.collection('lists').updateMany(
          { boardId, swimlaneId: { $in: ['', null] } },
          { $set: { swimlaneId: String(newId) } },
        );
        await tgtDb.collection('cards').updateMany(
          { boardId, swimlaneId: { $in: ['', null] } },
          { $set: { swimlaneId: String(newId) } },
        );
      }
    }
  }

  // ── 6. Fix orphaned cards: card.listId references a nonexistent list ───
  state.phase = 'fixing-orphans';
  state.phase_detail = 'Linking orphaned cards to visible swimlane/list…';
  if (!DRY_RUN) {
    // Collect all valid listIds per board
    const allLists = await tgtDb.collection('lists').find({}, {
      projection: { _id: 1, boardId: 1, swimlaneId: 1 },
    }).toArray();
    const listSet = new Set(allLists.map(l => String(l._id)));
    const listByBoard = {};
    for (const l of allLists) {
      if (!listByBoard[l.boardId]) listByBoard[l.boardId] = l;
    }

    const orphanCursor = tgtDb.collection('cards').find({});
    for await (const card of orphanCursor) {
      const cid  = String(card._id);
      const bid  = card.boardId;
      const lid  = card.listId;
      let update = null;

      if (lid && !listSet.has(lid)) {
        // listId points nowhere — reassign to first list of this board
        const fallback = listByBoard[bid];
        if (fallback) {
          update = {
            listId:     String(fallback._id),
            swimlaneId: fallback.swimlaneId || '',
          };
        }
      }
      if (!card.swimlaneId) {
        update = { ...(update || {}), swimlaneId: defaultSwimlaneIdFor[bid] || '' };
      }
      if (update) {
        await tgtDb.collection('cards').updateOne({ _id: card._id }, { $set: update });
      }
    }
    await orphanCursor.close();
  }

  // ── 7. Extract GridFS / CollectionFS binary files to filesystem ─────────
  state.phase = 'migrating-files';

  async function migrateGridFs(bucketName, destDir, fileStateKey) {
    const filesCollName   = `cfs_gridfs.${bucketName}.files`;
    const chunksCollName  = `cfs_gridfs.${bucketName}.chunks`;
    if (!allColls.includes(filesCollName)) return;

    state.phase_detail = `Extracting ${bucketName} files from GridFS…`;
    console.log(`[migrate] Extracting GridFS bucket: ${bucketName} → ${destDir}`);

    const bucket = new GridFSBucket(srcDb, { bucketName: `cfs_gridfs.${bucketName}` });
    const filesCol = srcDb.collection(filesCollName);
    const metaCursor = srcDb.collection(`cfs.${bucketName}.filerecord`).find({});

    state.files[fileStateKey].total = await filesCol.countDocuments();

    for await (const record of metaCursor) {
      const original = record.original || {};
      const gridFsId = original.gridFsFileId || record.gridFsFileId || (record.copies && record.copies.gridfs && record.copies.gridfs.key);
      if (!gridFsId) {
        state.files[fileStateKey].skipped++;
        continue;
      }

      const originalName = original.name || record.filename || String(record._id);
      const { fullPath, basename } = uniqueFilePath(destDir, String(record._id), originalName);

      if (!hasEnoughSpace(destDir, original.size || 0)) {
        pushError(`Not enough disk space for ${originalName} (${original.size} bytes) — skipping`);
        state.files[fileStateKey].errors++;
        continue;
      }

      if (DRY_RUN) {
        state.files[fileStateKey].done++;
        state.files[fileStateKey].bytes += original.size || 0;
        continue;
      }

      try {
        const bytes = await extractGridFsFile(bucket, gridFsId, fullPath);
        state.files[fileStateKey].done++;
        state.files[fileStateKey].bytes += bytes;

        // Update the Meteor-Files record in target to point to the new path
        await tgtDb.collection(bucketName).updateOne(
          { _id: record._id },
          {
            $set: {
              path: fullPath,
              'meta.originalFilename': originalName,
              'meta.storedBasename':   basename,
              'meta.source':           'cfs-migration',
              'versions.original.path': fullPath,
              'versions.original.storage': 'fs',
            },
          },
          { upsert: false },
        );
      } catch (err) {
        pushError(`GridFS extract ${bucketName}/${record._id}: ${err.message}`);
        state.files[fileStateKey].errors++;
        // Clean up partial file
        try { fs.unlinkSync(fullPath); } catch { /* ignore */ }
      }
    }
    await metaCursor.close();
  }

  await migrateGridFs('attachments', ATTACH_DIR, 'attachments');
  await migrateGridFs('avatars',     AVATAR_DIR, 'avatars');

  // Also migrate any attachments that are already in Meteor-Files format but stored
  // in GridFS (storage === 'gridfs') — move binary to filesystem and update record.
  state.phase_detail = 'Migrating Meteor-Files GridFS records to filesystem…';
  for (const [collName, destDir, fileStateKey] of [
    ['attachments', ATTACH_DIR, 'attachments'],
    ['avatars',     AVATAR_DIR, 'avatars'],
  ]) {
    if (!allColls.includes(collName)) continue;
    const col = srcDb.collection(collName);
    const cursor = col.find({ 'versions.original.storage': 'gridfs' });
    const bucket = new GridFSBucket(srcDb, { bucketName: collName });

    for await (const doc of cursor) {
      const gridFsId = doc.versions?.original?.meta?.gridFsFileId;
      if (!gridFsId) continue;
      const originalName = doc.name || String(doc._id);
      const { fullPath, basename } = uniqueFilePath(destDir, String(doc._id), originalName);

      if (!hasEnoughSpace(destDir, doc.size || 0)) {
        pushError(`Disk full — cannot move ${originalName}`);
        state.files[fileStateKey].errors++;
        continue;
      }

      if (DRY_RUN) { state.files[fileStateKey].done++; continue; }

      try {
        const bytes = await extractGridFsFile(bucket, gridFsId, fullPath);
        state.files[fileStateKey].done++;
        state.files[fileStateKey].bytes += bytes;
        await tgtDb.collection(collName).updateOne(
          { _id: doc._id },
          {
            $set: {
              path: fullPath,
              'meta.storedBasename': basename,
              'meta.originalFilename': originalName,
              'versions.original.path':    fullPath,
              'versions.original.storage': 'fs',
              'versions.original.meta':    {},
            },
          },
        );
      } catch (err) {
        pushError(`Move GridFS→fs ${collName}/${doc._id}: ${err.message}`);
        state.files[fileStateKey].errors++;
        try { fs.unlinkSync(fullPath); } catch { /* ignore */ }
      }
    }
    await cursor.close();
  }

  // ── 8. Write completion marker ─────────────────────────────────────────
  if (!DRY_RUN) {
    await markerColl.replaceOne(
      { _id: 'completed' },
      {
        _id:           'completed',
        schemaVersion: SCHEMA_VER,
        completedAt:   new Date(),
        sourceUrl:     SOURCE_URL,
        targetUrl:     TARGET_URL,
        dryRun:        DRY_RUN,
        collections:   Object.fromEntries(
          Object.entries(state.collections).map(([k, v]) => [k, { done: v.done, errors: v.errors }])
        ),
        files: state.files,
      },
      { upsert: true },
    );
  }

  // ── 9. Ensure indexes on commonly-queried fields ───────────────────────
  if (!DRY_RUN) {
    state.phase = 'creating-indexes';
    state.phase_detail = 'Creating indexes on target…';
    try {
      const idx = (col, spec, opts = {}) =>
        tgtDb.collection(col).createIndex(spec, { background: true, ...opts }).catch(() => {});
      await Promise.all([
        idx('boards',    { members: 1 }),
        idx('boards',    { slug: 1 }),
        idx('swimlanes', { boardId: 1, sort: 1 }),
        idx('lists',     { boardId: 1, swimlaneId: 1, sort: 1 }),
        idx('cards',     { boardId: 1, swimlaneId: 1, listId: 1, sort: 1 }),
        idx('cards',     { listId: 1, swimlaneId: 1 }),
        idx('cards',     { userId: 1 }),
        idx('activities',{ boardId: 1, createdAt: -1 }),
        idx('attachments',{ 'meta.cardId': 1 }),
        idx('attachments',{ 'meta.boardId': 1 }),
        idx('avatars',   { userId: 1 }),
      ]);
    } catch { /* index creation is best-effort — FerretDB may have limitations */ }
  }

  // ── Done ──────────────────────────────────────────────────────────────
  await srcClient.close();
  await tgtClient.close();

  const totalErrors = state.errors.length;
  if (totalErrors === 0) {
    state.phase   = 'completed';
    state.success = true;
    console.log('[migrate] ✓ Migration completed successfully.');
  } else {
    state.phase   = 'completed-with-errors';
    state.success = totalErrors < 10; // treat <10 isolated errors as success
    console.log(`[migrate] ⚠ Migration done with ${totalErrors} error(s). See dashboard.`);
  }
  state.finishedAt = new Date().toISOString();

  // Keep HTTP server alive for 60 s so operators can read the final status
  setTimeout(() => process.exit(state.success ? 0 : 1), 60_000);
}

// ── Entry point ────────────────────────────────────────────────────────────
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
WeKan MongoDB → FerretDB Migration
===================================
Usage:  node releases/migrate-mongodb-to-ferretdb.mjs [--dry-run]

Environment variables:
  SOURCE_MONGO_URL   Source MongoDB URL         (default: $MONGO_URL or mongodb://localhost:27017/wekan)
  TARGET_MONGO_URL   Target FerretDB URL        (default: mongodb://localhost:27018/wekan)
  WRITABLE_PATH      File storage root          (default: /data)
  MIGRATION_PORT     HTTP progress server port  (default: 8080)
  BATCH_SIZE         Docs per write batch       (default: 200)
  DRY_RUN            true = no writes           (default: false)
  FORCE_MIGRATE      true = ignore done marker  (default: false)

Files are written to:
  \$WRITABLE_PATH/files/attachments/
  \$WRITABLE_PATH/files/avatars/

Idempotent: re-running after success is safe (marker in _wekan_migration).
`);
  process.exit(0);
}

if (process.argv.includes('--dry-run')) {
  process.env.DRY_RUN = 'true';
}

run().catch(err => {
  pushError('Fatal: ' + err.stack);
  state.phase   = 'error';
  state.success = false;
  state.finishedAt = new Date().toISOString();
  console.error('[migrate] Fatal error:', err);
  setTimeout(() => process.exit(1), 5000);
});
