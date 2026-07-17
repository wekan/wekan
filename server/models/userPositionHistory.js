import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Boards from '/models/boards';
import UserPositionHistory from '/models/userPositionHistory';
import { ReactiveCache } from '/imports/reactiveCache';
import { ensureIndex } from '/server/lib/mongoStartup';

// Reject callers who are not allowed to see the board. Mirrors the guard used
// by the sibling positionHistory.track* methods (server/methods/positionHistory.js).
// Without this, any authenticated user could create/read position-history
// checkpoints scoped to an arbitrary board they have no access to (the same
// PositionHistoryBleed class listed in the Hall of Fame).
const requireBoardVisible = async (userId, boardId) => {
  const board = await ReactiveCache.getBoard(boardId);
  if (!board || !board.isVisibleBy({ _id: userId })) {
    throw new Meteor.Error('not-authorized', 'You do not have access to this board.');
  }
};

Meteor.startup(async () => {
  await ensureIndex(UserPositionHistory, { userId: 1, boardId: 1, createdAt: -1 });
  await ensureIndex(UserPositionHistory, { userId: 1, entityType: 1, entityId: 1 });
  await ensureIndex(UserPositionHistory, { userId: 1, isCheckpoint: 1 });
  await ensureIndex(UserPositionHistory, { batchId: 1 });
  await ensureIndex(UserPositionHistory, { createdAt: 1 });
});

UserPositionHistory.trackChange = async function(options) {
  const {
    userId,
    boardId,
    entityType,
    entityId,
    actionType,
    previousState,
    newState,
    batchId,
  } = options;

  if (!userId || !boardId || !entityType || !entityId || !actionType) {
    throw new Meteor.Error('invalid-params', 'Missing required parameters');
  }

  // #6478: a NEW real change invalidates the redo stack for this user+board, so
  // an undone-then-superseded change can never be redone into stale state.
  await UserPositionHistory.removeAsync({
    userId,
    boardId,
    isCheckpoint: { $ne: true },
    undone: true,
  });

  const historyEntry = {
    userId,
    boardId,
    entityType,
    entityId,
    actionType,
    newState,
  };

  if (previousState) {
    historyEntry.previousState = previousState;
    historyEntry.previousSort = previousState.sort;
    historyEntry.previousSwimlaneId = previousState.swimlaneId;
    historyEntry.previousListId = previousState.listId;
    historyEntry.previousBoardId = previousState.boardId;
  }

  if (newState) {
    historyEntry.newSort = newState.sort;
    historyEntry.newSwimlaneId = newState.swimlaneId;
    historyEntry.newListId = newState.listId;
    historyEntry.newBoardId = newState.boardId;
  }

  if (batchId) {
    historyEntry.batchId = batchId;
  }

  return await UserPositionHistory.insertAsync(historyEntry);
};

UserPositionHistory.cleanup = async function() {
  const users = await Meteor.users.find({}, { fields: { _id: 1 } }).fetchAsync();

  for (const user of users) {
    const boards = await Boards.find({ 'members.userId': user._id }, { fields: { _id: 1 } }).fetchAsync();

    for (const board of boards) {
      const history = await UserPositionHistory.find(
        { userId: user._id, boardId: board._id, isCheckpoint: { $ne: true } },
        { sort: { createdAt: -1 }, limit: 1000 },
      ).fetchAsync();

      if (history.length >= 1000) {
        const oldestToKeep = history[999].createdAt;
        await UserPositionHistory.removeAsync({
          userId: user._id,
          boardId: board._id,
          createdAt: { $lt: oldestToKeep },
          isCheckpoint: { $ne: true },
        });
      }
    }
  }
};

if (Meteor.settings.public?.enableHistoryCleanup !== false) {
  Meteor.setInterval(() => {
    try {
      UserPositionHistory.cleanup().catch(error => {
        console.error('Error during history cleanup:', error);
      });
    } catch (e) {
      console.error('Error during history cleanup:', e);
    }
  }, 24 * 60 * 60 * 1000);
}

Meteor.methods({
  async 'userPositionHistory.createCheckpoint'(boardId, checkpointName) {
    check(boardId, String);
    check(checkpointName, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    await requireBoardVisible(this.userId, boardId);

    return await UserPositionHistory.insertAsync({
      userId: this.userId,
      boardId,
      entityType: 'checkpoint',
      entityId: 'checkpoint',
      actionType: 'create',
      isCheckpoint: true,
      checkpointName,
      newState: {
        timestamp: new Date(),
      },
    });
  },

  async 'userPositionHistory.undo'(historyId) {
    check(historyId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    const history = await UserPositionHistory.findOneAsync({ _id: historyId, userId: this.userId });
    if (!history) {
      throw new Meteor.Error('not-found', 'History entry not found');
    }

    return await history.undo();
  },

  // #6478: undo the caller's most recent position change on this board (the
  // Ctrl+Z / Undo path). Marks it undone so it can be redone until superseded.
  async 'userPositionHistory.undoLast'(boardId) {
    check(boardId, String);
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    await requireBoardVisible(this.userId, boardId);

    const [entry] = await UserPositionHistory.find(
      { userId: this.userId, boardId, isCheckpoint: { $ne: true }, undone: { $ne: true } },
      { sort: { createdAt: -1 }, limit: 1 },
    ).fetchAsync();
    if (!entry) {
      return { undone: false };
    }

    const doc = await UserPositionHistory.findOneAsync(entry._id);
    await doc.undo();
    await UserPositionHistory.updateAsync(entry._id, {
      $set: { undone: true, undoneAt: new Date() },
    });

    return { undone: true, entityType: entry.entityType, entityId: entry.entityId };
  },

  // #6478: redo the caller's most-recently-undone change on this board (Ctrl+Y).
  async 'userPositionHistory.redoLast'(boardId) {
    check(boardId, String);
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    await requireBoardVisible(this.userId, boardId);

    const [entry] = await UserPositionHistory.find(
      { userId: this.userId, boardId, isCheckpoint: { $ne: true }, undone: true },
      { sort: { undoneAt: -1 }, limit: 1 },
    ).fetchAsync();
    if (!entry) {
      return { redone: false };
    }

    const doc = await UserPositionHistory.findOneAsync(entry._id);
    await doc.redo();
    await UserPositionHistory.updateAsync(entry._id, {
      $set: { undone: false },
      $unset: { undoneAt: '' },
    });

    return { redone: true, entityType: entry.entityType, entityId: entry.entityId };
  },

  async 'userPositionHistory.getRecent'(boardId, limit = 50) {
    check(boardId, String);
    check(limit, Number);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    await requireBoardVisible(this.userId, boardId);

    return await UserPositionHistory.find(
      { userId: this.userId, boardId },
      { sort: { createdAt: -1 }, limit: Math.min(limit, 100) },
    ).fetchAsync();
  },

  async 'userPositionHistory.getCheckpoints'(boardId) {
    check(boardId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    await requireBoardVisible(this.userId, boardId);

    return await UserPositionHistory.find(
      { userId: this.userId, boardId, isCheckpoint: true },
      { sort: { createdAt: -1 } },
    ).fetchAsync();
  },

  async 'userPositionHistory.restoreToCheckpoint'(checkpointId) {
    check(checkpointId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    const checkpoint = await UserPositionHistory.findOneAsync({
      _id: checkpointId,
      userId: this.userId,
      isCheckpoint: true,
    });

    if (!checkpoint) {
      throw new Meteor.Error('not-found', 'Checkpoint not found');
    }

    // Restoring re-applies position changes to the board's entities, so the
    // caller must still be allowed to see the board (they may have been removed
    // since the checkpoint was created).
    await requireBoardVisible(this.userId, checkpoint.boardId);

    const changesToUndo = await UserPositionHistory.find(
      {
        userId: this.userId,
        boardId: checkpoint.boardId,
        createdAt: { $gt: checkpoint.createdAt },
        isCheckpoint: { $ne: true },
      },
      { sort: { createdAt: -1 } },
    ).fetchAsync();

    let undoneCount = 0;
    for (const change of changesToUndo) {
      try {
        if (await change.canUndo()) {
          await change.undo();
          undoneCount++;
        }
      } catch (e) {
        console.warn('Failed to undo change:', change._id, e);
      }
    }

    return { undoneCount, totalChanges: changesToUndo.length };
  },
});
