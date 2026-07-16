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

// Resolve the CURRENT mongodb driver (v6, OP_MSG) from WeKan's bundle. A plain
// `import { MongoClient } from 'mongodb'` under Node 24's ESM loader can resolve the
// ANCIENT meteor-spk base mongodb v2.x (legacy OP_QUERY, which FerretDB rejects with
// "Unsupported OP_QUERY command: update") or fail default-interop entirely. So anchor a
// createRequire inside the modern bundle exactly like migrate-mongo3-to-ferretdb.mjs:
// build candidate ROOTS from $SNAP (env) and the script's parent dirs, then try the known
// modern-bundle sub-paths under each (npm-mongo's nested mongodb v6 BEFORE the plain
// node_modules so we never pick up the v2 driver). rootURLs is reused for i18n lookup.
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { statfsSync } from 'node:fs';

const rootURLs = [];
const pushRoot = (u) => { if (u) { try { rootURLs.push(new URL(u)); } catch {} } };
if (process.env.SNAP)        pushRoot(pathToFileURL(process.env.SNAP + '/'));
if (process.env.BUNDLE_ROOT) pushRoot(pathToFileURL(process.env.BUNDLE_ROOT + '/'));
if (process.env.NODE_PATH)   pushRoot(pathToFileURL(process.env.NODE_PATH.split(':')[0].replace(/\/programs\/server\/node_modules\/?$/, '') + '/'));
pushRoot(new URL('../', import.meta.url));    // $SNAP  (this script is $SNAP/bin/<name>)
pushRoot(new URL('./', import.meta.url));     // $SNAP/bin (if the bundle sits beside it)
pushRoot(new URL('../../', import.meta.url)); // one more up, for other/older layouts
const _subPaths = [
  'programs/server/npm/node_modules/meteor/npm-mongo/node_modules/_.cjs',
  'programs/server/npm/node_modules/_.cjs',
  'programs/server/node_modules/_.cjs',
  '_.cjs',
];
const _anchors = [];
for (const root of rootURLs) {
  for (const sp of _subPaths) {
    try { _anchors.push(createRequire(new URL(sp, root))); } catch {}
  }
}
// Also try a normal import specifier resolution as a last resort (dev / non-snap runs
// where `mongodb` is a plain dependency on NODE_PATH).
_anchors.push(createRequire(import.meta.url));
function requireAny(spec) {
  for (const req of _anchors) { try { return req(spec); } catch {} }
  return null;
}
// Check every anchor and USE WHAT WORKS: a usable driver has MongoClient + GridFSBucket and
// speaks OP_MSG (major >= 6, which FerretDB needs). Return the first v6+ driver found;
// otherwise fall back to the highest-version module that at least exposes MongoClient, so we
// still run (and log a warning) rather than crash. Records the version for a startup check.
function resolveMongodb() {
  let best = null, bestMajor = -1;
  for (const req of _anchors) {
    let mod; try { mod = req('mongodb'); } catch { continue; }
    if (!mod || typeof mod.MongoClient !== 'function') continue;
    let major = 0;
    try { major = parseInt(String(req('mongodb/package.json')?.version || '0').split('.')[0], 10) || 0; } catch {}
    if (typeof mod.GridFSBucket === 'function' && major >= 6) return { mod, major };
    if (major > bestMajor) { best = mod; bestMajor = major; }
  }
  return best ? { mod: best, major: bestMajor } : { mod: {}, major: -1 };
}
const _resolvedDriver = resolveMongodb();
const mongodb = _resolvedDriver.mod;
const MONGODB_DRIVER_MAJOR = _resolvedDriver.major;
const { MongoClient, GridFSBucket, ObjectId } = mongodb;

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
  // Live per-file progress for the file currently being extracted (name, size, bytes done,
  // 1-based index across ALL files, total files) so the dashboard shows a progress BAR for a
  // big file, not just a counter. kind: 'attachments' | 'avatars' (translated for the viewer).
  current: { active: false, kind: '', name: '', size: 0, done: 0, index: 0, total: 0 },
  // Live free disk space (bytes). Below the safety margin the migration ABORTS — a full disk
  // can corrupt the source MongoDB, which is still running as we read it.
  diskFree: -1, abort: false,
  // Set when the migration STOPS for lack of disk space: total bytes for ALL files, how much
  // MORE is required, and a rollback summary (partial files deleted to give the space back).
  filesTotalBytes: 0, additionalBytesNeeded: 0, rollback: null,
  errors:    [],                   // up to 200 recent errors
  startedAt: new Date().toISOString(),
  finishedAt: null,
  success:   null,
  dryRun:    DRY_RUN,
  // Product name shown on the dashboard. Defaults to WeKan, but if the migrated
  // database has a product name set in Admin Panel (settings.productName), that is
  // used instead and WeKan is not mentioned. Populated after the source connects.
  product:   'WeKan',
};

function pushError(msg) {
  console.error('[ERROR]', msg);
  state.errors.push({ ts: new Date().toISOString(), msg: String(msg).slice(0, 400) });
  if (state.errors.length > 200) state.errors.shift();
}

// ── HTTP progress server ───────────────────────────────────────────────────
const HTML_TEMPLATE = `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><meta http-equiv="refresh" content="3">
<title>__PRODUCT__ Migration Progress</title>
<style>
  body{font-family:monospace;background:#111;color:#ddd;padding:1em 2em}
  h1{color:#7bf}  h2{color:#7bf;font-size:1.05em}  .ok{color:#7f7}  .fail{color:#f77}  .warn{color:#fb7}
  .bar-wrap{background:#333;border-radius:4px;height:18px;width:100%;max-width:600px}
  .bar{background:#4a9;height:18px;border-radius:4px;transition:width .4s}
  table{border-collapse:collapse;width:100%}
  td,th{padding:4px 10px;border-bottom:1px solid #333;text-align:left}
  th{color:#aaa;font-size:.85em}
  .phase{font-size:1.3em;margin:1em 0}
</style></head><body>
<h1>__PRODUCT__ Migration: MongoDB → FerretDB (SQLite)</h1>
<div class="phase">Phase: <strong id="phase">…</strong> <span id="detail" style="color:#aaa"></span></div>
<p>Started: __STARTED__  &nbsp; Elapsed: <span id="elapsed"></span>__DISKFREE__</p>
__DISKERR__
__CURRENT__
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

function buildHtml(T) {
  const mb = (n) => (Number(n || 0) / 1048576).toFixed(1);
  const colRows = Object.entries(state.collections).map(([name, c]) => {
    const pct = c.total > 0 ? Math.round(100 * c.done / c.total) : 0;
    return `<tr><td>${escHtml(name)}</td><td><div class="bar-wrap"><div class="bar" style="width:${pct}%"></div></div>${pct}%</td>`
         + `<td>${c.done}</td><td>${c.total}</td><td class="${c.errors>0?'fail':''}">${c.errors}</td></tr>`;
  }).join('');

  // Translate the file-type rows for the viewer's language.
  const typeLabel = (t) => t === 'avatars' ? T.avatars : T.attachments;
  const fRows = Object.entries(state.files).map(([type, f]) =>
    `<tr><td>${escHtml(typeLabel(type))}</td><td>${f.done}</td><td>${f.skipped}</td><td class="${f.errors>0?'fail':''}">${f.errors}</td><td>${mb(f.bytes)} MB</td></tr>`
  ).join('');

  const errHtml = state.errors.length === 0 ? '<p style="color:#aaa">None</p>'
    : state.errors.slice(-20).reverse().map(e => `<div class="fail">${e.ts} — ${escHtml(e.msg)}</div>`).join('');

  // Live per-file progress bar for the file currently streaming to disk (e.g. a 5 GB
  // attachment): translated kind, file name + size, "file N of TOTAL", and a % bar.
  let currentHtml = '';
  const cur = state.current;
  if (cur && cur.active) {
    const kindLabel = cur.kind === 'avatars' ? T.avatar : T.attachment;
    const pct = cur.size > 0 ? Math.min(100, Math.floor((cur.done / cur.size) * 100)) : 0;
    currentHtml = `<h2>${escHtml(kindLabel)}</h2>
<p style="margin:.2em 0"><strong>${escHtml(cur.name || '')}</strong></p>
<p style="color:#aaa;margin:.2em 0">${escHtml(T.file)} ${cur.index} ${escHtml(T.of)} ${cur.total} · ${escHtml(T.size)} ${mb(cur.size)} MB</p>
<div class="bar-wrap"><div class="bar" style="width:${pct}%"></div></div>
<p style="color:#aaa;margin:.3em 0">${mb(cur.done)} / ${mb(cur.size)} MB — ${pct}%</p>`;
  }

  // Disk-space error panel: total needed, how much MORE is required, and how many files were
  // migrated (then deleted to free the space back) before stopping.
  let diskErrHtml = '';
  if (state.additionalBytesNeeded > 0 || state.rollback) {
    const rb = state.rollback || {};
    const knownFree = state.diskFree >= 0;
    diskErrHtml = `<div style="border:1px solid #f77;border-radius:4px;padding:.6em 1em;margin:1em 0">
<h2 class="fail" style="margin:.2em 0">⚠ Not enough disk space</h2>
<p>${escHtml(T.attachments)} + ${escHtml(T.avatars)}: <strong>${mb(state.filesTotalBytes)} MB</strong>${knownFree ? ` · disk free: <strong>${mb(state.diskFree)} MB</strong>` : ''}</p>
<p class="fail" style="font-size:1.2em">${knownFree ? 'More disk space required' : 'Free space required for all files'}: ${mb(state.additionalBytesNeeded)} MB</p>
<p style="color:#aaa">Migrated before stopping — ${escHtml(T.attachments)}: ${rb.migratedAttachments ?? state.files.attachments.done}, ${escHtml(T.avatars)}: ${rb.migratedAvatars ?? state.files.avatars.done}.${rb.deletedFiles ? ` Deleted ${rb.deletedFiles} partially-migrated files (freed ${mb(rb.freedBytes)} MB) so the volume is not left full.` : ''} Free up at least the amount above; the migration retries automatically.</p>
</div>`;
  }

  const diskFreeHtml = state.diskFree >= 0 ? `  &nbsp; Disk free: ${mb(state.diskFree)} MB` : '';

  let phaseColor = '';
  if (state.success === true) phaseColor = ' class="ok"';
  if (state.success === false) phaseColor = ' class="fail"';

  return HTML_TEMPLATE
    .replace(/__PRODUCT__/g, escHtml(state.product))
    .replace(/__STARTED__/g, state.startedAt)
    .replace('__DISKFREE__', diskFreeHtml)
    .replace('__DISKERR__', diskErrHtml)
    .replace('__CURRENT__', currentHtml)
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
    // Keep the free-space figure fresh while running, and translate to the viewer's language.
    if (state.success === null) updateDiskFree(WRITABLE);
    const T = loadLang(pickLang(req.headers['accept-language']));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(buildHtml(T));
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

/** Free bytes available in `dir`, or Infinity if it can't be determined. */
function freeBytes(dir) {
  try {
    const st = statfsSync(dir);
    return Number(st.bavail) * Number(st.bsize);
  } catch {
    return Infinity;
  }
}

// ── i18n: translate a few dashboard words into the viewer's language ──────────
// The dashboard runs standalone (WeKan is not up yet, no logged-in user), so use the
// browser's Accept-Language and read the matching <lang>.i18n.json straight from WeKan's
// own bundle (best-effort across known layouts), falling back to English.
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
function pickLang(acceptLanguage) {
  const tags = String(acceptLanguage || '').split(',').map(s => s.split(';')[0].trim()).filter(Boolean);
  for (const tag of tags) {
    for (const cand of [tag, tag.split('-')[0]]) { if (i18nFileFor(cand)) return cand; }
  }
  return 'en';
}

// ── disk-space guard: STOP + roll back (same policy as migrate-mongo3-to-ferretdb.mjs) ──
// A full disk can corrupt the source MongoDB (still running as we read it), so we never
// write the volume dry: we stop, delete the partially migrated attachments/avatars to free
// the space back, and report how much MORE is needed.
// Platform note: on a SNAP statfs WORKS — statfs/statfs64/fstatfs/fstatfs64/statvfs/fstatvfs
// are in snapd's DEFAULT seccomp allow-list (snapcore/snapd interfaces/seccomp/template.go),
// and a snap has no per-snap disk quota by default, so statfsSync returns the real free
// space. quotactl is NOT allowed, but we never call it; a snapd storage-quota group (project
// quotas, invisible to statfs) is still caught by the ENOSPC/EDQUOT write-failure path. Inside
// a SANDSTORM grain statfs is NOT reliable (FUSE doesn't implement it, quotactl is blocked),
// so we cannot pre-check and rely purely on the write failure.
const IS_SANDSTORM = process.env.SANDSTORM === '1' || !!process.env.SANDSTORM_RAW_MONGO_PATH || (() => {
  try { return !!((JSON.parse(process.env.METEOR_SETTINGS || '{}').public) || {}).sandstorm; } catch { return false; }
})();
const IS_SNAP = !!(process.env.SNAP || process.env.SNAP_NAME);
const DISK_MIN_FREE = parseInt(process.env.MIGRATION_MIN_FREE_BYTES || String(1024 * 1048576), 10); // 1 GB
function flagDiskFull(detail) {
  if (state.abort) return;
  state.abort = true; state.success = false; state.phase = 'error';
  pushError(`FATAL: not enough disk space${detail ? ' (' + detail + ')' : ''}. Stopping and deleting migrated attachments/avatars to free the space, to avoid MongoDB data corruption.`);
}
let _lastDiskCheck = 0;
function updateDiskFree(dir, force) {
  // Snap: statfs is allowed by snapd's default seccomp policy and returns real free space.
  // Sandstorm: statfs is unreliable (FUSE unimplemented / quotactl blocked) — treat as
  // unknown. Elsewhere ATTEMPT it; if it fails (locked-down container) leave free space
  // unknown and rely on a write failure. Whenever state.diskFree stays < 0 the pre-check
  // guards are skipped.
  if (IS_SANDSTORM) { state.diskFree = -1; return; }
  const now = Date.now();
  if (!force && now - _lastDiskCheck < 1000) return; // ~1 statfs/sec while streaming
  _lastDiskCheck = now;
  try { const s = statfsSync(dir); state.diskFree = Number(s.bavail) * Number(s.bsize); }
  catch { state.diskFree = -1; return; }
  if (state.diskFree >= 0 && state.diskFree < DISK_MIN_FREE) {
    flagDiskFull(`only ${(state.diskFree / 1048576).toFixed(0)} MB free < ${(DISK_MIN_FREE / 1048576).toFixed(0)} MB margin`);
  }
}
// Before writing a file, ensure room for it PLUS the margin; else STOP (not skip). Returns false.
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
// Called once when the migration stops for lack of disk space: delete the attachments/avatars
// this run wrote (an incomplete file migration is useless, and freeing the space keeps the
// volume — and the running MongoDB — safe; the migration retries from scratch), then report
// how many files were migrated and how much MORE space is needed for ALL files at once.
let _abortHandled = false;
function onDiskAbort() {
  if (_abortHandled) return;
  _abortHandled = true;
  const migratedAttachments = state.files.attachments.done;
  const migratedAvatars = state.files.avatars.done;
  console.log('[migrate] Not enough disk space — deleting the partially migrated attachments/avatars to free the space back…');
  let deletedFiles = 0, freedBytes = 0;
  for (const dir of [ATTACH_DIR, AVATAR_DIR]) {
    try {
      for (const ent of fs.readdirSync(dir)) {
        const p = path.join(dir, ent);
        try { const st = fs.statSync(p); if (st.isFile()) { freedBytes += Number(st.size) || 0; fs.unlinkSync(p); deletedFiles++; } } catch {}
      }
    } catch {}
  }
  updateDiskFree(WRITABLE, true);
  const freeNow = state.diskFree >= 0 ? state.diskFree : 0;
  state.additionalBytesNeeded = Math.max(0, state.filesTotalBytes + DISK_MIN_FREE - freeNow);
  state.rollback = { migratedAttachments, migratedAvatars, deletedFiles, freedBytes };
  saveCheckpoint(true);
}

// ── Resumable progress checkpoint (saved to WRITABLE_PATH) ───────────────────
// The migration can take a long time — hours on a big instance — and may be
// interrupted (snap refresh, Sandstorm grain restart, power loss). We persist
// progress to WRITABLE_PATH so a restart RESUMES instead of starting over:
// collections already fully copied are skipped, files already extracted are
// skipped, and the progress dashboard is restored. copyCollection() already
// upserts every document, so resuming is always safe.
//
// The checkpoint only describes the target SQLite and the extracted files, so it
// must be deleted whenever those are (migration-control's
// discard_partial_ferretdb does this) — a checkpoint outliving the data it
// describes would make the next run skip collections that are no longer there.
const CHECKPOINT_FILE = path.join(WRITABLE, 'migration-progress.json');
const completedCollections = new Set();
// key `${bucket}:${recordId}` -> { path, size } for every file already extracted and
// recorded in the target. Written only AFTER the file is complete on disk and its
// record points at it, so a half-written file is never treated as done.
const completedFiles = new Map();

let _lastCheckpointSave = 0;
function saveCheckpoint(force) {
  if (DRY_RUN) return;
  // The file phase calls this per file; with thousands of files rewriting the whole
  // JSON each time is O(n²). Throttle to ~1 write/2s. Losing the last couple of
  // seconds of progress on an interruption only costs re-extracting a file or two.
  const now = Date.now();
  if (!force && now - _lastCheckpointSave < 2000) return;
  _lastCheckpointSave = now;
  try {
    ensureDir(WRITABLE);
    const tmp = CHECKPOINT_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify({
      version: 2,
      updatedAt: new Date().toISOString(),
      phase: state.phase,
      completedCollections: [...completedCollections],
      completedFiles: [...completedFiles].map(([k, v]) => [k, v]),
      collections: state.collections,
      success: state.success,
      compacted: state.compacted === true,
    }));
    fs.renameSync(tmp, CHECKPOINT_FILE);   // atomic replace
  } catch (err) {
    pushError('checkpoint save: ' + err.message);
  }
}

function loadCheckpoint() {
  try {
    if (!fs.existsSync(CHECKPOINT_FILE)) return;
    const cp = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
    (cp.completedCollections || []).forEach(c => completedCollections.add(c));
    (cp.completedFiles || []).forEach(([k, v]) => completedFiles.set(k, v));
    if (cp.collections) Object.assign(state.collections, cp.collections);
    if (cp.compacted) state.compacted = true;
    // state.files counters are deliberately NOT restored: the file loops re-count
    // every file they walk, skipped or extracted, so the totals stay exact even
    // though the checkpoint is only saved every couple of seconds.
    if (completedCollections.size > 0 || completedFiles.size > 0) {
      state.resumed = true;
      console.log(`[migrate] Resuming from checkpoint — ${completedCollections.size} collection(s) and ${completedFiles.size} file(s) already migrated.`);
    }
  } catch (err) {
    pushError('checkpoint load: ' + err.message);
  }
}

// A checkpointed file counts as done only if it is still on disk at the recorded size.
// Guards against the file being removed or truncated between runs (e.g. the disk-full
// rollback deletes extracted files), in which case we simply extract it again.
function alreadyExtracted(key) {
  const prev = completedFiles.get(key);
  if (!prev || !prev.path) return null;
  try {
    const st = fs.statSync(prev.path);
    if (st.isFile() && Number(st.size) === Number(prev.size)) return prev;
  } catch { /* missing — re-extract */ }
  completedFiles.delete(key);
  return null;
}

// ── Compact the OLD MongoDB after a successful migration ─────────────────────
// Once the text data is in FerretDB and files are on the filesystem, the old
// MongoDB data files still hold all that (now-duplicated) data. Run `compact` on
// each source collection so WiredTiger returns the freed space to the OS. This
// runs ONCE (tracked by a `compacted` flag on the completion marker), and is
// best-effort — compact is not critical and may be unsupported on some setups.
async function compactSource(srcDb, markerColl) {
  if (DRY_RUN) return;
  const done = await markerColl.findOne({ _id: 'completed' }).catch(() => null);
  if (done && done.compacted) { state.compacted = true; return; }

  state.phase = 'compacting-source';
  state.phase_detail = 'Reclaiming disk space in the old MongoDB (compact)…';
  console.log('[migrate] Compacting source MongoDB collections to free disk space…');
  const beforeFree = freeBytes(WRITABLE);
  let names = [];
  try { names = (await srcDb.listCollections().toArray()).map(c => c.name); } catch { /* ignore */ }
  for (const n of names) {
    try {
      state.phase_detail = 'compact ' + n;
      await srcDb.command({ compact: n, force: true });
    } catch (err) {
      // Best-effort: log and continue (compact can fail on views, capped colls, etc.)
      pushError('compact ' + n + ': ' + err.message);
    }
  }
  state.compacted = true;
  await markerColl.updateOne(
    { _id: 'completed' },
    { $set: { compacted: true, compactedAt: new Date() } },
  ).catch(() => {});
  const reclaimed = freeBytes(WRITABLE) - beforeFree;
  console.log(`[migrate] Compact done${Number.isFinite(reclaimed) ? ` (~${Math.round(reclaimed / 1048576)} MB freed)` : ''}.`);
  saveCheckpoint(true);
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
 * The path a record's file is extracted to, derived only from the record's own _id and
 * name. Returns the full path and the relative basename used.
 *
 * This is deterministic ON PURPOSE. It used to append a _1, _2, … counter while the
 * candidate path existed, which is wrong for the only case that can actually produce a
 * collision: idHex is the record's _id, so two different records never collide, and an
 * existing file at this path is always THIS record extracted by an earlier, interrupted
 * run. The counter turned every resume into a full second copy of every attachment —
 * orphaning the first copy, and needing double the disk the up-front space check
 * budgeted for. Completed files are skipped via the checkpoint before we get here, so a
 * file still sitting at this path is a partial one and is meant to be overwritten.
 */
function destFilePath(dir, idHex, originalName) {
  const base = `${idHex}_${sanitizeFilename(originalName)}`;
  return { fullPath: path.join(dir, base), basename: base };
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
async function extractGridFsFile(bucket, fileId, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    let oid;
    try { oid = typeof fileId === 'string' ? new ObjectId(fileId) : fileId; } catch { oid = fileId; }
    const stream = bucket.openDownloadStream(oid);
    const out   = fs.createWriteStream(destPath);
    let bytes = 0, settled = false;
    const fail = (e) => { if (settled) return; settled = true; try { stream.destroy(); } catch {} try { out.destroy(); } catch {} reject(e); };
    // Count bytes as they flow (pipe back-pressures, so downloaded ≈ written) and publish
    // live per-file progress. If the disk poller flagged an abort, stop this file now.
    stream.on('data', chunk => {
      bytes += chunk.length;
      if (onProgress) { try { onProgress(bytes); } catch {} }
      if (state.abort) fail(new Error('aborted: not enough disk space'));
    });
    stream.on('error', fail);
    out.on('error', (e) => {
      // ENOSPC/EDQUOT is the only out-of-space signal where free space is not measurable
      // (Sandstorm): trigger the disk-full abort + rollback.
      if (e && (e.code === 'ENOSPC' || e.code === 'EDQUOT')) flagDiskFull('write failed: ' + e.code);
      fail(e);
    });
    out.on('finish', () => { if (!settled) { settled = true; resolve(bytes); } });
    stream.pipe(out);
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
  // Resume from a previous interrupted run if a checkpoint exists in WRITABLE_PATH.
  loadCheckpoint();

  // Fail fast with a clear message if we could not resolve a usable modern mongodb driver
  // from the bundle (see resolveMongodb): without MongoClient there is nothing to do, and a
  // pre-v6 driver speaks OP_QUERY, which FerretDB rejects.
  if (typeof MongoClient !== 'function') {
    pushError('FATAL: could not resolve the mongodb driver (MongoClient) from the WeKan bundle.');
    state.phase = 'error'; state.success = false; state.finishedAt = new Date().toISOString();
    setTimeout(() => process.exit(1), 5000); return;
  }
  console.log('[migrate] mongodb driver major version:', MONGODB_DRIVER_MAJOR);
  if (MONGODB_DRIVER_MAJOR >= 0 && MONGODB_DRIVER_MAJOR < 6) {
    pushError(`WARNING: resolved mongodb driver v${MONGODB_DRIVER_MAJOR}; FerretDB needs v6+ (OP_MSG). Inserts may fail.`);
  }

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

  // If the migrated database has a product name set in Admin Panel, show that on
  // the dashboard instead of "WeKan". Best-effort: any failure keeps the default.
  try {
    const s = await srcDb.collection('settings').findOne({ productName: { $type: 'string' } });
    if (s && typeof s.productName === 'string' && s.productName.trim()) {
      state.product = s.productName.trim();
      console.log('[migrate] Using product name from Admin Panel settings:', state.product);
      // Cache it so the snap maintenance page can show it when both databases are stopped.
      try { if (process.env.SNAP_COMMON) fs.writeFileSync(process.env.SNAP_COMMON + '/.productname.txt', state.product + '\n'); } catch {}
    }
  } catch (e) { /* keep default product name */ }

  // Check idempotency marker
  const markerColl = tgtDb.collection(MARKER_COLL);
  const marker = await markerColl.findOne({ _id: 'completed' });
  if (marker && marker.schemaVersion >= SCHEMA_VER && !process.env.FORCE_MIGRATE) {
    console.log('[migrate] Already migrated (schema v' + marker.schemaVersion + '). Exiting.');
    state.phase = 'already-migrated';
    state.phase_detail = 'Schema v' + marker.schemaVersion + ' already present in target';
    state.success = true;
    // A previous boot already migrated attachments, avatars and text data:
    // reclaim the old MongoDB disk space now (runs once, tracked by the marker).
    try { await compactSource(srcDb, markerColl); } catch (e) { pushError('compact: ' + e.message); }
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
    // FerretDB v1 rejects collection names containing a dot ("invalid key: '<name>' (key must
    // not contain '.' sign)"), and NONE of WeKan's real data collections have a dot. Every
    // DOTTED collection is a GridFS internals collection (<bucket>.files/.chunks, cfs_gridfs.*,
    // cfs._tempstore.*), a CollectionFS filerecord (cfs.<bucket>.filerecord) or a system.*
    // collection — GridFS binaries are extracted in the file phase, and CollectionFS
    // filerecords become bare <bucket> records there too. So skip any dotted name here.
    if (name.includes('.') || gridFsCols.has(name)) {
      console.log(`[migrate] Skipping dotted/GridFS collection (handled in file phase): ${name}`);
      continue;
    }
    // Resume: skip collections a previous run already finished copying.
    if (!process.env.FORCE_MIGRATE && completedCollections.has(name)) {
      console.log(`[migrate] Skipping already-migrated collection: ${name}`);
      continue;
    }

    let transformer = null;
    if (name === 'boards') {
      transformer = doc => upgradeBoard(doc);
    } else if (name === 'lists') {
      transformer = doc => upgradeList(doc, defaultSwimlaneIdFor);
    } else if (name === 'cards') {
      transformer = doc => upgradeCard(doc, listSwimlaneMap, defaultSwimlaneIdFor);
    }

    state.phase_detail = name;
    console.log(`[migrate] Copying collection: ${name}`);
    await copyCollection(srcDb, tgtDb, name, transformer);
    completedCollections.add(name);
    saveCheckpoint(true);   // persist progress to WRITABLE_PATH after each collection
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

  // Close both clients and exit (staying up 60 s so the dashboard's disk-space error can be
  // read) when the file phase stops for lack of disk space.
  const finishAbort = async () => {
    state.finishedAt = new Date().toISOString();
    try { await srcClient.close(); } catch {}
    try { await tgtClient.close(); } catch {}
    setTimeout(() => process.exit(1), 60_000);
  };

  // Measure up front how many files and how many BYTES must be extracted (both the
  // CollectionFS GridFS files and the Meteor-Files-in-GridFS records), so the dashboard can
  // show "file N of TOTAL" and a per-file bar, and so we can STOP before extracting anything
  // if the volume cannot hold them all (a full disk can corrupt the still-running MongoDB).
  let fileIndex = 0;
  const cfsFileColls = ['attachments', 'avatars'].filter(b => allColls.includes(`cfs_gridfs.${b}.files`));
  const mfColls      = ['attachments', 'avatars'].filter(c => allColls.includes(c));
  for (const b of cfsFileColls) {
    try { state.current.total += await srcDb.collection(`cfs_gridfs.${b}.files`).countDocuments(); } catch {}
    try { const r = await srcDb.collection(`cfs_gridfs.${b}.files`).aggregate([{ $group: { _id: null, s: { $sum: '$length' } } }]).toArray(); state.filesTotalBytes += r.length ? Number(r[0].s) || 0 : 0; } catch {}
  }
  for (const c of mfColls) {
    try { state.current.total += await srcDb.collection(c).countDocuments({ 'versions.original.storage': 'gridfs' }); } catch {}
    try { const r = await srcDb.collection(c).aggregate([{ $match: { 'versions.original.storage': 'gridfs' } }, { $group: { _id: null, s: { $sum: '$versions.original.size' } } }]).toArray(); state.filesTotalBytes += r.length ? Number(r[0].s) || 0 : 0; } catch {}
  }
  updateDiskFree(WRITABLE, true);
  console.log(`[migrate] Files to extract: ${state.current.total} (${(state.filesTotalBytes / 1048576).toFixed(0)} MB)${state.diskFree >= 0 ? `; disk free ${(state.diskFree / 1048576).toFixed(0)} MB` : '; free space unknown — will stop on a write failure'}.`);
  // Up-front check ONLY when free space is measurable. If it will not all fit, stop before
  // extracting anything so a full disk can never corrupt MongoDB.
  if (!DRY_RUN && state.filesTotalBytes > 0 && state.diskFree >= 0 && state.diskFree < state.filesTotalBytes + DISK_MIN_FREE) {
    state.abort = true; state.success = false; state.phase = 'error';
    state.additionalBytesNeeded = Math.max(0, state.filesTotalBytes + DISK_MIN_FREE - state.diskFree);
    pushError(`FATAL: not enough disk space to migrate all files: ${(state.filesTotalBytes / 1048576).toFixed(0)} MB of attachments/avatars must be extracted, only ${(state.diskFree / 1048576).toFixed(0)} MB free — need ${(state.additionalBytesNeeded / 1048576).toFixed(0)} MB more. Stopped before extracting to avoid MongoDB data corruption.`);
    onDiskAbort();
    await finishAbort();
    return;
  }

  async function migrateGridFs(bucketName, destDir, fileStateKey) {
    const filesCollName   = `cfs_gridfs.${bucketName}.files`;
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
      const size = original.size || 0;
      const { fullPath, basename } = destFilePath(destDir, String(record._id), originalName);

      // Extracted by an earlier run that was interrupted: count it and move on. This is
      // what makes a resumed migration cheap — re-extracting gigabytes of unchanged
      // attachments is the slowest part of the whole job.
      const resumeKey = `${bucketName}:${record._id}`;
      const done = alreadyExtracted(resumeKey);
      if (done) {
        fileIndex++;
        state.files[fileStateKey].done++;
        state.files[fileStateKey].bytes += Number(done.size) || 0;
        continue;
      }

      // STOP (not skip) if this file plus the safety margin will not fit: a full disk can
      // corrupt the still-running source MongoDB. Roll back and report how much more is needed.
      if (!DRY_RUN && !ensureDiskForFile(destDir, size, originalName)) { await metaCursor.close(); onDiskAbort(); return; }

      fileIndex++;
      state.current = { active: true, kind: fileStateKey, name: originalName, size, done: 0, index: fileIndex, total: state.current.total };

      if (DRY_RUN) {
        state.files[fileStateKey].done++;
        state.files[fileStateKey].bytes += size;
        state.current.active = false;
        continue;
      }

      try {
        const bytes = await extractGridFsFile(bucket, gridFsId, fullPath, (w) => { state.current.done = w; updateDiskFree(destDir); });
        state.files[fileStateKey].done++;
        state.files[fileStateKey].bytes += bytes;
        state.current.done = bytes;

        // CREATE the Meteor-Files record in the bare <bucket> collection from the CollectionFS
        // filerecord, pointing at the on-disk file. The cfs.<bucket>.filerecord collection is
        // NOT copied as text (FerretDB rejects its dotted name), so this is where the record is
        // made. replaceOne(upsert:true) so it works whether or not one already exists.
        const mfRecord = cfsRecordToMeteorFile(record, bucketName, basename);
        mfRecord.path = fullPath;
        mfRecord.size = bytes;
        if (mfRecord.versions && mfRecord.versions.original) {
          mfRecord.versions.original.path = fullPath;
          mfRecord.versions.original.size = bytes;
          mfRecord.versions.original.storage = 'fs';
        }
        mfRecord.meta = { ...(mfRecord.meta || {}), originalFilename: originalName, storedBasename: basename, source: 'cfs-migration' };
        await tgtDb.collection(bucketName).replaceOne({ _id: record._id }, mfRecord, { upsert: true });
        // Only now is this file really done: bytes on disk AND a record pointing at them.
        completedFiles.set(resumeKey, { path: fullPath, size: bytes });
        saveCheckpoint();
      } catch (err) {
        if (err && (err.code === 'ENOSPC' || err.code === 'EDQUOT')) flagDiskFull('write failed: ' + err.code);
        pushError(`GridFS extract ${bucketName}/${record._id}: ${err.message}`);
        state.files[fileStateKey].errors++;
        // Clean up partial file
        try { fs.unlinkSync(fullPath); } catch { /* ignore */ }
      } finally { state.current.active = false; }

      if (state.abort) { await metaCursor.close(); onDiskAbort(); return; }
    }
    await metaCursor.close();
  }

  await migrateGridFs('attachments', ATTACH_DIR, 'attachments');
  if (state.abort) { await finishAbort(); return; }
  saveCheckpoint(true);
  await migrateGridFs('avatars',     AVATAR_DIR, 'avatars');
  if (state.abort) { await finishAbort(); return; }
  saveCheckpoint(true);

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
      const size = (doc.versions && doc.versions.original && doc.versions.original.size) || doc.size || 0;
      const { fullPath, basename } = destFilePath(destDir, String(doc._id), originalName);

      const resumeKey = `${collName}:${doc._id}`;
      const done = alreadyExtracted(resumeKey);
      if (done) {
        fileIndex++;
        state.files[fileStateKey].done++;
        state.files[fileStateKey].bytes += Number(done.size) || 0;
        continue;
      }

      if (!DRY_RUN && !ensureDiskForFile(destDir, size, originalName)) { await cursor.close(); onDiskAbort(); await finishAbort(); return; }

      fileIndex++;
      state.current = { active: true, kind: fileStateKey, name: originalName, size, done: 0, index: fileIndex, total: state.current.total };

      if (DRY_RUN) { state.files[fileStateKey].done++; state.current.active = false; continue; }

      try {
        const bytes = await extractGridFsFile(bucket, gridFsId, fullPath, (w) => { state.current.done = w; updateDiskFree(destDir); });
        state.files[fileStateKey].done++;
        state.files[fileStateKey].bytes += bytes;
        state.current.done = bytes;
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
        completedFiles.set(resumeKey, { path: fullPath, size: bytes });
        saveCheckpoint();
      } catch (err) {
        if (err && (err.code === 'ENOSPC' || err.code === 'EDQUOT')) flagDiskFull('write failed: ' + err.code);
        pushError(`Move GridFS→fs ${collName}/${doc._id}: ${err.message}`);
        state.files[fileStateKey].errors++;
        try { fs.unlinkSync(fullPath); } catch { /* ignore */ }
      } finally { state.current.active = false; }

      if (state.abort) { await cursor.close(); onDiskAbort(); await finishAbort(); return; }
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
    saveCheckpoint(true);
  }

  // ── 8b. Reclaim old MongoDB disk space now that everything is migrated ──
  try { await compactSource(srcDb, markerColl); } catch (e) { pushError('compact: ' + e.message); }

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
    // #6466: per-item errors (one unparsable document, one attachment/avatar that
    // fails to extract) must NOT fail the whole migration — everything that DID
    // copy is valid. The old `totalErrors < 10` threshold turned ten cosmetic
    // per-item errors into a non-zero exit, which made the snap's
    // migration-control discard the fully-copied FerretDB SQLite and leave WeKan
    // serving 502 Bad Gateway. Fatal conditions (disk-full, unreachable
    // source/target) already set state.success = false and never reach here.
    if (state.success !== false) state.success = true;
    console.log(`[migrate] ⚠ Migration done with ${totalErrors} error(s). See dashboard.`);
  }
  state.finishedAt = new Date().toISOString();
  saveCheckpoint(true);

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

Resumable: progress is checkpointed to \$WRITABLE_PATH/migration-progress.json
after every collection and file phase, so an interrupted migration (snap refresh,
Sandstorm grain restart, power loss) RESUMES on restart instead of starting over.

Idempotent: re-running after success is safe (marker in _wekan_migration). Once
the migration has completed successfully, a later run reclaims the now-duplicated
disk space in the OLD MongoDB by running \`compact\` on each source collection
(best-effort, runs once — tracked by the marker's \`compacted\` flag).
`);
  process.exit(0);
}

if (process.argv.includes('--dry-run')) {
  process.env.DRY_RUN = 'true';
}

// Being stopped mid-migration (snap refresh, grain restart, `snap stop`) is normal for a
// job this long, and must not be mistaken for a failure. Flush the checkpoint — routine
// saves are throttled, so up to a couple of seconds of progress is otherwise re-done —
// and exit with the conventional 128+signo, which migration-control reads as "interrupted,
// keep the partial database and resume next start" rather than "failed, discard it".
for (const [signal, signo] of [['SIGTERM', 15], ['SIGINT', 2]]) {
  process.on(signal, () => {
    console.log(`[migrate] ${signal} — saving the checkpoint; the next start resumes from here.`);
    state.phase = 'interrupted';
    try { saveCheckpoint(true); } catch { /* exiting anyway */ }
    process.exit(128 + signo);
  });
}

run().catch(err => {
  pushError('Fatal: ' + err.stack);
  state.phase   = 'error';
  state.success = false;
  state.finishedAt = new Date().toISOString();
  console.error('[migrate] Fatal error:', err);
  setTimeout(() => process.exit(1), 5000);
});
