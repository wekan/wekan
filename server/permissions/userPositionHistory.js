import UserPositionHistory from '/models/userPositionHistory';
import { tripCanary } from '/server/lib/canary';

UserPositionHistory.allow({
  insert(userId) {
    // PositionHistoryBleed, sibling (2026-10-02): history entries are recorded
    // by the server (trackChange) when a change really happens; no client
    // inserts one. Allowing it - even with board checks on boardId and
    // previousBoardId - let a member forge an entry naming any card, list or
    // checklist item by id, with any newBoardId or actionType, and then have
    // undo/redo move it into their board or soft-delete it.
    return tripCanary('history.cross-board', { userId });
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
