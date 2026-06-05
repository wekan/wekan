/**
 * Server-side unified attachment/avatar storage migration ("Move Attachment").
 *
 * Moves files between every supported backend as a background job that runs
 * entirely on the server, so the transfer survives the admin leaving the page.
 *
 * Backends:
 *   - 'fs'           Filesystem
 *   - 'gridfs'       Meteor-Files GridFS (bucket <coll>)
 *   - 's3'/'azure'/'gcs'  Cloud (storage-abstraction)
 *   - 'collectionfs' Legacy CollectionFS GridFS (cfs.<coll>.filerecord +
 *                    cfs_gridfs.<coll> bucket) — read source AND write/export target.
 *
 * Source may be a specific backend or 'all' (every Read-enabled, working backend).
 * Scope may be 'attachments', 'avatars', or 'both'.
 *
 * Moves WITHIN the Meteor-Files collection (fs/gridfs/cloud) reuse moveToStorage
 * and keep the same _id. Moves to/from CollectionFS cross document formats, so a
 * new record is created and the old one deleted (after success); attachment
 * cover references (cards.coverId) are remapped to the new id.
 *
 * Progress is persisted in the `attachmentBulkMoveStatus` collection (_id 'bulk').
 */

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { MongoInternals } from 'meteor/mongo';
import fs from 'fs';
import path from 'path';
import { ReactiveCache } from '/imports/reactiveCache';
import Attachments from '/models/attachments';
import Avatars from '/models/avatars';
import AttachmentBulkMoveStatus from '/models/attachmentBulkMoveStatus';
import AttachmentStorageSettings from '/models/attachmentStorageSettings';
import { fileStoreStrategyFactory as attachmentsFactory } from '/models/attachments.server';
import { fileStoreStrategyFactory as avatarsFactory } from '/models/avatars.server';
import { moveToStorage } from '/models/lib/fileStoreStrategy';
import {
  STORAGE_NAME_FILESYSTEM,
  STORAGE_NAME_COLLECTIONFS,
  CLOUD_STORAGE_NAMES,
} from '/models/lib/fileStoreConstants';
import {
  listCollectionFsRecords,
  readCollectionFsBuffer,
  writeCollectionFsRecord,
  deleteCollectionFsRecord,
} from '/models/lib/collectionFsStore';

const STATUS_ID = 'bulk';

const ALLOWED_SOURCES = ['all', STORAGE_NAME_COLLECTIONFS, STORAGE_NAME_FILESYSTEM, 'gridfs', ...CLOUD_STORAGE_NAMES];
const ALLOWED_DESTINATIONS = [STORAGE_NAME_COLLECTIONFS, STORAGE_NAME_FILESYSTEM, 'gridfs', ...CLOUD_STORAGE_NAMES];
const ALLOWED_SCOPES = ['attachments', 'avatars', 'both'];

// In-memory control flags for the currently running job (one per server process).
const controller = {
  running: false,
  paused: false,
  cancelled: false,
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getDb() {
  const db = MongoInternals.defaultRemoteCollectionDriver()?.mongo?.db;
  if (!db) {
    throw new Meteor.Error('mongo-unavailable', 'MongoDB connection is not available');
  }
  return db;
}

async function setStatus(fields) {
  await AttachmentBulkMoveStatus.upsertAsync(
    { _id: STATUS_ID },
    { $set: { ...fields, updatedAt: new Date() } },
  );
}

async function requireAdmin(userId) {
  if (!userId) {
    throw new Meteor.Error('not-authorized', 'Must be logged in');
  }
  const user = await ReactiveCache.getUser(userId);
  if (!user || !user.isAdmin) {
    throw new Meteor.Error('not-authorized', 'Admin access required');
  }
  return user;
}

function collectionConfigs(scope) {
  const attachments = { coll: 'attachments', Collection: Attachments, factory: attachmentsFactory };
  const avatars = { coll: 'avatars', Collection: Avatars, factory: avatarsFactory };
  if (scope === 'both') return [attachments, avatars];
  if (scope === 'avatars') return [avatars];
  return [attachments];
}

// Whether a backend is usable as a read source given admin settings. Filesystem,
// GridFS and CollectionFS default to enabled; cloud must be configured/enabled.
function storageReadable(settings, name) {
  if (settings && typeof settings.isStorageReadEnabled === 'function' && !settings.isStorageReadEnabled(name)) {
    return false;
  }
  if (CLOUD_STORAGE_NAMES.includes(name)) {
    return !!(settings && typeof settings.isStorageEnabled === 'function' && settings.isStorageEnabled(name));
  }
  return true;
}

function storageWritable(settings, name) {
  if (settings && typeof settings.isStorageWriteEnabled === 'function' && !settings.isStorageWriteEnabled(name)) {
    return false;
  }
  if (CLOUD_STORAGE_NAMES.includes(name)) {
    return !!(settings && typeof settings.isStorageEnabled === 'function' && settings.isStorageEnabled(name));
  }
  return true;
}

// Resolve where a Meteor-Files document's original version currently lives.
function resolveDocStorage(cfg, doc) {
  try {
    return cfg.factory.getFileStrategy(doc, 'original').getStorageName();
  } catch (error) {
    return STORAGE_NAME_FILESYSTEM;
  }
}

async function readStrategyBuffer(strategy) {
  const stream = strategy.getReadStream();
  if (!stream) {
    throw new Error('source file not found in storage');
  }
  return await new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', c => chunks.push(c));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

// Build the list of items to move for one collection, honoring the source
// selection and (for 'all') the Read-enabled/working backends.
async function buildItems(cfg, source, settings) {
  const items = [];

  // CollectionFS records (separate metadata collection + bucket).
  if ((source === STORAGE_NAME_COLLECTIONFS || source === 'all') &&
      storageReadable(settings, STORAGE_NAME_COLLECTIONFS)) {
    const recs = await listCollectionFsRecords(cfg.coll);
    for (const r of recs) {
      items.push({ ...r, cfg });
    }
  }

  // Meteor-Files documents (fs / gridfs / cloud), in the primary collection.
  if (source !== STORAGE_NAME_COLLECTIONFS) {
    const docs = await cfg.Collection.collection.find({}).fetchAsync();
    for (const doc of docs) {
      const current = resolveDocStorage(cfg, doc);
      const include = source === 'all'
        ? storageReadable(settings, current)
        : current === source;
      if (include) {
        items.push({
          backend: 'meteorfiles',
          currentStorage: current,
          doc,
          cfg,
          name: doc.name,
          size: doc.size,
        });
      }
    }
  }

  return items;
}

// Create a Meteor-Files document on the filesystem from a buffer, in the exact
// shape the app produces on upload. Returns the new _id.
async function createMeteorFilesDocFromBuffer(cfg, info) {
  const { ObjectId } = MongoInternals.NpmModule;
  const newId = new ObjectId().toString();
  const name = info.name || newId;
  const dot = name.lastIndexOf('.');
  const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
  const storagePath = cfg.factory.storagePath;
  const fileName = ext ? `${newId}.${ext}` : newId;
  const fullPath = path.join(storagePath, fileName);
  fs.writeFileSync(fullPath, info.buffer);

  const type = info.type || 'application/octet-stream';
  const size = info.size || info.buffer.length;
  const doc = {
    _id: newId,
    size,
    type,
    name,
    meta: { ...(info.meta || {}), source: 'storage-migrate' },
    ext,
    extension: ext,
    extensionWithDot: ext ? `.${ext}` : '',
    mime: type,
    'mime-type': type,
    userId: info.userId,
    path: fullPath,
    versions: {
      original: {
        path: fullPath,
        size,
        type,
        extension: ext,
        storage: STORAGE_NAME_FILESYSTEM,
      },
    },
    _downloadRoute: '/cdn/storage',
    _collectionName: cfg.coll,
    isVideo: type.startsWith('video/'),
    isAudio: type.startsWith('audio/'),
    isImage: type.startsWith('image/'),
    isText: type.startsWith('text/'),
    isJSON: type === 'application/json',
    isPDF: type === 'application/pdf',
    _storagePath: storagePath,
    public: false,
    uploadedAtOstrio: info.uploadedAt || new Date(),
  };
  await cfg.Collection.collection.insertAsync(doc);
  return newId;
}

// Repoint references after an attachment's _id changes (cross-format move).
async function remapReferences(cfg, oldId, newId) {
  if (cfg.coll !== 'attachments' || !oldId || !newId || oldId === newId) {
    return;
  }
  try {
    const db = getDb();
    await db.collection('cards').updateMany({ coverId: oldId }, { $set: { coverId: newId } });
  } catch (error) {
    console.error('[attachmentMigration] coverId remap failed', error);
  }
}

// Move a single item to the destination backend.
async function moveItem(item, dest) {
  const cfg = item.cfg;

  // Source is legacy CollectionFS.
  if (item.backend === STORAGE_NAME_COLLECTIONFS) {
    if (dest === STORAGE_NAME_COLLECTIONFS) {
      return; // already there
    }
    const buffer = await readCollectionFsBuffer(item);
    const newId = await createMeteorFilesDocFromBuffer(cfg, {
      buffer,
      name: item.name,
      type: item.type,
      size: item.size,
      meta: item.meta,
      userId: item.userId,
      uploadedAt: item.uploadedAt,
    });
    if (dest !== STORAGE_NAME_FILESYSTEM) {
      const newDoc = await cfg.Collection.collection.findOneAsync({ _id: newId });
      if (newDoc) {
        await moveToStorage(newDoc, dest, cfg.factory);
      }
    }
    await remapReferences(cfg, item.sourceId, newId);
    await deleteCollectionFsRecord(cfg.coll, item.sourceId, item.gridFsKey);
    return;
  }

  // Source is a Meteor-Files document.
  const doc = item.doc;

  // Export to legacy CollectionFS (cross-format): create a filerecord + bucket
  // entry, then remove the Meteor-Files document and its binary.
  if (dest === STORAGE_NAME_COLLECTIONFS) {
    const strategy = cfg.factory.getFileStrategy(doc, 'original');
    const buffer = await readStrategyBuffer(strategy);
    const written = await writeCollectionFsRecord(cfg.coll, {
      name: doc.name,
      type: doc.type,
      size: doc.size,
      meta: doc.meta || {},
      userId: doc.userId,
      uploadedAt: doc.uploadedAtOstrio || new Date(),
    }, buffer);
    await remapReferences(cfg, doc._id, written.sourceId);
    try {
      strategy.unlink();
    } catch (error) {
      // binary may already be gone
    }
    await cfg.Collection.collection.removeAsync({ _id: doc._id });
    return;
  }

  // Move within Meteor-Files (fs / gridfs / cloud) — keeps the same _id.
  if (item.currentStorage === dest) {
    return; // already there
  }
  await moveToStorage(doc, dest, cfg.factory);
}

async function runMigration(items, dest) {
  const total = items.length;
  try {
    for (let i = 0; i < total; i++) {
      if (controller.cancelled) break;
      while (controller.paused && !controller.cancelled) {
        await sleep(200);
      }
      if (controller.cancelled) break;

      const item = items[i];
      const name = item.name || item.sourceId || (item.doc && item.doc._id) || '';
      await setStatus({
        done: i,
        current: i + 1,
        name,
        size: item.size || 0,
        paused: false,
      });

      // Defensive: one bad file must only skip itself, never abort the job.
      try {
        await moveItem(item, dest);
      } catch (error) {
        console.error('[attachmentMigration] Failed to move item', name, error);
      }
    }
  } finally {
    const cancelled = controller.cancelled;
    controller.running = false;
    controller.paused = false;
    controller.cancelled = false;
    const finalStatus = {
      running: false,
      paused: false,
      cancelled,
      finishedAt: new Date(),
    };
    if (!cancelled) {
      finalStatus.done = total;
    }
    await setStatus(finalStatus);
  }
}

Meteor.methods({
  async startBulkAttachmentMove(source, dest, scope = 'attachments') {
    check(source, String);
    check(dest, String);
    check(scope, String);

    await requireAdmin(this.userId);

    if (controller.running) {
      throw new Meteor.Error('bulk-move-already-running', 'A bulk attachment move is already running');
    }

    if (!ALLOWED_SOURCES.includes(source) || !ALLOWED_DESTINATIONS.includes(dest)) {
      throw new Meteor.Error('invalid-storage', 'Invalid storage selection');
    }
    if (!ALLOWED_SCOPES.includes(scope)) {
      throw new Meteor.Error('invalid-scope', 'Invalid scope selection');
    }
    if (source !== 'all' && source === dest) {
      throw new Meteor.Error('invalid-storage', 'Source and destination must differ');
    }

    const settings = await AttachmentStorageSettings.findOneAsync({});
    if (!storageWritable(settings, dest)) {
      throw new Meteor.Error('invalid-storage', 'Destination storage is not writable or not configured');
    }

    // Build the work list up front so we can return an accurate total (and show
    // the "nothing to move" message) before deferring the background job.
    let items = [];
    for (const cfg of collectionConfigs(scope)) {
      items = items.concat(await buildItems(cfg, source, settings));
    }
    // Drop items already on the destination.
    items = items.filter(it =>
      it.backend === STORAGE_NAME_COLLECTIONFS
        ? dest !== STORAGE_NAME_COLLECTIONFS
        : it.currentStorage !== dest,
    );

    if (items.length === 0) {
      await setStatus({
        running: false,
        paused: false,
        total: 0,
        done: 0,
        current: 0,
        source,
        dest,
        scope,
        finishedAt: new Date(),
      });
      return { total: 0 };
    }

    controller.running = true;
    controller.paused = false;
    controller.cancelled = false;

    await setStatus({
      running: true,
      paused: false,
      total: items.length,
      done: 0,
      current: 0,
      name: '',
      size: 0,
      source,
      dest,
      scope,
      cancelled: false,
      startedAt: new Date(),
      finishedAt: null,
    });

    // Guard the deferred job: an unhandled rejection would crash the server
    // (SyncedCron treats it as fatal).
    Meteor.defer(() => {
      Promise.resolve()
        .then(() => runMigration(items, dest))
        .catch(async error => {
          console.error('[attachmentMigration] Migration aborted:', error);
          controller.running = false;
          controller.paused = false;
          controller.cancelled = false;
          try {
            await setStatus({ running: false, paused: false, finishedAt: new Date() });
          } catch (statusError) {
            console.error('[attachmentMigration] Failed to reset status after abort:', statusError);
          }
        });
    });

    return { total: items.length };
  },

  async pauseBulkAttachmentMove() {
    await requireAdmin(this.userId);
    if (!controller.running) return false;
    controller.paused = true;
    await setStatus({ paused: true });
    return true;
  },

  async resumeBulkAttachmentMove() {
    await requireAdmin(this.userId);
    if (!controller.running) return false;
    controller.paused = false;
    await setStatus({ paused: false });
    return true;
  },

  async cancelBulkAttachmentMove() {
    await requireAdmin(this.userId);
    controller.cancelled = true;
    controller.paused = false;
    return true;
  },
});

Meteor.publish('attachmentBulkMoveStatus', async function () {
  if (!this.userId) {
    return this.ready();
  }
  const user = await ReactiveCache.getUser(this.userId);
  if (!user || !user.isAdmin) {
    return this.ready();
  }
  return AttachmentBulkMoveStatus.find({});
});

Meteor.startup(() => {
  // A move job cannot survive a server restart (its in-memory controller is
  // gone), so clear any stale "running" flag left over from a previous process.
  AttachmentBulkMoveStatus.updateAsync(
    { _id: STATUS_ID, running: true },
    { $set: { running: false, paused: false, interrupted: true, updatedAt: new Date() } },
  ).catch(() => {});
});
