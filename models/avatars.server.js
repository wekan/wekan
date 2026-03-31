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
const storagePath = path.join(process.env.WRITABLE_PATH || process.cwd(), 'files', 'avatars');

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
    const user = await ReactiveCache.getUser(fileObj.userId);
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
  const files = normalizeRemovedFiles(filesInput);

  for (const fileObj of files) {
    if (fileObj && fileObj.userId) {
      const user = await ReactiveCache.getUser(fileObj.userId);
      user.setAvatarUrl('');
    }
  }

  return true;
};

Avatars.onAfterRemove = function (filesInput) {
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
