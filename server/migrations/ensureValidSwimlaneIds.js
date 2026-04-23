/**
 * Migration: Ensure all entities have valid swimlaneId
 *
 * This migration ensures that:
 * 1. All cards have a valid swimlaneId
 * 2. All lists have a valid swimlaneId (if applicable)
 * 3. Orphaned entities (without valid swimlaneId) are moved to a "Rescued Data" swimlane
 *
 * This is similar to the existing rescue migration but specifically for swimlaneId validation
 */

import Activities from '/models/activities';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';

// Helper collection to track migrations - must be defined first
const Migrations = new Mongo.Collection('migrations');

// DISABLED: This migration now runs from Admin Panel / Cron / Run All Migrations
// Instead of running automatically on startup
/*
Meteor.startup(() => {
  // Only run on server
  if (!Meteor.isServer) return;

  const MIGRATION_NAME = 'ensure-valid-swimlane-ids';
  const MIGRATION_VERSION = 1;

  // Check if migration already ran
  const existingMigration = Migrations.findOne({ name: MIGRATION_NAME });
  if (existingMigration && existingMigration.version >= MIGRATION_VERSION) {
    return;
  }

  console.log(`Running migration: ${MIGRATION_NAME} v${MIGRATION_VERSION}`);
*/

// Export migration functions for use by cron migration manager
export const MIGRATION_NAME = 'ensure-valid-swimlane-ids';
export const MIGRATION_VERSION = 1;

/**
 * Get or create a "Rescued Data" swimlane for a board
 */
async function getOrCreateRescuedSwimlane(boardId) {
    const board = await Boards.findOneAsync(boardId);
    if (!board) return null;

    // Look for existing rescued data swimlane
    let rescuedSwimlane = await Swimlanes.findOneAsync({
      boardId,
      title: { $regex: /rescued.*data/i },
    });

    if (!rescuedSwimlane) {
      // Create a new rescued data swimlane
      const swimlaneId = await Swimlanes.insertAsync({
        title: 'Rescued Data (Missing Swimlane)',
        boardId,
        archived: false,
        sort: 9999999, // Put at the end
        type: 'swimlane',
        color: 'red',
      });

      rescuedSwimlane = await Swimlanes.findOneAsync(swimlaneId);

      await Activities.insertAsync({
        userId: 'migration',
        type: 'swimlane',
        activityType: 'createSwimlane',
        boardId,
        swimlaneId,
        title: 'Created rescued data swimlane during migration',
      });
    }

    return rescuedSwimlane;
  }

  /**
   * Validate and fix cards without valid swimlaneId
   */
  async function fixCardsWithoutSwimlaneId() {
    let fixedCount = 0;
    let rescuedCount = 0;

    const cardsWithoutSwimlane = await Cards.find({
      $or: [
        { swimlaneId: { $exists: false } },
        { swimlaneId: null },
        { swimlaneId: '' },
      ],
    }).fetchAsync();

    console.log(`Found ${cardsWithoutSwimlane.length} cards without swimlaneId`);

    for (const card of cardsWithoutSwimlane) {
      const board = await Boards.findOneAsync(card.boardId);
      if (!board) {
        console.warn(`Card ${card._id} has invalid boardId: ${card.boardId}`);
        continue;
      }

      // Try to get default swimlane
      let defaultSwimlane = await Swimlanes.findOneAsync({
        boardId: card.boardId,
        type: { $ne: 'template-swimlane' },
        archived: false,
      }, { sort: { sort: 1 } });

      if (!defaultSwimlane) {
        // No swimlanes at all - create default
        const swimlaneId = await Swimlanes.insertAsync({
          title: 'Default',
          boardId: card.boardId,
          archived: false,
          sort: 0,
          type: 'swimlane',
        });
        defaultSwimlane = await Swimlanes.findOneAsync(swimlaneId);
      }

      if (defaultSwimlane) {
        await Cards.updateAsync(card._id, {
          $set: { swimlaneId: defaultSwimlane._id },
        });
        fixedCount++;
      } else {
        console.warn(`Could not find or create default swimlane for card ${card._id}`);
      }
    }

    return { fixedCount, rescuedCount };
  }

  /**
   * Validate and fix lists without valid swimlaneId
   */
  async function fixListsWithoutSwimlaneId() {
    let fixedCount = 0;

    const listsWithoutSwimlane = await Lists.find({
      $or: [
        { swimlaneId: { $exists: false } },
        { swimlaneId: null },
      ],
    }).fetchAsync();

    console.log(`Found ${listsWithoutSwimlane.length} lists without swimlaneId`);

    for (const list of listsWithoutSwimlane) {
      // Set to empty string for backward compatibility
      // (lists can be shared across swimlanes)
      await Lists.updateAsync(list._id, {
        $set: { swimlaneId: '' },
      });
      fixedCount++;
    }

    return { fixedCount };
  }

  /**
   * Find and rescue orphaned cards (swimlaneId points to non-existent swimlane)
   */
  async function rescueOrphanedCards() {
    let rescuedCount = 0;

    const allCards = await Cards.find({}).fetchAsync();

    for (const card of allCards) {
      if (!card.swimlaneId) return; // Handled by fixCardsWithoutSwimlaneId

      // Check if swimlane exists
      const swimlane = await Swimlanes.findOneAsync(card.swimlaneId);
      if (!swimlane) {
        // Orphaned card - swimlane doesn't exist
        const rescuedSwimlane = await getOrCreateRescuedSwimlane(card.boardId);

        if (rescuedSwimlane) {
          await Cards.updateAsync(card._id, {
            $set: { swimlaneId: rescuedSwimlane._id },
          });
          rescuedCount++;

          await Activities.insertAsync({
            userId: 'migration',
            type: 'card',
            activityType: 'moveCard',
            boardId: card.boardId,
            cardId: card._id,
            swimlaneId: rescuedSwimlane._id,
            listId: card.listId,
            title: `Rescued card from deleted swimlane`,
          });
        }
      }
    }

    return { rescuedCount };
  }

  /**
   * Ensure all swimlaneId references are always saved in all operations
   * This adds a global hook to validate swimlaneId before insert/update
   */
  function addSwimlaneIdValidationHooks() {
    // Card insert hook
    Cards.before.insert(async function(userId, doc) {
      if (!doc.swimlaneId) {
        const board = await Boards.findOneAsync(doc.boardId);
        if (board) {
          const defaultSwimlane = await Swimlanes.findOneAsync({
            boardId: doc.boardId,
            type: { $ne: 'template-swimlane' },
            archived: false,
          }, { sort: { sort: 1 } });

          if (defaultSwimlane) {
            doc.swimlaneId = defaultSwimlane._id;
          } else {
            console.warn('No default swimlane found for new card, creating one');
            const swimlaneId = await Swimlanes.insertAsync({
              title: 'Default',
              boardId: doc.boardId,
              archived: false,
              sort: 0,
              type: 'swimlane',
            });
            doc.swimlaneId = swimlaneId;
          }
        }
      }
    });

    // Card update hook - ensure swimlaneId is never removed
    Cards.before.update(async function(userId, doc, fieldNames, modifier) {
      if (modifier.$unset && modifier.$unset.swimlaneId) {
        delete modifier.$unset.swimlaneId;
        console.warn('Prevented removal of swimlaneId from card', doc._id);
      }

      if (modifier.$set && modifier.$set.swimlaneId === null) {
        const defaultSwimlane = await Swimlanes.findOneAsync({
          boardId: doc.boardId,
          type: { $ne: 'template-swimlane' },
          archived: false,
        }, { sort: { sort: 1 } });

        if (defaultSwimlane) {
          modifier.$set.swimlaneId = defaultSwimlane._id;
        }
      }
    });
  }

  // Exported function to run the migration from cron
  export async function runEnsureValidSwimlaneIdsMigration() {
    const existingMigration = await Migrations.findOneAsync({ name: MIGRATION_NAME });
    if (existingMigration && existingMigration.version >= MIGRATION_VERSION) {
      console.log(`Migration ${MIGRATION_NAME} already completed`);
      return { alreadyCompleted: true, ...existingMigration.results };
    }

    console.log(`Running migration: ${MIGRATION_NAME} v${MIGRATION_VERSION}`);

    try {
      // Run all fix operations
      const cardResults = await fixCardsWithoutSwimlaneId();
      const listResults = await fixListsWithoutSwimlaneId();
      const rescueResults = await rescueOrphanedCards();

      console.log('Migration results:');
      console.log(`- Fixed ${cardResults.fixedCount} cards without swimlaneId`);
      console.log(`- Fixed ${listResults.fixedCount} lists without swimlaneId`);
      console.log(`- Rescued ${rescueResults.rescuedCount} orphaned cards`);

      // Record migration completion
      await Migrations.upsertAsync(
        { name: MIGRATION_NAME },
        {
          $set: {
            name: MIGRATION_NAME,
            version: MIGRATION_VERSION,
            completedAt: new Date(),
            results: {
              cardsFixed: cardResults.fixedCount,
              listsFixed: listResults.fixedCount,
              cardsRescued: rescueResults.rescuedCount,
            },
          },
        }
      );

      console.log(`Migration ${MIGRATION_NAME} completed successfully`);

      return {
        success: true,
        cardsFixed: cardResults.fixedCount,
        listsFixed: listResults.fixedCount,
        cardsRescued: rescueResults.rescuedCount,
      };
    } catch (error) {
      console.error(`Migration ${MIGRATION_NAME} failed:`, error);
      throw error;
    }
  }

// Install validation hooks on startup (always run these for data integrity)
Meteor.startup(() => {
  if (!Meteor.isServer) return;

  try {
    addSwimlaneIdValidationHooks();
    console.log('SwimlaneId validation hooks installed');
  } catch (error) {
    console.error('Failed to install swimlaneId validation hooks:', error);
  }
});

/*
  // OLD AUTO-RUN CODE - DISABLED
  try {
    // Run all fix operations
    const cardResults = fixCardsWithoutSwimlaneId();
    const listResults = fixListsWithoutSwimlaneId();
    const rescueResults = rescueOrphanedCards();

    console.log('Migration results:');
    console.log(`- Fixed ${cardResults.fixedCount} cards without swimlaneId`);
    console.log(`- Fixed ${listResults.fixedCount} lists without swimlaneId`);
    console.log(`- Rescued ${rescueResults.rescuedCount} orphaned cards`);

    // Record migration completion
    Migrations.upsert(
      { name: MIGRATION_NAME },
      {
        $set: {
          name: MIGRATION_NAME,
          version: MIGRATION_VERSION,
          completedAt: new Date(),
          results: {
            cardsFixed: cardResults.fixedCount,
            listsFixed: listResults.fixedCount,
            cardsRescued: rescueResults.rescuedCount,
          },
        },
      }
    );

    console.log(`Migration ${MIGRATION_NAME} completed successfully`);
  } catch (error) {
    console.error(`Migration ${MIGRATION_NAME} failed:`, error);
  }

  // Add validation hooks (outside try-catch to ensure they run even if migration failed)
  try {
    addSwimlaneIdValidationHooks();
    console.log('SwimlaneId validation hooks installed');
  } catch (error) {
    console.error('Failed to install swimlaneId validation hooks:', error);
  }
});
*/
