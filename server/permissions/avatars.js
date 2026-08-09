import Avatars from '/models/avatars';
import AttachmentStorageSettings from '/models/attachmentStorageSettings';
import {
  hasUnsafeClientVersionFields,
  touchesVersionFields,
  onlyTouchesAllowedFields,
} from '/models/lib/fileVersionFields';
import { tripCanary } from '/server/lib/canary';

// What an avatar's owner may change from the client. `versions` is NOT here,
// and is refused separately below so the reason can be logged: it holds the
// server-managed on-disk path.
const ALLOWED_UPDATE_FIELDS = ['name', 'size', 'type', 'extension', 'extensionWithDot', 'meta'];

function isOwner(userId, doc) {
  return userId && userId === doc.userId;
}

// Admin-level hard stop for avatar uploads (Admin Panel > Attachments >
// Transfer limits, default off). Mirrors the attachmentsUploadBlocked check in
// server/permissions/attachments.js. When blocked, only inserts (new uploads)
// are rejected; updating/removing an existing avatar still works.
async function avatarUploadsBlocked() {
  try {
    const settings = await AttachmentStorageSettings.findOneAsync({});
    return settings?.limitSettings?.avatarsUploadBlocked === true;
  } catch (error) {
    if (process.env.DEBUG === 'true') {
      console.warn('Could not read avatar upload block setting:', error);
    }
    return false;
  }
}

Avatars.allow({
  async insert(userId, doc) {
    // GHSA-4mxf-m8pq-xc9p: the same guard attachments have. `versions.*.path`
    // says where on disk the bytes are; a client that can choose it can make
    // the board exporter read any file the WeKan process can read.
    if (hasUnsafeClientVersionFields(doc)) {
      if (process.env.DEBUG === 'true') {
        console.warn('Blocked avatar insert with client-supplied versions.path/storage');
      }
      // A canary: no WeKan client sends this field, so an insert carrying it is
      // somebody trying PathBleed (docs/Security/Remediation/WeKan.md §12).
      return tripCanary('avatar.version-path', { userId });
    }

    if (await avatarUploadsBlocked()) {
      return false;
    }
    return isOwner(userId, doc);
  },
  // GHSA-4mxf-m8pq-xc9p: this used to be `update: isOwner` - the owner could
  // set ANY field, `versions.original.path` included. Being the owner is still
  // necessary, but no longer sufficient: the storage metadata is server-managed
  // and a client never writes it.
  update(userId, doc, fields) {
    if (!isOwner(userId, doc)) {
      return tripCanary('avatar.not-owner', { userId });
    }

    if (touchesVersionFields(fields)) {
      if (process.env.DEBUG === 'true') {
        console.warn('Blocked attempt to update avatar versions metadata:', fields);
      }
      return tripCanary('avatar.version-path', { userId });
    }

    if (!onlyTouchesAllowedFields(fields, ALLOWED_UPDATE_FIELDS)) {
      if (process.env.DEBUG === 'true') {
        console.warn('Blocked attempt to update restricted avatar fields:', fields);
      }
      return tripCanary('avatar.restricted-field', { userId });
    }

    return true;
  },
  remove: isOwner,
  fetch: ['userId'],
});
