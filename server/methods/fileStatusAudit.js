import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { MongoInternals } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
import { fileStoreStrategyFactory as attachments } from '/models/attachments.server';
import { fileStoreStrategyFactory as avatars } from '/models/avatars.server';
import { isCloudConfigured } from '/models/lib/cloudStorage';
import { randomUUID } from 'node:crypto';
const { detectMimeBuffer } = require('/models/lib/mimeDetection');
const { auditFiles } = require('/server/lib/fileStatusAudit');
const { computeStoragePaths } = require('/models/lib/attachmentStoragePath');
const { extension } = require('mime-types');
let job = null;
let cancelRequested = false;

async function requireAdmin() {
  const user = await ReactiveCache.getCurrentUser();
  if (!user?.isAdmin) throw new Meteor.Error('not-authorized', 'Admin only');
}
async function detect(buffer) {
  try {
    const { fileTypeFromBuffer } = await import('file-type');
    const result = await fileTypeFromBuffer(buffer);
    if (result) return result;
  } catch (_) { /* Text, truncated or unsupported format: try libmagic. */ }
  const mime = await detectMimeBuffer(buffer);
  return mime ? { mime, ext: extension(mime) || null } : null;
}
function remoteRead(coll, doc, version, storage) {
  if (!['gridfs', 's3', 'azure', 'gcs'].includes(storage)) throw Object.assign(new Error(), { code: 'UNSUPPORTED_STORAGE' });
  if (storage !== 'gridfs' && !isCloudConfigured(storage)) throw Object.assign(new Error(), { code: 'STORAGE_NOT_CONFIGURED' });
  const factory = coll === 'attachments' ? attachments : avatars;
  // Explicit backend prevents an unavailable cloud provider silently falling
  // back to a local file and being reported as a healthy remote object.
  const stream = factory.getFileStrategy(doc, version, storage)?.getReadStream();
  if (!stream) throw Object.assign(new Error(), { code: 'NO_READ_STREAM' });
  return new Promise((resolve, reject) => {
    const parts = []; let bytes = 0, done = false;
    function finish(error) {
      if (done) return; done = true; clearTimeout(timer); stream.destroy();
      if (error) reject(error); else resolve(Buffer.concat(parts, bytes));
    }
    const timer = setTimeout(() => finish(Object.assign(new Error(), { code: 'READ_TIMEOUT' })), 5000);
    stream.on('error', finish);
    stream.on('data', chunk => {
      const part = Buffer.from(chunk).subarray(0, 65536 - bytes); parts.push(part); bytes += part.length;
      if (bytes >= 65536) finish();
    });
    stream.on('end', () => finish());
    stream.on('close', () => { if (!done) finish(Object.assign(new Error(), { code: 'STREAM_CLOSED' })); });
  });
}
Meteor.methods({
  async startFileStatusAudit(mode) {
    check(mode, String);
    await requireAdmin();
    if (!['all', 'types', 'inventory'].includes(mode)) throw new Meteor.Error('invalid-mode');
    if (job?.state === 'running') return { id: job.id, reused: true };
    if (job && Date.now() - job.startedAt.getTime() < 30000) throw new Meteor.Error('scan-cooldown', 'Wait 30 seconds between scans.');
    cancelRequested = false;
    job = { id: randomUUID(), state: 'running', startedAt: new Date(), phase: 'starting' };
    const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
    const paths = computeStoragePaths(process.env.WRITABLE_PATH);
    // The promise owns its errors; a disconnect does not leave an unhandled
    // rejection or start a second inventory on another pane.
    void auditFiles({ db, mode, roots: { attachments: attachments.storagePath, avatars: avatars.storagePath },
      writablePath: paths.writablePath, detect, remoteRead, report: job,
      cancelled: () => cancelRequested }).catch(() => { job.state = 'failed'; });
    return { id: job.id, reused: false };
  },
  async getFileStatusAudit() {
    await requireAdmin();
    return job;
  },
  async cancelFileStatusAudit() {
    await requireAdmin();
    cancelRequested = true;
    return true;
  },
});
