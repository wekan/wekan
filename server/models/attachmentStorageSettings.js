import { Meteor } from 'meteor/meteor';
import { MongoInternals } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
import AttachmentStorageSettings from '/models/attachmentStorageSettings';
import {
  STORAGE_NAME_FILESYSTEM,
  STORAGE_NAME_GRIDFS,
  STORAGE_NAME_S3,
  STORAGE_NAME_AZURE,
  STORAGE_NAME_GCS,
  CLOUD_STORAGE_NAMES,
} from '/models/lib/fileStoreConstants';
import { check } from 'meteor/check';
import { WebApp } from 'meteor/webapp';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';
import { refreshCloudStorageFromSettings, testCloudConnection } from '/models/lib/cloudStorage';
import { computeStoragePaths } from '/models/lib/attachmentStoragePath';

// Secret fields per cloud provider — never published to the client and only
// overwritten when a non-empty replacement value is supplied.
const CLOUD_SECRET_FIELDS = {
  [STORAGE_NAME_S3]: ['secretAccessKey'],
  [STORAGE_NAME_AZURE]: ['accountKey', 'connectionString'],
  [STORAGE_NAME_GCS]: ['credentials'],
};

// Mask secret fields in a settings document before returning it to the client,
// replacing each secret with '' and adding a boolean `<field>Set` marker so the
// admin UI can show that a value exists without revealing it.
function maskStorageSecrets(settings) {
  if (!settings || !settings.storageConfig) {
    return settings;
  }
  const masked = { ...settings, storageConfig: { ...settings.storageConfig } };
  CLOUD_STORAGE_NAMES.forEach(provider => {
    const cfg = masked.storageConfig[provider];
    if (!cfg) return;
    const maskedCfg = { ...cfg };
    (CLOUD_SECRET_FIELDS[provider] || []).forEach(field => {
      maskedCfg[`${field}Set`] = !!cfg[field];
      maskedCfg[field] = '';
    });
    masked.storageConfig[provider] = maskedCfg;
  });
  return masked;
}

function parseNonNegativeInt(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

async function countCollectionDocumentsSafe(db, collectionName) {
  try {
    const exists = await db.listCollections({ name: collectionName }, { nameOnly: true }).toArray();
    if (!Array.isArray(exists) || exists.length === 0) {
      return 0;
    }
    return await db.collection(collectionName).countDocuments({});
  } catch (error) {
    return 0;
  }
}

async function countByStorageSafe(db, collectionName, storageName) {
  try {
    const exists = await db.listCollections({ name: collectionName }, { nameOnly: true }).toArray();
    if (!Array.isArray(exists) || exists.length === 0) {
      return 0;
    }
    // Check any version key for the target storage value via aggregation
    const result = await db.collection(collectionName).aggregate([
      { $addFields: {
        _storages: {
          $map: {
            input: { $objectToArray: { $ifNull: ['$versions', {}] } },
            as: 'v',
            in: '$$v.v.storage',
          },
        },
      } },
      { $match: { _storages: storageName } },
      { $count: 'n' },
    ]).toArray();
    return result.length > 0 ? result[0].n : 0;
  } catch (error) {
    return 0;
  }
}

function highestCount(...counts) {
  return counts.reduce((max, value) => Math.max(max, Number(value) || 0), 0);
}

// Count documents that have at least one version actually stored in MongoDB
// GridFS (Meteor-Files). A version is in GridFS when its `storage` flag is
// 'gridfs' OR it carries a `meta.gridFsFileId` reference — the same rule used by
// FileStoreStrategyFactory.getFileStrategy() and the bulk-move source matcher.
// This must NOT count every metadata document, because the `attachments`
// collection holds metadata for filesystem- and cloud-stored files too.
async function countGridFsStoredSafe(db, collectionName) {
  try {
    const exists = await db.listCollections({ name: collectionName }, { nameOnly: true }).toArray();
    if (!Array.isArray(exists) || exists.length === 0) {
      return 0;
    }
    const result = await db.collection(collectionName).aggregate([
      { $addFields: {
        _inGridFs: {
          $anyElementTrue: {
            $map: {
              input: { $objectToArray: { $ifNull: ['$versions', {}] } },
              as: 'v',
              in: {
                $or: [
                  { $eq: ['$$v.v.storage', 'gridfs'] },
                  { $ne: [{ $ifNull: ['$$v.v.meta.gridFsFileId', null] }, null] },
                ],
              },
            },
          },
        },
      } },
      { $match: { _inGridFs: true } },
      { $count: 'n' },
    ]).toArray();
    return result.length > 0 ? result[0].n : 0;
  } catch (error) {
    return 0;
  }
}

// Build a direct-connection URL to a specific replica set member, stripping replicaSet
// routing so the driver connects to exactly the given host (required for compact on secondaries).
function buildDirectNodeUrl(mongoUrl, targetHostPort) {
  const protoEnd = mongoUrl.indexOf('://');
  const withoutProto = protoEnd !== -1 ? mongoUrl.slice(protoEnd + 3) : mongoUrl;
  const firstSlash = withoutProto.indexOf('/');
  const hostArea = firstSlash !== -1 ? withoutProto.slice(0, firstSlash) : withoutProto;
  const dbAndOpts = firstSlash !== -1 ? withoutProto.slice(firstSlash) : '/admin';
  // lastIndexOf('@') correctly handles passwords that contain '@'
  const lastAt = hostArea.lastIndexOf('@');
  const auth = lastAt !== -1 ? hostArea.slice(0, lastAt + 1) : '';
  const qIdx = dbAndOpts.indexOf('?');
  const dbPath = qIdx !== -1 ? dbAndOpts.slice(0, qIdx) : dbAndOpts;
  const params = new URLSearchParams(qIdx !== -1 ? dbAndOpts.slice(qIdx + 1) : '');
  params.delete('replicaSet');
  params.delete('readPreference');
  params.set('directConnection', 'true');
  return `mongodb://${auth}${targetHostPort}${dbPath}?${params.toString()}`;
}

async function compactCollectionsOnNode(nodeDb, candidates, force = false) {
  const results = {};
  for (const collName of candidates) {
    try {
      const exists = await nodeDb.listCollections({ name: collName }, { nameOnly: true }).toArray();
      if (!Array.isArray(exists) || exists.length === 0) continue;
      // On a replica-set primary, MongoDB refuses compact ("will not run compact
      // on an active replica set primary …") unless force:true is given. A
      // single-node replica set (the common Meteor oplog setup) has only a
      // primary, so without force nothing is compacted at all.
      const command = force ? { compact: collName, force: true } : { compact: collName };
      await nodeDb.command(command);
      results[collName] = 'ok';
    } catch (err) {
      results[collName] = err.message || 'error';
    }
  }
  return results;
}

Meteor.methods({
  // #6473: the Admin Panel > Attachments page used to render these paths from
  // process.env.WRITABLE_PATH ON THE CLIENT, where process.env never has it, so
  // it always showed "/data" — a path that does not exist on a Snap install.
  // The client now asks the server for the real, Snap-aware paths.
  async getAttachmentStoragePaths() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(this.userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }
    return computeStoragePaths(process.env.WRITABLE_PATH);
  },

  async getAttachmentStorageSettings() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    const user = await ReactiveCache.getUser(this.userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    let settings = await AttachmentStorageSettings.findOneAsync({});
    if (!settings) {
      settings = {
        defaultStorage: STORAGE_NAME_FILESYSTEM,
        storageConfig: {
          filesystem: {
            enabled: true,
            read: true,
            write: true,
            // #6473: the REAL storage path (Snap-aware: WRITABLE_PATH may already
            // end in /files), not `${WRITABLE_PATH}/attachments`, which pointed
            // at a directory that does not exist on Docker (/data/attachments
            // instead of /data/files/attachments).
            path: computeStoragePaths(process.env.WRITABLE_PATH).attachments,
          },
          gridfs: {
            enabled: true,
            read: true,
            write: true,
          },
          s3: {
            enabled: false,
            read: true,
            write: true,
            endpoint: process.env.S3_ENDPOINT || '',
            region: process.env.S3_REGION || '',
            bucket: process.env.S3_BUCKET || '',
            accessKeyId: process.env.S3_ACCESS_KEY || '',
            secretAccessKey: process.env.S3_SECRET_KEY || '',
            forcePathStyle: true,
          },
          azure: {
            enabled: false,
            read: true,
            write: true,
            accountName: '',
            accountKey: '',
            connectionString: '',
            bucket: '',
          },
          gcs: {
            enabled: false,
            read: true,
            write: true,
            projectId: '',
            keyFilename: '',
            credentials: '',
            bucket: '',
          },
        },
        uploadSettings: {
          maxFileSize: process.env.ATTACHMENTS_UPLOAD_MAX_SIZE
            ? parseNonNegativeInt(process.env.ATTACHMENTS_UPLOAD_MAX_SIZE, 0) : 0,
          allowedMimeTypes: process.env.ATTACHMENTS_UPLOAD_MIME_TYPES
            ? process.env.ATTACHMENTS_UPLOAD_MIME_TYPES.split(',').map(t => t.trim()) : [],
        },
        limitSettings: {
          attachmentsUploadMaxBytes: process.env.ATTACHMENTS_UPLOAD_MAX_SIZE
            ? parseNonNegativeInt(process.env.ATTACHMENTS_UPLOAD_MAX_SIZE, 0) : 0,
          attachmentsUploadBlocked: false,
          avatarsUploadBlocked: false,
          attachmentsDownloadMaxBytes: 0,
          attachmentsDownloadBlocked: false,
          apiUploadMaxBytes: process.env.ATTACHMENT_API_MAX_UPLOAD_BYTES
            ? parseNonNegativeInt(process.env.ATTACHMENT_API_MAX_UPLOAD_BYTES, 0)
            : 0,
          apiUploadBlocked: false,
          apiDownloadMaxBytes: process.env.ATTACHMENT_API_MAX_DOWNLOAD_BYTES
            ? parseNonNegativeInt(process.env.ATTACHMENT_API_MAX_DOWNLOAD_BYTES, 0)
            : 0,
          apiDownloadBlocked: false,
        },
        migrationSettings: {
          autoMigrate: false,
          batchSize: 10,
          delayMs: 1000,
          cpuThreshold: 70,
        },
        createdBy: this.userId,
        updatedBy: this.userId,
      };

      await AttachmentStorageSettings.insertAsync(settings);
      settings = await AttachmentStorageSettings.findOneAsync({});
    }

    // Never expose secret keys to the client; the UI shows a "set" marker.
    return maskStorageSecrets(settings);
  },

  // Whether avatar uploads are blocked board-wide (Admin Panel > Attachments >
  // Transfer limits). Readable by any logged-in user so the avatar popup can
  // hide its upload option; the actual upload is also blocked server-side in
  // server/permissions/avatars.js. Default false (avatars enabled).
  async isAvatarUploadBlocked() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const settings = await AttachmentStorageSettings.findOneAsync(
      {}, { fields: { 'limitSettings.avatarsUploadBlocked': 1 } },
    );
    return settings?.limitSettings?.avatarsUploadBlocked === true;
  },

  async getGridFsStorageStats() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    const user = await ReactiveCache.getUser(this.userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    const db = MongoInternals.defaultRemoteCollectionDriver()?.mongo?.db;
    if (!db) {
      throw new Meteor.Error('mongo-unavailable', 'MongoDB connection is not available');
    }

    const [
      cfsAttachmentsFiles,
      cfsAttachmentsFilerecord,
      mongoAttachments,
      mongoAttachmentsFiles,
      cfsAvatarsFiles,
      cfsAvatarsFilerecord,
      mongoAvatars,
      mongoAvatarsFiles,
    ] = await Promise.all([
      countCollectionDocumentsSafe(db, 'cfs_gridfs.attachments.files'),
      countCollectionDocumentsSafe(db, 'cfs.attachments.filerecord'),
      // GridFS-stored attachments only — NOT every metadata document, since the
      // 'attachments' collection also holds filesystem/cloud-stored files.
      countGridFsStoredSafe(db, 'attachments'),
      countCollectionDocumentsSafe(db, 'attachments.files'),
      countCollectionDocumentsSafe(db, 'cfs_gridfs.avatars.files'),
      countCollectionDocumentsSafe(db, 'cfs.avatars.filerecord'),
      countGridFsStoredSafe(db, 'avatars'),
      countCollectionDocumentsSafe(db, 'avatars.files'),
    ]);

    // Compatibility across tags:
    // - Old CollectionFS tags used cfs_gridfs.*.files and sometimes cfs.*.filerecord
    // - New Mongo-Files tags store the binary in GridFS, flagged per version
    //   (mongoAttachments now counts only those), with the raw GridFS bucket
    //   (attachments.files) kept as a fallback/cross-check.
    const attachmentsCollectionFs = highestCount(cfsAttachmentsFiles, cfsAttachmentsFilerecord);
    const avatarsCollectionFs = highestCount(cfsAvatarsFiles, cfsAvatarsFilerecord);
    // Headline count = attachments whose version markers say GridFS (exactly the
    // set the bulk move can act on). The raw GridFS bucket counts
    // (mongoAttachmentsFiles / mongoAvatarsFiles) are reported separately under
    // `details` as a cross-check for orphaned bucket data.
    const attachmentsMongoFiles = mongoAttachments;
    const avatarsMongoFiles = mongoAvatars;

    return {
      attachments: {
        collectionFs: attachmentsCollectionFs,
        mongoFiles: attachmentsMongoFiles,
      },
      avatars: {
        collectionFs: avatarsCollectionFs,
        mongoFiles: avatarsMongoFiles,
      },
      details: {
        collectionFs: {
          attachments: {
            cfsGridfsFiles: cfsAttachmentsFiles,
            cfsFileRecord: cfsAttachmentsFilerecord,
          },
          avatars: {
            cfsGridfsFiles: cfsAvatarsFiles,
            cfsFileRecord: cfsAvatarsFilerecord,
          },
        },
        mongoFiles: {
          attachments: {
            collection: mongoAttachments,
            filesCollection: mongoAttachmentsFiles,
          },
          avatars: {
            collection: mongoAvatars,
            filesCollection: mongoAvatarsFiles,
          },
        },
      },
      calculatedAt: new Date(),
    };
  },

  async getFilesystemStorageStats() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(this.userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }
    const db = MongoInternals.defaultRemoteCollectionDriver()?.mongo?.db;
    if (!db) {
      throw new Meteor.Error('mongo-unavailable', 'MongoDB connection is not available');
    }
    const [attachments, avatars] = await Promise.all([
      countByStorageSafe(db, 'attachments', 'fs'),
      countByStorageSafe(db, 'avatars', 'fs'),
    ]);
    return { attachments, avatars, calculatedAt: new Date() };
  },

  async getS3StorageStats() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(this.userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }
    const db = MongoInternals.defaultRemoteCollectionDriver()?.mongo?.db;
    if (!db) {
      throw new Meteor.Error('mongo-unavailable', 'MongoDB connection is not available');
    }
    const [attachments, avatars] = await Promise.all([
      countByStorageSafe(db, 'attachments', 's3'),
      countByStorageSafe(db, 'avatars', 's3'),
    ]);
    return { attachments, avatars, calculatedAt: new Date() };
  },

  async getAzureStorageStats() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(this.userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }
    const db = MongoInternals.defaultRemoteCollectionDriver()?.mongo?.db;
    if (!db) {
      throw new Meteor.Error('mongo-unavailable', 'MongoDB connection is not available');
    }
    const [attachments, avatars] = await Promise.all([
      countByStorageSafe(db, 'attachments', 'azure'),
      countByStorageSafe(db, 'avatars', 'azure'),
    ]);
    return { attachments, avatars, calculatedAt: new Date() };
  },

  async getGcsStorageStats() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(this.userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }
    const db = MongoInternals.defaultRemoteCollectionDriver()?.mongo?.db;
    if (!db) {
      throw new Meteor.Error('mongo-unavailable', 'MongoDB connection is not available');
    }
    const [attachments, avatars] = await Promise.all([
      countByStorageSafe(db, 'attachments', 'gcs'),
      countByStorageSafe(db, 'avatars', 'gcs'),
    ]);
    return { attachments, avatars, calculatedAt: new Date() };
  },

  async compactMongoGridFs() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(this.userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }
    const db = MongoInternals.defaultRemoteCollectionDriver()?.mongo?.db;
    if (!db) {
      throw new Meteor.Error('mongo-unavailable', 'MongoDB connection is not available');
    }

    const candidates = [
      'attachments.chunks',
      'attachments.files',
      'avatars.chunks',
      'avatars.files',
      'cfs_gridfs.attachments.files',
      'cfs_gridfs.avatars.files',
      'cfs.attachments.filerecord',
      'cfs.avatars.filerecord',
    ];

    const allResults = {};

    // Compact secondaries first (best practice: keep primary available during compaction)
    try {
      const rsStatus = await db.admin().command({ replSetGetStatus: 1 });
      const secondaries = (rsStatus.members || []).filter(m => m.state === 2);

      if (secondaries.length > 0 && process.env.MONGO_URL) {
        const { MongoClient } = MongoInternals.NpmModules.mongodb.module;
        for (const secondary of secondaries) {
          const nodeUrl = buildDirectNodeUrl(process.env.MONGO_URL, secondary.name);
          let secClient;
          try {
            secClient = new MongoClient(nodeUrl, { serverSelectionTimeoutMS: 15000 });
            await secClient.connect();
            const secDb = secClient.db(db.databaseName);
            allResults[`secondary:${secondary.name}`] = await compactCollectionsOnNode(secDb, candidates);
          } catch (err) {
            allResults[`secondary:${secondary.name}`] = { _error: err.message || 'connection failed' };
          } finally {
            if (secClient) await secClient.close().catch(() => {});
          }
        }
      }
    } catch (rsErr) {
      // Not in a replica set or replSetGetStatus unavailable — normal for standalone
      const msg = rsErr.message || '';
      if (!msg.includes('not running with --replSet') && rsErr.codeName !== 'NotYetInitialized') {
        allResults._rsError = msg || 'replica set status unavailable';
      }
    }

    // Compact primary using the existing WeKan connection. force:true is
    // required to compact a replica-set primary (the secondaries above were
    // compacted without it, as best practice keeps the primary available).
    allResults.primary = await compactCollectionsOnNode(db, candidates, true);

    return allResults;
  },

  async updateAttachmentStorageSettings(settings) {
    check(settings, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    const user = await ReactiveCache.getUser(this.userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    // Strip MongoDB metadata fields before saving
    const { _id, createdAt, updatedAt, createdBy, updatedBy, ...cleanSettings } = settings;

    const existing = (await AttachmentStorageSettings.findOneAsync({})) || {};
    const existingConfig = existing.storageConfig || {};

    // Merge storageConfig: keep known providers, and for cloud providers
    // preserve any secret that the client left blank (it never receives the
    // real secret, only a "set" marker) so saving other fields can't wipe it.
    if (cleanSettings.storageConfig) {
      const incoming = cleanSettings.storageConfig;
      const merged = {};

      ['filesystem', 'gridfs'].forEach(key => {
        if (incoming[key] !== undefined) {
          merged[key] = incoming[key];
        } else if (existingConfig[key] !== undefined) {
          merged[key] = existingConfig[key];
        }
      });

      CLOUD_STORAGE_NAMES.forEach(provider => {
        const incomingCfg = incoming[provider];
        const prevCfg = existingConfig[provider] || {};
        if (incomingCfg === undefined) {
          if (existingConfig[provider] !== undefined) {
            merged[provider] = existingConfig[provider];
          }
          return;
        }
        // Drop client-only markers, then merge over the previous config.
        const sanitizedIncoming = { ...incomingCfg };
        (CLOUD_SECRET_FIELDS[provider] || []).forEach(field => {
          delete sanitizedIncoming[`${field}Set`];
        });
        const mergedCfg = { ...prevCfg, ...sanitizedIncoming };
        (CLOUD_SECRET_FIELDS[provider] || []).forEach(field => {
          // Blank secret => keep the previously stored value.
          if (!sanitizedIncoming[field]) {
            mergedCfg[field] = prevCfg[field] || '';
          }
        });
        merged[provider] = mergedCfg;
      });

      cleanSettings.storageConfig = merged;
    }

    const result = await AttachmentStorageSettings.upsertAsync(
      {},
      {
        $set: {
          ...cleanSettings,
          updatedBy: this.userId,
          updatedAt: new Date(),
        },
      },
    );

    // Rebuild the cloud adapters so changes take effect immediately.
    await refreshCloudStorageFromSettings();

    return result;
  },

  async getDefaultAttachmentStorage() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    const settings = await AttachmentStorageSettings.findOneAsync({});
    return settings ? settings.getDefaultStorage() : STORAGE_NAME_FILESYSTEM;
  },

  async setDefaultAttachmentStorage(storageName) {
    check(storageName, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    const user = await ReactiveCache.getUser(this.userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    if (![
      STORAGE_NAME_FILESYSTEM,
      STORAGE_NAME_GRIDFS,
      STORAGE_NAME_S3,
      STORAGE_NAME_AZURE,
      STORAGE_NAME_GCS,
    ].includes(storageName)) {
      throw new Meteor.Error('invalid-storage', 'Invalid storage backend');
    }

    return AttachmentStorageSettings.upsertAsync(
      {},
      {
        $set: {
          defaultStorage: storageName,
          updatedBy: this.userId,
          updatedAt: new Date(),
        },
      },
    );
  },

  // Test connectivity to a cloud provider. `config` is the provider config from
  // the admin form; blank secrets fall back to the stored value.
  async testAttachmentCloudConnection(provider, config) {
    check(provider, String);
    check(config, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(this.userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }
    if (!CLOUD_STORAGE_NAMES.includes(provider)) {
      throw new Meteor.Error('invalid-storage', 'Invalid storage backend');
    }

    const existing = (await AttachmentStorageSettings.findOneAsync({})) || {};
    const prevCfg = (existing.storageConfig && existing.storageConfig[provider]) || {};
    const effectiveCfg = { ...prevCfg, ...config };
    (CLOUD_SECRET_FIELDS[provider] || []).forEach(field => {
      delete effectiveCfg[`${field}Set`];
      if (!config[field]) {
        effectiveCfg[field] = prevCfg[field] || '';
      }
    });

    return testCloudConnection(provider, effectiveCfg);
  },
});

// Project secret fields out so they never reach the client over the wire.
const CLOUD_SECRET_PROJECTION = {
  'storageConfig.s3.secretAccessKey': 0,
  'storageConfig.azure.accountKey': 0,
  'storageConfig.azure.connectionString': 0,
  'storageConfig.gcs.credentials': 0,
};

Meteor.publish('attachmentStorageSettings', async function() {
  if (!this.userId) {
    return this.ready();
  }

  const user = await ReactiveCache.getUser(this.userId);
  if (!user || !user.isAdmin) {
    return this.ready();
  }

  return AttachmentStorageSettings.find({}, { fields: CLOUD_SECRET_PROJECTION });
});

/**
 * @operation get_attachment_settings
 * @tag Settings
 *
 * @summary Get the attachment storage / upload-block settings (GlobalAdmin)
 *
 * @description Only the global admin can call this. Returns the Admin Panel >
 * Attachments settings document, including `limitSettings.attachmentsUploadBlocked`
 * and `limitSettings.avatarsUploadBlocked` plus the size limits. Cloud-storage
 * secret keys (S3 secretAccessKey, Azure accountKey/connectionString, GCS
 * credentials) are masked and never returned; a boolean `<field>Set` marker
 * shows whether a value exists.
 *
 * @return_type Object
 */
WebApp.handlers.get('/api/admin/attachment-settings', async function(req, res) {
  try {
    await Authentication.checkUserId(req.userId);
    const settings = await Meteor.server.method_handlers[
      'getAttachmentStorageSettings'
    ].call({ userId: req.userId });
    sendJsonResult(res, { code: 200, data: settings });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});

/**
 * @operation update_attachment_settings
 * @tag Settings
 *
 * @summary Update the attachment storage / upload-block settings (GlobalAdmin)
 *
 * @description Only the global admin can call this. The request body is a
 * partial settings object (for example
 * `{"limitSettings": {"avatarsUploadBlocked": true}}`). It is applied through
 * the same update path as the `updateAttachmentStorageSettings` Meteor method,
 * so validation and `$set` semantics are identical: cloud-storage secrets left
 * blank are preserved. The masked, updated settings document is returned.
 *
 * @param {Object} settings the partial attachment settings to set
 * @return_type Object
 */
WebApp.handlers.put('/api/admin/attachment-settings', async function(req, res) {
  try {
    await Authentication.checkUserId(req.userId);
    const body = req.body || {};
    await Meteor.server.method_handlers['updateAttachmentStorageSettings'].call(
      { userId: req.userId },
      body,
    );
    const updated = await Meteor.server.method_handlers[
      'getAttachmentStorageSettings'
    ].call({ userId: req.userId });
    sendJsonResult(res, { code: 200, data: updated });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});
