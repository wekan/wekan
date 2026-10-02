'use strict';
// BackgroundBleed (2026-10-02): a board's background is one of that board's
// own attachments. Both background download APIs (the api.board.downloadBackground
// method and GET /api/attachment/download-background/:boardId) answered with
// whatever attachment board.backgroundImageId named, checking only that the
// caller is a member of the board - and a board admin could set that field to
// ANY attachment id, so anyone could create a board, point its background at
// an attachment on someone else's private board, and download it.
// Pure: tests/backgroundBleed.test.cjs.
const { isLiveAttachment } = require('./attachmentSoftDelete');

function isOwnBoardBackground(board, attachment) {
  return !!board && !!attachment && !!attachment.meta && typeof board._id === 'string' &&
    attachment.meta.boardId === board._id && isLiveAttachment(attachment);
}

module.exports = { isOwnBoardBackground };
