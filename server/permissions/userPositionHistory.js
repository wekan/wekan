import UserPositionHistory from '/models/userPositionHistory';
import Boards from '/models/boards';
import { tripCanary } from '/server/lib/canary';

UserPositionHistory.allow({
  async insert(userId, doc) {
    if (!userId || doc.userId !== userId) {
      return tripCanary('history.cross-board', { userId });
    }
    const board = await Boards.findOneAsync(doc.boardId);
    if (!board || !board.hasMember(userId)) {
      return tripCanary('history.cross-board', { userId });
    }
    if (doc.previousBoardId) {
      const previousBoard = await Boards.findOneAsync(doc.previousBoardId);
      if (!previousBoard || !previousBoard.hasMember(userId)) {
        return tripCanary('history.cross-board', { userId });
      }
    }
    return true;
  },
  update(userId) {
    // Server-side checkpoint updates bypass allow rules. A client must never be
    // able to rewrite a trusted undo destination after insert validation.
    return tripCanary('history.cross-board', { userId });
  },
  remove() {
    // Don't allow removal - history is permanent
    return false;
  },
  fetch: ['userId'],
});
