import { Meteor } from 'meteor/meteor';
import { FilesCollection } from 'meteor/ostrio:files';
import { generateUniversalAttachmentUrl } from '/models/lib/universalUrlGenerator';

// Pure helper: build the activity document for a newly added attachment.
// Kept side-effect free so it can be unit tested without a database.
// Mirrors the shape used for the 'deleteAttachment' activity, so card
// history rendering and member/subscriber notifications behave identically.
// see #5905
export function buildAttachmentAddedActivity(fileObj) {
  const meta = (fileObj && fileObj.meta) || {};
  return {
    userId: fileObj && fileObj.userId,
    type: 'card',
    activityType: 'addAttachment',
    attachmentId: fileObj && fileObj._id,
    // preserve the name so notifications stay meaningful even after removal
    attachmentName: fileObj && fileObj.name,
    boardId: meta.boardId,
    cardId: meta.cardId,
    listId: meta.listId,
    swimlaneId: meta.swimlaneId,
  };
}

// XXX Enforce a schema for the Attachments FilesCollection
// see: https://github.com/VeliovGroup/Meteor-Files/wiki/Schema

// Compute storage path:
// - Docker (WRITABLE_PATH=/data): /data/files/attachments
// - Snap (WRITABLE_PATH=$SNAP_COMMON/files): $SNAP_COMMON/files/attachments
const computeAttachmentStoragePath = () => {
  const basePath = process.env.WRITABLE_PATH || process.cwd();
  const endsWithFiles = basePath.endsWith('/files') || basePath.endsWith('\\files');
  if (endsWithFiles) {
    // Snap: WRITABLE_PATH already includes /files
    return basePath + '/attachments';
  } else {
    // Docker & Dev: append /files/attachments
    return basePath + '/files/attachments';
  }
};

const storagePath = Meteor.isServer ? computeAttachmentStoragePath() : 'assets/app/uploads/attachments';

const Attachments = new FilesCollection({
  debug: false,
  collectionName: 'attachments',
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
  onBeforeUpload(file) {
    // SECURITY: Sanitize filename to prevent path traversal attacks
    if (file.name && typeof file.name === 'string') {
      // Strip directory components (client-safe alternative to path.basename)
      let safeName = file.name.split(/[\\/]/).pop();
      // Remove null bytes
      safeName = safeName.replace(/\0/g, '');
      // Remove path traversal sequences (repeat until stable to avoid incomplete multi-character sanitization)
      let previousSafeName;
      do {
        previousSafeName = safeName;
        safeName = safeName.replace(/\.\.[\\/]/g, '');
      } while (safeName !== previousSafeName);
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
    return Attachments.find({ _id: filesInput }).fetch();
  }

  if (filesInput && typeof filesInput === 'object') {
    if (filesInput._id && (filesInput.versions || filesInput.meta)) {
      return [filesInput];
    }

    return Attachments.find(filesInput).fetch();
  }

  return [];
}

// Export normalizeRemovedFiles for use in server file
export { normalizeRemovedFiles };

// Backward compatibility stubs (overridden in attachments.server.js with real implementations)
Attachments.getAttachmentWithBackwardCompatibility = async () => null;
Attachments.getAttachmentsWithBackwardCompatibility = async () => [];

// Override Attachments.link to use universal short URLs and to bypass
// the `check(fileRef, Object)` inside the original which fails when fileRef is
// a collection-helpers class instance (not a plain object).
// Uses short URL format handled by universalFileServer.js.
if (Meteor.isClient) {
  Attachments.link = function () {
    let fileRef;
    if (this && this._id) {
      // Called as instance method: doc.link(version)
      fileRef = this;
    } else if (arguments[0] && arguments[0]._id) {
      // Called as static from FileCursor: Attachments.link(fileRef, version)
      fileRef = arguments[0];
    } else {
      return '';
    }
    return generateUniversalAttachmentUrl(fileRef._id);
  };
}

// #5905: Notify card members/subscribers and record card history when a new
// attachment is uploaded. The 'deleteAttachment' activity is already created
// (via the store strategy's onAfterRemove during file removal), but the matching
// 'addAttachment' activity was never created during the upload flow. Create it
// here with a server-side collection insert hook, mirroring the original
// behaviour. The generic Activities after.insert hook (server/models/activities.js)
// then notifies card members + watchers, deduplicated, exactly as it does for
// every other card activity.
if (Meteor.isServer) {
  Attachments.collection.after.insert((userId, doc) => {
    // Skip attachments created during a board/card import: those are not
    // user-driven uploads and should not generate notifications.
    if (doc.meta && doc.meta.source === 'import') {
      return;
    }
    // Lazy import to keep this out of the client bundle.
    const Activities = require('/models/activities').default;
    Activities.insertAsync(buildAttachmentAddedActivity(doc)).catch(error => {
      console.error('Failed to insert addAttachment activity:', error);
    });
  });
}

export default Attachments;
