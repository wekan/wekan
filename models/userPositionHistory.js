import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from '/imports/simpleSchema';
import { ReactiveCache } from '/imports/reactiveCache';
import Boards from '/models/boards';
import Cards from '/models/cards';
import ChecklistItems from '/models/checklistItems';
import Checklists from '/models/checklists';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';

/**
 * UserPositionHistory collection - Per-user history of entity movements
 * Similar to Activities but specifically for tracking position changes with undo/redo support
 */
const UserPositionHistory = new Mongo.Collection('userPositionHistory');

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
      optional: true,
    },
    newSort: {
      type: Number,
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
    // #6478 undo/redo stack: a change that has been undone can be redone until a
    // NEW change is recorded (which clears the redo stack). undoneAt orders the
    // redo stack (most-recently-undone is redone first).
    undone: {
      type: Boolean,
      defaultValue: false,
      optional: true,
    },
    undoneAt: {
      type: Date,
      optional: true,
    },
  }),
);

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
  async canUndo() {
    // Can undo if the entity still exists
    switch (this.entityType) {
      case 'card':
        return !!(await ReactiveCache.getCard(this.entityId));
      case 'list':
        return !!(await ReactiveCache.getList(this.entityId));
      case 'swimlane':
        return !!(await ReactiveCache.getSwimlane(this.entityId));
      case 'checklist':
        return !!(await ReactiveCache.getChecklist(this.entityId));
      case 'checklistItem':
        return !!(await ChecklistItems.findOneAsync(this.entityId));
      default:
        return false;
    }
  },

  /**
   * Soft-delete apply/undo helper (docs/Features/Undo/Undo.md). Marks
   * (`deleted=true`) or restores (`deleted=false`) the entity AND its cascade,
   * using the history entry's `batchId` as the canonical group so repeated
   * undo/redo cycles stay consistent. v1 wires lists (+ their cards); other entity
   * types are no-ops here (their delete paths are not yet soft).
   */
  async _applyDeleted(deleted) {
    if (this.entityType !== 'list') return;
    const list = await ReactiveCache.getList(this.entityId);
    if (!list) return;
    const batchId = this.batchId || list.deleteBatchId || this.entityId;

    if (deleted) {
      const at = new Date();
      const set = { deletedAt: at, deleteBatchId: batchId };
      if (this.userId) set.deletedBy = this.userId;
      await Lists.updateAsync(list._id, { $set: set });
      // Re-mark the list's currently-live cards under the canonical batch.
      await Cards.updateAsync(
        { listId: list._id, boardId: list.boardId, deletedAt: null },
        { $set: set },
        { multi: true },
      );
    } else {
      // Restore: $unset all three fields (setting a Date to null trips schema).
      const unset = { $unset: { deletedAt: '', deletedBy: '', deleteBatchId: '' } };
      await Lists.updateAsync(list._id, unset);
      await Cards.updateAsync({ deleteBatchId: batchId }, unset, { multi: true });
    }
  },

  /**
   * Undo this change
   */
  async undo() {
    if (!(await this.canUndo())) {
      throw new Meteor.Error('cannot-undo', 'Entity no longer exists');
    }

    // Soft delete: undo of a 'delete' RESTORES the entity (+ batch); undo of a
    // 'restore' re-deletes it. (docs/Features/Undo/Undo.md)
    if (this.actionType === 'delete') {
      await this._applyDeleted(false);
      return;
    }
    if (this.actionType === 'restore') {
      await this._applyDeleted(true);
      return;
    }

    const userId = this.userId;

    switch (this.entityType) {
      case 'card': {
        const card = await ReactiveCache.getCard(this.entityId);
        if (card) {
          // Restore previous position
          const boardId = this.previousBoardId || card.boardId;
          const swimlaneId = this.previousSwimlaneId || card.swimlaneId;
          const listId = this.previousListId || card.listId;
          const sort = this.previousSort !== undefined ? this.previousSort : card.sort;

          await Cards.updateAsync(card._id, {
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
        const list = await ReactiveCache.getList(this.entityId);
        if (list) {
          const sort = this.previousSort !== undefined ? this.previousSort : list.sort;
          const swimlaneId = this.previousSwimlaneId || list.swimlaneId;

          await Lists.updateAsync(list._id, {
            $set: {
              sort,
              swimlaneId,
            },
          });
        }
        break;
      }
      case 'swimlane': {
        const swimlane = await ReactiveCache.getSwimlane(this.entityId);
        if (swimlane) {
          const sort = this.previousSort !== undefined ? this.previousSort : swimlane.sort;

          await Swimlanes.updateAsync(swimlane._id, {
            $set: {
              sort,
            },
          });
        }
        break;
      }
      case 'checklist': {
        const checklist = await ReactiveCache.getChecklist(this.entityId);
        if (checklist) {
          const sort = this.previousSort !== undefined ? this.previousSort : checklist.sort;

          await Checklists.updateAsync(checklist._id, {
            $set: {
              sort,
            },
          });
        }
        break;
      }
      case 'checklistItem': {
        if (typeof ChecklistItems !== 'undefined') {
          const item = await ChecklistItems.findOneAsync(this.entityId);
          if (item) {
            const sort = this.previousSort !== undefined ? this.previousSort : item.sort;
            const checklistId = this.previousState?.checklistId || item.checklistId;

            await ChecklistItems.updateAsync(item._id, {
              $set: {
                sort,
                checklistId,
              },
            });
          }
        }
        break;
      }
    }
  },

  /**
   * #6478: Redo this change — re-apply the NEW position after an undo. Mirrors
   * undo() but restores the new* fields instead of the previous* ones.
   */
  async redo() {
    if (!(await this.canUndo())) {
      throw new Meteor.Error('cannot-redo', 'Entity no longer exists');
    }

    // Soft delete: redo of a 'delete' re-deletes; redo of a 'restore' restores.
    if (this.actionType === 'delete') {
      await this._applyDeleted(true);
      return;
    }
    if (this.actionType === 'restore') {
      await this._applyDeleted(false);
      return;
    }

    switch (this.entityType) {
      case 'card': {
        const card = await ReactiveCache.getCard(this.entityId);
        if (card) {
          await Cards.updateAsync(card._id, {
            $set: {
              boardId: this.newBoardId || card.boardId,
              swimlaneId: this.newSwimlaneId || card.swimlaneId,
              listId: this.newListId || card.listId,
              sort: this.newSort !== undefined ? this.newSort : card.sort,
            },
          });
        }
        break;
      }
      case 'list': {
        const list = await ReactiveCache.getList(this.entityId);
        if (list) {
          await Lists.updateAsync(list._id, {
            $set: {
              sort: this.newSort !== undefined ? this.newSort : list.sort,
              swimlaneId: this.newSwimlaneId || list.swimlaneId,
            },
          });
        }
        break;
      }
      case 'swimlane': {
        const swimlane = await ReactiveCache.getSwimlane(this.entityId);
        if (swimlane) {
          await Swimlanes.updateAsync(swimlane._id, {
            $set: { sort: this.newSort !== undefined ? this.newSort : swimlane.sort },
          });
        }
        break;
      }
      case 'checklist': {
        const checklist = await ReactiveCache.getChecklist(this.entityId);
        if (checklist) {
          await Checklists.updateAsync(checklist._id, {
            $set: { sort: this.newSort !== undefined ? this.newSort : checklist.sort },
          });
        }
        break;
      }
      case 'checklistItem': {
        if (typeof ChecklistItems !== 'undefined') {
          const item = await ChecklistItems.findOneAsync(this.entityId);
          if (item) {
            await ChecklistItems.updateAsync(item._id, {
              $set: { sort: this.newSort !== undefined ? this.newSort : item.sort },
            });
          }
        }
        break;
      }
    }
  },
});

export default UserPositionHistory;
