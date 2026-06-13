import Attachments from '/models/attachments';
import { ReactiveCache } from '/imports/reactiveCache';

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
  const isPublic = board.isPublic && board.isPublic();
  const isMember = board.hasMember && board.hasMember(this.userId);
  if (!isPublic && !isMember) {
    return this.ready();
  }
  return Attachments.collection.find({
    'meta.boardId': boardId,
    'meta.source': 'board-background',
  });
});
