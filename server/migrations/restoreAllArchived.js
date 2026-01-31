/**
 * Restore All Archived Migration
 * 
 * Restores all archived swimlanes, lists, and cards.
 * If any restored items are missing swimlaneId, listId, or cardId, 
 * creates/assigns proper IDs to make them visible.
 */

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Cards from '/models/cards';
import Swimlanes from '/models/swimlanes';

class RestoreAllArchivedMigration {
  constructor() {
    this.name = 'restoreAllArchived';
    this.version = 1;
  }

  /**
   * Check if migration is needed for a board
   */
  async needsMigration(boardId) {
    try {
      const archivedSwimlanes = await ReactiveCache.getSwimlanes({ boardId, archived: true });
      const archivedLists = await ReactiveCache.getLists({ boardId, archived: true });
      const archivedCards = await ReactiveCache.getCards({ boardId, archived: true });

      return archivedSwimlanes.length > 0 || archivedLists.length > 0 || archivedCards.length > 0;
    } catch (error) {
      console.error('Error checking if restoreAllArchived migration is needed:', error);
      return false;
    }
  }

  /**
   * Execute the migration
   */
  async executeMigration(boardId) {
    try {
      const results = {
        swimlanesRestored: 0,
        listsRestored: 0,
        cardsRestored: 0,
        itemsFixed: 0,
        errors: []
      };

      const board = await ReactiveCache.getBoard(boardId);
      if (!board) {
        throw new Error('Board not found');
      }

      // Get archived items
      const archivedSwimlanes = await ReactiveCache.getSwimlanes({ boardId, archived: true });
      const archivedLists = await ReactiveCache.getLists({ boardId, archived: true });
      const archivedCards = await ReactiveCache.getCards({ boardId, archived: true });

      // Get active items for reference
      const activeSwimlanes = await ReactiveCache.getSwimlanes({ boardId, archived: false });
      const activeLists = await ReactiveCache.getLists({ boardId, archived: false });

      // Restore all archived swimlanes
      for (const swimlane of archivedSwimlanes) {
        Swimlanes.update(swimlane._id, {
          $set: {
            archived: false,
            updatedAt: new Date()
          }
        });
        results.swimlanesRestored++;

        if (process.env.DEBUG === 'true') {
          console.log(`Restored swimlane: ${swimlane.title}`);
        }
      }

      // Restore all archived lists and fix missing swimlaneId
      for (const list of archivedLists) {
        const updateFields = {
          archived: false,
          updatedAt: new Date()
        };

        // Fix missing swimlaneId
        if (!list.swimlaneId) {
          // Try to find a suitable swimlane or use default
          let targetSwimlane = activeSwimlanes.find(s => !s.archived);
          
          if (!targetSwimlane) {
            // No active swimlane found, create default
            const swimlaneId = Swimlanes.insert({
              title: TAPi18n.__('default'),
              boardId: boardId,
              sort: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
              archived: false
            });
            targetSwimlane = await ReactiveCache.getSwimlane(swimlaneId);
          }

          updateFields.swimlaneId = targetSwimlane._id;
          results.itemsFixed++;

          if (process.env.DEBUG === 'true') {
            console.log(`Fixed missing swimlaneId for list: ${list.title}`);
          }
        }

        Lists.update(list._id, {
          $set: updateFields
        });
        results.listsRestored++;

        if (process.env.DEBUG === 'true') {
          console.log(`Restored list: ${list.title}`);
        }
      }

      // Refresh lists after restoration
      const allLists = await ReactiveCache.getLists({ boardId, archived: false });
      const allSwimlanes = await ReactiveCache.getSwimlanes({ boardId, archived: false });

      // Restore all archived cards and fix missing IDs
      for (const card of archivedCards) {
        const updateFields = {
          archived: false,
          updatedAt: new Date()
        };

        let needsFix = false;

        // Fix missing listId
        if (!card.listId) {
          // Find or create a default list
          let targetList = allLists.find(l => !l.archived);
          
          if (!targetList) {
            // No active list found, create one
            const defaultSwimlane = allSwimlanes.find(s => !s.archived) || allSwimlanes[0];
            
            const listId = Lists.insert({
              title: TAPi18n.__('default'),
              boardId: boardId,
              swimlaneId: defaultSwimlane._id,
              sort: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
              archived: false
            });
            targetList = await ReactiveCache.getList(listId);
          }

          updateFields.listId = targetList._id;
          needsFix = true;
        }

        // Fix missing swimlaneId
        if (!card.swimlaneId) {
          // Try to get swimlaneId from the card's list
          if (card.listId || updateFields.listId) {
            const cardList = allLists.find(l => l._id === (updateFields.listId || card.listId));
            if (cardList && cardList.swimlaneId) {
              updateFields.swimlaneId = cardList.swimlaneId;
            } else {
              // Fall back to first available swimlane
              const defaultSwimlane = allSwimlanes.find(s => !s.archived) || allSwimlanes[0];
              updateFields.swimlaneId = defaultSwimlane._id;
            }
          } else {
            // Fall back to first available swimlane
            const defaultSwimlane = allSwimlanes.find(s => !s.archived) || allSwimlanes[0];
            updateFields.swimlaneId = defaultSwimlane._id;
          }
          needsFix = true;
        }

        if (needsFix) {
          results.itemsFixed++;

          if (process.env.DEBUG === 'true') {
            console.log(`Fixed missing IDs for card: ${card.title}`);
          }
        }

        Cards.update(card._id, {
          $set: updateFields
        });
        results.cardsRestored++;

        if (process.env.DEBUG === 'true') {
          console.log(`Restored card: ${card.title}`);
        }
      }

      return {
        success: true,
        changes: [
          `Restored ${results.swimlanesRestored} archived swimlanes`,
          `Restored ${results.listsRestored} archived lists`,
          `Restored ${results.cardsRestored} archived cards`,
          `Fixed ${results.itemsFixed} items with missing IDs`
        ],
        results
      };
    } catch (error) {
      console.error('Error executing restoreAllArchived migration:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

const restoreAllArchivedMigration = new RestoreAllArchivedMigration();

// Register Meteor methods
Meteor.methods({
  async 'restoreAllArchived.needsMigration'(boardId) {
    check(boardId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    return await restoreAllArchivedMigration.needsMigration(boardId);
  },

  async 'restoreAllArchived.execute'(boardId) {
    check(boardId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    // Check if user is board admin
    const board = await ReactiveCache.getBoard(boardId);
    if (!board) {
      throw new Meteor.Error('board-not-found', 'Board not found');
    }

    const user = await ReactiveCache.getUser(this.userId);
    if (!user) {
      throw new Meteor.Error('user-not-found', 'User not found');
    }

    // Only board admins can run migrations
    const isBoardAdmin = board.members && board.members.some(
      member => member.userId === this.userId && member.isAdmin
    );

    if (!isBoardAdmin && !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Only board administrators can run migrations');
    }

    return await restoreAllArchivedMigration.executeMigration(boardId);
  }
});

export default restoreAllArchivedMigration;
