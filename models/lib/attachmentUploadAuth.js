'use strict';

// UploadBleed: who may upload an attachment through Meteor-Files' own upload
// pipeline (_FilesCollectionStart_attachments / Write, and its HTTP twin).
// That pipeline inserts the stored document SERVER-side, so the collection's
// allow rules (server/permissions/attachments.js) are never asked: the only
// gate is the collection's onBeforeUpload, which used to sanitize the file
// name and return true. Any DDP client, signed in or not, could put a file on
// any card of any board - published to that board's members, with an
// addAttachment activity and its notifications - and choose its meta.boardId
// freely (StampBleed). models/attachments.server.js asks this on every chunk.
//
// Pure: the caller looks up the card and the board and asks the permission
// helpers; this decides. Returns { allow, reason, key, stamp }:
//   key   - the security catalog key to record when it is an attempt (null
//           when a legitimate user can reach the refusal, e.g. uploads off);
//   stamp - for a card attachment, the card's own board, list and swimlane,
//           written over whatever the client sent.

function uploadDecision({ userId, meta, card, mayEditCard, board, mayWriteBoard, uploadsBlocked }) {
  const m = meta && typeof meta === 'object' ? meta : {};
  if (uploadsBlocked) return { allow: false, reason: 'Uploads are turned off.', key: null };
  if (!userId) return { allow: false, reason: 'Please sign in to upload.', key: 'authz.attachment-upload' };
  if (typeof m.cardId === 'string' && m.cardId) {
    // A card deleted while its upload started is not an attempt.
    if (!card) return { allow: false, reason: 'Card not found.', key: null };
    if (!mayEditCard) return { allow: false, reason: 'You cannot add attachments to this card.', key: 'authz.attachment-upload' };
    if (typeof m.boardId === 'string' && m.boardId && m.boardId !== card.boardId) {
      return { allow: false, reason: 'You cannot add attachments to this card.', key: 'authz.card-child-stamp' };
    }
    return { allow: true, stamp: { boardId: card.boardId, listId: card.listId, swimlaneId: card.swimlaneId } };
  }
  // A board's own image (background, map): write access on that board.
  if (typeof m.boardId !== 'string' || !m.boardId || !board) {
    return { allow: false, reason: 'Board not found.', key: m.boardId ? null : 'authz.attachment-upload' };
  }
  if (!mayWriteBoard) return { allow: false, reason: 'You cannot add images to this board.', key: 'authz.attachment-upload' };
  return { allow: true, stamp: null };
}

module.exports = { uploadDecision };
