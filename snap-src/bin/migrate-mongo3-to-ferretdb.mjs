#!/usr/bin/env node
/**
 * WeKan snap: migrate a WeKan 6.09 MongoDB 3.2 database to FerretDB v1 (SQLite),
 * WITHOUT mongodump/mongorestore and WITHOUT an intermediate MongoDB 7.
 *
 * The modern Node MongoDB driver cannot connect to a 3.2 server, so this reads
 * the source with the legacy MongoDB CLI tools (mongoexport, which DOES work with
 * 3.2) and inserts into the running FerretDB with the modern Node driver:
 *
 *   - text data:   mongoexport each collection (Extended JSON) -> driver insert
 *                  into FerretDB. Text data is small (~1-2 GB) so it streams fine.
 *   - attachments/ CollectionFS GridFS (cfs_gridfs.<b>.{files,chunks} +
 *     avatars:     cfs.<b>.filerecord): each file is reassembled per-file from its
 *                  exported chunks and written straight to <files>/attachments or
 *                  <files>/avatars (no duplicate copy), and a Meteor-Files record
 *                  is inserted into FerretDB pointing at that path.
 *
 * Progress is served at ROOT_URL (MIGRATION_PORT). Schema is left as-is — WeKan's
 * own Board Settings / Migrations upgrade it on first use.
 *
 * Env:
 *   MONGO_BIN_DIR     dir with mongoexport + mongo (migratemongo/bin)
 *   MONGO_LIB         extra LD_LIBRARY_PATH for those tools (old libs)   [optional]
 *   SRC_PORT          source mongod port                                [27099]
 *   SRC_DB            source database                                   [wekan]
 *   TARGET_MONGO_URL  FerretDB URL (mongodb://127.0.0.1:PORT/wekan)
 *   FILES_DIR         files root (holds attachments/, avatars/, db/)
 *   MIGRATION_PORT    HTTP progress port                                [8080]
 */
import { MongoClient } from 'mongodb';
// `bson` (as bundled in WeKan's server node_modules) is a CommonJS module, so under
// Node 24's ESM loader it has no named `EJSON` export — importing { EJSON } throws
// "Named export 'EJSON' not found". Import the default and destructure instead.
import bson from 'bson';
const { EJSON } = bson;
import { spawnSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const MONGO_BIN_DIR = process.env.MONGO_BIN_DIR || '';
const MONGO_LIB     = process.env.MONGO_LIB || '';
const SRC_PORT      = process.env.SRC_PORT || '27099';
const SRC_DB        = process.env.SRC_DB || 'wekan';
const TARGET_URL    = process.env.TARGET_MONGO_URL || 'mongodb://127.0.0.1:27098/wekan';
const FILES_DIR     = process.env.FILES_DIR || path.join(process.env.WRITABLE_PATH || '/data', 'files');
const PORT          = parseInt(process.env.MIGRATION_PORT || '8080', 10);
// Optional: write the final migration state here as JSON so an admin UI can read
// it later (e.g. WeKan on Sandstorm — Admin Panel / Attachments / Sandstorm).
const STATUS_FILE   = process.env.STATUS_FILE || '';

const ATTACH_DIR = path.join(FILES_DIR, 'attachments');
const AVATAR_DIR = path.join(FILES_DIR, 'avatars');
const BATCH = 200;

const MONGOEXPORT = path.join(MONGO_BIN_DIR, 'mongoexport');
const MONGO       = path.join(MONGO_BIN_DIR, 'mongo');

// ── progress state + HTTP dashboard ──────────────────────────────────────────
const state = {
  startedAt: new Date().toISOString(), phase: 'starting', detail: '',
  collections: {}, files: { attachments: { done: 0, bytes: 0 }, avatars: { done: 0, bytes: 0 } },
  errors: [], success: null,
};
function err(m) { state.errors.push(new Date().toISOString() + ' — ' + String(m).slice(0, 400)); if (state.errors.length > 200) state.errors.shift(); console.error('[migrate3]', m); }
function esc(s) { return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
http.createServer((req, res) => {
  if (req.url === '/json') { res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify(state, null, 2)); }
  const cols = Object.entries(state.collections)
    .map(([n, c]) => `<tr><td>${esc(n)}</td><td>${c.done}</td><td>${c.total ?? '?'}</td></tr>`).join('');
  const color = state.success === true ? '#7f7' : state.success === false ? '#f77' : '#7bf';
  res.setHeader('content-type', 'text/html');
  res.end(`<!DOCTYPE html><html><head><meta charset=utf-8><meta http-equiv=refresh content=3>
<title>WeKan Migration</title><style>body{font-family:monospace;background:#111;color:#ddd;padding:1em 2em}
td,th{padding:3px 10px;border-bottom:1px solid #333;text-align:left}</style></head><body>
<h1 style="color:#7bf">WeKan Migration: MongoDB 3 &rarr; FerretDB v1 (SQLite)</h1>
<p>Started ${state.startedAt}</p>
<p style="font-size:1.3em;color:${color}">Phase: <b>${esc(state.phase)}</b> ${esc(state.detail)}</p>
<h2>Text collections</h2><table><tr><th>Collection</th><th>Inserted</th><th>Total</th></tr>${cols}</table>
<h2>Files</h2><table><tr><th>Type</th><th>Files</th><th>MB</th></tr>
<tr><td>attachments</td><td>${state.files.attachments.done}</td><td>${(state.files.attachments.bytes / 1048576).toFixed(1)}</td></tr>
<tr><td>avatars</td><td>${state.files.avatars.done}</td><td>${(state.files.avatars.bytes / 1048576).toFixed(1)}</td></tr></table>
<h2>Errors</h2>${state.errors.slice(-15).reverse().map(e => `<div style="color:#f77">${esc(e)}</div>`).join('') || '<p>None</p>'}
</body></html>`);
}).listen(PORT, () => console.log(`[migrate3] progress at http://localhost:${PORT}`));

// ── run a mongo CLI tool with the old libraries on LD_LIBRARY_PATH ────────────
function runTool(bin, args) {
  const env = { ...process.env };
  if (MONGO_LIB) env.LD_LIBRARY_PATH = MONGO_LIB + (env.LD_LIBRARY_PATH ? ':' + env.LD_LIBRARY_PATH : '');
  env.LC_ALL = 'C';
  return spawnSync(bin, args, { env, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 });
}

// List collection names in the source via the legacy mongo shell.
function listCollections() {
  const r = runTool(MONGO, ['--quiet', '--port', SRC_PORT, SRC_DB,
    '--eval', 'db.getCollectionNames().join("\\n")']);
  if (r.status !== 0) { err('mongo getCollectionNames failed: ' + (r.stderr || r.error)); return []; }
  return r.stdout.split('\n').map(s => s.trim()).filter(Boolean);
}

// mongoexport a collection (optionally with a query) as Extended JSON lines.
function exportDocs(coll, query) {
  const args = ['--quiet', '--port', SRC_PORT, '--db', SRC_DB, '--collection', coll];
  if (query) args.push('--query', query, '--sort', '{"n":1}');
  const r = runTool(MONGOEXPORT, args);
  if (r.status !== 0) { err(`mongoexport ${coll} failed: ` + (r.stderr || r.error)); return []; }
  return r.stdout.split('\n').filter(Boolean).map(l => { try { return EJSON.parse(l); } catch (e) { err('parse ' + coll + ': ' + e.message); return null; } }).filter(Boolean);
}

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
// Persist the final state to STATUS_FILE (if set) so a later admin UI can show
// whether the migration succeeded. Best-effort; never throws into the caller.
function writeStatus() {
  if (!STATUS_FILE) return;
  try {
    ensureDir(path.dirname(STATUS_FILE));
    fs.writeFileSync(STATUS_FILE,
      JSON.stringify({ ...state, finishedAt: new Date().toISOString() }, null, 2));
  } catch (e) { err('writeStatus: ' + e.message); }
}
function hasSpace(dir, need) { try { const s = fs.statfsSync(dir); return Number(s.bavail) * Number(s.bsize) > need + 10 * 1048576; } catch { return true; } }

async function run() {
  ensureDir(ATTACH_DIR); ensureDir(AVATAR_DIR);
  if (!fs.existsSync(MONGOEXPORT) || !fs.existsSync(MONGO)) {
    err(`mongoexport/mongo not found in ${MONGO_BIN_DIR}`); state.success = false; state.phase = 'error'; return;
  }

  state.phase = 'connecting'; state.detail = 'FerretDB ' + TARGET_URL;
  const client = await MongoClient.connect(TARGET_URL);
  const db = client.db(new URL(TARGET_URL.replace('mongodb://', 'http://')).pathname.slice(1) || 'wekan');

  const all = listCollections();
  const gridFs = new Set(['cfs_gridfs.attachments.files', 'cfs_gridfs.attachments.chunks',
    'cfs_gridfs.avatars.files', 'cfs_gridfs.avatars.chunks']);

  // ── text collections (everything except the GridFS chunk/file collections) ──
  state.phase = 'migrating-collections';
  for (const name of all) {
    if (gridFs.has(name)) continue;
    state.detail = name;
    const docs = exportDocs(name);
    state.collections[name] = { total: docs.length, done: 0 };
    const coll = db.collection(name);
    for (let i = 0; i < docs.length; i += BATCH) {
      const chunk = docs.slice(i, i + BATCH);
      try { await coll.insertMany(chunk, { ordered: false }); }
      catch (e) { /* upsert one-by-one on conflict */ for (const d of chunk) { try { await coll.replaceOne({ _id: d._id }, d, { upsert: true }); } catch (e2) { err(`${name}/${d._id}: ${e2.message}`); } } }
      state.collections[name].done = Math.min(i + chunk.length, docs.length);
    }
  }

  // ── GridFS attachments + avatars -> filesystem ──────────────────────────────
  state.phase = 'migrating-files';
  for (const [bucket, destDir, key] of [['attachments', ATTACH_DIR, 'attachments'], ['avatars', AVATAR_DIR, 'avatars']]) {
    const filesColl = `cfs_gridfs.${bucket}.files`;
    if (!all.includes(filesColl)) continue;
    state.detail = bucket;
    const filerecords = all.includes(`cfs.${bucket}.filerecord`) ? exportDocs(`cfs.${bucket}.filerecord`) : [];
    const byGridId = new Map();
    for (const fr of filerecords) {
      const gid = (fr.original && fr.original.gridFsFileId) || fr.gridFsFileId ||
        (fr.copies && fr.copies.gridfs && fr.copies.gridfs.key);
      if (gid) byGridId.set(String(gid), fr);
    }
    const gfFiles = exportDocs(filesColl);
    for (const gf of gfFiles) {
      const fid = gf._id;
      const fr = byGridId.get(String(fid)) || {};
      const original = fr.original || {};
      const name = (original.name || gf.filename || String(fr._id || fid)).replace(/[/\\\0]/g, '_').slice(0, 180) || 'file';
      const dest = path.join(destDir, `${String(fr._id || fid)}-${name}`);
      const size = gf.length || original.size || 0;
      if (!hasSpace(destDir, size)) { err(`disk full extracting ${name}`); continue; }
      // Reassemble the file from its chunks (queried per-file, sorted by n).
      try {
        const chunks = exportDocs(`cfs_gridfs.${bucket}.chunks`, `{"files_id":${EJSON.stringify(fid)}}`);
        const fd = fs.openSync(dest, 'w');
        let written = 0;
        for (const c of chunks) {
          const data = c.data; // EJSON Binary
          const buf = data && data.buffer ? Buffer.from(data.buffer) : Buffer.from(data || '', 'base64');
          fs.writeSync(fd, buf); written += buf.length;
        }
        fs.closeSync(fd);
        state.files[key].done++; state.files[key].bytes += written;
        // Meteor-Files record pointing at the filesystem path.
        if (fr._id) {
          await db.collection(bucket).replaceOne({ _id: fr._id }, {
            _id: fr._id, name, size: written, path: dest,
            versions: { original: { path: dest, storage: 'fs', size: written } },
            meta: { ...(fr.meta || {}), source: 'cfs-cli-migration', originalFilename: name },
          }, { upsert: true });
        }
      } catch (e) { err(`extract ${bucket}/${fid}: ${e.message}`); try { fs.unlinkSync(dest); } catch {} }
    }
  }

  await client.close();
  state.phase = state.errors.length ? 'completed-with-errors' : 'completed';
  state.success = state.errors.length < 10;
  writeStatus();
}

run().then(() => { setTimeout(() => process.exit(state.success ? 0 : 1), 60000); })
     .catch(e => { err('Fatal: ' + e.stack); state.phase = 'error'; state.success = false; writeStatus(); setTimeout(() => process.exit(1), 5000); });
