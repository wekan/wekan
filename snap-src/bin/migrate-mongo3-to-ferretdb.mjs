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
// mongodb and bson are CommonJS in WeKan's bundle. Under Node 24's ESM loader an
// `import x from 'cjs'` default-interop gave objects that were missing EJSON entirely
// (both `import bson`'s default and mongodb's re-export came back undefined, so every
// collection failed with "Cannot read properties of undefined (reading 'parse')").
// Use createRequire instead: CJS require returns the real module.exports (with the
// getters/re-exports intact) and honors the importer's NODE_PATH, sidestepping all of
// the ESM default-interop quirks.
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';

// WeKan's CURRENT bson and mongodb (WITH EJSON, and the v6 driver that speaks OP_MSG)
// live inside the Meteor bundle under programs/server/... . The OLD meteor-spk base
// node_modules next to the tools has bson 1.x (no EJSON) and an ancient mongodb v2.x
// (no EJSON re-export, legacy OP_QUERY) — anchoring there gave "EJSON.parse unavailable"
// and, for inserts, "Unsupported OP_QUERY command: update". So we must anchor requires
// inside the modern bundle.
//
// CRUCIAL: in the snap this script runs as $SNAP/bin/migrate-mongo3-to-ferretdb.mjs, but
// the bundle is at $SNAP/programs/server/... — one level ABOVE bin/. Anchoring the
// sub-paths relative to the script alone resolved $SNAP/bin/programs/server/... (which
// does not exist) and fell through to the ancient base bson. Build candidate ROOTS from
// $SNAP (env, the real bundle root in the snap) and the script's parent dirs, then try
// the known modern-bundle sub-paths under each. Order matters: npm-mongo's nested
// mongodb (v6) before the plain node_modules so we never pick up the ancient v2 driver.
const rootURLs = [];
const pushRoot = (u) => { if (u) { try { rootURLs.push(new URL(u)); } catch {} } };
if (process.env.SNAP)        pushRoot(pathToFileURL(process.env.SNAP + '/'));
if (process.env.BUNDLE_ROOT) pushRoot(pathToFileURL(process.env.BUNDLE_ROOT + '/'));
if (process.env.NODE_PATH)   pushRoot(pathToFileURL(process.env.NODE_PATH.split(':')[0].replace(/\/programs\/server\/node_modules\/?$/, '') + '/'));
pushRoot(new URL('../', import.meta.url));    // $SNAP  (this script is $SNAP/bin/<name>)
pushRoot(new URL('./', import.meta.url));     // $SNAP/bin (if the bundle sits beside it)
pushRoot(new URL('../../', import.meta.url)); // one more up, for other/older layouts
// Sub-anchors inside a bundle root, modern first (the '_.cjs' basename need not exist —
// createRequire only anchors resolution; require() then walks up node_modules).
const subPaths = [
  'programs/server/npm/node_modules/meteor/npm-mongo/node_modules/_.cjs',
  'programs/server/npm/node_modules/_.cjs',
  'programs/server/node_modules/_.cjs',
  '_.cjs',
];
const anchors = [];
for (const root of rootURLs) {
  for (const sp of subPaths) {
    try { anchors.push(createRequire(new URL(sp, root))); } catch {}
  }
}
function requireAny(spec) {
  for (const req of anchors) { try { return req(spec); } catch {} }
  return null;
}
const mongodb = requireAny('mongodb') || {};
const { MongoClient } = mongodb;

// Resolve EJSON across the grain's / snap's differing node_modules layouts, modern
// bundle first; return a diagnostic list of what each attempt yielded on failure.
function resolveEJSON() {
  const tries = [];
  const candidates = [
    () => requireAny('bson')?.EJSON,
    () => mongodb.EJSON,
    () => requireAny('bson')?.BSON?.EJSON,
  ];
  for (const get of candidates) {
    try {
      const e = get();
      if (e && typeof e.parse === 'function') return { ejson: e };
      tries.push('got ' + (e === undefined ? 'undefined' : typeof e) + ' without .parse');
    } catch (err) { tries.push(err.code || err.message); }
  }
  return { ejson: null, tries };
}
const _ejson = resolveEJSON();
const EJSON = _ejson.ejson;
import { spawnSync, spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline';

const MONGO_BIN_DIR = process.env.MONGO_BIN_DIR || '';
const MONGO_LIB     = process.env.MONGO_LIB || '';
const SRC_PORT      = process.env.SRC_PORT || '27099';
const SRC_DB        = process.env.SRC_DB || 'wekan';
const TARGET_URL    = process.env.TARGET_MONGO_URL || 'mongodb://127.0.0.1:27098/wekan';
const FILES_DIR     = process.env.FILES_DIR || path.join(process.env.WRITABLE_PATH || '/data', 'files');
const PORT          = parseInt(process.env.MIGRATION_PORT || '8080', 10);
// #6473: FILES_ONLY=true = incremental attachment/avatar repair against an existing,
// LIVE target (set by the snap's attachment-repair on startup): the text collections
// are left completely untouched (users may have changed them since the original
// migration), already-migrated files are verified and skipped, and only missing
// binaries/records are migrated.
const FILES_ONLY    = process.env.FILES_ONLY === 'true';
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
  // Live per-file progress for the file currently being extracted, so the dashboard can
  // show a progress bar for a big file (e.g. a 5 GB attachment) instead of only a file
  // counter. kind: 'attachments' | 'avatars' (translated on the dashboard for the
  // viewer's language); name; size (total bytes); done (bytes written so far); index
  // (1-based number of the file across ALL files); total (all files to extract).
  current: { active: false, kind: '', name: '', size: 0, done: 0, index: 0, total: 0 },
  // Live free disk space (bytes) on the files volume, shown on the dashboard. If it drops
  // below the safety margin the migration ABORTS — a full disk can corrupt MongoDB.
  diskFree: -1, abort: false,
  // Set when the migration STOPS for lack of disk space: total bytes needed for ALL
  // files, how much MORE space is required, and a rollback summary (we delete the
  // partially migrated files to give the space back so the volume is not left full).
  filesTotalBytes: 0, additionalBytesNeeded: 0, rollback: null,
  log: [], errors: [], success: null,
  // Product name shown on the dashboard. Defaults to WeKan, but if the migrated
  // database has a product name set in Admin Panel (settings.productName), that is
  // used instead and WeKan is not mentioned. Populated early in run().
  product: 'WeKan',
};
// Rolling activity log so the dashboard shows what the migration is actually doing
// (a few live lines), not just red errors after the fact. Mirrored to stdout so it
// also lands in the Sandstorm grain log.
function logline(m) { state.log.push(new Date().toISOString().slice(11, 19) + ' ' + String(m).slice(0, 200)); if (state.log.length > 40) state.log.shift(); console.log('[migrate3]', m); }
function err(m) { state.errors.push(new Date().toISOString() + ' — ' + String(m).slice(0, 400)); if (state.errors.length > 200) state.errors.shift(); console.error('[migrate3]', m); }
function esc(s) { return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

// ── i18n: translate a few dashboard words into the viewer's language ──────────
// The dashboard runs standalone (WeKan is not up yet, so there is no logged-in user),
// so we use the browser's Accept-Language. Read the matching <lang>.i18n.json straight
// from WeKan's own bundle (best-effort across the layouts we know), and fall back to
// English so the dashboard always renders even if the files are not found.
const I18N_KEYS = ['attachment', 'attachments', 'avatar', 'avatars', 'file', 'size', 'of', 'progress', 'complete'];
const I18N_EN = { attachment: 'Attachment', attachments: 'Attachments', avatar: 'Avatar', avatars: 'Avatars', file: 'File', size: 'Size', of: 'of', progress: 'Progress', complete: 'Complete' };
const _i18nCache = new Map();
function i18nFileFor(lang) {
  if (!/^[A-Za-z_-]{2,12}$/.test(lang || '')) return null;
  const rels = [
    `imports/i18n/data/${lang}.i18n.json`,
    `programs/web.browser/app/imports/i18n/data/${lang}.i18n.json`,
    `programs/web.browser.legacy/app/imports/i18n/data/${lang}.i18n.json`,
    `programs/server/assets/app/imports/i18n/data/${lang}.i18n.json`,
    `programs/server/assets/packages/wekan-i18n/data/${lang}.i18n.json`,
  ];
  for (const root of rootURLs) {
    for (const rel of rels) {
      try { const p = fileURLToPath(new URL(rel, root)); if (fs.existsSync(p)) return p; } catch {}
    }
  }
  return null;
}
function loadLang(lang) {
  if (_i18nCache.has(lang)) return _i18nCache.get(lang);
  const map = { ...I18N_EN };
  const p = i18nFileFor(lang);
  if (p) { try { const j = JSON.parse(fs.readFileSync(p, 'utf8')); for (const k of I18N_KEYS) if (typeof j[k] === 'string' && j[k]) map[k] = j[k]; } catch {} }
  _i18nCache.set(lang, map);
  return map;
}
// Pick the best language we actually have a file for from Accept-Language; else English.
function pickLang(acceptLanguage) {
  const tags = String(acceptLanguage || '').split(',').map(s => s.split(';')[0].trim()).filter(Boolean);
  for (const tag of tags) {
    for (const cand of [tag, tag.split('-')[0]]) { if (i18nFileFor(cand)) return cand; }
  }
  return 'en';
}

// Count documents in a source collection via the legacy mongo shell (cheap; used to size
// the overall "file N of TOTAL" counter before extracting).
function countColl(coll, query) {
  const q = `db.getCollection(${JSON.stringify(coll)}).count(${query || ''})`;
  const r = runTool(MONGO, ['--quiet', '--port', SRC_PORT, SRC_DB, '--eval', q]);
  const n = parseInt((r.stdout || '').trim().split('\n').pop(), 10);
  return Number.isFinite(n) ? n : 0;
}

// Sum the `length` (byte size) of every GridFS file in a *.files collection, so we can
// know up front how much disk the extracted attachments/avatars will need in total.
function sumBytes(coll) {
  const q = `var r=db.getCollection(${JSON.stringify(coll)}).aggregate([{$group:{_id:null,s:{$sum:"$length"}}}]).toArray();print(r.length?r[0].s:0)`;
  const r = runTool(MONGO, ['--quiet', '--port', SRC_PORT, SRC_DB, '--eval', q]);
  const n = parseInt((r.stdout || '').trim().split('\n').pop(), 10);
  return Number.isFinite(n) ? n : 0;
}

// Stream ONE GridFS file's chunks (sorted by n) straight to an open fd, one chunk at a
// time, so a multi-GB file never lands in RAM. The old approach buffered the whole file
// through mongoexport's stdout, so a big file blew the 512 MB maxBuffer and failed;
// this streams line-by-line with natural back-pressure. onProgress(bytesSoFar) is called
// after each chunk so the dashboard can show a live per-file progress bar.
function streamChunksToFile(chunksColl, fid, fd, onProgress) {
  const env = { ...process.env };
  if (MONGO_LIB) env.LD_LIBRARY_PATH = MONGO_LIB + (env.LD_LIBRARY_PATH ? ':' + env.LD_LIBRARY_PATH : '');
  env.LC_ALL = 'C';
  const args = ['--host', '127.0.0.1', '--port', SRC_PORT, '--db', SRC_DB, '--collection', chunksColl,
    '--query', `{"files_id":${EJSON.stringify(fid)}}`, '--sort', '{"n":1}'];
  return new Promise((resolve, reject) => {
    const child = spawn(MONGOEXPORT, args, { env });
    const rl = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });
    let written = 0, stderr = '', parseErr = null, writeErr = null, rlClosed = false, exitCode = null, done = false;
    // fs.writeSync in the line handler is synchronous: it blocks the event loop per chunk
    // and so naturally back-pressures mongoexport, keeping memory bounded by design.
    rl.on('line', (line) => {
      if (!line || parseErr || writeErr || state.abort) return;
      let doc;
      try { doc = EJSON.parse(legacyToV2(line)); } catch (e) { parseErr = e; return; }
      const data = doc && doc.data;
      const buf = data && data.buffer ? Buffer.from(data.buffer) : Buffer.from(data || '', 'base64');
      if (buf.length) {
        try { fs.writeSync(fd, buf); }
        catch (e) {
          // A write failure is how we detect "out of space" on Sandstorm (where free
          // space is not measurable). ENOSPC/EDQUOT → disk-full abort + rollback; any
          // other write error fails just this file.
          if (e && (e.code === 'ENOSPC' || e.code === 'EDQUOT')) flagDiskFull('write failed: ' + e.code);
          else writeErr = e;
          try { child.kill('SIGKILL'); } catch {}
          return;
        }
        written += buf.length; try { onProgress(written); } catch {}
        // onProgress refreshes free disk space (Snap); if it dropped below the margin,
        // stop now: kill the exporter so we do not keep writing a nearly-full volume.
        if (state.abort) { try { child.kill('SIGKILL'); } catch {} }
      }
    });
    child.stderr.on('data', d => { stderr += d.toString(); if (stderr.length > 4000) stderr = stderr.slice(-4000); });
    child.on('error', reject);
    const finish = () => {
      if (done || !rlClosed || exitCode === null) return;
      done = true;
      // Disk-guard/ENOSPC abort killed mongoexport on purpose: reject so the caller
      // unlinks the partial file and stops (the fatal disk error is already in state).
      if (state.abort) return reject(new Error('aborted: not enough disk space'));
      if (writeErr) return reject(writeErr); // non-space write error: fail just this file
      if (exitCode !== 0) return reject(new Error(`mongoexport ${chunksColl} exit ${exitCode}: ${stderr.trim().slice(0, 300)}`));
      if (parseErr) return reject(new Error(`chunk parse ${chunksColl}: ${parseErr.message}`));
      resolve(written);
    };
    rl.on('close', () => { rlClosed = true; finish(); });
    // code is null when the process is killed by a signal (e.g. our SIGKILL on the disk
    // abort) — coerce to a non-null, non-zero value so finish() can settle the promise.
    child.on('close', (code, signal) => { exitCode = (code === null ? (signal ? 137 : -1) : code); finish(); });
  });
}
http.createServer((req, res) => {
  const T = loadLang(pickLang(req.headers['accept-language']));
  // Keep the displayed free-space figure fresh while the migration is still running.
  if (state.success === null) updateDiskFree(FILES_DIR);
  if (req.url === '/json') { res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify(state, null, 2)); }
  const cols = Object.entries(state.collections)
    .map(([n, c]) => `<tr><td>${esc(n)}</td><td>${c.done}</td><td>${c.total ?? '?'}</td></tr>`).join('');
  const color = state.success === true ? '#27ae60' : state.success === false ? '#c0392b' : '#2980b9';
  res.setHeader('content-type', 'text/html');
  const running = state.success === null;
  const doneOk = state.success === true;
  const spin = '<span style="display:inline-block;width:1em;height:1em;border:3px solid #d6e4ef;border-top-color:#2980b9;border-radius:50%;animation:spin .8s linear infinite;vertical-align:middle"></span>';
  // Spinner keeps spinning through the hand-off to WeKan (running OR done-ok), so it is
  // clear the grain is still working while it opens; a red ✗ only for failure.
  const spinner = (running || doneOk) ? spin : '❌';
  // While migrating, meta-refresh keeps the page live. Once it succeeds we DON'T
  // meta-refresh (a refresh during the importer→WeKan port hand-off would hit a dead
  // port and strand the user); instead a JS poller (below) waits out the gap and opens
  // All Boards as soon as WeKan answers. On failure, keep refreshing so errors update.
  const metaRefresh = doneOk ? '' : '<meta http-equiv=refresh content=2>';
  const handoff = doneOk ? `<script>
    (function poll(){
      fetch('/', { cache: 'no-store' }).then(function(r){ return r.text(); }).then(function(t){
        // The app is up once '/' is its app shell (has __meteor_runtime_config__)
        // rather than this dashboard (a stable 'migration-dashboard' marker, which is
        // independent of the product name shown). Then reload the SAME page the user was
        // on (e.g. the board URL they had open) instead of forcing All Boards, so they
        // stay where they were before the migration dashboard took over.
        if (t.indexOf('__meteor_runtime_config__') !== -1 || t.indexOf('migration-dashboard') === -1) {
          location.replace(location.pathname + location.search + location.hash);
        } else { setTimeout(poll, 1500); }
      }).catch(function(){ setTimeout(poll, 1500); }); // connection gap during hand-off — retry
    })();
  </script>` : '';
  // Live per-file progress for the file currently streaming to disk (e.g. a 5 GB
  // attachment): translated kind, file name + size, "file N of TOTAL", and a % bar so
  // the admin can see exactly where the migration of a big file is.
  const mb = (n) => (Number(n || 0) / 1048576).toFixed(1);
  const cur = state.current;
  let currentHtml = '';
  if (cur && cur.active) {
    const kindLabel = cur.kind === 'avatars' ? T.avatar : T.attachment;
    const pct = cur.size > 0 ? Math.min(100, Math.floor((cur.done / cur.size) * 100)) : 0;
    currentHtml = `<h2>${esc(kindLabel)}</h2>
<p style="margin:.2em 0"><b>${esc(cur.name || '')}</b></p>
<p class="muted" style="margin:.2em 0">${esc(T.file)} ${cur.index} ${esc(T.of)} ${cur.total} · ${esc(T.size)} ${mb(cur.size)} MB</p>
<div style="background:#e4e9ed;border-radius:4px;height:1.4em;overflow:hidden;max-width:100%">
<div style="width:${pct}%;height:100%;background:#2980b9;transition:width .3s"></div></div>
<p class="muted" style="margin:.3em 0">${mb(cur.done)} / ${mb(cur.size)} MB — ${pct}%</p>`;
  }
  // Disk-space error: how many files were migrated before stopping (they were deleted to
  // free the space back), and how much MORE disk space is required for all files.
  let diskErrHtml = '';
  if (state.additionalBytesNeeded > 0 || state.rollback) {
    const rb = state.rollback || {};
    const knownFree = state.diskFree >= 0;
    diskErrHtml = `<h2 style="color:#c0392b;border-color:#f5c6cb">⚠ Not enough disk space</h2>
<p>Total ${esc(T.attachments)} + ${esc(T.avatars)}: <b>${mb(state.filesTotalBytes)} MB</b>${knownFree ? ` · disk free: <b>${mb(state.diskFree)} MB</b>` : ''}</p>
<p style="font-size:1.25em;color:#c0392b"><b>${knownFree ? 'More disk space required' : 'Free space required for all files'}: ${mb(state.additionalBytesNeeded)} MB</b></p>
<p class="muted">Migrated before stopping — ${esc(T.attachments)}: ${rb.migratedAttachments ?? state.files.attachments.done}, ${esc(T.avatars)}: ${rb.migratedAvatars ?? state.files.avatars.done}.${rb.deletedFiles ? ` Deleted ${rb.deletedFiles} partially-migrated files (freed ${mb(rb.freedBytes)} MB) so the volume is not left full.` : ''} Free up at least the amount above, then the migration retries automatically.</p>`;
  }
  res.end(`<!DOCTYPE html><html><head><meta charset=utf-8>${metaRefresh}
<!--migration-dashboard-->
<title>${esc(state.product)} Migration</title><style>
body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#eceff1;color:#2c3e50;padding:1.5em 2em;margin:0}
h1{color:#2980b9;font-size:1.5em} h2{color:#2980b9;font-size:1.05em;margin:1.2em 0 .4em;border-bottom:2px solid #d6e4ef;padding-bottom:.2em}
.card{background:#fff;border:1px solid #d6e4ef;border-radius:6px;padding:1em 1.4em;max-width:960px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
table{border-collapse:collapse;width:100%} td,th{padding:3px 10px;border-bottom:1px solid #e4e9ed;text-align:left} th{color:#5f6b76;font-weight:600}
.muted{color:#7f8c9a;font-size:.9em}
pre{background:#f4f6f8;color:#2c3e50;border:1px solid #dfe4e8;border-radius:4px;padding:8px;max-height:16em;overflow:auto;white-space:pre-wrap}
@keyframes spin{to{transform:rotate(360deg)}}</style></head><body><div class="card">
<h1>${spinner} ${esc(state.product)} Migration: MongoDB 3 &rarr; FerretDB v1 (SQLite)</h1>
<p class="muted">Started ${state.startedAt} · updated ${new Date().toISOString()} · errors ${state.errors.length}${state.diskFree >= 0 ? ` · disk free ${mb(state.diskFree)} MB` : ''}</p>
${doneOk ? `<p style="font-size:1.3em;color:#27ae60">✅ Migration complete — starting ${esc(state.product)} and opening All Boards…</p>` : ''}
<p style="font-size:1.3em;color:${color}">Phase: <b>${esc(state.phase)}</b> ${esc(state.detail)}</p>${handoff}
${diskErrHtml}
${currentHtml}
<h2>Text collections</h2><table><tr><th>Collection</th><th>Inserted</th><th>Total</th></tr>${cols}</table>
<h2>Files</h2><table><tr><th>Type</th><th>Files</th><th>MB</th></tr>
<tr><td>${esc(T.attachments)}</td><td>${state.files.attachments.done}</td><td>${(state.files.attachments.bytes / 1048576).toFixed(1)}</td></tr>
<tr><td>${esc(T.avatars)}</td><td>${state.files.avatars.done}</td><td>${(state.files.avatars.bytes / 1048576).toFixed(1)}</td></tr></table>
<h2>Activity</h2><pre>${state.log.slice(-15).map(esc).join('\n') || '(waiting…)'}</pre>
<h2>Errors</h2>${state.errors.slice(-15).reverse().map(e => `<div style="color:#c0392b">${esc(e)}</div>`).join('') || '<p class="muted">None</p>'}
</div></body></html>`);
}).on('error', (e) => {
  // A background FILES_ONLY repair runs while WeKan itself owns the web port (#6473):
  // the dashboard is a convenience — never crash the repair over EADDRINUSE.
  console.log(`[migrate3] progress dashboard not available (${e.code || e.message}); continuing without it.`);
}).listen(PORT, () => console.log(`[migrate3] progress at http://localhost:${PORT}`));

// ── run a mongo CLI tool with the old libraries on LD_LIBRARY_PATH ────────────
function runTool(bin, args) {
  const env = { ...process.env };
  if (MONGO_LIB) env.LD_LIBRARY_PATH = MONGO_LIB + (env.LD_LIBRARY_PATH ? ':' + env.LD_LIBRARY_PATH : '');
  env.LC_ALL = 'C';
  return spawnSync(bin, args, { env, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 });
}

// Full diagnostic string for a spawnSync result. spawnSync sets `signal` when the
// child is killed (e.g. SIGSEGV → status null, signal 'SIGSEGV', empty stderr — which
// is exactly the "failed: undefined" we saw when only (stderr || error) was logged),
// `error` when the spawn itself failed (ENOENT, EACCES), and status for a normal
// non-zero exit. Include a stdout snippet since some Mongo tools print errors there.
function describe(r) {
  if (!r) return 'no spawn result';
  const errStr = r.error ? (r.error.code || r.error.message) : '-';
  const se = (r.stderr || '').trim().slice(0, 300);
  const so = (r.stdout || '').trim().slice(0, 200);
  return `status=${r.status} signal=${r.signal || '-'} error=${errStr}`
    + ` stderr=${JSON.stringify(se)} stdout=${JSON.stringify(so)}`;
}

// List collection names in the source via the legacy mongo shell.
function listCollections() {
  const r = runTool(MONGO, ['--quiet', '--port', SRC_PORT, SRC_DB,
    '--eval', 'db.getCollectionNames().join("\\n")']);
  if (r.status !== 0) { err('mongo getCollectionNames failed: ' + describe(r)); return []; }
  return r.stdout.split('\n').map(s => s.trim()).filter(Boolean);
}

// mongoexport a collection (optionally with a query) as Extended JSON lines.
function exportDocs(coll, query) {
  // NOTE: no --quiet here. mongoexport's --quiet suppresses ALL of its logging,
  // including the actual failure reason on stderr — which is why every export
  // previously failed with an empty stderr. Without it, a real failure prints e.g.
  // "Failed: <reason>" to stderr (its normal progress "connected to:"/"exported N
  // records" also go to stderr, so stdout stays clean Extended JSON either way).
  // Force --host 127.0.0.1. The mongo shell defaults its host to 127.0.0.1 (so
  // listCollections connects fine), but mongoexport (a Go tool) defaults to
  // "localhost", which resolves to ::1 (IPv6) first — and the migration mongod only
  // listens on --bind_ip 127.0.0.1 (IPv4), so mongoexport failed every collection
  // with "error connecting to db server: no reachable servers".
  const args = ['--host', '127.0.0.1', '--port', SRC_PORT, '--db', SRC_DB, '--collection', coll];
  if (query) args.push('--query', query, '--sort', '{"n":1}');
  const r = runTool(MONGOEXPORT, args);
  if (r.status !== 0) { err(`mongoexport ${coll} failed: ` + describe(r)); return []; }
  return r.stdout.split('\n').filter(Boolean).map(l => { try { return clampNonFinite(EJSON.parse(legacyToV2(l))); } catch (e) { err('parse ' + coll + ': ' + e.message); return null; } }).filter(Boolean);
}

// mongo 3.x mongoexport emits LEGACY (v1) Extended JSON, which modern bson's
// EJSON.parse rejects for binary: v1 is { "$binary": "<base64>", "$type": "00" } but
// v2 (what EJSON.parse wants) is { "$binary": { "base64": "<b64>", "subType": "00" } }.
// That mismatch is why every attachments.chunks doc failed with "Unexpected Binary
// Extended JSON format". Rewrite the v1 binary shape to v2 before parsing. ObjectIds
// ($oid) and dates ($date, incl. { $date: { $numberLong } }) are accepted by
// EJSON.parse in both forms, so only binary needs translating.
function legacyToV2(line) {
  return sanitizeNonFinite(line.replace(
    /\{\s*"\$binary"\s*:\s*"([A-Za-z0-9+/=]*)"\s*,\s*"\$type"\s*:\s*"([0-9a-fA-F]{1,2})"\s*\}/g,
    (_m, b64, t) => `{"$binary":{"base64":"${b64}","subType":"${t.toLowerCase().padStart(2, '0')}"}}`,
  ));
}

// mongo 3.x mongoexport can emit non-finite doubles as the BARE tokens NaN,
// Infinity, +Infinity and -Infinity (e.g. a card's "sort":+Infinity or an
// activity's "value":NaN). Those are NOT valid JSON, so EJSON.parse throws
// "Unexpected token 'N'/'+'" and the WHOLE document is dropped — which is why
// boards/cards went missing after an otherwise "successful" migration (#6481).
// Rewrite each bare token, ONLY where it is a JSON value (outside string
// literals), to the canonical EJSON v2 double form
// {"$numberDouble":"NaN"|"Infinity"|"-Infinity"} that EJSON.parse accepts, so the
// document migrates instead of being lost. A string that merely contains the text
// "NaN"/"Infinity", and ordinary negative numbers like -5, are left untouched.
export function sanitizeNonFinite(line) {
  if (line.indexOf('NaN') === -1 && line.indexOf('Infinity') === -1) return line;
  let out = '', inStr = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inStr) {
      out += c;
      if (c === '\\') { out += line[i + 1] || ''; i++; continue; } // keep escaped char verbatim
      if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; out += c; continue; }
    if (c === 'N' || c === 'I' || c === '+' || c === '-') {
      const m = /^(NaN|[+-]?Infinity)/.exec(line.slice(i));
      if (m) {
        const tok = m[1];
        const val = tok === 'NaN' ? 'NaN' : (tok[0] === '-' ? '-Infinity' : 'Infinity');
        out += `{"$numberDouble":"${val}"}`;
        i += tok.length - 1;
        continue;
      }
    }
    out += c;
  }
  return out;
}

// FerretDB/SQLite — unlike MongoDB — cannot store non-finite doubles AT ALL:
// inserting one fails with "invalid value { sort: +Inf } (infinity values are
// not allowed)" and aborts that document (#6481, follow-up). sanitizeNonFinite()
// above only makes the bare mongoexport tokens PARSE; the parsed value is still a
// JS Infinity/NaN (or a bson Double wrapping one), which the driver then refuses
// to insert. So after parsing, clamp every non-finite number in the document to a
// finite 0 — a safe default for the fields this actually hits (a card's `sort`,
// an activity's numeric `value`). The document then migrates instead of being
// dropped. Mutates and returns the same object (documents are freshly parsed, so
// in-place mutation is safe). BSON wrapper instances (ObjectId, Binary, Date, …)
// are left untouched except a Double whose value is non-finite.
export function clampNonFinite(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) value[i] = clampNonFinite(value[i]);
    return value;
  }
  if (value && typeof value === 'object') {
    if (value._bsontype === 'Double' && typeof value.value === 'number' && !Number.isFinite(value.value)) {
      value.value = 0;
      return value;
    }
    if (value._bsontype) return value; // other BSON types carry no non-finite doubles
    for (const k of Object.keys(value)) value[k] = clampNonFinite(value[k]);
    return value;
  }
  return value;
}

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

/**
 * Resolve the GridFS ObjectId of a CollectionFS filerecord (#6473).
 *
 * Real CollectionFS (old WeKan, FS.Store.GridFS named after the bucket) stores
 * the GridFS file id at `copies.<storeName>.key` where the store name equals
 * the bucket name — `copies.attachments.key` / `copies.avatars.key`. The old
 * lookup only tried `original.gridFsFileId`, `gridFsFileId` and
 * `copies.gridfs.key`, NONE of which exist in that layout, so no filerecord was
 * ever matched to its GridFS file: the binaries were extracted but no
 * attachment record was created, and every attachment was missing (#6473).
 * Try, in order:
 *   1. original.gridFsFileId / gridFsFileId (newer intermediate layouts)
 *   2. copies.<bucketName>.key              (real CollectionFS layout)
 *   3. copies.gridfs.key                    (legacy fallback kept for safety)
 *   4. the first copies.*.key found         (renamed stores)
 * Returns null when the record carries no GridFS reference at all.
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

// ── Resumable progress checkpoint ────────────────────────────────────────────
// This migration can run for hours, and being interrupted part-way (snap refresh to a
// new revision, `snap stop`, reboot, power loss) is normal rather than exceptional.
// Persist what is already in the target so the next start CONTINUES instead of redoing
// everything — re-extracting gigabytes of unchanged attachments is the slowest part.
//
// The checkpoint describes the target FerretDB SQLite and the extracted files, and is
// only valid together with them: migration-control deletes it whenever it discards a
// partial SQLite, so a fresh migration never skips a collection that is not there.
const CHECKPOINT_FILE = process.env.CHECKPOINT_FILE ||
  path.join(process.env.SNAP_COMMON || path.dirname(FILES_DIR), 'migration-progress.json');
const completedCollections = new Set();
// key `${bucket}:${recordId}` -> { path, size }, written only once the file is complete
// on disk AND its record in the target points at it, so a partial file is never "done".
const completedFiles = new Map();
let _lastCheckpointSave = 0;
function saveCheckpoint(force) {
  // Called per file; rewriting the whole JSON every time would be O(n²) over thousands
  // of files. Throttle to ~1 write/2s — at worst an interruption re-does a file or two.
  const now = Date.now();
  if (!force && now - _lastCheckpointSave < 2000) return;
  _lastCheckpointSave = now;
  try {
    ensureDir(path.dirname(CHECKPOINT_FILE));
    const tmp = CHECKPOINT_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify({
      version: 2, updatedAt: new Date().toISOString(), phase: state.phase,
      completedCollections: [...completedCollections],
      completedFiles: [...completedFiles].map(([k, v]) => [k, v]),
      collections: state.collections, success: state.success,
    }));
    fs.renameSync(tmp, CHECKPOINT_FILE);   // atomic replace
  } catch (e) { err('checkpoint save: ' + e.message); }
}
function loadCheckpoint() {
  try {
    if (!fs.existsSync(CHECKPOINT_FILE)) return;
    const cp = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
    (cp.completedCollections || []).forEach(c => completedCollections.add(c));
    (cp.completedFiles || []).forEach(([k, v]) => completedFiles.set(k, v));
    if (cp.collections) Object.assign(state.collections, cp.collections);
    // state.files counters are NOT restored: the file loops re-count every file they
    // walk, skipped or extracted, so the dashboard totals stay exact despite throttling.
    if (completedCollections.size || completedFiles.size) {
      logline(`Resuming from checkpoint — ${completedCollections.size} collection(s) and ${completedFiles.size} file(s) already migrated; they are skipped.`);
    }
  } catch (e) { err('checkpoint load: ' + e.message); }
}
// A checkpointed file counts as done only while it is still on disk at the recorded
// size — the disk-full rollback deletes extracted files, so re-check rather than trust.
function alreadyExtracted(key) {
  const prev = completedFiles.get(key);
  if (!prev || !prev.path) return null;
  try {
    const st = fs.statSync(prev.path);
    if (st.isFile() && Number(st.size) === Number(prev.size)) return prev;
  } catch { /* missing — extract it again */ }
  completedFiles.delete(key);
  return null;
}
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

// Platform note on measuring free disk space:
//  - SNAP: statfs WORKS. statfs/statfs64/fstatfs/fstatfs64/statvfs/fstatvfs are all in
//    snapd's DEFAULT seccomp allow-list (snapcore/snapd interfaces/seccomp/template.go),
//    and a snap has no per-snap disk quota by default, so fs.statfsSync($SNAP_COMMON/…)
//    returns the real host-filesystem free space the snap can use. quotactl is NOT in the
//    allow-list, but we never call it; the one case it would matter (a snapd storage-quota
//    group, enforced via project quotas invisible to statfs) is still caught by the
//    ENOSPC/EDQUOT write-failure path below.
//  - SANDSTORM: statfs is NOT reliable. A grain's FUSE filesystem does not implement statfs
//    (it may report the host disk, not the grain's storage quota) and quotactl is blocked,
//    so we do NOT pre-check or poll free space — we just try to migrate and treat an actual
//    write failure (ENOSPC/EDQUOT) as "out of space": stop, delete what we wrote, show the
//    disk-space error. Detected via the env Sandstorm / WeKan-on-Sandstorm sets (SANDSTORM=1,
//    WeKan's SANDSTORM_RAW_MONGO_PATH, or METEOR_SETTINGS.public.sandstorm).
const IS_SANDSTORM = process.env.SANDSTORM === '1' || !!process.env.SANDSTORM_RAW_MONGO_PATH || (() => {
  try { return !!((JSON.parse(process.env.METEOR_SETTINGS || '{}').public) || {}).sandstorm; } catch { return false; }
})();
// Detect the Snap from its environment ($SNAP is set for every snap process). Used only for
// the platform log line — the guards key off whether statfs actually returns a figure (see
// updateDiskFree), so even a locked-down container where statfs fails degrades to the same
// write-failure detection as Sandstorm.
const IS_SNAP = !!(process.env.SNAP || process.env.SNAP_NAME);

// Keep at least this much free while migrating. A FULL disk can corrupt the source
// MongoDB (which is still running as we read it), so we must never write the volume dry.
const DISK_MIN_FREE = parseInt(process.env.MIGRATION_MIN_FREE_BYTES || String(1024 * 1048576), 10); // 1 GB

// Flag "out of disk space" (once) so the file loop rolls back and stops. Used both by the
// statfs guard (Snap) and by an ENOSPC/EDQUOT write failure (the only signal on Sandstorm).
function flagDiskFull(detail) {
  if (state.abort) return;
  state.abort = true; state.success = false; state.phase = 'error';
  err(`FATAL: not enough disk space${detail ? ' (' + detail + ')' : ''}. Stopping and deleting migrated attachments/avatars to free the space, to avoid MongoDB data corruption.`);
}
let _lastDiskCheck = 0;
// Refresh state.diskFree (throttled) so the dashboard shows the current free space, and
// ABORT if it falls below the safety margin (do NOT keep writing). On a Snap, statfs is in
// snapd's default seccomp allow-list and reports real free space, so this actively guards;
// on Sandstorm (or anywhere statfs is unavailable) we leave diskFree unknown and rely on
// ENOSPC/EDQUOT write failures instead.
function updateDiskFree(dir, force) {
  // statfs is allowed by snapd's default seccomp policy
  // (snapcore/snapd interfaces/seccomp/template.go lists statfs/statfs64/fstatfs/…), so on a
  // Snap fs.statfsSync returns the real host-filesystem free space (a snap has no per-snap
  // quota by default). Inside a Sandstorm grain statfs is NOT reliable — FUSE does not
  // implement it and quotactl is blocked — so treat free space as unknown there. Everywhere
  // else we ATTEMPT statfs; if it is unavailable (a locked-down container), the catch leaves
  // free space unknown and we fall back to write-failure detection. Behaviour keys off
  // whether free space is measurable, not the platform: whenever state.diskFree stays < 0
  // the free-space guards below are skipped.
  if (IS_SANDSTORM) { state.diskFree = -1; return; }
  const now = Date.now();
  if (!force && now - _lastDiskCheck < 1000) return; // ~1 statfs/sec while streaming
  _lastDiskCheck = now;
  try { const s = fs.statfsSync(dir); state.diskFree = Number(s.bavail) * Number(s.bsize); }
  catch { state.diskFree = -1; return; }
  if (state.diskFree >= 0 && state.diskFree < DISK_MIN_FREE) {
    flagDiskFull(`only ${(state.diskFree / 1048576).toFixed(0)} MB free < ${(DISK_MIN_FREE / 1048576).toFixed(0)} MB margin`);
  }
}
// Before writing a file, ensure room for it PLUS the margin; else STOP (not skip) so a
// full disk can never corrupt MongoDB. Sets state.abort + a fatal error, returns false.
function ensureDiskForFile(dir, need, name) {
  updateDiskFree(dir, true);
  const free = state.diskFree;
  if (free < 0) return true; // free space not measurable — rely on a write failure instead
  if (free < Number(need || 0) + DISK_MIN_FREE) {
    flagDiskFull(`need ${(Number(need || 0) / 1048576).toFixed(0)} MB + ${(DISK_MIN_FREE / 1048576).toFixed(0)} MB margin for "${name}", only ${(free / 1048576).toFixed(0)} MB free`);
    return false;
  }
  return true;
}

// Called once when the migration stops for lack of disk space. Roll back: delete the
// attachments/avatars this migration already wrote (an incomplete file migration is
// useless, and freeing the space keeps the volume — and the running MongoDB — safe;
// migration-control retries from scratch with the MongoDB 3 data still intact). Then
// report how many files were migrated before stopping and how much MORE disk space is
// needed to migrate ALL files at once.
let _abortHandled = false;
function onDiskAbort() {
  if (_abortHandled) return;
  _abortHandled = true;
  const migratedAttachments = state.files.attachments.done;
  const migratedAvatars = state.files.avatars.done;
  logline('Not enough disk space — deleting the partially migrated attachments/avatars to free the space back…');
  let deletedFiles = 0, freedBytes = 0;
  for (const dir of [ATTACH_DIR, AVATAR_DIR]) {
    try {
      for (const ent of fs.readdirSync(dir)) {
        const p = path.join(dir, ent);
        try { const st = fs.statSync(p); if (st.isFile()) { freedBytes += Number(st.size) || 0; fs.unlinkSync(p); deletedFiles++; } } catch {}
      }
    } catch {}
  }
  updateDiskFree(FILES_DIR, true); // recompute free space after the rollback (stays aborted)
  logline(`Freed ${(freedBytes / 1048576).toFixed(0)} MB by deleting ${deletedFiles} partially-migrated files. Migrated before stopping: ${migratedAttachments} attachments, ${migratedAvatars} avatars.`);
  // How much MORE free space is needed to hold ALL files at once (plus the safety
  // margin). state.filesTotalBytes was measured up front from the source *.files sizes.
  const freeNow = state.diskFree >= 0 ? state.diskFree : 0;
  state.additionalBytesNeeded = Math.max(0, state.filesTotalBytes + DISK_MIN_FREE - freeNow);
  state.rollback = { migratedAttachments, migratedAvatars, deletedFiles, freedBytes };
  writeStatus();
}

async function run() {
  ensureDir(ATTACH_DIR); ensureDir(AVATAR_DIR);
  loadCheckpoint();   // resume an interrupted migration instead of redoing it
  logline(`Platform: ${IS_SANDSTORM ? 'Sandstorm grain' : IS_SNAP ? 'Snap' : 'other'}. Free-space guard: ${IS_SANDSTORM ? 'off (grain has no free-space API)' : 'used only if statfs reports free space, otherwise stops on a write failure'}.`);
  updateDiskFree(FILES_DIR, true); // seed the free-space figure before the dashboard loads
  if (state.abort) { writeStatus(); return; } // already out of disk before we started
  if (!fs.existsSync(MONGOEXPORT) || !fs.existsSync(MONGO)) {
    err(`mongoexport/mongo not found in ${MONGO_BIN_DIR}`); state.success = false; state.phase = 'error'; return;
  }

  // One-time probe: does mongoexport even run, and what is it? Every per-collection
  // mongoexport failed with an empty stderr (a signal death, not an option error),
  // while the mongo shell on the same libs worked — so establish up front whether the
  // binary itself is broken (--version also dies → bundling/ABI problem) or only the
  // export invocation is (--version works → argument/runtime problem).
  if (!EJSON || typeof EJSON.parse !== 'function') {
    err('FATAL: EJSON.parse unavailable. Tried: ' + JSON.stringify(_ejson.tries));
    state.success = false; state.phase = 'error'; return;
  }
  logline('EJSON resolved');
  let drvVer = '?';
  try { drvVer = requireAny('mongodb/package.json')?.version || '?'; } catch {}
  logline('mongodb driver ' + drvVer + ' (must be 6.x for OP_MSG; 2.x speaks OP_QUERY which FerretDB rejects)');
  const ver = runTool(MONGOEXPORT, ['--version']);
  console.log('[migrate3] mongoexport --version -> ' + describe(ver));
  logline('mongoexport ready: ' + ((ver.stdout || '').split('\n')[0] || 'unknown'));

  // If the migrated database has a product name set in Admin Panel, show that on
  // the dashboard instead of "WeKan". Best-effort: any failure keeps the default.
  try {
    const settingsDocs = exportDocs('settings');
    const pn = settingsDocs.map(d => d && d.productName).find(v => typeof v === 'string' && v.trim());
    if (pn) {
      state.product = pn.trim();
      logline('Using product name from Admin Panel settings: ' + state.product);
      // Cache it so the snap maintenance page can show it when both databases are stopped.
      try { if (process.env.SNAP_COMMON) fs.writeFileSync(process.env.SNAP_COMMON + '/.productname.txt', state.product + '\n'); } catch {}
    }
  } catch (e) { /* keep default product name */ }

  state.phase = 'connecting'; state.detail = 'FerretDB ' + TARGET_URL;
  const client = await MongoClient.connect(TARGET_URL);
  const db = client.db(new URL(TARGET_URL.replace('mongodb://', 'http://')).pathname.slice(1) || 'wekan');

  const all = listCollections();
  logline(`found ${all.length} source collections in db "${SRC_DB}"`);
  // GridFS chunk/file collections are NOT migrated as text — they are reassembled to
  // files below. This covers BOTH storage layouts a grain can hold: CollectionFS
  // (cfs_gridfs.<bucket>.{files,chunks}) and Meteor-Files' own GridFS buckets
  // (<bucket>.{files,chunks}). Without excluding the latter, attachments.chunks was
  // run through the text path and every binary chunk failed to parse. The <bucket>
  // metadata collections themselves (attachments, avatars) STAY in the text migration.
  const gridFs = new Set([
    'cfs_gridfs.attachments.files', 'cfs_gridfs.attachments.chunks',
    'cfs_gridfs.avatars.files', 'cfs_gridfs.avatars.chunks',
    'attachments.files', 'attachments.chunks',
    'avatars.files', 'avatars.chunks',
    'cfs._tempstore.chunks', 'cfs_gridfs._tempstore.chunks', 'cfs_gridfs._tempstore.files',
  ]);

  // ── text collections (everything except the GridFS chunk/file collections) ──
  // #6473: FILES_ONLY repair NEVER touches text collections — users may have
  // added/changed boards and cards on FerretDB since the original migration, and
  // re-copying from the frozen MongoDB source would overwrite or resurrect data.
  if (FILES_ONLY) {
    logline('FILES_ONLY: skipping text collections; incremental attachment/avatar repair only.');
  } else {
  state.phase = 'migrating-collections';
  for (const name of all) {
    // FerretDB v1 rejects collection names containing a dot ("invalid key: '<name>' (key must
    // not contain '.' sign)"), and NONE of WeKan's real data collections have a dot. Every
    // DOTTED collection is a GridFS internals collection (<bucket>.files/.chunks, cfs_gridfs.*,
    // cfs._tempstore.*), a CollectionFS filerecord (cfs.<bucket>.filerecord) or a system.*
    // collection — all handled in the file phase (binaries + bare <bucket> records) or not
    // needed. So skip any dotted name here (this also covers the whole gridFs set above).
    if (name.includes('.') || gridFs.has(name)) continue;
    // Copied in full by an earlier run that was interrupted — skip it. Without this a
    // snap refresh part-way through meant exporting and re-inserting every collection
    // from the beginning.
    if (completedCollections.has(name)) { logline(`${name}: already migrated (checkpoint), skipping.`); continue; }
    state.detail = name;
    const docs = exportDocs(name);
    state.collections[name] = { total: docs.length, done: 0 };
    logline(`${name}: exported ${docs.length}${docs.length ? ', inserting…' : ''}`);
    const coll = db.collection(name);
    for (let i = 0; i < docs.length; i += BATCH) {
      const chunk = docs.slice(i, i + BATCH);
      try { await coll.insertMany(chunk, { ordered: false }); }
      catch (e) { /* upsert one-by-one on conflict */ for (const d of chunk) { try { await coll.replaceOne({ _id: d._id }, d, { upsert: true }); } catch (e2) { err(`${name}/${d._id}: ${e2.message}`); } } }
      state.collections[name].done = Math.min(i + chunk.length, docs.length);
    }
    if (docs.length) logline(`${name}: inserted ${state.collections[name].done}/${docs.length}`);
    completedCollections.add(name);
    saveCheckpoint(true);   // a collection boundary is worth a guaranteed write
  }
  }   // end !FILES_ONLY (text collections)

  // ── GridFS attachments + avatars -> filesystem ──────────────────────────────
  state.phase = 'migrating-files';
  // Size the overall file counter up front (across BOTH GridFS layouts) so the dashboard
  // can show "file N of TOTAL" while it streams big files one at a time.
  let fileIndex = 0;
  const fileColls = ['cfs_gridfs.attachments.files', 'cfs_gridfs.avatars.files', 'attachments.files', 'avatars.files'].filter(c => all.includes(c));
  state.current.total = fileColls.reduce((n, c) => n + countColl(c), 0);
  // Measure the total byte size of ALL attachments+avatars up front. If the volume does
  // not have room for that (plus the safety margin), STOP immediately with a clear error
  // instead of extracting files until the disk fills (which could corrupt MongoDB).
  state.filesTotalBytes = fileColls.reduce((n, c) => n + sumBytes(c), 0);
  updateDiskFree(FILES_DIR, true);
  logline(`Files to extract: ${state.current.total} (${(state.filesTotalBytes / 1048576).toFixed(0)} MB total)${state.diskFree >= 0 ? `; disk free ${(state.diskFree / 1048576).toFixed(0)} MB` : '; free space unknown — will stop on a write failure'}.`);
  // Up-front check ONLY when free space is measurable (Snap with working statfs). When it
  // is not (Sandstorm grain, or a container where statfs fails), skip this and rely on an
  // actual write failure below. Stop before extracting anything if it cannot all fit.
  if (state.filesTotalBytes > 0 && state.diskFree >= 0 && state.diskFree < state.filesTotalBytes + DISK_MIN_FREE) {
    state.abort = true; state.success = false; state.phase = 'error';
    state.additionalBytesNeeded = Math.max(0, state.filesTotalBytes + DISK_MIN_FREE - state.diskFree);
    err(`FATAL: not enough disk space to migrate all files: ${(state.filesTotalBytes / 1048576).toFixed(0)} MB of attachments/avatars must be extracted, only ${(state.diskFree / 1048576).toFixed(0)} MB free — need ${(state.additionalBytesNeeded / 1048576).toFixed(0)} MB more (incl. ${(DISK_MIN_FREE / 1048576).toFixed(0)} MB margin). Stopped before extracting to avoid MongoDB data corruption.`);
    onDiskAbort();
    return;
  }
  for (const [bucket, destDir, key] of [['attachments', ATTACH_DIR, 'attachments'], ['avatars', AVATAR_DIR, 'avatars']]) {
    const filesColl = `cfs_gridfs.${bucket}.files`;
    if (!all.includes(filesColl)) continue;
    state.detail = bucket;
    const filerecords = all.includes(`cfs.${bucket}.filerecord`) ? exportDocs(`cfs.${bucket}.filerecord`) : [];
    const byGridId = new Map();
    for (const fr of filerecords) {
      const gid = resolveCfsGridFsId(fr, bucket);
      if (gid) byGridId.set(String(gid), fr);
    }
    const gfFiles = exportDocs(filesColl);
    logline(`${bucket}: ${gfFiles.length} GridFS files to extract -> ${destDir}`);
    let orphanFiles = 0;   // GridFS files with no filerecord (extracted, kept on disk)
    for (const gf of gfFiles) {
      const fid = gf._id;
      const fr = byGridId.get(String(fid)) || {};
      const original = fr.original || {};
      const name = (original.name || gf.filename || String(fr._id || fid)).replace(/[/\\\0]/g, '_').slice(0, 180) || 'file';
      const dest = path.join(destDir, `${String(fr._id || fid)}-${name}`);
      const size = gf.length || original.size || 0;
      // Extracted whole by an earlier, interrupted run: count it and move on.
      const resumeKey = `${bucket}:${String(fr._id || fid)}`;
      const alreadyDone = alreadyExtracted(resumeKey);
      if (alreadyDone) {
        fileIndex++;
        state.files[key].done++; state.files[key].bytes += Number(alreadyDone.size) || 0;
        continue;
      }
      // #6473: ALREADY MIGRATED? Check the TARGET itself — record present, version on
      // 'fs', file actually on disk. This makes the automatic startup repair
      // INCREMENTAL: healthy installs verify-and-skip, only what is missing migrates.
      if (fr._id) {
        try {
          const tgtRec = await db.collection(bucket).findOne({ _id: fr._id });
          const tv = tgtRec && tgtRec.versions && tgtRec.versions.original;
          if (tv && tv.storage === 'fs' && tv.path && fs.existsSync(tv.path)) {
            fileIndex++;
            state.files[key].done++; state.files[key].bytes += Number(tv.size) || 0;
            let onDiskSize = Number(tv.size) || 0;
            try { onDiskSize = fs.statSync(tv.path).size; } catch { /* keep record size */ }
            completedFiles.set(resumeKey, { path: tv.path, size: onDiskSize });
            saveCheckpoint();
            continue;
          }
        } catch { /* fall through to extraction */ }
      }
      if (!ensureDiskForFile(destDir, size, name)) { onDiskAbort(); return; }
      // Stream the file from its chunks (sorted by n) straight to disk, one chunk at a
      // time (bounded RAM), publishing live per-file progress for the dashboard.
      fileIndex++;
      state.current = { active: true, kind: key, name, size, done: 0, index: fileIndex, total: state.current.total };
      let written = 0;
      try {
        const fd = fs.openSync(dest, 'w');
        try { written = await streamChunksToFile(`cfs_gridfs.${bucket}.chunks`, fid, fd, (w) => { state.current.done = w; updateDiskFree(destDir); }); }
        finally { fs.closeSync(fd); }
        state.current.done = written;
        state.files[key].done++; state.files[key].bytes += written;
        // Meteor-Files record pointing at the filesystem path. #6473: real
        // CollectionFS filerecords keep boardId/cardId/... at the TOP level (not
        // under meta), so copy them into meta explicitly — a record without
        // meta.cardId is never shown on any card.
        if (fr._id) {
          const frMeta = fr.meta || {};
          await db.collection(bucket).replaceOne({ _id: fr._id }, {
            _id: fr._id, name, size: written, path: dest,
            type: original.type || 'application/octet-stream',
            versions: { original: { path: dest, storage: 'fs', size: written, type: original.type || 'application/octet-stream' } },
            meta: {
              ...frMeta,
              boardId:    frMeta.boardId    || fr.boardId    || '',
              cardId:     frMeta.cardId     || fr.cardId     || '',
              listId:     frMeta.listId     || fr.listId     || '',
              swimlaneId: frMeta.swimlaneId || fr.swimlaneId || '',
              userId:     frMeta.userId     || fr.userId     || '',
              source: 'cfs-cli-migration', originalFilename: name,
              cfsOriginalId: String(fr._id),
            },
            userId: frMeta.userId || fr.userId || '',
            collectionName: bucket,
          }, { upsert: true });
        } else {
          // No filerecord: there is no board/card to attach the file to, so no
          // record is created — but the binary IS extracted and kept on disk
          // instead of being silently lost.
          orphanFiles++;
        }
        // Done only now: bytes on disk AND a record pointing at them.
        completedFiles.set(resumeKey, { path: dest, size: written });
        saveCheckpoint();
      } catch (e) { if (e && (e.code === 'ENOSPC' || e.code === 'EDQUOT')) flagDiskFull('write failed: ' + e.code); err(`extract ${bucket}/${fid}: ${e.message}`); try { fs.unlinkSync(dest); } catch {} }
      finally { state.current.active = false; }
      if (state.abort) { onDiskAbort(); return; }
    }
    if (orphanFiles > 0) logline(`${bucket}: ${orphanFiles} GridFS file(s) had no CollectionFS filerecord; extracted without a database record.`);
    logline(`${bucket}: extracted ${state.files[key].done} files (${(state.files[key].bytes / 1048576).toFixed(1)} MB)`);
  }

  // ── Meteor-Files native GridFS buckets -> filesystem ────────────────────────
  // Newer WeKan grains store attachments/avatars in Meteor-Files' own GridFS buckets
  // (<bucket>.files + <bucket>.chunks) with the FilesCollection record living in the
  // <bucket> collection itself (already migrated as text above). The GridFS file's
  // metadata.fileId is that record's _id; its metadata.versionName is the version.
  // Reassemble each file to disk, then repoint the record's versions.<v> at the file
  // AND drop versions.<v>.meta.gridFsFileId — otherwise WeKan's getFileStrategy keeps
  // choosing the GridFS backend (the data no longer lives there) and the image 404s.
  for (const [bucket, destDir, key] of [['attachments', ATTACH_DIR, 'attachments'], ['avatars', AVATAR_DIR, 'avatars']]) {
    const filesColl = `${bucket}.files`, chunksColl = `${bucket}.chunks`;
    if (!all.includes(filesColl) || !all.includes(chunksColl)) continue;
    state.detail = bucket + ' (meteor-files)';
    const gfFiles = exportDocs(filesColl);
    logline(`${bucket} (Meteor-Files GridFS): ${gfFiles.length} files to extract -> ${destDir}`);
    for (const gf of gfFiles) {
      const fid = gf._id;
      const md = gf.metadata || {};
      const recId = md.fileId || String(fid);
      const versionName = md.versionName || 'original';
      const name = String(gf.filename || recId).replace(/[/\\\0]/g, '_').slice(0, 180) || 'file';
      const dest = path.join(destDir, `${recId}-${versionName}-${name}`);
      const size = gf.length || 0;
      const resumeKey = `${bucket}.${versionName}:${recId}`;
      const alreadyDone = alreadyExtracted(resumeKey);
      if (alreadyDone) {
        fileIndex++;
        state.files[key].done++; state.files[key].bytes += Number(alreadyDone.size) || 0;
        continue;
      }
      // #6473: ALREADY MIGRATED? Verify against the TARGET record — version on 'fs'
      // and the file on disk means nothing to do (incremental startup repair). And in
      // FILES_ONLY mode a record DELETED from the target since the migration must not
      // have its binary resurrected.
      try {
        const tgtRec = await db.collection(bucket).findOne({ _id: recId });
        const tv = tgtRec && tgtRec.versions && tgtRec.versions[versionName];
        if (tv && tv.storage === 'fs' && tv.path && fs.existsSync(tv.path)) {
          fileIndex++;
          state.files[key].done++; state.files[key].bytes += Number(tv.size) || 0;
          let onDiskSize = Number(tv.size) || 0;
          try { onDiskSize = fs.statSync(tv.path).size; } catch { /* keep record size */ }
          completedFiles.set(resumeKey, { path: tv.path, size: onDiskSize });
          saveCheckpoint();
          continue;
        }
        if (FILES_ONLY && !tgtRec) continue;
      } catch { /* fall through to extraction */ }
      if (!ensureDiskForFile(destDir, size, name)) { onDiskAbort(); return; }
      fileIndex++;
      state.current = { active: true, kind: key, name, size, done: 0, index: fileIndex, total: state.current.total };
      let written = 0;
      try {
        const fd = fs.openSync(dest, 'w');
        try { written = await streamChunksToFile(chunksColl, fid, fd, (w) => { state.current.done = w; updateDiskFree(destDir); }); }
        finally { fs.closeSync(fd); }
        if (!written) { fs.unlinkSync(dest); err(`meteor-files ${bucket}/${recId}: 0 bytes (no chunks)`); continue; }
        state.current.done = written;
        state.files[key].done++; state.files[key].bytes += written;
        // Repoint the already-migrated FilesCollection record at the on-disk file.
        await db.collection(bucket).updateOne({ _id: recId }, {
          $set: {
            [`versions.${versionName}.path`]: dest,
            [`versions.${versionName}.storage`]: 'fs',
            [`versions.${versionName}.size`]: written,
            path: dest,
          },
          $unset: { [`versions.${versionName}.meta.gridFsFileId`]: '' },
        });
        completedFiles.set(resumeKey, { path: dest, size: written });
        saveCheckpoint();
      } catch (e) { if (e && (e.code === 'ENOSPC' || e.code === 'EDQUOT')) flagDiskFull('write failed: ' + e.code); err(`meteor-files ${bucket}/${recId}: ${e.message}`); try { fs.unlinkSync(dest); } catch {} }
      finally { state.current.active = false; }
      if (state.abort) { onDiskAbort(); return; }
    }
    logline(`${bucket} (Meteor-Files): extracted ${state.files[key].done} files total (${(state.files[key].bytes / 1048576).toFixed(1)} MB)`);
  }

  await client.close();
  state.phase = state.errors.length ? 'completed-with-errors' : 'completed';
  // #6466: per-item errors (a document that fails EJSON parse — "no valid json" —
  // or a single attachment/avatar that fails to extract) must NOT fail the whole
  // migration: everything that DID copy is valid and consistent. The old
  // `state.errors.length < 10` threshold meant ten cosmetic per-item errors
  // (e.g. the "Avatars Errors" list) exited non-zero, which made migration-control
  // discard the fully-copied FerretDB SQLite and leave the snap serving 502 Bad
  // Gateway forever. Genuinely fatal conditions (disk-full abort, unusable source
  // tools, unreachable target) already returned early with state.success = false;
  // reaching this point means the run completed.
  if (state.success !== false) state.success = true;
  saveCheckpoint(true);
  writeStatus();
}

// Being stopped mid-migration (snap refresh, `snap stop`, reboot) is normal for a job
// this long and is NOT a failure. Flush the checkpoint — routine saves are throttled —
// and exit 128+signo, which migration-control reads as "interrupted: keep the partial
// FerretDB and resume on the next start" rather than "failed: discard it".
for (const [signal, signo] of [['SIGTERM', 15], ['SIGINT', 2]]) {
  process.on(signal, () => {
    logline(`${signal} — saving the checkpoint; the next start resumes from here.`);
    state.phase = 'interrupted';
    try { saveCheckpoint(true); } catch { /* exiting anyway */ }
    process.exit(128 + signo);
  });
}

run().then(() => {
  // On success, exit soon so start.js can boot WeKan on this port — long enough
  // (> the 2s dashboard refresh) for the browser to fetch the done page and start its
  // poller, which then survives the hand-off gap and opens All Boards. On failure, stay
  // up a minute so the admin can read the errors on the dashboard.
  setTimeout(() => process.exit(state.success ? 0 : 1), state.success ? 5000 : 60000);
})
     .catch(e => { err('Fatal: ' + e.stack); state.phase = 'error'; state.success = false; writeStatus(); setTimeout(() => process.exit(1), 5000); });
