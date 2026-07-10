import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { MongoInternals } from 'meteor/mongo';
import { EJSON } from 'meteor/ejson';
import { ReactiveCache } from '/imports/reactiveCache';
import { SyncedCron } from '/server/cron/syncedCron';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

// ─────────────────────────────────────────────────────────────────────────────
// Admin Panel / Attachments / Backup.
//
// Backs up any of: Attachments, Avatars, Data (text = all collections that are
// NOT attachments/avatars) into
//   <files>/backup/YYYY/MM/DD/HH_MM_SS/backup.zip
// whose contents are
//   YYYY_MM_DD-HH_MM_SS/attachments/…
//   YYYY_MM_DD-HH_MM_SS/avatars/…
//   YYYY_MM_DD-HH_MM_SS/data/<collection>.json   (EJSON)
//
// Restore supports "add missing" (only insert documents / files not already
// present) or "replace all". A schedule (daily / weekly / monthly) runs backups
// via synced-cron. A storage name is recorded with each backup (filesystem is
// implemented; cloud targets can be added later).
//
// NOTE: the whole backup is assembled with jszip; a very large attachment set
// can use a lot of memory. Not exercised end-to-end here.
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
  const base = process.env.WRITABLE_PATH || process.cwd();
  return (base.endsWith('/files') || base.endsWith('\\files')) ? base : path.join(base, 'files');
}
const attachmentsDir = () => path.join(filesRoot(), 'attachments');
const avatarsDir = () => path.join(filesRoot(), 'avatars');
const backupRoot = () => path.join(filesRoot(), 'backup');

// Stream a zip Readable straight to a cloud provider (no temp file). Uses the
// provider config saved in AttachmentStorageSettings.storageConfig. SDKs are
// lazy-required so the server does not load them unless a cloud backup runs.
// NOTE: cloud paths are best-effort and not exercised here — verify the config
// field names against your storage settings.
async function streamZipToCloud(zipStream, provider, key) {
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
    await new Upload({ client, params: { Bucket: cfg.bucket, Key: key, Body: zipStream, ContentType: 'application/zip' } }).done();
    return `s3://${cfg.bucket}/${key}`;
  }
  if (provider === 'azure') {
    const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
    const svc = cfg.connectionString
      ? BlobServiceClient.fromConnectionString(cfg.connectionString)
      : new BlobServiceClient(`https://${cfg.accountName}.blob.core.windows.net`,
          new StorageSharedKeyCredential(cfg.accountName, cfg.accountKey));
    await svc.getContainerClient(cfg.bucket).getBlockBlobClient(key).uploadStream(zipStream);
    return `azure://${cfg.bucket}/${key}`;
  }
  if (provider === 'gcs') {
    const { Storage } = require('@google-cloud/storage');
    const storage = new Storage({
      projectId: cfg.projectId || undefined,
      keyFilename: cfg.keyFilename || undefined,
      credentials: cfg.credentials ? (typeof cfg.credentials === 'string' ? JSON.parse(cfg.credentials) : cfg.credentials) : undefined,
    });
    const file = storage.bucket(cfg.bucket).file(key);
    await new Promise((resolve, reject) => {
      zipStream.pipe(file.createWriteStream({ resumable: false, contentType: 'application/zip' }))
        .on('finish', resolve).on('error', reject);
    });
    return `gcs://${cfg.bucket}/${key}`;
  }
  throw new Meteor.Error('bad-storage', `Unknown storage "${provider}".`);
}

function pad(n) { return String(n).padStart(2, '0'); }
function nowParts() {
  const d = new Date();
  return { y: d.getFullYear(), mo: pad(d.getMonth() + 1), da: pad(d.getDate()), h: pad(d.getHours()), mi: pad(d.getMinutes()), s: pad(d.getSeconds()) };
}

// Live progress the client polls.
const progress = { running: false, phase: 'idle', detail: '', file: '', success: null, error: '' };
function setProgress(p) { Object.assign(progress, p); }

// Recursively add a directory's files to a JSZip folder.
function addDirToZip(zipFolder, dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) addDirToZip(zipFolder.folder(entry.name), full);
    else if (entry.isFile()) zipFolder.file(entry.name, fs.readFileSync(full));
  }
}

async function doBackup(opts, storageName) {
  setProgress({ running: true, phase: 'backup', detail: '', file: '', success: null, error: '' });
  try {
    const t = nowParts();
    const stamp = `${t.y}_${t.mo}_${t.da}-${t.h}_${t.mi}_${t.s}`;

    const zip = new JSZip();
    const root = zip.folder(stamp);
    if (opts.attachments) { setProgress({ phase: 'attachments' }); addDirToZip(root.folder('attachments'), attachmentsDir()); }
    if (opts.avatars) { setProgress({ phase: 'avatars' }); addDirToZip(root.folder('avatars'), avatarsDir()); }
    if (opts.data) {
      setProgress({ phase: 'data' });
      const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
      const names = (await db.listCollections().toArray()).map(c => c.name)
        .filter(n => !FILE_COLLECTIONS.has(n) && !n.startsWith('system.'));
      const dataF = root.folder('data');
      for (const n of names) {
        setProgress({ detail: 'data: ' + n });
        const docs = await db.collection(n).find({}).toArray();
        dataF.file(n + '.json', EJSON.stringify(docs));
      }
    }

    // Stream the zip DIRECTLY to the selected storage — no temp file, no double
    // disk usage. filesystem: pipe to the file. Cloud (s3/azure/gcs): stream to
    // the provider (S3 lib-storage Upload / Azure uploadStream / GCS
    // createWriteStream), keyed backup/YYYY/MM/DD/HH_MM_SS/backup.zip.
    setProgress({ phase: 'zipping', detail: storageName || 'filesystem' });
    const key = `backup/${t.y}/${t.mo}/${t.da}/${t.h}_${t.mi}_${t.s}/backup.zip`;
    const zipStream = zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true, compression: 'DEFLATE' });
    let dest;
    if (!storageName || storageName === 'filesystem') {
      const dir = path.join(backupRoot(), String(t.y), t.mo, t.da, `${t.h}_${t.mi}_${t.s}`);
      fs.mkdirSync(dir, { recursive: true });   // the final backup dir, not a temp dir
      dest = path.join(dir, 'backup.zip');
      await new Promise((resolve, reject) => {
        zipStream.pipe(fs.createWriteStream(dest)).on('finish', resolve).on('error', reject);
      });
      try { fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ stamp, storage: 'filesystem', opts })); } catch (_) {}
    } else {
      dest = await streamZipToCloud(zipStream, storageName, key);
    }
    setProgress({ phase: 'completed', file: dest, success: true });
    return dest;
  } catch (e) {
    setProgress({ phase: 'error', success: false, error: String(e && e.message ? e.message : e).slice(0, 500) });
    throw e;
  } finally {
    progress.running = false;
  }
}

async function doRestore(zipPath, mode) {
  setProgress({ running: true, phase: 'restore', detail: zipPath, success: null, error: '' });
  try {
    const buf = fs.readFileSync(zipPath);
    const zip = await JSZip.loadAsync(buf);
    const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
    // Files: <stamp>/attachments/*, <stamp>/avatars/*
    for (const [name, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      const rel = name.split('/').slice(1); // drop the <stamp> top folder
      const kind = rel[0];
      if (kind === 'attachments' || kind === 'avatars') {
        const dest = path.join(kind === 'attachments' ? attachmentsDir() : avatarsDir(), ...rel.slice(1));
        if (mode === 'add-missing' && fs.existsSync(dest)) continue;
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, await entry.async('nodebuffer'));
      }
    }
    // Data: <stamp>/data/<coll>.json (EJSON array)
    for (const [name, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      const rel = name.split('/').slice(1);
      if (rel[0] !== 'data' || !rel[1] || !rel[1].endsWith('.json')) continue;
      const coll = rel[1].replace(/\.json$/, '');
      setProgress({ detail: 'data: ' + coll });
      const docs = EJSON.parse(await entry.async('string'));
      const c = db.collection(coll);
      if (mode === 'replace-all') { await c.deleteMany({}).catch(() => {}); }
      for (let i = 0; i < docs.length; i += 200) {
        const batch = docs.slice(i, i + 200);
        if (mode === 'add-missing') {
          for (const d of batch) { try { await c.insertOne(d); } catch (_) { /* already present */ } }
        } else {
          const ops = batch.map(d => ({ replaceOne: { filter: { _id: d._id }, replacement: d, upsert: true } }));
          try { await c.bulkWrite(ops, { ordered: false }); } catch (_) {}
        }
      }
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
function scheduleText(s) {
  // s: { frequency:'daily'|'weekly'|'monthly', time:'HH:MM', dayOfWeek, dayOfMonth }
  const [hh, mm] = (s.time || '04:00').split(':');
  const at = `at ${hh}:${mm}`;
  if (s.frequency === 'weekly') return `on ${s.dayOfWeek || 'Sunday'} ${at}`;
  if (s.frequency === 'monthly') return `on the ${s.dayOfMonth || 1} day of the month ${at}`;
  return `every day ${at}`; // daily
}
function registerCron() {
  try { SyncedCron.remove(CRON_NAME); } catch (_) {}
  const s = BackupSettings.findOne({ _id: 'schedule' });
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
Meteor.startup(() => { try { registerCron(); } catch (e) { console.error('[backup] cron init:', e); } });

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
    return BackupSettings.findOne({ _id: 'schedule' }) || null;
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
    BackupSettings.upsert({ _id: 'schedule' }, doc);
    registerCron();
    return doc;
  },
});
