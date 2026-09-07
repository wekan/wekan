import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Mongo } from 'meteor/mongo';
import { MongoInternals } from 'meteor/mongo';
import { EJSON } from 'meteor/ejson';
import { ReactiveCache } from '/imports/reactiveCache';
import { SyncedCron } from '/server/cron/syncedCron';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { Readable } from 'stream';
import { ZipArchive } from 'archiver';
import unzipper from 'unzipper';
const { filesRootFrom, scheduleText, safeEntryPath, safeCollectionName } =
  require('/models/lib/backupPaths');
// Multitenancy option D (docs/Design/Multitenancy/Multitenancy.md, D.8): backing up
// and restoring ONE Organization. Every decision - which collections, the selector
// for each, which archive belongs to whom, and the restore-side ownership guard -
// is made by these two pure modules, so it can be unit-tested without a database
// (tests/tenantBackup.test.cjs) and cannot drift between the two directions.
import * as tenantBackup from '/models/lib/tenantBackup';
import * as tenantAdmin from '/models/lib/tenantAdmin';

// ─────────────────────────────────────────────────────────────────────────────
// Admin Panel / Attachments / Backup.
//
// Backs up any of: Attachments, Avatars, Data (text = all collections that are
// NOT attachments/avatars) into
//   backup/YYYY/MM/DD/HH_MM_SS/backup.zip
// whose contents are
//   YYYY_MM_DD-HH_MM_SS/attachments/…            (files, streamed from disk)
//   YYYY_MM_DD-HH_MM_SS/avatars/…                (files, streamed from disk)
//   YYYY_MM_DD-HH_MM_SS/data/<collection>.ndjson (one EJSON document per line)
//
// LOW MEMORY / STREAMING BY DESIGN — a board with thousands of cards or a 5 GB
// attachment must not be loaded into RAM:
//   * The zip is written with `archiver`, which STREAMS each attachment/avatar
//     directly from disk (`archive.directory`) — never buffering a whole file.
//   * Text data is streamed a DOCUMENT AT A TIME from a MongoDB cursor into the
//     archive as NDJSON (one doc per line).
//   * The archive is piped straight to the destination (a file, or an S3/Azure/GCS
//     streaming upload) — no temp file, no whole-zip buffer.
//   * Restore reads the zip with `unzipper` and streams each file entry straight
//     to disk, and each data NDJSON entry LINE BY LINE into the database.
//
// Restore supports "add missing" (only insert docs/files not already present) or
// "replace all". A schedule (daily/weekly/monthly) runs backups via synced-cron.
// The selected storage is where the .zip is streamed (filesystem is fully
// implemented; the cloud upload paths are not exercised end-to-end here).
//
// PER-TENANT (multitenancy option D, D.8): the same machinery with a SCOPE. With an
// orgId, only that Organization's boards and everything hanging off them are
// exported - no accounts, no instance settings, no org/team documents - into
// <files>/backup/org/<orgId>/…, and a restore of such an archive may only write
// documents that belong to boards the tenant really owns. A per-tenant Global Admin
// may only ever use their own tenant's archives; the whole-instance scope stays
// site-admin only.
// ─────────────────────────────────────────────────────────────────────────────

const BackupSettings = new Mongo.Collection('backupSettings');

// Collections that hold FILE data (attachments/avatars) — excluded from "Data".
const FILE_COLLECTIONS = new Set([
  'attachments', 'avatars',
  'cfs.attachments.filerecord', 'cfs.avatars.filerecord',
  'cfs_gridfs.attachments.files', 'cfs_gridfs.attachments.chunks',
  'cfs_gridfs.avatars.files', 'cfs_gridfs.avatars.chunks',
]);

function filesRoot() {
  return filesRootFrom(process.env.WRITABLE_PATH || process.cwd());
}
const attachmentsDir = () => path.join(filesRoot(), 'attachments');
const avatarsDir = () => path.join(filesRoot(), 'avatars');
const backupRoot = () => path.join(filesRoot(), 'backup');

function pad(n) { return String(n).padStart(2, '0'); }
function nowParts() {
  const d = new Date();
  return { y: d.getFullYear(), mo: pad(d.getMonth() + 1), da: pad(d.getDate()), h: pad(d.getHours()), mi: pad(d.getMinutes()), s: pad(d.getSeconds()) };
}

// Live progress the client polls.
const progress = { running: false, phase: 'idle', detail: '', file: '', success: null, error: '' };
function setProgress(p) { Object.assign(progress, p); }

// Stream a MongoDB collection out as NDJSON (one EJSON document per line) — pulls
// a document at a time from the cursor, so a collection with thousands of cards
// never sits in RAM.
async function* ndjsonOfCollection(db, coll) {
  const cursor = db.collection(coll).find({});
  for await (const doc of cursor) {
    yield EJSON.stringify(doc) + '\n';
  }
  await cursor.close();
}

// Stream the archive straight to a cloud provider (no temp file). SDKs are
// lazy-required. Returns { dest, promise } — the caller adds entries + finalizes,
// then awaits the promise. NOTE: cloud paths are best-effort and not tested here.
async function streamArchiveToCloud(archive, provider, key) {
  const AttachmentStorageSettings = (await import('/models/attachmentStorageSettings')).default;
  const settings = await AttachmentStorageSettings.findOneAsync({});
  const cfg = settings && settings.storageConfig && settings.storageConfig[provider];
  if (!cfg) throw new Meteor.Error('storage-not-configured', `Storage "${provider}" is not configured.`);

  if (provider === 's3') {
    const { S3Client } = require('@aws-sdk/client-s3');
    const { Upload } = require('@aws-sdk/lib-storage');
    const client = new S3Client({
      endpoint: cfg.endpoint || undefined,
      region: cfg.region || 'us-east-1',
      forcePathStyle: cfg.forcePathStyle !== false,
      credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
    });
    // @aws-sdk/lib-storage streams the archive body as a multipart upload.
    const up = new Upload({ client, params: { Bucket: cfg.bucket, Key: key, Body: archive, ContentType: 'application/zip' } });
    return { dest: `s3://${cfg.bucket}/${key}`, promise: up.done() };
  }
  if (provider === 'azure') {
    const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
    const svc = cfg.connectionString
      ? BlobServiceClient.fromConnectionString(cfg.connectionString)
      : new BlobServiceClient(`https://${cfg.accountName}.blob.core.windows.net`,
          new StorageSharedKeyCredential(cfg.accountName, cfg.accountKey));
    const blob = svc.getContainerClient(cfg.bucket).getBlockBlobClient(key);
    return { dest: `azure://${cfg.bucket}/${key}`, promise: blob.uploadStream(archive) };
  }
  if (provider === 'gcs') {
    const { Storage } = require('@google-cloud/storage');
    const storage = new Storage({
      projectId: cfg.projectId || undefined,
      keyFilename: cfg.keyFilename || undefined,
      credentials: cfg.credentials ? (typeof cfg.credentials === 'string' ? JSON.parse(cfg.credentials) : cfg.credentials) : undefined,
    });
    const ws = storage.bucket(cfg.bucket).file(key).createWriteStream({ resumable: false, contentType: 'application/zip' });
    const promise = new Promise((resolve, reject) => { ws.on('finish', resolve); ws.on('error', reject); });
    archive.pipe(ws);
    return { dest: `gcs://${cfg.bucket}/${key}`, promise };
  }
  throw new Meteor.Error('bad-storage', `Unknown storage "${provider}".`);
}

// ── the tenant's own documents ───────────────────────────────────────────────

// Everything a tenant scope needs: the board ids the Organization owns, and the
// trigger/action ids its rules point at (triggers and actions carry no board of
// their own). Computed once per backup/restore and handed to the pure module.
async function tenantContext(db, orgId) {
  const boardSelector = tenantBackup.tenantBoardSelector(orgId);
  const boards = boardSelector
    ? await db.collection('boards').find(boardSelector, { projection: { _id: 1 } }).toArray()
    : [];
  const boardIds = boards.map(b => b._id).filter(id => typeof id === 'string');
  let triggerIds = [];
  let actionIds = [];
  if (boardIds.length) {
    const rules = await db.collection('rules')
      .find({ boardId: { $in: boardIds } }, { projection: { triggerId: 1, actionId: 1 } })
      .toArray();
    triggerIds = rules.map(r => r.triggerId).filter(id => typeof id === 'string');
    actionIds = rules.map(r => r.actionId).filter(id => typeof id === 'string');
  }
  return { orgId, boardIds, triggerIds, actionIds };
}

// Stream ONE collection out as NDJSON under a selector - the tenant form of
// ndjsonOfCollection, a document at a time so a big board never sits in RAM.
async function* ndjsonOfSelector(db, coll, selector) {
  const cursor = db.collection(coll).find(selector);
  for await (const doc of cursor) {
    yield EJSON.stringify(doc) + '\n';
  }
  await cursor.close();
}

async function doBackup(opts, storageName, orgId = null) {
  setProgress({ running: true, phase: 'backup', detail: '', file: '', success: null, error: '' });
  try {
    const t = nowParts();
    const stamp = `${t.y}_${t.mo}_${t.da}-${t.h}_${t.mi}_${t.s}`;
    // <files>/backup/… for the instance, <files>/backup/org/<orgId>/… for a tenant,
    // so "which archives may this admin see" stays a path question (D.8).
    const relativeDir = tenantBackup.tenantBackupRelativeDir(orgId, t);
    const key = `${relativeDir}/backup.zip`;

    // archiver@8 is ESM: use the ZipArchive class instead of the old
    // archiver('zip', …) factory (which no longer exists).
    const archive = new ZipArchive({ zlib: { level: 6 } });
    archive.on('warning', err => { if (err && err.code !== 'ENOENT') setProgress({ error: String(err.message || err) }); });

    // Attach the destination BEFORE finalizing so nothing is buffered in RAM.
    setProgress({ phase: 'zipping', detail: storageName || 'filesystem' });
    let dest;
    let donePromise;
    if (!storageName || storageName === 'filesystem') {
      const dir = path.join(filesRoot(), ...relativeDir.split('/'));
      fs.mkdirSync(dir, { recursive: true });   // the final backup dir, not a temp dir
      dest = path.join(dir, 'backup.zip');
      const out = fs.createWriteStream(dest);
      donePromise = new Promise((resolve, reject) => { out.on('close', resolve); out.on('error', reject); archive.on('error', reject); });
      archive.pipe(out);
      try { fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ stamp, storage: 'filesystem', opts, orgId: orgId || null })); } catch (_) {}
    } else {
      const cloud = await streamArchiveToCloud(archive, storageName, key);
      dest = cloud.dest;
      donePromise = cloud.promise;
    }

    const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;

    if (orgId) {
      // ── one Organization ──────────────────────────────────────────────────
      // Its boards and everything hanging off them, plus the attachment FILES
      // those boards use. No accounts, no settings, no org/team documents - see
      // models/lib/tenantBackup.js for why each of those is excluded.
      const ctx = await tenantContext(db, orgId);
      if (opts.attachments && ctx.boardIds.length) {
        setProgress({ phase: 'attachments' });
        // The instance backup streams the whole attachments directory; a tenant's
        // files have to be picked one by one, from the attachment records of its
        // own boards. Entry names match the instance form exactly, so restore
        // reads both kinds of archive the same way.
        const cursor = db.collection('attachments')
          .find({ 'meta.boardId': { $in: ctx.boardIds } });
        for await (const doc of cursor) {
          const versions = (doc && doc.versions) || {};
          Object.keys(versions).forEach(version => {
            const filePath = versions[version] && versions[version].path;
            if (!filePath || !fs.existsSync(filePath)) return;
            const rel = path.relative(attachmentsDir(), filePath);
            // Only files that really live under the attachments directory.
            if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return;
            archive.file(filePath, { name: `${stamp}/attachments/${rel.split(path.sep).join('/')}` });
          });
        }
        await cursor.close();
      }
      // Avatars are NOT part of a tenant archive: they belong to accounts, and
      // accounts are one global namespace in option D (D.6).
      if (opts.data) {
        setProgress({ phase: 'data' });
        for (const n of tenantBackup.names()) {
          const selector = tenantBackup.exportSelector(n, ctx);
          if (!selector) continue;   // this tenant has nothing in that collection
          setProgress({ detail: 'data: ' + n });
          archive.append(Readable.from(ndjsonOfSelector(db, n, selector)), { name: `${stamp}/data/${n}.ndjson` });
        }
      }
    } else {
      // ── the whole instance ────────────────────────────────────────────────
      // Add content — all streamed (directories from disk, data a doc at a time).
      if (opts.attachments && fs.existsSync(attachmentsDir())) { setProgress({ phase: 'attachments' }); archive.directory(attachmentsDir(), `${stamp}/attachments`); }
      if (opts.avatars && fs.existsSync(avatarsDir())) { setProgress({ phase: 'avatars' }); archive.directory(avatarsDir(), `${stamp}/avatars`); }
      if (opts.data) {
        setProgress({ phase: 'data' });
        const names = (await db.listCollections().toArray()).map(c => c.name)
          .filter(n => !FILE_COLLECTIONS.has(n) && !n.startsWith('system.'));
        for (const n of names) {
          setProgress({ detail: 'data: ' + n });
          archive.append(Readable.from(ndjsonOfCollection(db, n)), { name: `${stamp}/data/${n}.ndjson` });
        }
      }
    }

    await archive.finalize();
    await donePromise;
    setProgress({ phase: 'completed', file: dest, success: true });
    return dest;
  } catch (e) {
    setProgress({ phase: 'error', success: false, error: String(e && e.message ? e.message : e).slice(0, 500) });
    throw e;
  } finally {
    progress.running = false;
  }
}

// Read one data entry of an archive WITHOUT writing anything - used by a tenant
// restore to learn what the archive claims before it is allowed to write.
async function readArchiveDocs(entryStream, onDoc) {
  const rl = readline.createInterface({ input: entryStream, crlfDelay: Infinity });
  for await (const line of rl) {
    const s = line.trim();
    if (!s) continue;
    let doc;
    try { doc = EJSON.parse(s); } catch (_) { continue; }
    onDoc(doc);
  }
}

// `tenant` is null for an instance restore (everything is written as before), or
// the pure module's context for a tenant restore, in which case EVERY document is
// checked against the boards that tenant really owns before it is written.
async function restoreDataLines(entryStream, coll, mode, tenant = null) {
  const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
  const c = db.collection(coll);
  // A tenant restore must never empty a shared collection: "replace all" replaces
  // this tenant's documents, not everyone's.
  if (mode === 'replace-all' && !tenant) { await c.deleteMany({}).catch(() => {}); }
  const rl = readline.createInterface({ input: entryStream, crlfDelay: Infinity });
  let batch = [];
  const flush = async () => {
    if (!batch.length) return;
    if (mode === 'add-missing') {
      for (const d of batch) { try { await c.insertOne(d); } catch (_) { /* already present */ } }
    } else {
      const ops = batch.map(d => ({ replaceOne: { filter: { _id: d._id }, replacement: d, upsert: true } }));
      try { await c.bulkWrite(ops, { ordered: false }); } catch (_) {}
    }
    batch = [];
  };
  let refused = 0;
  for await (const line of rl) {
    const s = line.trim();
    if (!s) continue;
    let doc;
    try { doc = EJSON.parse(s); } catch (_) { continue; }
    // The archive names the collection and carries the documents, and neither can
    // be trusted: an archive can be edited, and a per-tenant admin uploading one
    // must not be able to write into another tenant's boards.
    if (tenant && !tenantBackup.docBelongsToTenant(coll, doc, tenant)) { refused += 1; continue; }
    batch.push(doc);
    if (batch.length >= 200) await flush();
  }
  await flush();
  return refused;
}

async function doRestore(zipPath, mode, orgId = null) {
  setProgress({ running: true, phase: 'restore', detail: zipPath, success: null, error: '' });
  try {
    // unzipper.Open reads the central directory, then streams each entry on
    // demand — a 5 GB attachment is piped straight to disk, never buffered.
    const directory = await unzipper.Open.file(zipPath);
    // ZipBleed: entries refused for naming a path outside the directory they belong
    // in, or a collection WeKan does not write. Collected and reported at the end
    // rather than thrown on, so one hostile entry cannot abort a genuine restore.
    const skipped = [];
    let refusedDocs = 0;

    // ── a TENANT restore: learn what the archive claims, then narrow it ──────
    // The board ids that may be written are the INTERSECTION of what the archive
    // says with what the Organization really owns, so an archive cannot widen its
    // own scope by listing someone else's board (D.8).
    let tenant = null;
    let allowedFileIds = null;
    if (orgId) {
      const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
      const owned = await tenantContext(db, orgId);
      const archiveBoardIds = [];
      const archiveTriggerIds = [];
      const archiveActionIds = [];
      const boardsEntry = directory.files.find(e => e.type === 'File' && /(^|\/)data\/boards\.ndjson$/.test(e.path));
      if (boardsEntry) {
        await readArchiveDocs(boardsEntry.stream(), doc => {
          if (doc && typeof doc._id === 'string') archiveBoardIds.push(doc._id);
        });
      }
      const boardIds = tenantBackup.allowedRestoreBoardIds(archiveBoardIds, owned.boardIds);
      // Triggers and actions are reachable only through a rule of an allowed board,
      // so the allowed ids come from the archive's own rules, filtered by that set.
      const rulesEntry = directory.files.find(e => e.type === 'File' && /(^|\/)data\/rules\.ndjson$/.test(e.path));
      if (rulesEntry) {
        await readArchiveDocs(rulesEntry.stream(), doc => {
          if (!doc || !boardIds.includes(doc.boardId)) return;
          if (typeof doc.triggerId === 'string') archiveTriggerIds.push(doc.triggerId);
          if (typeof doc.actionId === 'string') archiveActionIds.push(doc.actionId);
        });
      }
      tenant = { orgId, boardIds, triggerIds: archiveTriggerIds, actionIds: archiveActionIds };
      // Attachment FILES are named after the attachment record's id, so the files
      // that may be written are exactly the records that passed the same guard.
      allowedFileIds = new Set();
      const attachmentsEntry = directory.files.find(e => e.type === 'File' && /(^|\/)data\/attachments\.ndjson$/.test(e.path));
      if (attachmentsEntry) {
        await readArchiveDocs(attachmentsEntry.stream(), doc => {
          if (tenantBackup.docBelongsToTenant('attachments', doc, tenant) && typeof doc._id === 'string') {
            allowedFileIds.add(doc._id);
          }
        });
      }
    }

    // Files first (attachments/avatars), then data.
    for (const entry of directory.files) {
      if (entry.type !== 'File') continue;
      const rel = entry.path.split('/').slice(1); // drop the <stamp> top folder
      const kind = rel[0];
      if (kind !== 'attachments' && kind !== 'avatars') continue;
      if (tenant) {
        // A tenant restore never writes avatars (they belong to accounts, which are
        // one global namespace), and only writes attachment files of its own boards.
        if (kind !== 'attachments') { skipped.push(entry.path); continue; }
        const base = rel[rel.length - 1] || '';
        const fileId = base.split('.')[0];
        if (!allowedFileIds.has(fileId)) { skipped.push(entry.path); continue; }
      }
      // The entry names its own path and path.join RESOLVES `..`, so
      // `<stamp>/attachments/../../../etc/x` satisfied the check above and then wrote
      // outside the files directory. safeEntryPath refuses anything that escapes.
      const destPath = safeEntryPath(
        kind === 'attachments' ? attachmentsDir() : avatarsDir(), rel.slice(1));
      if (!destPath) { skipped.push(entry.path); continue; }
      if (mode === 'add-missing' && fs.existsSync(destPath)) continue;
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      setProgress({ detail: entry.path });
      await new Promise((resolve, reject) => {
        entry.stream().pipe(fs.createWriteStream(destPath)).on('finish', resolve).on('error', reject);
      });
    }
    for (const entry of directory.files) {
      if (entry.type !== 'File') continue;
      const rel = entry.path.split('/').slice(1);
      if (rel[0] !== 'data' || !rel[1] || !rel[1].endsWith('.ndjson')) continue;
      // The entry also names the collection to restore into. Only a plain name is
      // accepted - `system.*` is internal to the database (and excluded from backups
      // in the first place), and a name carrying a separator is not one WeKan writes.
      const coll = safeCollectionName(rel[1].replace(/\.ndjson$/, ''));
      if (!coll) { skipped.push(entry.path); continue; }
      // A tenant archive may only carry the collections a tenant owns. An entry for
      // `users`, `settings` or any other instance-wide collection is refused
      // outright rather than filtered document by document.
      if (tenant && !tenantBackup.isTenantCollection(coll)) { skipped.push(entry.path); continue; }
      setProgress({ detail: 'data: ' + coll });
      refusedDocs += (await restoreDataLines(entry.stream(), coll, mode, tenant)) || 0;
    }
    if (skipped.length) {
      console.warn('Backup restore refused ' + skipped.length +
        ' archive entry/entries that pointed outside the restore directory: ' +
        skipped.slice(0, 10).join(', '));
    }
    if (refusedDocs) {
      console.warn('Backup restore refused ' + refusedDocs +
        ' document(s) that did not belong to the Organization being restored.');
    }
    setProgress({ phase: 'completed', success: true, skipped: skipped.length, refused: refusedDocs });
  } catch (e) {
    setProgress({ phase: 'error', success: false, error: String(e && e.message ? e.message : e).slice(0, 500) });
    throw e;
  } finally {
    progress.running = false;
  }
}

// Recursively find backup.zip files under <files>/backup.
function findBackups(dir, out) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findBackups(full, out);
    else if (entry.name === 'backup.zip') {
      let storage = 'filesystem', stamp = path.basename(path.dirname(full));
      try { const m = JSON.parse(fs.readFileSync(path.join(path.dirname(full), 'meta.json'), 'utf8')); storage = m.storage || storage; stamp = m.stamp || stamp; } catch (_) {}
      const st = fs.statSync(full);
      out.push({ path: full, datetime: st.mtime.toISOString(), stamp, storage, size: st.size });
    }
  }
  return out;
}

// ── synced-cron schedule ─────────────────────────────────────────────────────
const CRON_NAME = 'WeKan Scheduled Backup';
async function registerCron() {
  try { SyncedCron.remove(CRON_NAME); } catch (_) {}
  const s = await BackupSettings.findOneAsync({ _id: 'schedule' });
  if (!s || !s.enabled || !s.frequency || s.frequency === 'off') return;
  SyncedCron.add({
    name: CRON_NAME,
    schedule(parser) { return parser.text(scheduleText(s)); },
    async job() {
      if (progress.running) return;
      try { await doBackup({ attachments: !!s.attachments, avatars: !!s.avatars, data: !!s.data }, s.storage || 'filesystem'); }
      catch (e) { console.error('[backup] scheduled backup failed:', e); }
    },
  });
  console.log('[backup] scheduled:', scheduleText(s));
}
Meteor.startup(async () => { try { await registerCron(); } catch (e) { console.error('[backup] cron init:', e); } });

async function requireAdmin() {
  const user = await ReactiveCache.getCurrentUser();
  if (!user || !user.isAdmin) throw new Meteor.Error('not-authorized');
}

// Multitenancy option D (D.8): the caller, and the scope they asked for. The scope
// is REFUSED rather than narrowed when they may not have it - silently backing up
// the wrong scope is worse than an error. A per-tenant Global Admin may only ever
// name one of their own Organizations; the whole-instance scope is site-admin only.
async function requireBackupScope(userId, orgId) {
  const user = userId
    ? await ReactiveCache.getUser({ _id: userId }, { fields: { isAdmin: 1, orgs: 1 } })
    : null;
  if (!tenantAdmin.canOpenAdminPanel(user)) throw new Meteor.Error('not-authorized');
  const scope = tenantBackup.resolveBackupScope({
    isSiteAdmin: tenantAdmin.isSiteAdmin(user),
    adminOrgIds: tenantAdmin.adminOrgIds(user),
    orgId: orgId === undefined ? null : orgId,
  });
  if (!scope.ok) throw new Meteor.Error(scope.error);
  return { user, orgId: scope.orgId };
}

Meteor.methods({
  async backupStatus() {
    const user = await ReactiveCache.getCurrentUser();
    // A per-tenant admin polls the same progress: only one backup runs at a time,
    // and the phase/file it reports is the one they started.
    if (!tenantAdmin.canOpenAdminPanel(user)) return false;
    return { ...progress };
  },
  async runBackup(opts, storageName, orgId = null) {
    check(opts, Object);
    check(storageName, Match.OneOf(String, null, undefined));
    check(orgId, Match.OneOf(String, null, undefined));
    const scope = await requireBackupScope(this.userId, orgId);
    if (progress.running) throw new Meteor.Error('already-running');
    if (!opts || (!opts.attachments && !opts.avatars && !opts.data)) throw new Meteor.Error('nothing-selected', 'Select at least one of Attachments, Avatars, Data.');
    doBackup(opts, storageName, scope.orgId); // background; poll backupStatus
    return { started: true, orgId: scope.orgId };
  },
  async restoreBackup(zipPath, mode) {
    check(zipPath, String);
    check(mode, String);
    const user = this.userId
      ? await ReactiveCache.getUser({ _id: this.userId }, { fields: { isAdmin: 1, orgs: 1 } })
      : null;
    if (!tenantAdmin.canOpenAdminPanel(user)) throw new Meteor.Error('not-authorized');
    // Which archive is this, and may this admin restore it? A per-tenant admin may
    // only restore their own tenant's archives - never an instance-wide one, which
    // contains every tenant.
    if (!tenantBackup.canUseBackupPath({
      isSiteAdmin: tenantAdmin.isSiteAdmin(user),
      adminOrgIds: tenantAdmin.adminOrgIds(user),
      backupPath: zipPath,
    })) throw new Meteor.Error('not-authorized');
    if (progress.running) throw new Meteor.Error('already-running');
    if (!zipPath || !fs.existsSync(zipPath)) throw new Meteor.Error('not-found', 'Backup file not found.');
    if (mode !== 'add-missing' && mode !== 'replace-all') throw new Meteor.Error('bad-mode');
    // The scope comes from the archive's own location, not from the caller: a
    // tenant archive is always restored as that tenant, even by the site admin, so
    // it can never write outside the Organization it was taken from.
    doRestore(zipPath, mode, tenantBackup.orgIdOfBackupPath(zipPath));
    return { started: true };
  },
  async listBackups() {
    const user = this.userId
      ? await ReactiveCache.getUser({ _id: this.userId }, { fields: { isAdmin: 1, orgs: 1 } })
      : null;
    if (!tenantAdmin.canOpenAdminPanel(user)) throw new Meteor.Error('not-authorized');
    const isSiteAdmin = tenantAdmin.isSiteAdmin(user);
    const adminOrgIds = tenantAdmin.adminOrgIds(user);
    return findBackups(backupRoot(), [])
      // Everyone sees only the archives they may restore, so the list and the
      // permission cannot disagree.
      .filter(b => tenantBackup.canUseBackupPath({ isSiteAdmin, adminOrgIds, backupPath: b.path }))
      .map(b => ({ ...b, orgId: tenantBackup.orgIdOfBackupPath(b.path) }))
      .sort((a, b) => (a.datetime < b.datetime ? 1 : -1));
  },
  async getBackupSchedule() {
    await requireAdmin();
    return await BackupSettings.findOneAsync({ _id: 'schedule' }) || null;
  },
  // The schedule is instance-wide (one cron, one archive of everything), so it
  // stays site-admin only - a per-tenant admin backs up their tenant on demand.
  async saveBackupSchedule(schedule) {
    check(schedule, Object);
    await requireAdmin();
    const doc = {
      _id: 'schedule',
      enabled: !!schedule.enabled,
      frequency: schedule.frequency || 'off',
      time: schedule.time || '04:00',
      dayOfWeek: schedule.dayOfWeek || 'Sunday',
      dayOfMonth: schedule.dayOfMonth || 1,
      attachments: !!schedule.attachments,
      avatars: !!schedule.avatars,
      data: !!schedule.data,
      storage: schedule.storage || 'filesystem',
      updatedAt: new Date(),
    };
    await BackupSettings.upsertAsync({ _id: 'schedule' }, doc);
    await registerCron();
    return doc;
  },
});
