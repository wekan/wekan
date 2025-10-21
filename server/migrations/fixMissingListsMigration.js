/**
 * Fix Missing Lists Migration
 * 
 * This migration fixes the issue where cards have incorrect listId references
 * due to the per-swimlane lists change. It detects cards with mismatched
 * listId/swimlaneId and creates the missing lists.
 * 
 * Issue: When upgrading from v7.94 to v8.02, cards that were in different
 * swimlanes but shared the same list now have wrong listId references.
 * 
 * Example:
 * - Card1: listId: 'HB93dWNnY5bgYdtxc', swimlaneId: 'sK69SseWkh3tMbJvg'
 * - Card2: listId: 'HB93dWNnY5bgYdtxc', swimlaneId: 'XeecF9nZxGph4zcT4'
 * 
 * Card2 should have a different listId that corresponds to its swimlane.
 */

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Cards from '/models/cards';

class FixMissingListsMigration {
  constructor() {
    this.name = 'fix-missing-lists';
    this.version = 1;
  }

  /**
   * Check if migration is needed for a board
   */
  needsMigration(boardId) {
    try {
      const board = ReactiveCache.getBoard(boardId);
      if (!board) return false;

      // Check if board has already been processed
      if (board.fixMissingListsCompleted) {
        return false;
      }

      // Check if there are cards with mismatched listId/swimlaneId
      const cards = ReactiveCache.getCards({ boardId });
      const lists = ReactiveCache.getLists({ boardId });
      
      // Create a map of listId -> swimlaneId for existing lists
      const listSwimlaneMap = new Map();
      lists.forEach(list => {
        listSwimlaneMap.set(list._id, list.swimlaneId || '');
      });

      // Check for cards with mismatched listId/swimlaneId
      for (const card of cards) {
        const expectedSwimlaneId = listSwimlaneMap.get(card.listId);
        if (expectedSwimlaneId && expectedSwimlaneId !== card.swimlaneId) {
          console.log(`Found mismatched card: ${card._id}, listId: ${card.listId}, card swimlaneId: ${card.swimlaneId}, list swimlaneId: ${expectedSwimlaneId}`);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking if migration is needed:', error);
      return false;
    }
  }

  /**
   * Execute the migration for a board
   */
  async executeMigration(boardId) {
    try {
      console.log(`Starting fix missing lists migration for board ${boardId}`);
      
      const board = ReactiveCache.getBoard(boardId);
      if (!board) {
        throw new Error(`Board ${boardId} not found`);
      }

      const cards = ReactiveCache.getCards({ boardId });
      const lists = ReactiveCache.getLists({ boardId });
      const swimlanes = ReactiveCache.getSwimlanes({ boardId });

      // Create maps for efficient lookup
      const listSwimlaneMap = new Map();
      const swimlaneListsMap = new Map();
      
      lists.forEach(list => {
        listSwimlaneMap.set(list._id, list.swimlaneId || '');
        if (!swimlaneListsMap.has(list.swimlaneId || '')) {
          swimlaneListsMap.set(list.swimlaneId || '', []);
        }
        swimlaneListsMap.get(list.swimlaneId || '').push(list);
      });

      // Group cards by swimlaneId
      const cardsBySwimlane = new Map();
      cards.forEach(card => {
        if (!cardsBySwimlane.has(card.swimlaneId)) {
          cardsBySwimlane.set(card.swimlaneId, []);
        }
        cardsBySwimlane.get(card.swimlaneId).push(card);
      });

      let createdLists = 0;
      let updatedCards = 0;

      // Process each swimlane
      for (const [swimlaneId, swimlaneCards] of cardsBySwimlane) {
        if (!swimlaneId) continue;

        // Get existing lists for this swimlane
        const existingLists = swimlaneListsMap.get(swimlaneId) || [];
        const existingListTitles = new Set(existingLists.map(list => list.title));

        // Group cards by their current listId
        const cardsByListId = new Map();
        swimlaneCards.forEach(card => {
          if (!cardsByListId.has(card.listId)) {
            cardsByListId.set(card.listId, []);
          }
          cardsByListId.get(card.listId).push(card);
        });

        // For each listId used by cards in this swimlane
        for (const [listId, cardsInList] of cardsByListId) {
          const originalList = lists.find(l => l._id === listId);
          if (!originalList) continue;

          // Check if this list's swimlaneId matches the card's swimlaneId
          const listSwimlaneId = listSwimlaneMap.get(listId);
          if (listSwimlaneId === swimlaneId) {
            // List is already correctly assigned to this swimlane
            continue;
          }

          // Check if we already have a list with the same title in this swimlane
          let targetList = existingLists.find(list => list.title === originalList.title);
          
          if (!targetList) {
            // Create a new list for this swimlane
            const newListData = {
              title: originalList.title,
              boardId: boardId,
              swimlaneId: swimlaneId,
              sort: originalList.sort || 0,
              archived: originalList.archived || false,
              createdAt: new Date(),
              modifiedAt: new Date(),
              type: originalList.type || 'list'
            };

            // Copy other properties if they exist
            if (originalList.color) newListData.color = originalList.color;
            if (originalList.wipLimit) newListData.wipLimit = originalList.wipLimit;
            if (originalList.wipLimitEnabled) newListData.wipLimitEnabled = originalList.wipLimitEnabled;
            if (originalList.wipLimitSoft) newListData.wipLimitSoft = originalList.wipLimitSoft;
            if (originalList.starred) newListData.starred = originalList.starred;
            if (originalList.collapsed) newListData.collapsed = originalList.collapsed;

            // Insert the new list
            const newListId = Lists.insert(newListData);
            targetList = { _id: newListId, ...newListData };
            createdLists++;
            
            console.log(`Created new list "${originalList.title}" for swimlane ${swimlaneId}`);
          }

          // Update all cards in this group to use the correct listId
          for (const card of cardsInList) {
            Cards.update(card._id, {
              $set: {
                listId: targetList._id,
                modifiedAt: new Date()
              }
            });
            updatedCards++;
          }
        }
      }

      // Mark board as processed
      Boards.update(boardId, {
        $set: {
          fixMissingListsCompleted: true,
          fixMissingListsCompletedAt: new Date()
        }
      });

      console.log(`Fix missing lists migration completed for board ${boardId}: created ${createdLists} lists, updated ${updatedCards} cards`);
      
      return {
        success: true,
        createdLists,
        updatedCards
      };

    } catch (error) {
      console.error(`Error executing fix missing lists migration for board ${boardId}:`, error);
      throw error;
    }
  }

  /**
   * Get migration status for a board
   */
  getMigrationStatus(boardId) {
    try {
      const board = ReactiveCache.getBoard(boardId);
      if (!board) {
        return { status: 'board_not_found' };
      }

      if (board.fixMissingListsCompleted) {
        return { 
          status: 'completed',
          completedAt: board.fixMissingListsCompletedAt
        };
      }

      const needsMigration = this.needsMigration(boardId);
      return {
        status: needsMigration ? 'needed' : 'not_needed'
      };

    } catch (error) {
      console.error('Error getting migration status:', error);
      return { status: 'error', error: error.message };
    }
  }
}

// Export singleton instance
export const fixMissingListsMigration = new FixMissingListsMigration();

// Meteor methods
Meteor.methods({
  'fixMissingListsMigration.check'(boardId) {
    check(boardId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    return fixMissingListsMigration.getMigrationStatus(boardId);
  },

  'fixMissingListsMigration.execute'(boardId) {
    check(boardId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    return fixMissingListsMigration.executeMigration(boardId);
  },

  'fixMissingListsMigration.needsMigration'(boardId) {
    check(boardId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    return fixMissingListsMigration.needsMigration(boardId);
  }
});
