import { ReactiveCache } from '/imports/reactiveCache';
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { isFileValid } from './fileValidation';
import { createBucket } from './lib/grid/createBucket';
import fs from 'fs';
import path from 'path';
import { AttachmentStoreStrategyFilesystem, AttachmentStoreStrategyGridFs } from '/models/lib/attachmentStoreStrategy';
import FileStoreStrategyFactory, { moveToStorage, rename, STORAGE_NAME_FILESYSTEM, STORAGE_NAME_GRIDFS } from '/models/lib/fileStoreStrategy';
import { getAttachmentWithBackwardCompatibility, getAttachmentsWithBackwardCompatibility } from './lib/attachmentBackwardCompatibility';
import AttachmentStorageSettings from './attachmentStorageSettings';
import Attachments, { normalizeRemovedFiles } from './attachments';
import Boards from '/models/boards';
import { allowIsBoardMember } from '/server/lib/utils';

// ---------------------------------------------------------------------------
// Server-only configuration
// ---------------------------------------------------------------------------

let attachmentUploadExternalProgram;
let attachmentUploadMimeTypes = [];
let attachmentUploadSize = 0;

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
  attachmentUploadSize = parseInt(process.env.ATTACHMENTS_UPLOAD_MAX_SIZE);

  if (isNaN(attachmentUploadSize)) {
    attachmentUploadSize = 0;
  }
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
);

// ---------------------------------------------------------------------------
// Assign server-only FilesCollection callbacks
// ---------------------------------------------------------------------------

Attachments.storagePath = function () {
  return fileStoreStrategyFactory.storagePath;
};

Attachments.onAfterUpload = async function (fileObj) {
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

        const isValid = await isFileValid(currentFileObj, attachmentUploadMimeTypes, attachmentUploadSize, attachmentUploadExternalProgram);
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

    const fileObj = await ReactiveCache.getAttachment(fileObjId);
    if (!fileObj) {
      throw new Meteor.Error('attachment-not-found', 'Attachment not found');
    }

    const board = await ReactiveCache.getBoard(fileObj.meta?.boardId);
    if (!board || !board.isVisibleBy({ _id: this.userId })) {
      throw new Meteor.Error('not-authorized', 'You do not have access to this board.');
    }

    // Allowlist storage destinations
    const allowedDestinations = ['fs', 'gridfs', 's3'];
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

    const isValid = await isFileValid(fileObj, attachmentUploadMimeTypes, attachmentUploadSize, attachmentUploadExternalProgram);

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

    const fileObj = await ReactiveCache.getAttachment(fileObjId);
    if (!fileObj) {
      throw new Meteor.Error('attachment-not-found', 'Attachment not found');
    }

    const board = await ReactiveCache.getBoard(fileObj.meta?.boardId);
    if (!board || !board.isVisibleBy({ _id: this.userId })) {
      throw new Meteor.Error('not-authorized', 'You do not have access to this board.');
    }

    // Allowlist storage destinations
    const allowedDestinations = ['fs', 'gridfs', 's3'];
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
  await Attachments.collection.createIndexAsync({ 'meta.cardId': 1 });
  const sp = fileStoreStrategyFactory.storagePath;
  if (!fs.existsSync(sp)) {
    console.log("create storagePath because it doesn't exist: " + sp);
    fs.mkdirSync(sp, { recursive: true });
  }
});
