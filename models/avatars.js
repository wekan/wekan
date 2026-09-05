import { Meteor } from 'meteor/meteor';
import { FilesCollection } from 'meteor/ostrio:files';
import { generateUniversalAvatarUrl } from '/models/lib/universalUrlGenerator';
const { cleanFileName } = require('/imports/lib/fileNameDisplay');

const { filesize } = require('filesize');
const getTAPi18n = () => require('/imports/i18n').TAPi18n;

let avatarsUploadSize = 72000;

// Compute storage path:
// - Docker (WRITABLE_PATH=/data): /data/files/avatars
// - Snap (WRITABLE_PATH=$SNAP_COMMON/files): $SNAP_COMMON/files/avatars
const computeAvatarStoragePath = () => {
  const basePath = process.env.WRITABLE_PATH || process.cwd();
  const endsWithFiles = basePath.endsWith('/files') || basePath.endsWith('\\files');
  if (endsWithFiles) {
    // Snap: WRITABLE_PATH already includes /files
    return basePath + '/avatars';
  } else {
    // Docker & Dev: append /files/avatars
    return basePath + '/files/avatars';
  }
};

const storagePath = Meteor.isServer ? computeAvatarStoragePath() : 'assets/app/uploads/avatars';

const Avatars = new FilesCollection({
  debug: false, // Change to `true` for debugging
  collectionName: 'avatars',
  allowClientCode: true,
  storagePath: storagePath,
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
    // Strip shell metacharacters and path-traversal sequences from the
    // user-supplied portion of the filename.  The result is used as part of
    // the on-disk path passed to external commands, so only safe characters
    // (alphanumerics, hyphens, underscores, and dots) are kept.
    const safeName = filenameWithoutExtension.replace(/[^a-zA-Z0-9_.\-]/g, '_');
    const ret = fileId + "-original-" + safeName;
    return ret;
  },
  sanitize(str, max, replacement) {
    // Strip characters that are dangerous in shell contexts and filesystem paths.
    return str.replace(/[^a-zA-Z0-9_.\-]/g, '_');
  },
  onBeforeUpload(file) {
    file.name = cleanFileName(file && file.name) || 'image';
    // Block SVG files for avatars to prevent XSS attacks
    if (file.name && file.name.toLowerCase().endsWith('.svg')) {
      if (process.env.DEBUG === 'true') {
        console.warn('Blocked SVG file upload for avatar:', file.name);
      }
      return 'SVG files are not allowed for avatars due to security reasons. Please use PNG, JPG, or GIF format.';
    }

    if (file.type === 'image/svg+xml') {
      if (process.env.DEBUG === 'true') {
        console.warn('Blocked SVG MIME type upload for avatar:', file.type);
      }
      return 'SVG files are not allowed for avatars due to security reasons. Please use PNG, JPG, or GIF format.';
    }

    if (file.size <= avatarsUploadSize && file.type.startsWith('image/')) {
      return true;
    }
    return getTAPi18n().__('avatar-too-big', {size: filesize(avatarsUploadSize)});
  },
});

function normalizeRemovedFiles(filesInput) {
  if (!filesInput) {
    return [];
  }

  if (Array.isArray(filesInput)) {
    return filesInput;
  }

  if (typeof filesInput.fetch === 'function') {
    return filesInput.fetch();
  }

  if (Array.isArray(filesInput.files)) {
    return filesInput.files;
  }

  if (typeof filesInput === 'string') {
    return Avatars.find({ _id: filesInput }).fetch();
  }

  if (filesInput && typeof filesInput === 'object') {
    if (filesInput._id && (filesInput.versions || filesInput.userId)) {
      return [filesInput];
    }

    return Avatars.find(filesInput).fetch();
  }

  return [];
}

// Export normalizeRemovedFiles and avatarsUploadSize setter for use in server file
export { normalizeRemovedFiles };

export function setAvatarsUploadSize(size) {
  avatarsUploadSize = size;
}

// Override the link method to use universal URLs
if (Meteor.isClient) {
  // Add custom link method to avatar documents
  Avatars.collection.helpers({
    link(version = 'original') {
      // Use universal URL generator for consistent, URL-agnostic URLs
      return generateUniversalAvatarUrl(this._id, version);
    }
  });
}

export default Avatars;
