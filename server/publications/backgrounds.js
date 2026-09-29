import Attachments from '/models/attachments';
import { ReactiveCache } from '/imports/reactiveCache';
import { liveAttachments } from '/models/lib/attachmentSoftDelete';
const { readableWithoutMembership } = require('/models/lib/boardPermission');

// Publish a board's background images so the board-settings backgrounds list
// can show them. Board backgrounds are stored as board-level Attachments
// (meta.boardId set, no meta.cardId, meta.source === 'board-background').
Meteor.publish('boardBackgrounds', async function (boardId) {
  check(boardId, String);
  if (!this.userId) {
    return this.ready();
  }
  const board = await ReactiveCache.getBoard(boardId);
  if (!board) {
    return this.ready();
  }
  // Signed in (checked above), so an 'instance' board (#3249) is readable too.
  const readable = readableWithoutMembership(board.permission, true);
  const isMember = board.hasMember && board.hasMember(this.userId);
  if (!readable && !isMember) {
    return this.ready();
  }
  return Attachments.collection.find(liveAttachments({
    'meta.boardId': boardId,
    'meta.source': 'board-background',
  }));
});
