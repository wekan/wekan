// Admin Panel / Attachments / Encrypt (server/lib/attachmentEncryption.js):
// encrypt or decrypt every attachment stored on this server's disk, in the
// background with progress, and encrypt new ones as they arrive. Only while
// ATTACHMENTS_PASSPHRASE is set - without it the pane is not shown and every
// method refuses. Site administrators only; the runs and the switch are in
// the Audit log (models/lib/adminAudit.js).
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

const enc = require('/server/lib/attachmentEncryption');
const { isSiteAdmin } = require('/models/lib/tenantAdmin');

// { _id: 'settings', encryptNew: Boolean }
export const AttachmentEncryptionSettings = new Mongo.Collection('attachmentEncryption');

const HOUR_MS = 60 * 60 * 1000;
const progress = { running: false, action: '', done: 0, total: 0, failed: 0, error: '' };

async function requireSiteAdmin(userId) {
  const user = userId ? await Meteor.users.findOneAsync(userId, { fields: { isAdmin: 1, loginDisabled: 1, orgs: 1, teams: 1 } }) : null;
  if (!user || user.loginDisabled || !isSiteAdmin(user)) throw new Meteor.Error('not-authorized');
  if (!enc.attachmentsPassphrase()) throw new Meteor.Error('attachment-encryption-off', 'ATTACHMENTS_PASSPHRASE is not set.');
}

function attachmentsRaw() {
  return require('/models/attachments').default.collection.rawCollection();
}

// The file paths of an attachment that are on this server's disk.
function filesystemPaths(doc) {
  return Object.values((doc && doc.versions) || {})
    .filter(v => v && typeof v.path === 'string' && (!v.storage || v.storage === 'fs'))
    .map(v => v.path);
}

async function encryptNewEnabled() {
  const s = await AttachmentEncryptionSettings.findOneAsync('settings');
  return !!(s && s.encryptNew === true);
}

// One attachment: each of its files on disk, then a note on its document so
// the filesystem integrity scan sees the change explained.
async function convertOne(doc, action) {
  const fs = require('node:fs');
  let changed = false;
  for (const file of filesystemPaths(doc)) {
    if (!fs.existsSync(file)) continue;
    // eslint-disable-next-line no-await-in-loop
    changed = (action === 'encrypt' ? await enc.encryptFileInPlace(file) : await enc.decryptFileInPlace(file)) || changed;
  }
  if (changed) {
    await attachmentsRaw().updateOne({ _id: doc._id }, { $set: { 'meta.encrypted': action === 'encrypt', 'meta.updatedAt': new Date() } });
  }
  return changed;
}

export async function runAll(action) {
  if (progress.running) throw new Meteor.Error('already-running');
  Object.assign(progress, { running: true, action, done: 0, total: 0, failed: 0, error: '' });
  try {
    const selector = { 'versions.original.path': { $exists: true } };
    progress.total = await attachmentsRaw().countDocuments(selector);
    for await (const doc of attachmentsRaw().find(selector, { projection: { versions: 1 } })) {
      try {
        await convertOne(doc, action);
      } catch (e) {
        progress.failed += 1;
        progress.error = String(e && e.message ? e.message : e).slice(0, 300);
      }
      progress.done += 1;
    }
  } finally {
    progress.running = false;
  }
}

// A new attachment, after its validation (models/attachments.server.js
// onAfterUpload): encrypted when encryption of new attachments is on.
export async function encryptNewAttachment(fileObjId) {
  if (!enc.attachmentsPassphrase() || !(await encryptNewEnabled())) return false;
  const doc = await attachmentsRaw().findOne({ _id: fileObjId }, { projection: { versions: 1 } });
  return doc ? convertOne(doc, 'encrypt') : false;
}

// Attachments that arrive without onAfterUpload - imports, e-mail to card,
// the REST API - are encrypted by this hourly sweep while the switch is on.
async function sweep() {
  if (progress.running || !enc.attachmentsPassphrase() || !(await encryptNewEnabled())) return;
  const docs = await attachmentsRaw().find({ 'versions.original.path': { $exists: true }, 'meta.encrypted': { $ne: true } },
    { projection: { versions: 1 }, limit: 5000 }).toArray();
  for (const doc of docs) {
    try { await convertOne(doc, 'encrypt'); } catch (e) { /* the next sweep tries again */ }
  }
}

async function counts() {
  const fs = require('node:fs');
  const out = { encrypted: 0, plain: 0, missing: 0 };
  for await (const doc of attachmentsRaw().find({ 'versions.original.path': { $exists: true } }, { projection: { versions: 1 } })) {
    const file = doc.versions.original.path;
    if (!fs.existsSync(file)) { out.missing += 1; continue; }
    if (await enc.isEncryptedFile(file)) out.encrypted += 1; else out.plain += 1;
  }
  return out;
}

Meteor.methods({
  // Whether the pane is shown at all: only while the passphrase is set.
  async attachmentEncryptionAvailable() {
    if (!this.userId) return false;
    const user = await Meteor.users.findOneAsync(this.userId, { fields: { isAdmin: 1, loginDisabled: 1, orgs: 1, teams: 1 } });
    return !!(user && !user.loginDisabled && isSiteAdmin(user) && enc.attachmentsPassphrase());
  },
  async attachmentEncryptionStatus() {
    await requireSiteAdmin(this.userId);
    return { encryptNew: await encryptNewEnabled(), progress: { ...progress }, counts: progress.running ? null : await counts() };
  },
  async setEncryptNewAttachments(on) {
    check(on, Boolean);
    await requireSiteAdmin(this.userId);
    await AttachmentEncryptionSettings.upsertAsync({ _id: 'settings' }, { $set: { encryptNew: on, updatedAt: new Date() } });
    return on;
  },
  async encryptAllAttachments() {
    await requireSiteAdmin(this.userId);
    runAll('encrypt').catch(e => console.error('[attachment-encryption]', e && e.message));
    return true;
  },
  async decryptAllAttachments() {
    await requireSiteAdmin(this.userId);
    runAll('decrypt').catch(e => console.error('[attachment-encryption]', e && e.message));
    return true;
  },
});

Meteor.startup(() => {
  if (!enc.attachmentsPassphrase() && process.env.ATTACHMENTS_PASSPHRASE) {
    console.error('[attachment-encryption] ATTACHMENTS_PASSPHRASE is shorter than 16 characters; encryption is off.');
  }
  Meteor.setInterval(() => { sweep().catch(() => {}); }, HOUR_MS);
});
