import Attachments from '/models/attachments';
import Boards from '/models/boards';
import AttachmentStorageSettings from '/models/attachmentStorageSettings';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';

function hasUnsafeClientVersionFields(fileObj) {
  const versions = fileObj?.versions;
  if (!versions || typeof versions !== 'object') {
    return false;
  }

  return Object.values(versions).some((version) => {
    if (!version || typeof version !== 'object') {
      return false;
    }

    // Path and storage are internal server-managed metadata.
    return Object.prototype.hasOwnProperty.call(version, 'path') ||
      Object.prototype.hasOwnProperty.call(version, 'storage');
  });
}

Attachments.allow({
  async insert(userId, fileObj) {
    // Block attempts to inject server-managed storage metadata.
    if (hasUnsafeClientVersionFields(fileObj)) {
      if (process.env.DEBUG === 'true') {
        console.warn('Blocked attachment insert with client-supplied versions.path/storage');
      }
      return false;
    }

    // Admin-level hard stop for all non-API attachment uploads.
    try {
      const settings = await AttachmentStorageSettings.findOneAsync({});
      if (settings?.limitSettings?.attachmentsUploadBlocked === true) {
        return false;
      }
    } catch (error) {
      if (process.env.DEBUG === 'true') {
        console.warn('Could not read attachment upload block setting:', error);
      }
    }

    // ReadOnly users cannot upload attachments
    return allowIsBoardMemberWithWriteAccess(userId, await Boards.findOneAsync(fileObj.meta?.boardId));
  },
  async update(userId, fileObj, fields) {
    // SECURITY: The 'name' field is sanitized in onBeforeUpload and server-side methods,
    // but we block direct client-side $set operations on 'versions.*.path' to prevent
    // path traversal attacks via storage migration exploits.

    // Block direct updates to server-managed version metadata.
    const touchesVersions = fields.some(field => field === 'versions' || field.startsWith('versions.'));
    if (touchesVersions) {
      if (process.env.DEBUG === 'true') {
        console.warn('Blocked attempt to update attachment versions metadata:', fields);
      }
      return false;
    }

    // Allow normal updates for file upload/management
    const allowedFields = ['name', 'size', 'type', 'extension', 'extensionWithDot', 'meta'];
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
    return allowIsBoardMemberWithWriteAccess(userId, await Boards.findOneAsync(fileObj.meta?.boardId));
  },
  async remove(userId, fileObj) {
    // Additional security check: ensure the file belongs to the board the user has access to
    if (!fileObj || !fileObj.meta?.boardId) {
      if (process.env.DEBUG === 'true') {
        console.warn('Blocked attachment removal: file has no boardId');
      }
      return false;
    }

    const board = await Boards.findOneAsync(fileObj.meta?.boardId);
    if (!board) {
      if (process.env.DEBUG === 'true') {
        console.warn('Blocked attachment removal: board not found');
      }
      return false;
    }

    // ReadOnly users cannot delete attachments
    return allowIsBoardMemberWithWriteAccess(userId, board);
  },
  fetch: ['meta'],
});
