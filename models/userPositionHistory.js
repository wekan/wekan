import { ReactiveCache } from '/imports/reactiveCache';

/**
 * UserPositionHistory collection - Per-user history of entity movements
 * Similar to Activities but specifically for tracking position changes with undo/redo support
 */
UserPositionHistory = new Mongo.Collection('userPositionHistory');

UserPositionHistory.attachSchema(
  new SimpleSchema({
    userId: {
      /**
       * The user who made this change
       */
      type: String,
    },
    boardId: {
      /**
       * The board where the change occurred
       */
      type: String,
    },
    entityType: {
      /**
       * Type of entity: 'swimlane', 'list', or 'card'
       */
      type: String,
      allowedValues: ['swimlane', 'list', 'card', 'checklist', 'checklistItem'],
    },
    entityId: {
      /**
       * The ID of the entity that was moved
       */
      type: String,
    },
    actionType: {
      /**
       * Type of action performed
       */
      type: String,
      allowedValues: ['move', 'create', 'delete', 'restore', 'archive'],
    },
    previousState: {
      /**
       * The state before the change
       */
      type: Object,
      blackbox: true,
      optional: true,
    },
    newState: {
      /**
       * The state after the change
       */
      type: Object,
      blackbox: true,
    },
    // For easier undo operations, store specific fields
    previousSort: {
      type: Number,
      decimal: true,
      optional: true,
    },
    newSort: {
      type: Number,
      decimal: true,
      optional: true,
    },
    previousSwimlaneId: {
      type: String,
      optional: true,
    },
    newSwimlaneId: {
      type: String,
      optional: true,
    },
    previousListId: {
      type: String,
      optional: true,
    },
    newListId: {
      type: String,
      optional: true,
    },
    previousBoardId: {
      type: String,
      optional: true,
    },
    newBoardId: {
      type: String,
      optional: true,
    },
    createdAt: {
      /**
       * When this history entry was created
       */
      type: Date,
      autoValue() {
        if (this.isInsert) {
          return new Date();
        } else if (this.isUpsert) {
          return { $setOnInsert: new Date() };
        } else {
          this.unset();
        }
      },
    },
    // For savepoint/checkpoint feature
    isCheckpoint: {
      /**
       * Whether this is a user-marked checkpoint/savepoint
       */
      type: Boolean,
      defaultValue: false,
      optional: true,
    },
    checkpointName: {
      /**
       * User-defined name for the checkpoint
       */
      type: String,
      optional: true,
    },
    // For grouping related changes
    batchId: {
      /**
       * ID to group related changes (e.g., moving multiple cards at once)
       */
      type: String,
      optional: true,
    },
  }),
);

UserPositionHistory.allow({
  insert(userId, doc) {
    // Only allow users to create their own history
    return userId && doc.userId === userId;
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

UserPositionHistory.helpers({
  /**
   * Get a human-readable description of this change
   */
  getDescription() {
    const entityName = this.entityType;
    const action = this.actionType;
    
    let desc = `${action} ${entityName}`;
    
    if (this.actionType === 'move') {
      if (this.previousListId && this.newListId && this.previousListId !== this.newListId) {
        desc += ' to different list';
      } else if (this.previousSwimlaneId && this.newSwimlaneId && this.previousSwimlaneId !== this.newSwimlaneId) {
        desc += ' to different swimlane';
      } else if (this.previousSort !== this.newSort) {
        desc += ' position';
      }
    }
    
    return desc;
  },

  /**
   * Can this change be undone?
   */
  canUndo() {
    // Can undo if the entity still exists
    switch (this.entityType) {
      case 'card':
        return !!ReactiveCache.getCard(this.entityId);
      case 'list':
        return !!ReactiveCache.getList(this.entityId);
      case 'swimlane':
        return !!ReactiveCache.getSwimlane(this.entityId);
      case 'checklist':
        return !!ReactiveCache.getChecklist(this.entityId);
      case 'checklistItem':
        return !!ChecklistItems.findOne(this.entityId);
      default:
        return false;
    }
  },

  /**
   * Undo this change
   */
  undo() {
    if (!this.canUndo()) {
      throw new Meteor.Error('cannot-undo', 'Entity no longer exists');
    }

    const userId = this.userId;
    
    switch (this.entityType) {
      case 'card': {
        const card = ReactiveCache.getCard(this.entityId);
        if (card) {
          // Restore previous position
          const boardId = this.previousBoardId || card.boardId;
          const swimlaneId = this.previousSwimlaneId || card.swimlaneId;
          const listId = this.previousListId || card.listId;
          const sort = this.previousSort !== undefined ? this.previousSort : card.sort;
          
          Cards.update(card._id, {
            $set: {
              boardId,
              swimlaneId,
              listId,
              sort,
            },
          });
        }
        break;
      }
      case 'list': {
        const list = ReactiveCache.getList(this.entityId);
        if (list) {
          const sort = this.previousSort !== undefined ? this.previousSort : list.sort;
          const swimlaneId = this.previousSwimlaneId || list.swimlaneId;
          
          Lists.update(list._id, {
            $set: {
              sort,
              swimlaneId,
            },
          });
        }
        break;
      }
      case 'swimlane': {
        const swimlane = ReactiveCache.getSwimlane(this.entityId);
        if (swimlane) {
          const sort = this.previousSort !== undefined ? this.previousSort : swimlane.sort;
          
          Swimlanes.update(swimlane._id, {
            $set: {
              sort,
            },
          });
        }
        break;
      }
      case 'checklist': {
        const checklist = ReactiveCache.getChecklist(this.entityId);
        if (checklist) {
          const sort = this.previousSort !== undefined ? this.previousSort : checklist.sort;
          
          Checklists.update(checklist._id, {
            $set: {
              sort,
            },
          });
        }
        break;
      }
      case 'checklistItem': {
        const item = ChecklistItems.findOne(this.entityId);
        if (item) {
          const sort = this.previousSort !== undefined ? this.previousSort : item.sort;
          const checklistId = this.previousState?.checklistId || item.checklistId;
          
          ChecklistItems.update(item._id, {
            $set: {
              sort,
              checklistId,
            },
          });
        }
        break;
      }
    }
  },
});

if (Meteor.isServer) {
  Meteor.startup(() => {
    UserPositionHistory._collection.createIndex({ userId: 1, boardId: 1, createdAt: -1 });
    UserPositionHistory._collection.createIndex({ userId: 1, entityType: 1, entityId: 1 });
    UserPositionHistory._collection.createIndex({ userId: 1, isCheckpoint: 1 });
    UserPositionHistory._collection.createIndex({ batchId: 1 });
    UserPositionHistory._collection.createIndex({ createdAt: 1 }); // For cleanup of old entries
  });

  /**
   * Helper to track a position change
   */
  UserPositionHistory.trackChange = function(options) {
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

    return UserPositionHistory.insert(historyEntry);
  };

  /**
   * Cleanup old history entries (keep last 1000 per user per board)
   */
  UserPositionHistory.cleanup = function() {
    const users = Meteor.users.find({}).fetch();
    
    users.forEach(user => {
      const boards = Boards.find({ 'members.userId': user._id }).fetch();
      
      boards.forEach(board => {
        const history = UserPositionHistory.find(
          { userId: user._id, boardId: board._id, isCheckpoint: { $ne: true } },
          { sort: { createdAt: -1 }, limit: 1000 }
        ).fetch();
        
        if (history.length >= 1000) {
          const oldestToKeep = history[999].createdAt;
          
          // Remove entries older than the 1000th entry (except checkpoints)
          UserPositionHistory.remove({
            userId: user._id,
            boardId: board._id,
            createdAt: { $lt: oldestToKeep },
            isCheckpoint: { $ne: true },
          });
        }
      });
    });
  };

  // Run cleanup daily
  if (Meteor.settings.public?.enableHistoryCleanup !== false) {
    Meteor.setInterval(() => {
      try {
        UserPositionHistory.cleanup();
      } catch (e) {
        console.error('Error during history cleanup:', e);
      }
    }, 24 * 60 * 60 * 1000); // Once per day
  }
}

// Meteor Methods for client interaction
Meteor.methods({
  'userPositionHistory.createCheckpoint'(boardId, checkpointName) {
    check(boardId, String);
    check(checkpointName, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    
    // Create a checkpoint entry
    return UserPositionHistory.insert({
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

  'userPositionHistory.undo'(historyId) {
    check(historyId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    
    const history = UserPositionHistory.findOne({ _id: historyId, userId: this.userId });
    if (!history) {
      throw new Meteor.Error('not-found', 'History entry not found');
    }
    
    return history.undo();
  },

  'userPositionHistory.getRecent'(boardId, limit = 50) {
    check(boardId, String);
    check(limit, Number);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    
    return UserPositionHistory.find(
      { userId: this.userId, boardId },
      { sort: { createdAt: -1 }, limit: Math.min(limit, 100) }
    ).fetch();
  },

  'userPositionHistory.getCheckpoints'(boardId) {
    check(boardId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    
    return UserPositionHistory.find(
      { userId: this.userId, boardId, isCheckpoint: true },
      { sort: { createdAt: -1 } }
    ).fetch();
  },

  'userPositionHistory.restoreToCheckpoint'(checkpointId) {
    check(checkpointId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    
    const checkpoint = UserPositionHistory.findOne({ 
      _id: checkpointId, 
      userId: this.userId,
      isCheckpoint: true,
    });
    
    if (!checkpoint) {
      throw new Meteor.Error('not-found', 'Checkpoint not found');
    }
    
    // Find all changes after this checkpoint and undo them in reverse order
    const changesToUndo = UserPositionHistory.find(
      {
        userId: this.userId,
        boardId: checkpoint.boardId,
        createdAt: { $gt: checkpoint.createdAt },
        isCheckpoint: { $ne: true },
      },
      { sort: { createdAt: -1 } }
    ).fetch();
    
    let undoneCount = 0;
    changesToUndo.forEach(change => {
      try {
        if (change.canUndo()) {
          change.undo();
          undoneCount++;
        }
      } catch (e) {
        console.warn('Failed to undo change:', change._id, e);
      }
    });
    
    return { undoneCount, totalChanges: changesToUndo.length };
  },
});

export default UserPositionHistory;
