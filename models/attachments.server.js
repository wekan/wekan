import { ReactiveCache } from '/imports/reactiveCache';
import { Meteor } from 'meteor/meteor';
import { MongoInternals } from 'meteor/mongo';
import { check } from 'meteor/check';
import { isFileValid } from './fileValidation';
import { createBucket } from './lib/grid/createBucket';
import fs from 'fs';
import path from 'path';
import { AttachmentStoreStrategyFilesystem, AttachmentStoreStrategyGridFs, AttachmentStoreStrategyCloud } from '/models/lib/attachmentStoreStrategy';
import FileStoreStrategyFactory, { moveToStorage, rename, STORAGE_NAME_FILESYSTEM, STORAGE_NAME_GRIDFS } from '/models/lib/fileStoreStrategy';
import { refreshCloudStorageFromSettings } from '/models/lib/cloudStorage';
import { getAttachmentWithBackwardCompatibility, getAttachmentsWithBackwardCompatibility } from './lib/attachmentBackwardCompatibility';
import AttachmentStorageSettings from './attachmentStorageSettings';
import Attachments, { normalizeRemovedFiles } from './attachments';
import Boards from '/models/boards';
import { allowIsBoardMember } from '/server/lib/utils';
import { ensureIndex } from '/server/lib/mongoStartup';

// ---------------------------------------------------------------------------
// Server-only configuration
// ---------------------------------------------------------------------------

let attachmentUploadExternalProgram;
let attachmentUploadMimeTypes = [];
let attachmentUploadSize = 0;

function parseNonNegativeInt(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

async function getAttachmentUploadMaxBytes() {
  try {
    const settings = await AttachmentStorageSettings.findOneAsync({});
    const configuredLimit = settings?.limitSettings?.attachmentsUploadMaxBytes;
    if (Number.isFinite(configuredLimit) && configuredLimit >= 0) {
      return configuredLimit;
    }

    // Backward compatibility: respect existing uploadSettings.maxFileSize if present.
    const legacySettingLimit = settings?.uploadSettings?.maxFileSize;
    if (Number.isFinite(legacySettingLimit) && legacySettingLimit >= 0) {
      return legacySettingLimit;
    }
  } catch (error) {
    if (process.env.DEBUG === 'true') {
      console.warn('Could not load attachment upload limit from settings:', error);
    }
  }

  return attachmentUploadSize;
}

const attachmentBucket = createBucket('attachments');

// Compute storage path:
// - Docker (WRITABLE_PATH=/data): /data/files/attachments
// - Snap (WRITABLE_PATH=$SNAP_COMMON/files): $SNAP_COMMON/files/attachments
const basePath = process.env.WRITABLE_PATH || process.cwd();
const endsWithFiles = basePath.endsWith('/files') || basePath.endsWith('\\files');
const storagePath = endsWithFiles
  ? path.join(basePath, 'attachments')
  : path.join(basePath, 'files', 'attachments');

if (process.env.ATTACHMENTS_UPLOAD_MIME_TYPES) {
  attachmentUploadMimeTypes = process.env.ATTACHMENTS_UPLOAD_MIME_TYPES.split(',');
  attachmentUploadMimeTypes = attachmentUploadMimeTypes.map(value => value.trim());
}

if (process.env.ATTACHMENTS_UPLOAD_MAX_SIZE) {
  attachmentUploadSize = parseNonNegativeInt(process.env.ATTACHMENTS_UPLOAD_MAX_SIZE, 0);
}

if (process.env.ATTACHMENTS_UPLOAD_EXTERNAL_PROGRAM) {
  attachmentUploadExternalProgram = process.env.ATTACHMENTS_UPLOAD_EXTERNAL_PROGRAM;

  if (!attachmentUploadExternalProgram.includes("{file}")) {
    attachmentUploadExternalProgram = undefined;
  }
}

// ---------------------------------------------------------------------------
// File store strategy factory
// ---------------------------------------------------------------------------

export const fileStoreStrategyFactory = new FileStoreStrategyFactory(
  AttachmentStoreStrategyFilesystem, storagePath,
  AttachmentStoreStrategyGridFs, attachmentBucket,
  AttachmentStoreStrategyCloud,
  Attachments,
);

// ---------------------------------------------------------------------------
// Assign server-only FilesCollection callbacks
// ---------------------------------------------------------------------------

Attachments.storagePath = function () {
  return fileStoreStrategyFactory.storagePath;
};

Attachments.onAfterUpload = async function (fileObj) {
  // Detect and sanitize known exploits from the uploaded file IN PLACE, while it
  // is still on the local filesystem staging area and BEFORE it is validated or
  // moved to any final storage backend (filesystem final location, S3, GridFS...).
  // Today this strips scripts, event handlers, javascript: URIs and XML
  // DOCTYPE/ENTITY (XML loop / billion-laughs) constructs from SVG uploads, so SVG
  // images upload safely instead of being rejected. General for every upload,
  // regardless of the configured storage backend.
  const { sanitizeUploadedFileExploits } = require('./lib/sanitizeUploadedFile');
  if (sanitizeUploadedFileExploits(fileObj)) {
    try {
      await Attachments.updateAsync(
        { _id: fileObj._id },
        { $set: { versions: fileObj.versions } },
      );
    } catch (error) {
      console.error('[onAfterUpload] Failed to persist sanitized versions:', error);
    }
    // Log to Admin Panel / Problems: who uploaded, what was removed, when, where.
    try {
      await require('/server/lib/filenameSanitizeLog').logContentSanitized({
        fileObj, source: 'attachmentUpload',
      });
    } catch (e) { /* best effort */ }
  }

  // Filename hardening for EVERY upload, on all storage backends:
  //   1. Reject a filename that itself looks like an exploit (HTML/JS/XML/etc.).
  //   2. Normalize + correct the stored name: URL-decode, fold confusable
  //      homoglyphs, remove invisible characters, strip exploit markup, and fix
  //      the EXTENSION to match the real detected file type — so double-clicking
  //      the downloaded file opens the right application — capped to a portable
  //      length. Uses the general, storage-agnostic detector (streams only a
  //      small header to WRITABLE_PATH/files/temp, then deletes it).
  try {
    const { filenameLooksLikeExploit, sanitizeUploadFileName } = require('./lib/uploadFileName');
    if (filenameLooksLikeExploit(fileObj.name)) {
      console.log('[onAfterUpload] rejected exploit-looking filename:', fileObj._id);
      await Attachments.removeAsync(fileObj._id);
      return;
    }
    const { detectStoredFileMime } = require('./lib/fileTypeCorrection');
    const detectedMime = await detectStoredFileMime(fileObj, fileStoreStrategyFactory);
    const originalName = fileObj.name;
    const correctedName = sanitizeUploadFileName(originalName, detectedMime || fileObj.type);
    if (correctedName && correctedName !== originalName) {
      rename(fileObj, correctedName, fileStoreStrategyFactory);
      fileObj.name = correctedName;
      // Log to Admin Panel / Problems: who uploaded, why, when, where.
      try {
        const { sanitizationReasons } = require('./lib/uploadFileName');
        await require('/server/lib/filenameSanitizeLog').logFilenameSanitized({
          fileObj, source: 'attachmentUpload',
          reasons: sanitizationReasons(originalName, detectedMime || fileObj.type, correctedName),
          from: originalName, to: correctedName,
        });
      } catch (e) { /* best effort */ }
    }
  } catch (error) {
    console.error('[onAfterUpload] filename hardening failed:', error);
  }

  // Get default storage backend from settings
  let defaultStorage = STORAGE_NAME_FILESYSTEM;
  try {
    const settings = await AttachmentStorageSettings.findOneAsync({});
    if (settings) {
      defaultStorage = settings.getDefaultStorage();
    }
  } catch (error) {
    console.warn('Could not get attachment storage settings, using default:', error);
  }

  // Set initial storage to filesystem (temporary)
  Object.keys(fileObj.versions).forEach(versionName => {
    fileObj.versions[versionName].storage = STORAGE_NAME_FILESYSTEM;
  });

  this._now = new Date();
  await Attachments.updateAsync({ _id: fileObj._id }, { $set: { "versions": fileObj.versions, "uploadedAtOstrio": this._now } });

  // Use selected storage backend or copy storage if specified
  let storageDestination = fileObj.meta.copyStorage || defaultStorage;

  // Only migrate if the destination is different from filesystem
  if (storageDestination !== STORAGE_NAME_FILESYSTEM) {
    const fileObjId = fileObj._id;
    // Note: Meteor.call('validateAttachmentAndMoveToStorage', ...) cannot be used here
    // because server-side calls have this.userId=null, triggering not-authorized.
    // Call the validation and migration logic directly instead.
    Meteor.defer(async () => {
      try {
        const currentFileObj = await ReactiveCache.getAttachment(fileObjId);
        if (!currentFileObj) return;

        const effectiveUploadMaxBytes = await getAttachmentUploadMaxBytes();
        const isValid = await isFileValid(currentFileObj, attachmentUploadMimeTypes, effectiveUploadMaxBytes, attachmentUploadExternalProgram);
        if (!isValid) {
          await Attachments.removeAsync(fileObjId);
          return;
        }

        const fileObjAfterValidation = await ReactiveCache.getAttachment(fileObjId);
        if (fileObjAfterValidation) {
          moveToStorage(fileObjAfterValidation, storageDestination, fileStoreStrategyFactory);
        }
      } catch (error) {
        console.error('[onAfterUpload] Error during validation and storage migration:', error);
      }
    });
  }
};

Attachments.interceptDownload = function (http, fileObj, versionName) {
  const ret = fileStoreStrategyFactory.getFileStrategy(fileObj, versionName).interceptDownload(http, this.cacheControl);
  return ret;
};

Attachments.onAfterRemove = function (filesInput) {
  const files = normalizeRemovedFiles(filesInput);

  files.forEach(fileObj => {
    if (!fileObj || !fileObj.versions) {
      return;
    }

    Object.keys(fileObj.versions).forEach(versionName => {
      fileStoreStrategyFactory.getFileStrategy(fileObj, versionName).onAfterRemove();
    });
  });
};

// We authorize the attachment download either:
// - if the board is public, everyone (even unconnected) can download it
// - if the board is private, only board members can download it
// Note: ostrio:files v3.x uses `await this.protected.call(...)` in _checkAccess,
// so this function can be async and use findOneAsync for Meteor 3.x compatibility.
Attachments.protected = async function (fileObj) {
  // file may have been deleted already again after upload validation failed
  if (!fileObj) {
    return false;
  }
  const board = await Boards.findOneAsync(fileObj.meta.boardId);
  if (!board) {
    return false;
  }
  if (board.isPublic()) {
    return true;
  }
  return board.hasMember(this.userId);
};

// ---------------------------------------------------------------------------
// Backward compatibility methods (override client stubs)
// ---------------------------------------------------------------------------

Attachments.getAttachmentWithBackwardCompatibility = getAttachmentWithBackwardCompatibility;
Attachments.getAttachmentsWithBackwardCompatibility = getAttachmentsWithBackwardCompatibility;

// ---------------------------------------------------------------------------
// Meteor methods
// ---------------------------------------------------------------------------

Meteor.methods({
  // Validate image URL to prevent SVG-based DoS attacks
  validateImageUrl(imageUrl) {
    check(imageUrl, String);

    if (!imageUrl) {
      return { valid: false, reason: 'Empty URL' };
    }

    // Block SVG files and data URIs
    if (imageUrl.endsWith('.svg') || imageUrl.startsWith('data:image/svg')) {
      if (process.env.DEBUG === 'true') {
        console.warn('Blocked potentially malicious SVG image URL:', imageUrl);
      }
      return { valid: false, reason: 'SVG images are blocked for security reasons' };
    }

    // Block data URIs that could contain malicious content
    if (imageUrl.startsWith('data:')) {
      if (process.env.DEBUG === 'true') {
        console.warn('Blocked data URI image URL:', imageUrl);
      }
      return { valid: false, reason: 'Data URIs are blocked for security reasons' };
    }

    // Validate URL format
    try {
      const url = new URL(imageUrl);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        return { valid: false, reason: 'Only HTTP and HTTPS protocols are allowed' };
      }
    } catch (e) {
      return { valid: false, reason: 'Invalid URL format' };
    }

    return { valid: true };
  },
  async moveAttachmentToStorage(fileObjId, storageDestination) {
    check(fileObjId, String);
    check(storageDestination, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }

    const user = await ReactiveCache.getUser(this.userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required.');
    }

    const fileObj = await ReactiveCache.getAttachment(fileObjId);
    if (!fileObj) {
      throw new Meteor.Error('attachment-not-found', 'Attachment not found');
    }

    const board = await ReactiveCache.getBoard(fileObj.meta?.boardId);
    if (!board || !board.isVisibleBy({ _id: this.userId })) {
      throw new Meteor.Error('not-authorized', 'You do not have access to this board.');
    }

    // Allowlist storage destinations
    const allowedDestinations = ['fs', 'gridfs', 's3', 'azure', 'gcs'];
    if (!allowedDestinations.includes(storageDestination)) {
      throw new Meteor.Error('invalid-storage-destination', 'Invalid storage destination');
    }

    moveToStorage(fileObj, storageDestination, fileStoreStrategyFactory);
  },
  async renameAttachment(fileObjId, newName) {
    check(fileObjId, String);
    check(newName, String);

    const currentUserId = this.userId;
    if (!currentUserId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in');
    }

    const fileObj = await ReactiveCache.getAttachment(fileObjId);
    if (!fileObj) {
      throw new Meteor.Error('file-not-found', 'Attachment not found');
    }

    // Verify the user has permission to modify this attachment
    const board = await ReactiveCache.getBoard(fileObj.meta?.boardId);
    if (!board) {
      throw new Meteor.Error('board-not-found', 'Board not found');
    }

    if (!allowIsBoardMember(currentUserId, board)) {
      if (process.env.DEBUG === 'true') {
        console.warn(`Blocked unauthorized attachment rename attempt: user ${currentUserId} tried to rename attachment ${fileObjId} in board ${fileObj.meta?.boardId}`);
      }
      throw new Meteor.Error('not-authorized', 'You do not have permission to modify this attachment');
    }

    rename(fileObj, newName, fileStoreStrategyFactory);
  },
  async validateAttachment(fileObjId) {
    check(fileObjId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }

    const fileObj = await ReactiveCache.getAttachment(fileObjId);
    if (!fileObj) {
      throw new Meteor.Error('attachment-not-found', 'Attachment not found');
    }

    const board = await ReactiveCache.getBoard(fileObj.meta?.boardId);
    if (!board || !board.isVisibleBy({ _id: this.userId })) {
      throw new Meteor.Error('not-authorized', 'You do not have access to this board.');
    }

    const effectiveUploadMaxBytes = await getAttachmentUploadMaxBytes();
    const isValid = await isFileValid(fileObj, attachmentUploadMimeTypes, effectiveUploadMaxBytes, attachmentUploadExternalProgram);

    if (!isValid) {
      await Attachments.removeAsync(fileObjId);
    }
  },
  async validateAttachmentAndMoveToStorage(fileObjId, storageDestination) {
    check(fileObjId, String);
    check(storageDestination, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in.');
    }

    const user = await ReactiveCache.getUser(this.userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required.');
    }

    const fileObj = await ReactiveCache.getAttachment(fileObjId);
    if (!fileObj) {
      throw new Meteor.Error('attachment-not-found', 'Attachment not found');
    }

    const board = await ReactiveCache.getBoard(fileObj.meta?.boardId);
    if (!board || !board.isVisibleBy({ _id: this.userId })) {
      throw new Meteor.Error('not-authorized', 'You do not have access to this board.');
    }

    // Allowlist storage destinations
    const allowedDestinations = ['fs', 'gridfs', 's3', 'azure', 'gcs'];
    if (!allowedDestinations.includes(storageDestination)) {
      throw new Meteor.Error('invalid-storage-destination', 'Invalid storage destination');
    }

    await Meteor.callAsync('validateAttachment', fileObjId);

    const fileObjAfter = await ReactiveCache.getAttachment(fileObjId);

    if (fileObjAfter) {
      Meteor.defer(() => Meteor.call('moveAttachmentToStorage', fileObjId, storageDestination));
    }
  },
});

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

Meteor.startup(async () => {
  await ensureIndex(Attachments, { 'meta.cardId': 1 });
  // The board publication now publishes all of a board's attachments with one cursor
  // on the denormalized meta.boardId (replacing a per-card N+1, #6480); index it so
  // that board-level query is not a full collection scan.
  await ensureIndex(Attachments, { 'meta.boardId': 1 });

  // Ensure standard GridFS index on attachments.chunks for efficient chunk lookups.
  // Without this, queries like find({files_id: ObjectId}) do full collection scans.
  const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
  const chunksCollection = db.collection('attachments.chunks');
  try {
    await chunksCollection.createIndex({ files_id: 1, n: 1 }, { unique: true });
  } catch (e) {
    // Index already exists, which is fine — skip the error.
    if (e.code !== 86) throw e;
  }

  const sp = fileStoreStrategyFactory.storagePath;
  if (!fs.existsSync(sp)) {
    console.log("create storagePath because it doesn't exist: " + sp);
    fs.mkdirSync(sp, { recursive: true });
  }

  // Build the configured cloud storage adapters (S3/Azure/GCS) from settings.
  await refreshCloudStorageFromSettings();
});
