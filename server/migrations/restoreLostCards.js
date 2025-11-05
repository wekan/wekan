/**
 * Restore Lost Cards Migration
 * 
 * Finds and restores cards and lists that have missing swimlaneId, listId, or are orphaned.
 * Creates a "Lost Cards" swimlane and restores visibility of lost items.
 * Only processes non-archived items.
 */

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Cards from '/models/cards';
import Swimlanes from '/models/swimlanes';

class RestoreLostCardsMigration {
  constructor() {
    this.name = 'restoreLostCards';
    this.version = 1;
  }

  /**
   * Check if migration is needed for a board
   */
  needsMigration(boardId) {
    try {
      const cards = ReactiveCache.getCards({ boardId, archived: false });
      const lists = ReactiveCache.getLists({ boardId, archived: false });

      // Check for cards missing swimlaneId or listId
      const lostCards = cards.filter(card => !card.swimlaneId || !card.listId);
      if (lostCards.length > 0) {
        return true;
      }

      // Check for lists missing swimlaneId
      const lostLists = lists.filter(list => !list.swimlaneId);
      if (lostLists.length > 0) {
        return true;
      }

      // Check for orphaned cards (cards whose list doesn't exist)
      for (const card of cards) {
        if (card.listId) {
          const listExists = lists.some(list => list._id === card.listId);
          if (!listExists) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking if restoreLostCards migration is needed:', error);
      return false;
    }
  }

  /**
   * Execute the migration
   */
  async executeMigration(boardId) {
    try {
      const results = {
        lostCardsSwimlaneCreated: false,
        cardsRestored: 0,
        listsRestored: 0,
        errors: []
      };

      const board = ReactiveCache.getBoard(boardId);
      if (!board) {
        throw new Error('Board not found');
      }

      // Get all non-archived items
      const cards = ReactiveCache.getCards({ boardId, archived: false });
      const lists = ReactiveCache.getLists({ boardId, archived: false });
      const swimlanes = ReactiveCache.getSwimlanes({ boardId, archived: false });

      // Detect items to restore BEFORE creating anything
      const lostLists = lists.filter(list => !list.swimlaneId);
      const lostCards = cards.filter(card => !card.swimlaneId || !card.listId);
      const orphanedCards = cards.filter(card => card.listId && !lists.some(list => list._id === card.listId));

      const hasCardsWork = lostCards.length > 0 || orphanedCards.length > 0;
      const hasListsWork = lostLists.length > 0;
      const hasAnyWork = hasCardsWork || hasListsWork;

      if (!hasAnyWork) {
        // Nothing to restore; do not create swimlane or list
        return {
          success: true,
          changes: [
            'No lost swimlanes, lists, or cards to restore'
          ],
          results: {
            lostCardsSwimlaneCreated: false,
            cardsRestored: 0,
            listsRestored: 0
          }
        };
      }

      // Find or create "Lost Cards" swimlane (only if there is actual work)
      let lostCardsSwimlane = swimlanes.find(s => s.title === TAPi18n.__('lost-cards'));
      if (!lostCardsSwimlane) {
        const swimlaneId = Swimlanes.insert({
          title: TAPi18n.__('lost-cards'),
          boardId: boardId,
          sort: 999999, // Put at the end
          color: 'red',
          createdAt: new Date(),
          updatedAt: new Date(),
          archived: false
        });
        lostCardsSwimlane = ReactiveCache.getSwimlane(swimlaneId);
        results.lostCardsSwimlaneCreated = true;
        if (process.env.DEBUG === 'true') {
          console.log(`Created "Lost Cards" swimlane for board ${boardId}`);
        }
      }

      // Restore lost lists (lists without swimlaneId)
      if (hasListsWork) {
        for (const list of lostLists) {
          Lists.update(list._id, {
            $set: {
              swimlaneId: lostCardsSwimlane._id,
              updatedAt: new Date()
            }
          });
          results.listsRestored++;
          if (process.env.DEBUG === 'true') {
            console.log(`Restored lost list: ${list.title}`);
          }
        }
      }

      // Create default list only if we need to move cards
      let defaultList = null;
      if (hasCardsWork) {
        defaultList = lists.find(l =>
          l.swimlaneId === lostCardsSwimlane._id &&
          l.title === TAPi18n.__('lost-cards-list')
        );
        if (!defaultList) {
          const listId = Lists.insert({
            title: TAPi18n.__('lost-cards-list'),
            boardId: boardId,
            swimlaneId: lostCardsSwimlane._id,
            sort: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            archived: false
          });
          defaultList = ReactiveCache.getList(listId);
          if (process.env.DEBUG === 'true') {
            console.log(`Created default list in Lost Cards swimlane`);
          }
        }
      }

      // Restore cards missing swimlaneId or listId
      if (hasCardsWork) {
        for (const card of lostCards) {
          const updateFields = { updatedAt: new Date() };
          if (!card.swimlaneId) updateFields.swimlaneId = lostCardsSwimlane._id;
          if (!card.listId) updateFields.listId = defaultList._id;
          Cards.update(card._id, { $set: updateFields });
          results.cardsRestored++;
          if (process.env.DEBUG === 'true') {
            console.log(`Restored lost card: ${card.title}`);
          }
        }

        // Restore orphaned cards (cards whose list doesn't exist)
        for (const card of orphanedCards) {
          Cards.update(card._id, {
            $set: {
              listId: defaultList._id,
              swimlaneId: lostCardsSwimlane._id,
              updatedAt: new Date()
            }
          });
          results.cardsRestored++;
          if (process.env.DEBUG === 'true') {
            console.log(`Restored orphaned card: ${card.title}`);
          }
        }
      }

      return {
        success: true,
        changes: [
          results.lostCardsSwimlaneCreated ? 'Created "Lost Cards" swimlane' : 'Using existing "Lost Cards" swimlane',
          `Restored ${results.listsRestored} lost lists`,
          `Restored ${results.cardsRestored} lost cards`
        ],
        results
      };
    } catch (error) {
      console.error('Error executing restoreLostCards migration:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

const restoreLostCardsMigration = new RestoreLostCardsMigration();

// Register Meteor methods
Meteor.methods({
  'restoreLostCards.needsMigration'(boardId) {
    check(boardId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    return restoreLostCardsMigration.needsMigration(boardId);
  },

  'restoreLostCards.execute'(boardId) {
    check(boardId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    // Check if user is board admin
    const board = ReactiveCache.getBoard(boardId);
    if (!board) {
      throw new Meteor.Error('board-not-found', 'Board not found');
    }

    const user = ReactiveCache.getUser(this.userId);
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

    return restoreLostCardsMigration.executeMigration(boardId);
  }
});

export default restoreLostCardsMigration;
