import { ReactiveCache } from '/imports/reactiveCache';
import { Meteor } from 'meteor/meteor';
import { isFileValid } from './fileValidation';
import { createBucket } from './lib/grid/createBucket';
import fs from 'fs';
import path from 'path';
import FileStoreStrategyFactory, { FileStoreStrategyFilesystem, FileStoreStrategyGridFs, STORAGE_NAME_FILESYSTEM } from '/models/lib/fileStoreStrategy';
import { generateUniversalAvatarUrl } from '/models/lib/universalUrlGenerator';
import Avatars, { normalizeRemovedFiles, setAvatarsUploadSize } from './avatars';

// ---------------------------------------------------------------------------
// Server-only configuration
// ---------------------------------------------------------------------------

let avatarsUploadExternalProgram;
let avatarsUploadMimeTypes = [];
let avatarsUploadSize = 72000;

if (process.env.AVATARS_UPLOAD_MIME_TYPES) {
  avatarsUploadMimeTypes = process.env.AVATARS_UPLOAD_MIME_TYPES.split(',');
  avatarsUploadMimeTypes = avatarsUploadMimeTypes.map(value => value.trim());
}

if (process.env.AVATARS_UPLOAD_MAX_SIZE) {
  const avatarsUploadSize_ = parseInt(process.env.AVATARS_UPLOAD_MAX_SIZE);

  if (typeof avatarsUploadSize_ === 'number' && avatarsUploadSize_ > 0) {
    avatarsUploadSize = avatarsUploadSize_;
    // Sync the upload size to the shared module for onBeforeUpload validation
    setAvatarsUploadSize(avatarsUploadSize);
  }
}

if (process.env.AVATARS_UPLOAD_EXTERNAL_PROGRAM) {
  avatarsUploadExternalProgram = process.env.AVATARS_UPLOAD_EXTERNAL_PROGRAM;

  if (!avatarsUploadExternalProgram.includes("{file}")) {
    avatarsUploadExternalProgram = undefined;
  }
}

const avatarsBucket = createBucket('avatars');

// Compute storage path:
// - Docker (WRITABLE_PATH=/data): /data/files/avatars
// - Snap (WRITABLE_PATH=$SNAP_COMMON/files): $SNAP_COMMON/files/avatars
const basePath = process.env.WRITABLE_PATH || process.cwd();
const endsWithFiles = basePath.endsWith('/files') || basePath.endsWith('\\files');
const storagePath = endsWithFiles
  ? path.join(basePath, 'avatars')
  : path.join(basePath, 'files', 'avatars');

// ---------------------------------------------------------------------------
// File store strategy factory
// ---------------------------------------------------------------------------

export const fileStoreStrategyFactory = new FileStoreStrategyFactory(
  FileStoreStrategyFilesystem, storagePath,
  FileStoreStrategyGridFs, avatarsBucket,
);

// ---------------------------------------------------------------------------
// Assign server-only FilesCollection callbacks
// ---------------------------------------------------------------------------

Avatars.storagePath = function () {
  return fileStoreStrategyFactory.storagePath;
};

Avatars.onAfterUpload = async function (fileObj) {
  // current storage is the filesystem, update object and database
  Object.keys(fileObj.versions).forEach(versionName => {
    fileObj.versions[versionName].storage = STORAGE_NAME_FILESYSTEM;
  });

  await Avatars.updateAsync({ _id: fileObj._id }, { $set: { "versions": fileObj.versions } });

  const isValid = await isFileValid(fileObj, avatarsUploadMimeTypes, avatarsUploadSize, avatarsUploadExternalProgram);

  if (isValid) {
    // Set avatar URL using universal URL generator (URL-agnostic)
    const universalUrl = generateUniversalAvatarUrl(fileObj._id);

    // Check if this is an admin uploading for another user
    let targetUserId = fileObj.userId;
    if (fileObj.meta && fileObj.meta.adminUploadForUserId) {
      // Verify the uploader is an admin
      const uploader = await Meteor.users.findOneAsync(fileObj.userId);
      if (uploader && uploader.isAdmin) {
        targetUserId = fileObj.meta.adminUploadForUserId;
        // Update the file to belong to the target user
        await Avatars.updateAsync({ _id: fileObj._id }, { $set: { userId: targetUserId } });
      }
    }

    const user = await ReactiveCache.getUser(targetUserId);
    user.setAvatarUrl(universalUrl);
  } else {
    await Avatars.removeAsync(fileObj._id);
  }
};

Avatars.interceptDownload = function (http, fileObj, versionName) {
  const ret = fileStoreStrategyFactory.getFileStrategy(fileObj, versionName).interceptDownload(http, this.cacheControl);
  return ret;
};

Avatars.onBeforeRemove = async function (filesInput) {
  let files;
  try {
    files = normalizeRemovedFiles(filesInput);
    // If normalizeRemovedFiles returns a Promise (from async fetch), await it
    if (files && typeof files.then === 'function') {
      console.warn('normalizeRemovedFiles returned a Promise, awaiting it');
      files = await files;
    }
  } catch (e) {
    console.error('Error normalizing removed files:', e, 'filesInput:', filesInput);
    files = [];
  }

  // Ensure files is an array
  if (!Array.isArray(files)) {
    console.error('normalizeRemovedFiles did not return an array, got:', typeof files);
    files = [];
  }

  for (const fileObj of files) {
    if (fileObj && fileObj.userId) {
      const user = await ReactiveCache.getUser(fileObj.userId);
      if (user) {
        await user.setAvatarUrl('');
      }
    }
  }

  return true;
};

Avatars.onAfterRemove = async function (filesInput) {
  let files;
  try {
    files = normalizeRemovedFiles(filesInput);
    // If normalizeRemovedFiles returns a Promise (from async fetch), await it
    if (files && typeof files.then === 'function') {
      console.warn('normalizeRemovedFiles returned a Promise in onAfterRemove, awaiting it');
      files = await files;
    }
  } catch (e) {
    console.error('Error normalizing removed files in onAfterRemove:', e, 'filesInput:', filesInput);
    files = [];
  }

  // Ensure files is an array
  if (!Array.isArray(files)) {
    console.error('normalizeRemovedFiles did not return an array in onAfterRemove, got:', typeof files);
    files = [];
  }

  files.forEach(fileObj => {
    if (!fileObj || !fileObj.versions) {
      return;
    }

    Object.keys(fileObj.versions).forEach(versionName => {
      fileStoreStrategyFactory.getFileStrategy(fileObj, versionName).onAfterRemove();
    });
  });
};

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

Meteor.startup(() => {
  const sp = fileStoreStrategyFactory.storagePath;
  if (!fs.existsSync(sp)) {
    console.log("create storagePath because it doesn't exist: " + sp);
    fs.mkdirSync(sp, { recursive: true });
  }
});
