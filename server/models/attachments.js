import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { DDP } from 'meteor/ddp';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';
import { publicErrorData } from '/server/lib/apiResponseHelpers';
import Attachments from '/models/attachments';

// REST API for the attachment soft delete (docs/Features/Reports/History/
// History.md §12). Every write here goes through the SAME Meteor methods the
// card and the card history use - `attachments.softDelete` and
// `attachments.restore` in server/attachmentSoftDelete.js - run as the
// request's user, so the permission check, the cover unset, the activity and
// the history row are the ones the UI gets. Nothing here hard-deletes: the one
// hard delete of attachments is the archived-board purge (§12.4).

// The raw collection, not ReactiveCache.getAttachment(): that one falls back to
// the legacy CollectionFS lookup, and a soft-deleted document must be found as
// itself, deletedAt and all.
async function attachmentOfBoard(attachmentId, boardId) {
  return Attachments.collection.findOneAsync({
    _id: attachmentId,
    'meta.boardId': boardId,
  });
}

function callAsUser(userId, name, ...args) {
  return DDP._CurrentMethodInvocation.withValue(
    { userId },
    async () => Meteor.callAsync(name, ...args),
  );
}

function serializeDeleted(attachment) {
  return {
    attachmentId: attachment._id,
    attachmentName: attachment.name,
    attachmentType: attachment.type,
    boardId: attachment.meta.boardId,
    swimlaneId: attachment.meta.swimlaneId,
    listId: attachment.meta.listId,
    cardId: attachment.meta.cardId,
    deletedAt: attachment.deletedAt,
    deletedBy: attachment.deletedBy,
    deleteBatchId: attachment.deleteBatchId,
  };
}

/**
 * @operation get_board_deleted_attachments
 * @tag Attachments
 * @summary Get the soft-deleted attachments of a board
 *
 * @description Deleting an attachment from a card is a soft delete: the file
 * is kept, the card hides it, and the card history can restore it. This lists
 * the attachments of a board that are currently deleted, with who deleted each
 * and when, so a script can find one to restore. The live attachments are at
 * `GET /api/boards/:boardId/attachments`. Requires board access.
 *
 * @param {string} boardId the board ID
 * @return_type [{attachmentId: string, attachmentName: string, attachmentType: string, boardId: string, swimlaneId: string, listId: string, cardId: string, deletedAt: string, deletedBy: string, deleteBatchId: string}]
 */
WebApp.handlers.get('/api/boards/:boardId/attachments/deleted', async function(req, res) {
  try {
    const paramBoardId = req.params.boardId;
    await Authentication.checkBoardAccess(req.userId, paramBoardId);
    const deleted = await Attachments.collection
      .find({ 'meta.boardId': paramBoardId, deletedAt: { $ne: null } })
      .fetchAsync();
    sendJsonResult(res, { code: 200, data: deleted.map(serializeDeleted) });
  } catch (error) {
    sendJsonResult(res, publicErrorData(error));
  }
});

/**
 * @operation delete_board_attachment
 * @tag Attachments
 * @summary Soft-delete an attachment
 *
 * @description The same "Delete" the card offers: the attachment gets
 * `deletedAt`, `deletedBy` and `deleteBatchId`, its file is kept, the card and
 * the minicard badge hide it, its cover is unset if it was the card's cover,
 * and the card history records who deleted it. Restore it with
 * `POST /api/boards/:boardId/attachments/:attachmentId/restore`. There is no
 * hard delete of a single attachment over the API. Requires permission to
 * edit the card the attachment is on (or write access to the board for a
 * board-level attachment). Idempotent: an already-deleted attachment is left
 * as it is.
 *
 * @param {string} boardId the board ID
 * @param {string} attachmentId the attachment ID
 * @return_type {deleted: boolean, batchId: string}
 */
WebApp.handlers.delete('/api/boards/:boardId/attachments/:attachmentId', async function(req, res) {
  try {
    Authentication.checkLoggedIn(req.userId);
    const attachment = await attachmentOfBoard(req.params.attachmentId, req.params.boardId);
    if (!attachment) {
      sendJsonResult(res, { code: 404, data: { error: 'Attachment not found' } });
      return;
    }
    const result = await callAsUser(req.userId, 'attachments.softDelete', attachment._id);
    sendJsonResult(res, { code: 200, data: result });
  } catch (error) {
    sendJsonResult(res, publicErrorData(error));
  }
});

/**
 * @operation restore_board_attachment
 * @tag Attachments
 * @summary Restore a soft-deleted attachment
 *
 * @description The card history's Restore for an attachment row: clears the
 * delete mark so the card, its attachment count and the minicard badge include
 * the attachment again, and records the restore in the card history. The
 * cover is never re-set by a restore. Requires the same permission as
 * deleting. Idempotent: `restored` is false for an attachment that is not
 * deleted.
 *
 * @param {string} boardId the board ID
 * @param {string} attachmentId the attachment ID
 * @return_type {restored: boolean}
 */
WebApp.handlers.post('/api/boards/:boardId/attachments/:attachmentId/restore', async function(req, res) {
  try {
    Authentication.checkLoggedIn(req.userId);
    const attachment = await attachmentOfBoard(req.params.attachmentId, req.params.boardId);
    if (!attachment) {
      sendJsonResult(res, { code: 404, data: { error: 'Attachment not found' } });
      return;
    }
    const result = await callAsUser(req.userId, 'attachments.restore', attachment._id);
    sendJsonResult(res, { code: 200, data: result });
  } catch (error) {
    sendJsonResult(res, publicErrorData(error));
  }
});
