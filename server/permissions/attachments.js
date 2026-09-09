import Attachments, { normalizeRemovedFiles } from '/models/attachments';
import Boards from '/models/boards';
import AttachmentStorageSettings from '/models/attachmentStorageSettings';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';
// GHSA-4mxf-m8pq-xc9p: these guards used to be written out here and NOT in
// server/permissions/avatars.js, which is how avatars ended up without them.
// They live in one place now, and both collections import that one.
import {
  hasUnsafeClientVersionFields,
  touchesVersionFields,
  onlyTouchesAllowedFields,
} from '/models/lib/fileVersionFields';
import { tripCanary } from '/server/lib/canary';
import Cards from '/models/cards';
import { canEditCardOrLinkedCard } from '/server/lib/linkedCardPermission';

async function canEditAttachmentCard(userId, fileObj) {
  const cardId = fileObj?.meta?.cardId;
  if (cardId) {
    const card = await Cards.findOneAsync(cardId);
    if (card) return await canEditCardOrLinkedCard(userId, card);
  }
  return allowIsBoardMemberWithWriteAccess(
    userId,
    await Boards.findOneAsync(fileObj?.meta?.boardId),
  );
}

Attachments.allow({
  async insert(userId, fileObj) {
    // Block attempts to inject server-managed storage metadata.
    if (hasUnsafeClientVersionFields(fileObj)) {
      if (process.env.DEBUG === 'true') {
        console.warn('Blocked attachment insert with client-supplied versions.path/storage');
      }
      return tripCanary('attachment.version-path', { userId });
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
    return await canEditAttachmentCard(userId, fileObj);
  },
  async update(userId, fileObj, fields) {
    // SECURITY: The 'name' field is sanitized in onBeforeUpload and server-side methods,
    // but we block direct client-side $set operations on 'versions.*.path' to prevent
    // path traversal attacks via storage migration exploits.

    // Block direct updates to server-managed version metadata.
    if (touchesVersionFields(fields)) {
      if (process.env.DEBUG === 'true') {
        console.warn('Blocked attempt to update attachment versions metadata:', fields);
      }
      return tripCanary('attachment.version-path', { userId });
    }

    // Allow normal updates for file upload/management
    const allowedFields = ['name', 'size', 'type', 'extension', 'extensionWithDot', 'meta'];
    if (!onlyTouchesAllowedFields(fields, allowedFields)) {
      if (process.env.DEBUG === 'true') {
        console.warn('Blocked attempt to update restricted attachment fields:', fields);
      }
      return tripCanary('attachment.restricted-field', { userId });
    }

    // ReadOnly users cannot update attachments
    return await canEditAttachmentCard(userId, fileObj);
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
    return await canEditAttachmentCard(userId, fileObj);
  },
  fetch: ['meta'],
});

// Advisory: "Unauthenticated DDP Methods _FilesCollectionRemove_attachments/
// _FilesCollectionRemove_avatars Allow Instance-Wide Deletion" - ostrio:files
// registers its OWN DDP method (_FilesCollectionRemove_attachments), gated
// only by `allowClientCode` (true above); its handler never goes through the
// `Attachments.allow({remove})` rule above - that only gates the ordinary
// Mongo `.remove()` call - and calls `self.removeAsync(selector)` directly.
// With no onBeforeRemove defined at all, any anonymous DDP connection could
// call it with selector `{}` and delete every attachment record and its
// physical file on the instance. `this.userId` here is the calling DDP
// method's own userId (ostrio:files' server.js binds it before invoking this
// hook), so this runs the same board-write-access check `remove` above does,
// against every document the selector actually matches - an empty or
// non-matching selector is refused rather than treated as "nothing to check".
Attachments.onBeforeRemove = async function (cursor) {
  const userId = this.userId;
  if (!userId) {
    try {
      require('/server/lib/securityLog').record({
        key: 'authz.file-remove',
        action: 'blocked',
        source: '_FilesCollectionRemove_attachments',
        detail: 'refused an unauthenticated attachment removal',
      });
    } catch (e) { /* logging must never break the guard */ }
    return false;
  }

  const files = normalizeRemovedFiles(cursor);
  if (!files.length) {
    return false;
  }

  for (const fileObj of files) {
    if (!fileObj || !fileObj.meta?.boardId) {
      return false;
    }
    const board = await Boards.findOneAsync(fileObj.meta.boardId);
    if (!board) {
      return false;
    }
    if (!(await canEditAttachmentCard(userId, fileObj))) {
      try {
        require('/server/lib/securityLog').record({
          key: 'authz.file-remove',
          action: 'blocked',
          userId,
          source: '_FilesCollectionRemove_attachments',
          detail: 'refused removal of an attachment outside the caller\'s write access',
        });
      } catch (e) { /* logging must never break the guard */ }
      return false;
    }
  }

  return true;
};
