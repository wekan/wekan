import Attachments from '/models/attachments';
import Boards from '/models/boards';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';

Attachments.allow({
  async insert(userId, fileObj) {
    // ReadOnly users cannot upload attachments
    return allowIsBoardMemberWithWriteAccess(userId, await Boards.findOneAsync(fileObj.meta?.boardId));
  },
  async update(userId, fileObj, fields) {
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
