import { ReactiveCache } from '/imports/reactiveCache';
import { Meteor } from 'meteor/meteor';
import { FilesCollection } from 'meteor/ostrio:files';
import { isFileValid } from './fileValidation';
import { createBucket } from './lib/grid/createBucket';
import fs from 'fs';
import path from 'path';
import { AttachmentStoreStrategyFilesystem, AttachmentStoreStrategyGridFs } from '/models/lib/attachmentStoreStrategy';
// DISABLED: S3 storage strategy removed due to Node.js compatibility
// import { AttachmentStoreStrategyS3 } from '/models/lib/attachmentStoreStrategy';
import FileStoreStrategyFactory, {moveToStorage, rename, STORAGE_NAME_FILESYSTEM, STORAGE_NAME_GRIDFS} from '/models/lib/fileStoreStrategy';
// DISABLED: S3 storage removed due to Node.js compatibility
// import { STORAGE_NAME_S3 } from '/models/lib/fileStoreStrategy';
import { getAttachmentWithBackwardCompatibility, getAttachmentsWithBackwardCompatibility } from './lib/attachmentBackwardCompatibility';
import AttachmentStorageSettings from './attachmentStorageSettings';
import { generateUniversalAttachmentUrl, cleanFileUrl } from '/models/lib/universalUrlGenerator';

let attachmentUploadExternalProgram;
let attachmentUploadMimeTypes = [];
let attachmentUploadSize = 0;
let attachmentBucket;
let storagePath;

if (Meteor.isServer) {
  attachmentBucket = createBucket('attachments');

  if (process.env.ATTACHMENTS_UPLOAD_MIME_TYPES) {
    attachmentUploadMimeTypes = process.env.ATTACHMENTS_UPLOAD_MIME_TYPES.split(',');
    attachmentUploadMimeTypes = attachmentUploadMimeTypes.map(value => value.trim());
  }

  if (process.env.ATTACHMENTS_UPLOAD_MAX_SIZE) {
    attachmentUploadSize = parseInt(process.env.ATTACHMENTS_UPLOAD_MAX_SIZE);

    if (isNaN(attachmentUploadSize)) {
      attachmentUploadSize = 0
    }
  }

  if (process.env.ATTACHMENTS_UPLOAD_EXTERNAL_PROGRAM) {
    attachmentUploadExternalProgram = process.env.ATTACHMENTS_UPLOAD_EXTERNAL_PROGRAM;

    if (!attachmentUploadExternalProgram.includes("{file}")) {
      attachmentUploadExternalProgram = undefined;
    }
  }

  storagePath = path.join(process.env.WRITABLE_PATH || process.cwd(), 'attachments');
}

export const fileStoreStrategyFactory = new FileStoreStrategyFactory(AttachmentStoreStrategyFilesystem, storagePath, AttachmentStoreStrategyGridFs, attachmentBucket);

// XXX Enforce a schema for the Attachments FilesCollection
// see: https://github.com/VeliovGroup/Meteor-Files/wiki/Schema

Attachments = new FilesCollection({
  debug: false, // Change to `true` for debugging
  collectionName: 'attachments',
  allowClientCode: true,
  namingFunction(opts) {
    let filenameWithoutExtension = ""
    let fileId = "";
    if (opts?.name) {
      // Client
      filenameWithoutExtension = opts.name.replace(/(.+)\..+/, "$1");
      fileId = opts.meta.fileId;
      delete opts.meta.fileId;
    } else if (opts?.file?.name) {
      // Server
      if (opts.file.extension) {
        filenameWithoutExtension = opts.file.name.replace(new RegExp(opts.file.extensionWithDot + "$"), "")
      } else {
        // file has no extension, so don't replace anything, otherwise the last character is removed (because extensionWithDot = '.')
        filenameWithoutExtension = opts.file.name;
      }
      fileId = opts.fileId;
    }
    else {
      // should never reach here
      filenameWithoutExtension = Math.random().toString(36).slice(2);
      fileId = Math.random().toString(36).slice(2);
    }

    // OLD:
    //const ret = fileId + "-original-" + filenameWithoutExtension;
    // NEW: Save file only with filename of ObjectID, not including filename.
    // Fixes https://github.com/wekan/wekan/issues/4416#issuecomment-1510517168
    const ret = fileId;
    // remove fileId from meta, it was only stored there to have this information here in the namingFunction function
    return ret;
  },
  sanitize(str, max, replacement) {
    // keep the original filename
    return str;
  },
  storagePath() {
    const ret = fileStoreStrategyFactory.storagePath;
    return ret;
  },
  onBeforeUpload(file) {
    // SECURITY: Sanitize filename to prevent path traversal attacks
    // Import sanitizeFilename from fileStoreStrategy - but since we can't import here,
    // we'll implement a minimal inline version to be safe
    if (file.name && typeof file.name === 'string') {
      // Use path.basename to strip directory components and prevent path traversal
      let safeName = path.basename(file.name);
      // Remove null bytes
      safeName = safeName.replace(/\0/g, '');
      // Remove path traversal sequences
      safeName = safeName.replace(/\.\.[\\/\\]/g, '');
      safeName = safeName.replace(/^\.\.$/g, '');
      safeName = safeName.trim();

      // If sanitization changed the name, update it
      if (safeName && safeName !== '.' && safeName !== '..' && safeName !== file.name) {
        file.name = safeName;
      } else if (!safeName || safeName === '.' || safeName === '..') {
        file.name = 'unnamed';
      }
    }

    // Block SVG files for attachments to prevent XSS attacks
    if (file.name && file.name.toLowerCase().endsWith('.svg')) {
      if (process.env.DEBUG === 'true') {
        console.warn('Blocked SVG file upload for attachment:', file.name);
      }
      return 'SVG files are not allowed for attachments due to security reasons. Please use PNG, JPG, GIF, or other safe formats.';
    }

    if (file.type === 'image/svg+xml') {
      if (process.env.DEBUG === 'true') {
        console.warn('Blocked SVG MIME type upload for attachment:', file.type);
      }
      return 'SVG files are not allowed for attachments due to security reasons. Please use PNG, JPG, GIF, or other safe formats.';
    }

    return true;
  },
  onAfterUpload(fileObj) {
    // Get default storage backend from settings
    let defaultStorage = STORAGE_NAME_FILESYSTEM;
    try {
      const settings = AttachmentStorageSettings.findOne({});
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
    Attachments.update({ _id: fileObj._id }, { $set: { "versions" : fileObj.versions } });
    Attachments.update({ _id: fileObj.uploadedAtOstrio }, { $set: { "uploadedAtOstrio" : this._now } });

    // Use selected storage backend or copy storage if specified
    let storageDestination = fileObj.meta.copyStorage || defaultStorage;

    // Only migrate if the destination is different from filesystem
    if (storageDestination !== STORAGE_NAME_FILESYSTEM) {
      Meteor.defer(() => Meteor.call('validateAttachmentAndMoveToStorage', fileObj._id, storageDestination));
    }
  },
  interceptDownload(http, fileObj, versionName) {
    const ret = fileStoreStrategyFactory.getFileStrategy(fileObj, versionName).interceptDownload(http, this.cacheControl);
    return ret;
  },
  onAfterRemove(files) {
    files.forEach(fileObj => {
      Object.keys(fileObj.versions).forEach(versionName => {
        fileStoreStrategyFactory.getFileStrategy(fileObj, versionName).onAfterRemove();
      });
    });
  },
  // We authorize the attachment download either:
  // - if the board is public, everyone (even unconnected) can download it
  // - if the board is private, only board members can download it
  protected(fileObj) {
    // file may have been deleted already again after upload validation failed
    if (!fileObj) {
      return false;
    }

    const board = ReactiveCache.getBoard(fileObj.meta.boardId);
    if (board.isPublic()) {
      return true;
    }

    return board.hasMember(this.userId);
  },
});

if (Meteor.isServer) {
  Attachments.allow({
    insert(userId, fileObj) {
      // ReadOnly users cannot upload attachments
      return allowIsBoardMemberWithWriteAccess(userId, ReactiveCache.getBoard(fileObj.boardId));
    },
    update(userId, fileObj, fields) {
      // SECURITY: The 'name' field is sanitized in onBeforeUpload and server-side methods,
      // but we block direct client-side $set operations on 'versions.*.path' to prevent
      // path traversal attacks via storage migration exploits.

      // Block direct updates to version paths (the attack vector)
      const hasPathUpdate = fields.some(field => field.includes('versions') && field.includes('path'));
      if (hasPathUpdate) {
        if (process.env.DEBUG === 'true') {
          console.warn('Blocked attempt to update attachment version paths:', fields);
        }
        return false;
      }

      // Allow normal updates for file upload/management
      const allowedFields = ['name', 'size', 'type', 'extension', 'extensionWithDot', 'meta', 'versions'];
      const isAllowedField = fields.every(field => {
        // Allow field itself or nested properties like 'versions.original'
        const baseField = field.split('.')[0];
        return allowedFields.includes(baseField);
      });

      if (!isAllowedField) {
        if (process.env.DEBUG === 'true') {
          console.warn('Blocked attempt to update restricted attachment fields:', fields);
        }
        return false;
      }

      // ReadOnly users cannot update attachments
      return allowIsBoardMemberWithWriteAccess(userId, ReactiveCache.getBoard(fileObj.boardId));
    },
    remove(userId, fileObj) {
      // Additional security check: ensure the file belongs to the board the user has access to
      if (!fileObj || !fileObj.boardId) {
        if (process.env.DEBUG === 'true') {
          console.warn('Blocked attachment removal: file has no boardId');
        }
        return false;
      }

      const board = ReactiveCache.getBoard(fileObj.boardId);
      if (!board) {
        if (process.env.DEBUG === 'true') {
          console.warn('Blocked attachment removal: board not found');
        }
        return false;
      }

      // ReadOnly users cannot delete attachments
      return allowIsBoardMemberWithWriteAccess(userId, board);
    },
    fetch: ['meta', 'boardId'],
  });

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
    moveAttachmentToStorage(fileObjId, storageDestination) {
      check(fileObjId, String);
      check(storageDestination, String);

      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'You must be logged in.');
      }

      const fileObj = ReactiveCache.getAttachment(fileObjId);
      if (!fileObj) {
        throw new Meteor.Error('attachment-not-found', 'Attachment not found');
      }

      const board = ReactiveCache.getBoard(fileObj.boardId);
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
    renameAttachment(fileObjId, newName) {
      check(fileObjId, String);
      check(newName, String);

      const currentUserId = Meteor.userId();
      if (!currentUserId) {
        throw new Meteor.Error('not-authorized', 'User must be logged in');
      }

      const fileObj = ReactiveCache.getAttachment(fileObjId);
      if (!fileObj) {
        throw new Meteor.Error('file-not-found', 'Attachment not found');
      }

      // Verify the user has permission to modify this attachment
      const board = ReactiveCache.getBoard(fileObj.boardId);
      if (!board) {
        throw new Meteor.Error('board-not-found', 'Board not found');
      }

      if (!allowIsBoardMember(currentUserId, board)) {
        if (process.env.DEBUG === 'true') {
          console.warn(`Blocked unauthorized attachment rename attempt: user ${currentUserId} tried to rename attachment ${fileObjId} in board ${fileObj.boardId}`);
        }
        throw new Meteor.Error('not-authorized', 'You do not have permission to modify this attachment');
      }

      rename(fileObj, newName, fileStoreStrategyFactory);
    },
    validateAttachment(fileObjId) {
      check(fileObjId, String);

      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'You must be logged in.');
      }

      const fileObj = ReactiveCache.getAttachment(fileObjId);
      if (!fileObj) {
        throw new Meteor.Error('attachment-not-found', 'Attachment not found');
      }

      const board = ReactiveCache.getBoard(fileObj.boardId);
      if (!board || !board.isVisibleBy({ _id: this.userId })) {
        throw new Meteor.Error('not-authorized', 'You do not have access to this board.');
      }

      const isValid = Promise.await(isFileValid(fileObj, attachmentUploadMimeTypes, attachmentUploadSize, attachmentUploadExternalProgram));

      if (!isValid) {
        Attachments.remove(fileObjId);
      }
    },
    validateAttachmentAndMoveToStorage(fileObjId, storageDestination) {
      check(fileObjId, String);
      check(storageDestination, String);

      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'You must be logged in.');
      }

      const fileObj = ReactiveCache.getAttachment(fileObjId);
      if (!fileObj) {
        throw new Meteor.Error('attachment-not-found', 'Attachment not found');
      }

      const board = ReactiveCache.getBoard(fileObj.boardId);
      if (!board || !board.isVisibleBy({ _id: this.userId })) {
        throw new Meteor.Error('not-authorized', 'You do not have access to this board.');
      }

      // Allowlist storage destinations
      const allowedDestinations = ['fs', 'gridfs', 's3'];
      if (!allowedDestinations.includes(storageDestination)) {
        throw new Meteor.Error('invalid-storage-destination', 'Invalid storage destination');
      }

      Meteor.call('validateAttachment', fileObjId);

      const fileObjAfter = ReactiveCache.getAttachment(fileObjId);

      if (fileObjAfter) {
        Meteor.defer(() => Meteor.call('moveAttachmentToStorage', fileObjId, storageDestination));
      }
    },
  });

  Meteor.startup(async () => {
    await Attachments.collection.createIndexAsync({ 'meta.cardId': 1 });
    const storagePath = fileStoreStrategyFactory.storagePath;
    if (!fs.existsSync(storagePath)) {
      console.log("create storagePath because it doesn't exist: " + storagePath);
      fs.mkdirSync(storagePath, { recursive: true });
    }
  });
}

// Add backward compatibility methods - available on both client and server
Attachments.getAttachmentWithBackwardCompatibility = getAttachmentWithBackwardCompatibility;
Attachments.getAttachmentsWithBackwardCompatibility = getAttachmentsWithBackwardCompatibility;

// Override the link method to use universal URLs
if (Meteor.isClient) {
  // Override the original FilesCollection link method to use universal URLs
  // This must override the ostrio:files method to avoid "Match error: Expected plain object"
  const originalLink = Attachments.link;
  Attachments.link = function(versionName) {
    // Accept both direct calls and collection.helpers style calls
    const fileRef = this._id ? this : (versionName && versionName._id ? versionName : this);
    const version = (typeof versionName === 'string') ? versionName : 'original';

    if (fileRef && fileRef._id) {
      const url = generateUniversalAttachmentUrl(fileRef._id, version);
      if (process.env.DEBUG === 'true') {
        console.log('Attachment link generated:', url, 'for ID:', fileRef._id);
      }
      return url;
    }
    // Fallback to original if somehow we don't have an ID
    return originalLink ? originalLink.call(this, versionName) : '';
  };

  // Also add as collection helper for document instances
  Attachments.collection.helpers({
    link(version) {
      // Handle both no-argument and string argument cases
      const ver = (typeof version === 'string') ? version : 'original';
      const url = generateUniversalAttachmentUrl(this._id, ver);
      if (process.env.DEBUG === 'true') {
        console.log('Attachment link (helper) generated:', url, 'for ID:', this._id);
      }
      return url;
    }
  });
}

export default Attachments;
