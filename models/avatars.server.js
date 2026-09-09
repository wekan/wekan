import { ReactiveCache } from '/imports/reactiveCache';
import { Meteor } from 'meteor/meteor';
import { isFileValid } from './fileValidation';
import { createBucket } from './lib/grid/createBucket';
import fs from 'fs';
import path from 'path';
import FileStoreStrategyFactory, { FileStoreStrategyFilesystem, FileStoreStrategyGridFs, FileStoreStrategyCloud, STORAGE_NAME_FILESYSTEM, rename } from '/models/lib/fileStoreStrategy';
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
  FileStoreStrategyCloud,
  Avatars,
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

  // Detect and sanitize known exploits from the uploaded avatar IN PLACE, on the
  // local filesystem staging area and BEFORE validation or any move to final
  // storage: strip scripts, event handlers, javascript: URIs and XML
  // DOCTYPE/ENTITY (XML loop) constructs from SVG avatars, so safe SVGs are
  // accepted instead of rejected. Same general function used for attachments.
  const { sanitizeUploadedFileExploits } = require('./lib/sanitizeUploadedFile');
  if (sanitizeUploadedFileExploits(fileObj)) {
    try {
      await require('/server/lib/filenameSanitizeLog').logContentSanitized({
        fileObj, source: 'avatarUpload',
      });
    } catch (e) { /* best effort */ }
  }

  await Avatars.updateAsync({ _id: fileObj._id }, { $set: { "versions": fileObj.versions } });

  const isValid = await isFileValid(fileObj, avatarsUploadMimeTypes, avatarsUploadSize, avatarsUploadExternalProgram);

  if (isValid) {
    // Normalize + correct the stored avatar filename: URL-decode, fold confusable
    // homoglyphs, remove invisible characters, strip exploit markup, and fix the
    // extension to match the real detected file type — capped to a portable
    // length. (isFileValid already rejected exploit-looking filenames above.)
    try {
      const { sanitizeUploadFileName, sanitizationReasons } = require('./lib/uploadFileName');
      const { detectStoredFileMime } = require('./lib/fileTypeCorrection');
      const detectedMime = await detectStoredFileMime(fileObj, fileStoreStrategyFactory);
      const originalName = fileObj.name;
      const correctedName = sanitizeUploadFileName(originalName, detectedMime || fileObj.type);
      if (correctedName && correctedName !== originalName) {
        rename(fileObj, correctedName, fileStoreStrategyFactory);
        fileObj.name = correctedName;
        try {
          await require('/server/lib/filenameSanitizeLog').logFilenameSanitized({
            fileObj, source: 'avatarUpload',
            reasons: sanitizationReasons(originalName, detectedMime || fileObj.type, correctedName),
            from: originalName, to: correctedName,
          });
        } catch (e) { /* best effort */ }
      }
    } catch (error) {
      console.error('[Avatars.onAfterUpload] filename hardening failed:', error);
    }

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
    // The upload is not complete until its profile pointer is durable. Without
    // awaiting this write, Meteor-Files reports success while the old/default
    // avatar can still win the following reactive refresh (#6656).
    await user.setAvatarUrl(universalUrl);
  } else {
    await Avatars.removeAsync(fileObj._id);
  }
};

// Advisory: "Avatars Collection Lacks `protected` Callback" - ostrio:files'
// own _checkAccess (server.js) only enforces anything when `this.protected`
// is set; its constructor default is `false`, so with no callback here the
// library's own globally-registered download middleware
// (/cdn/storage/avatars/{id}/original/{name}) served every avatar to any
// anonymous caller, ahead of WeKan's own authorized route in
// server/routes/avatarServer.js and its isAuthorizedForAvatar check in
// server/routes/universalFileServer.js - both of which never ran. Mirrors
// Attachments.protected (models/attachments.server.js): an authenticated
// caller may always view an avatar; an anonymous one only when the avatar's
// owner is a member of a public board, matching avatarIsOnAPublicBoard.
Avatars.protected = async function (fileObj) {
  if (!fileObj) {
    return false;
  }
  if (this.userId) {
    return true;
  }
  const owner = fileObj.userId;
  let authorized = false;
  if (owner) {
    const publicBoard = await ReactiveCache.getBoard({
      permission: 'public',
      'members.userId': owner,
    });
    authorized = !!publicBoard;
  }
  if (!authorized) {
    // An attempt: an anonymous caller reaching this branch is asking for an
    // avatar whose owner is not on a public board - that is what an
    // enumeration/download attempt against Advisory "Avatars Collection
    // Lacks a protected Callback" looks like once the callback exists.
    try {
      require('/server/lib/securityLog').record({
        key: 'authz.avatar-protected',
        action: 'blocked',
        source: 'Avatars.protected',
        detail: 'refused an anonymous download of a non-public avatar',
      });
    } catch (e) { /* logging must never break the guard */ }
  }
  return authorized;
};

Avatars.interceptDownload = function (http, fileObj, versionName) {
  const ret = fileStoreStrategyFactory.getFileStrategy(fileObj, versionName).interceptDownload(http, this.cacheControl);
  return ret;
};

// Advisory: "Unauthenticated DDP Methods _FilesCollectionRemove_attachments/
// _FilesCollectionRemove_avatars Allow Instance-Wide Deletion" - ostrio:files
// registers its OWN DDP method (_FilesCollectionRemove_avatars), gated only
// by `allowClientCode` (true for this collection); its handler never goes
// through Avatars.allow({remove: isOwner}) in server/permissions/avatars.js
// - that only gates the ordinary Mongo `.remove()` call. This hook used to
// unconditionally `return true` (it existed only to clear the removed
// avatar's owner's profile.avatarUrl below), so any anonymous DDP connection
// could call it with selector `{}` and delete every avatar on the instance,
// blanking every user's profile.avatarUrl too. `this.userId` here is the
// calling DDP method's own userId (ostrio:files' server.js binds it before
// invoking this hook): a caller may remove their OWN avatar, or any avatar
// if they are a site admin (client/components/users/userAvatar.js's
// adminChangeAvatarSetAvatar deletes other users' avatars this way).
Avatars.onBeforeRemove = async function (filesInput) {
  const userId = this.userId;
  if (!userId) {
    try {
      require('/server/lib/securityLog').record({
        key: 'authz.file-remove',
        action: 'blocked',
        source: '_FilesCollectionRemove_avatars',
        detail: 'refused an unauthenticated avatar removal',
      });
    } catch (e) { /* logging must never break the guard */ }
    return false;
  }

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

  if (!files.length) {
    return false;
  }

  const caller = await ReactiveCache.getUser(userId);
  const callerIsAdmin = !!(caller && caller.isAdmin);
  if (!callerIsAdmin) {
    for (const fileObj of files) {
      if (!fileObj || fileObj.userId !== userId) {
        try {
          require('/server/lib/securityLog').record({
            key: 'authz.file-remove',
            action: 'blocked',
            userId,
            source: '_FilesCollectionRemove_avatars',
            detail: 'refused removal of an avatar the caller does not own',
          });
        } catch (e) { /* logging must never break the guard */ }
        return false;
      }
    }
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
