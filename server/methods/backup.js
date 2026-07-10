import { Meteor } from 'meteor/meteor';
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
const { filesRootFrom, scheduleText } = require('/models/lib/backupPaths');

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

async function doBackup(opts, storageName) {
  setProgress({ running: true, phase: 'backup', detail: '', file: '', success: null, error: '' });
  try {
    const t = nowParts();
    const stamp = `${t.y}_${t.mo}_${t.da}-${t.h}_${t.mi}_${t.s}`;
    const key = `backup/${t.y}/${t.mo}/${t.da}/${t.h}_${t.mi}_${t.s}/backup.zip`;

    // archiver@8 is ESM: use the ZipArchive class instead of the old
    // archiver('zip', …) factory (which no longer exists).
    const archive = new ZipArchive({ zlib: { level: 6 } });
    archive.on('warning', err => { if (err && err.code !== 'ENOENT') setProgress({ error: String(err.message || err) }); });

    // Attach the destination BEFORE finalizing so nothing is buffered in RAM.
    setProgress({ phase: 'zipping', detail: storageName || 'filesystem' });
    let dest;
    let donePromise;
    if (!storageName || storageName === 'filesystem') {
      const dir = path.join(backupRoot(), String(t.y), t.mo, t.da, `${t.h}_${t.mi}_${t.s}`);
      fs.mkdirSync(dir, { recursive: true });   // the final backup dir, not a temp dir
      dest = path.join(dir, 'backup.zip');
      const out = fs.createWriteStream(dest);
      donePromise = new Promise((resolve, reject) => { out.on('close', resolve); out.on('error', reject); archive.on('error', reject); });
      archive.pipe(out);
      try { fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ stamp, storage: 'filesystem', opts })); } catch (_) {}
    } else {
      const cloud = await streamArchiveToCloud(archive, storageName, key);
      dest = cloud.dest;
      donePromise = cloud.promise;
    }

    // Add content — all streamed (directories from disk, data a doc at a time).
    if (opts.attachments && fs.existsSync(attachmentsDir())) { setProgress({ phase: 'attachments' }); archive.directory(attachmentsDir(), `${stamp}/attachments`); }
    if (opts.avatars && fs.existsSync(avatarsDir())) { setProgress({ phase: 'avatars' }); archive.directory(avatarsDir(), `${stamp}/avatars`); }
    if (opts.data) {
      setProgress({ phase: 'data' });
      const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
      const names = (await db.listCollections().toArray()).map(c => c.name)
        .filter(n => !FILE_COLLECTIONS.has(n) && !n.startsWith('system.'));
      for (const n of names) {
        setProgress({ detail: 'data: ' + n });
        archive.append(Readable.from(ndjsonOfCollection(db, n)), { name: `${stamp}/data/${n}.ndjson` });
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

async function restoreDataLines(entryStream, coll, mode) {
  const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
  const c = db.collection(coll);
  if (mode === 'replace-all') { await c.deleteMany({}).catch(() => {}); }
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
  for await (const line of rl) {
    const s = line.trim();
    if (!s) continue;
    try { batch.push(EJSON.parse(s)); } catch (_) { continue; }
    if (batch.length >= 200) await flush();
  }
  await flush();
}

async function doRestore(zipPath, mode) {
  setProgress({ running: true, phase: 'restore', detail: zipPath, success: null, error: '' });
  try {
    // unzipper.Open reads the central directory, then streams each entry on
    // demand — a 5 GB attachment is piped straight to disk, never buffered.
    const directory = await unzipper.Open.file(zipPath);
    // Files first (attachments/avatars), then data.
    for (const entry of directory.files) {
      if (entry.type !== 'File') continue;
      const rel = entry.path.split('/').slice(1); // drop the <stamp> top folder
      const kind = rel[0];
      if (kind !== 'attachments' && kind !== 'avatars') continue;
      const destPath = path.join(kind === 'attachments' ? attachmentsDir() : avatarsDir(), ...rel.slice(1));
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
      const coll = rel[1].replace(/\.ndjson$/, '');
      setProgress({ detail: 'data: ' + coll });
      await restoreDataLines(entry.stream(), coll, mode);
    }
    setProgress({ phase: 'completed', success: true });
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

Meteor.methods({
  async backupStatus() {
    const user = await ReactiveCache.getCurrentUser();
    if (!user || !user.isAdmin) return false;
    return { ...progress };
  },
  async runBackup(opts, storageName) {
    await requireAdmin();
    if (progress.running) throw new Meteor.Error('already-running');
    if (!opts || (!opts.attachments && !opts.avatars && !opts.data)) throw new Meteor.Error('nothing-selected', 'Select at least one of Attachments, Avatars, Data.');
    doBackup(opts, storageName); // background; poll backupStatus
    return { started: true };
  },
  async restoreBackup(zipPath, mode) {
    await requireAdmin();
    if (progress.running) throw new Meteor.Error('already-running');
    if (!zipPath || !fs.existsSync(zipPath)) throw new Meteor.Error('not-found', 'Backup file not found.');
    if (mode !== 'add-missing' && mode !== 'replace-all') throw new Meteor.Error('bad-mode');
    doRestore(zipPath, mode);
    return { started: true };
  },
  async listBackups() {
    await requireAdmin();
    return findBackups(backupRoot(), []).sort((a, b) => (a.datetime < b.datetime ? 1 : -1));
  },
  async getBackupSchedule() {
    await requireAdmin();
    return await BackupSettings.findOneAsync({ _id: 'schedule' }) || null;
  },
  async saveBackupSchedule(schedule) {
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
