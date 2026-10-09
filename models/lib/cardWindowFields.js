'use strict';

// #6745: which fields the lazy card window (server/publications/cardsWindow.js)
// reads and sends. Pure, so tests/largeBoardDataLoading.test.cjs runs it
// without Meteor.

// The fields a window's MEMBERSHIP observer keeps per card: the sort keys, so
// a re-order still re-reads the window. Every other field of every card in the
// list used to be held by that observer - one full copy of the list per
// window. Accepts both sort forms Meteor takes: `{ field: 1 }` and
// `[['field', 'asc']]` / `['field']`. `_id` is always there.
function windowOrderFields(sort) {
  const fields = { _id: 1 };
  const keys = Array.isArray(sort)
    ? sort.map(entry => (Array.isArray(entry) ? entry[0] : entry))
    : Object.keys(sort && typeof sort === 'object' ? sort : {});
  for (const key of keys) {
    // A sort key is a plain (possibly dotted) field name; anything else - an
    // operator, an empty string - is not a field and is not projected.
    if (typeof key === 'string' && key && !key.startsWith('$')) fields[key] = 1;
  }
  return fields;
}

// The comment fields a MINICARD reads: that the comment exists and when it was
// written (the count and the unread highlight, models/lib/unreadComments.js),
// plus who wrote it. The text only when the board shows the latest comments
// on its minicards (allowsCommentsOnMinicard). An opened card reads all of its
// own comments' fields from the `openCardData` publication.
const MINICARD_COMMENT_FIELDS = Object.freeze({
  boardId: 1,
  cardId: 1,
  userId: 1,
  createdAt: 1,
  modifiedAt: 1,
});

function windowCommentFields(board) {
  const fields = { ...MINICARD_COMMENT_FIELDS };
  if (board && board.allowsCommentsOnMinicard) fields.text = 1;
  return fields;
}

module.exports = { windowOrderFields, windowCommentFields, MINICARD_COMMENT_FIELDS };
