import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import UserPositionHistory from '/models/userPositionHistory';
import { ReactiveCache } from '/imports/reactiveCache';
import { ensureIndex } from '/server/lib/mongoStartup';
import { SyncedCron } from '/server/cron/syncedCron';
import { runWhenCpuLow, pauseIfBusy } from '/server/lib/cpuMonitor';

const { trimPositionHistory } = require('/models/lib/positionHistoryCleanup');

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

// Keep the newest 1000 non-checkpoint entries per user and board. Only the
// user/board pairs over the limit are visited (models/lib/positionHistoryCleanup.js,
// #6821) - not one query per board membership of every user.
UserPositionHistory.cleanup = async function({ pause } = {}) {
  return trimPositionHistory({
    overLimit: pipeline => UserPositionHistory.rawCollection()
      .aggregate(pipeline, { allowDiskUse: true }).toArray(),
    oldestKept: async ({ userId, boardId }, keep) => {
      const [entry] = await UserPositionHistory.find(
        { userId, boardId, isCheckpoint: { $ne: true } },
        { sort: { createdAt: -1 }, skip: keep - 1, limit: 1, fields: { createdAt: 1 } },
      ).fetchAsync();
      return entry ? entry.createdAt : null;
    },
    remove: ({ userId, boardId, before }) => UserPositionHistory.removeAsync({
      userId, boardId, createdAt: { $lt: before }, isCheckpoint: { $ne: true },
    }),
  }, { pause });
};

// Once a day for the whole installation, not once per WeKan process: a
// Meteor.setInterval ran it on every pod behind the database, 24 times a day
// on 24 pods (#6821). SyncedCron runs each scheduled time on one pod only, and
// the cleanup waits for a quiet CPU and pauses between pairs while it is busy.
if (Meteor.settings.public?.enableHistoryCleanup !== false) {
  Meteor.startup(() => {
    try {
      SyncedCron.add({
        name: 'wekan-position-history-cleanup',
        schedule(parser) {
          return parser.text('at 4:15 am');
        },
        job() {
          return runWhenCpuLow('position history cleanup',
            () => UserPositionHistory.cleanup({ pause: () => pauseIfBusy(100) }),
            { maxWaitMs: 55 * 60 * 1000 })
            .catch(error => console.error('Error during history cleanup:', error));
        },
      });
    } catch (e) {
      console.error('userPositionHistory: failed to register cleanup job', e);
    }
  });
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

    await requireBoardVisible(this.userId, history.boardId);

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
