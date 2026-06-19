import Avatars from '/models/avatars';
import AttachmentStorageSettings from '/models/attachmentStorageSettings';

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
    if (await avatarUploadsBlocked()) {
      return false;
    }
    return isOwner(userId, doc);
  },
  update: isOwner,
  remove: isOwner,
  fetch: ['userId'],
});
