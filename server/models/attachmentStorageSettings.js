import { Meteor } from 'meteor/meteor';
import { MongoInternals } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
import AttachmentStorageSettings from '/models/attachmentStorageSettings';
import {
  STORAGE_NAME_FILESYSTEM,
  STORAGE_NAME_GRIDFS,
} from '/models/lib/fileStoreConstants';

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

async function compactCollectionsOnNode(nodeDb, candidates) {
  const results = {};
  for (const collName of candidates) {
    try {
      const exists = await nodeDb.listCollections({ name: collName }, { nameOnly: true }).toArray();
      if (!Array.isArray(exists) || exists.length === 0) continue;
      await nodeDb.command({ compact: collName });
      results[collName] = 'ok';
    } catch (err) {
      results[collName] = err.message || 'error';
    }
  }
  return results;
}

Meteor.methods({
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
            path: process.env.WRITABLE_PATH ? `${process.env.WRITABLE_PATH}/attachments` : '/data/attachments',
          },
          gridfs: {
            enabled: true,
            read: true,
            write: true,
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

    return settings;
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
      countCollectionDocumentsSafe(db, 'attachments'),
      countCollectionDocumentsSafe(db, 'attachments.files'),
      countCollectionDocumentsSafe(db, 'cfs_gridfs.avatars.files'),
      countCollectionDocumentsSafe(db, 'cfs.avatars.filerecord'),
      countCollectionDocumentsSafe(db, 'avatars'),
      countCollectionDocumentsSafe(db, 'avatars.files'),
    ]);

    // Compatibility across tags:
    // - Old CollectionFS tags used cfs_gridfs.*.files and sometimes cfs.*.filerecord
    // - New Mongo-Files tags use collectionName 'attachments'/'avatars'
    // - Some environments may still expose *.files collections; include as fallback
    const attachmentsCollectionFs = highestCount(cfsAttachmentsFiles, cfsAttachmentsFilerecord);
    const avatarsCollectionFs = highestCount(cfsAvatarsFiles, cfsAvatarsFilerecord);
    const attachmentsMongoFiles = highestCount(mongoAttachments, mongoAttachmentsFiles);
    const avatarsMongoFiles = highestCount(mongoAvatars, mongoAvatarsFiles);

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

    // Compact primary using the existing WeKan connection
    allResults.primary = await compactCollectionsOnNode(db, candidates);

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

    // Only keep known storageConfig keys (e.g. exclude s3 which is not in the schema)
    if (cleanSettings.storageConfig) {
      const { filesystem, gridfs } = cleanSettings.storageConfig;
      cleanSettings.storageConfig = {};
      if (filesystem !== undefined) cleanSettings.storageConfig.filesystem = filesystem;
      if (gridfs !== undefined) cleanSettings.storageConfig.gridfs = gridfs;
    }

    return AttachmentStorageSettings.upsertAsync(
      {},
      {
        $set: {
          ...cleanSettings,
          updatedBy: this.userId,
          updatedAt: new Date(),
        },
      },
    );
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

    if (![STORAGE_NAME_FILESYSTEM, STORAGE_NAME_GRIDFS].includes(storageName)) {
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
});

Meteor.publish('attachmentStorageSettings', async function() {
  if (!this.userId) {
    return this.ready();
  }

  const user = await ReactiveCache.getUser(this.userId);
  if (!user || !user.isAdmin) {
    return this.ready();
  }

  return AttachmentStorageSettings.find({});
});
