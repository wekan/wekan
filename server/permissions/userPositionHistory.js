import UserPositionHistory from '/models/userPositionHistory';
import Boards from '/models/boards';

UserPositionHistory.allow({
  async insert(userId, doc) {
    if (!userId || doc.userId !== userId) return false;
    const board = await Boards.findOneAsync(doc.boardId);
    if (!board || !board.hasMember(userId)) return false;
    if (doc.previousBoardId) {
      const previousBoard = await Boards.findOneAsync(doc.previousBoardId);
      if (!previousBoard || !previousBoard.hasMember(userId)) return false;
    }
    return true;
  },
  update(userId, doc) {
    // Only allow users to update their own history (for checkpoints)
    return userId && doc.userId === userId;
  },
  remove() {
    // Don't allow removal - history is permanent
    return false;
  },
  fetch: ['userId'],
});
