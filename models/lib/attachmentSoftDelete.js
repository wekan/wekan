'use strict';

// Attachment soft delete: the decisions, with no Meteor in them.
// Design: docs/Features/Reports/History/History.md §12.
//
// CommonJS and dependency-light on purpose, like models/lib/softDelete.js it
// builds on, so tests/attachmentSoftDelete.test.cjs can run every rule here as
// arithmetic: what a delete sets, that it unsets the cover, that a restore never
// puts the cover back, what the history rows carry, and which reads must be
// filtered to live attachments. server/attachmentSoftDelete.js applies these.

const { notDeleted, softDeleteSet, restoreModifier, isDeleted } = require('./softDelete');

// The selector every card-facing read of attachments must use (§12.1): the
// opened card's gallery and count, the minicard badge, the slideshow, the cover
// and background pickers, the API list endpoints, the exporters. `{ deletedAt:
// null }` matches documents whose field is absent, so nothing needs a backfill.
function liveAttachments(selector) {
  return notDeleted(selector);
}

// Is this attachment one a card may show?
function isLiveAttachment(attachment) {
  return !!attachment && !isDeleted(attachment);
}

// The content a lifecycle history row carries for an attachment: the filename,
// so the row reads "Removed · photo.png" with no lookup, and the deleted flag
// the applier reads back.
function attachmentHistoryContent(attachment, deleted) {
  return {
    deleted: !!deleted,
    name: (attachment && attachment.name) || '',
  };
}

// Everything a soft delete does, decided in one place (§12.1):
//   - the $set on the attachment document (deletedAt/deletedBy/deleteBatchId);
//   - whether the card's cover must be unset (only when THIS attachment is it);
//   - the history row. It is written with previousContent and NO newContent:
//     History.md §8 says Restore applies what the row shows, a removal shows
//     what it removed, and contentForDirection() falls back to previousContent
//     for a row without newContent - so Restore on the "Removed" row brings the
//     attachment back instead of deleting it again.
function softDeleteAttachmentPlan({ attachment, card, userId, batchId, at }) {
  if (!attachment) return null;
  const when = at || new Date();
  const id = batchId || `attachment-${attachment._id}-${when.getTime()}`;
  const meta = attachment.meta || {};
  return {
    alreadyDeleted: isDeleted(attachment),
    set: softDeleteSet(userId, id, when),
    batchId: id,
    unsetCover: !!(card && card.coverId && card.coverId === attachment._id),
    historyRow: {
      boardId: meta.boardId || null,
      swimlaneId: meta.swimlaneId || null,
      listId: meta.listId || null,
      cardId: meta.cardId || null,
      entityType: 'attachment',
      entityId: attachment._id,
      group: 'lifecycle',
      changeType: 'removed',
      previousContent: attachmentHistoryContent(attachment, false),
      newContent: null,
      userId,
      batchId: id,
    },
  };
}

// Everything a restore does (§12.2): drop the three bookkeeping fields, record
// the mirror row - and nothing about the cover. `resetCover` is spelled out as
// false so the test can pin the rule rather than infer it from an absence.
function restoreAttachmentPlan({ attachment, userId }) {
  if (!attachment) return null;
  const meta = attachment.meta || {};
  return {
    alreadyLive: !isDeleted(attachment),
    modifier: restoreModifier(),
    resetCover: false,
    historyRow: {
      boardId: meta.boardId || null,
      swimlaneId: meta.swimlaneId || null,
      listId: meta.listId || null,
      cardId: meta.cardId || null,
      entityType: 'attachment',
      entityId: attachment._id,
      group: 'lifecycle',
      changeType: 'added',
      previousContent: { deleted: true, deletedAt: attachment.deletedAt || null },
      newContent: attachmentHistoryContent(attachment, false),
      userId,
      batchId: attachment.deleteBatchId || null,
    },
  };
}

// The history "Restore" for an attachment row (the applier in
// server/models/changeHistory.js): what the row's content asks for. A content
// that says `deleted: false` (a removal's previousContent, a restore's
// newContent) makes the attachment live; `deleted: true` marks it deleted. The
// cover is never touched either way.
function attachmentContentAction(content) {
  if (!content || content.deleted === undefined) return null;
  return content.deleted ? 'delete' : 'restore';
}

// Which history rows offer a per-row Restore button in the card history: an
// attachment row whose attachment is currently soft-deleted. A live one has
// nothing to restore, and a row for something other than an attachment keeps
// the generic selection + Restore.
function historyRowOffersRestore(row, attachment) {
  return !!(row && row.entityType === 'attachment' && attachment && isDeleted(attachment));
}

module.exports = {
  liveAttachments,
  isLiveAttachment,
  attachmentHistoryContent,
  softDeleteAttachmentPlan,
  restoreAttachmentPlan,
  attachmentContentAction,
  historyRowOffersRestore,
};
