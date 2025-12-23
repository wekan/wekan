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

// Helper collection to track migrations - must be defined first
const Migrations = new Mongo.Collection('migrations');

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

  /**
   * Get or create a "Rescued Data" swimlane for a board
   */
  function getOrCreateRescuedSwimlane(boardId) {
    const board = Boards.findOne(boardId);
    if (!board) return null;

    // Look for existing rescued data swimlane
    let rescuedSwimlane = Swimlanes.findOne({
      boardId,
      title: { $regex: /rescued.*data/i },
    });

    if (!rescuedSwimlane) {
      // Create a new rescued data swimlane
      const swimlaneId = Swimlanes.insert({
        title: 'Rescued Data (Missing Swimlane)',
        boardId,
        archived: false,
        sort: 9999999, // Put at the end
        type: 'swimlane',
        color: 'red',
      });

      rescuedSwimlane = Swimlanes.findOne(swimlaneId);
      
      Activities.insert({
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
  function fixCardsWithoutSwimlaneId() {
    let fixedCount = 0;
    let rescuedCount = 0;

    const cardsWithoutSwimlane = Cards.find({
      $or: [
        { swimlaneId: { $exists: false } },
        { swimlaneId: null },
        { swimlaneId: '' },
      ],
    }).fetch();

    console.log(`Found ${cardsWithoutSwimlane.length} cards without swimlaneId`);

    cardsWithoutSwimlane.forEach(card => {
      const board = Boards.findOne(card.boardId);
      if (!board) {
        console.warn(`Card ${card._id} has invalid boardId: ${card.boardId}`);
        return;
      }

      // Try to get default swimlane
      let defaultSwimlane = Swimlanes.findOne({
        boardId: card.boardId,
        type: { $ne: 'template-swimlane' },
        archived: false,
      }, { sort: { sort: 1 } });

      if (!defaultSwimlane) {
        // No swimlanes at all - create default
        const swimlaneId = Swimlanes.insert({
          title: 'Default',
          boardId: card.boardId,
          archived: false,
          sort: 0,
          type: 'swimlane',
        });
        defaultSwimlane = Swimlanes.findOne(swimlaneId);
      }

      if (defaultSwimlane) {
        Cards.update(card._id, {
          $set: { swimlaneId: defaultSwimlane._id },
        });
        fixedCount++;
      } else {
        console.warn(`Could not find or create default swimlane for card ${card._id}`);
      }
    });

    return { fixedCount, rescuedCount };
  }

  /**
   * Validate and fix lists without valid swimlaneId
   */
  function fixListsWithoutSwimlaneId() {
    let fixedCount = 0;

    const listsWithoutSwimlane = Lists.find({
      $or: [
        { swimlaneId: { $exists: false } },
        { swimlaneId: null },
      ],
    }).fetch();

    console.log(`Found ${listsWithoutSwimlane.length} lists without swimlaneId`);

    listsWithoutSwimlane.forEach(list => {
      // Set to empty string for backward compatibility
      // (lists can be shared across swimlanes)
      Lists.update(list._id, {
        $set: { swimlaneId: '' },
      });
      fixedCount++;
    });

    return { fixedCount };
  }

  /**
   * Find and rescue orphaned cards (swimlaneId points to non-existent swimlane)
   */
  function rescueOrphanedCards() {
    let rescuedCount = 0;

    const allCards = Cards.find({}).fetch();
    
    allCards.forEach(card => {
      if (!card.swimlaneId) return; // Handled by fixCardsWithoutSwimlaneId

      // Check if swimlane exists
      const swimlane = Swimlanes.findOne(card.swimlaneId);
      if (!swimlane) {
        // Orphaned card - swimlane doesn't exist
        const rescuedSwimlane = getOrCreateRescuedSwimlane(card.boardId);
        
        if (rescuedSwimlane) {
          Cards.update(card._id, {
            $set: { swimlaneId: rescuedSwimlane._id },
          });
          rescuedCount++;

          Activities.insert({
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
    });

    return { rescuedCount };
  }

  /**
   * Ensure all swimlaneId references are always saved in all operations
   * This adds a global hook to validate swimlaneId before insert/update
   */
  function addSwimlaneIdValidationHooks() {
    // Card insert hook
    Cards.before.insert(function(userId, doc) {
      if (!doc.swimlaneId) {
        const board = Boards.findOne(doc.boardId);
        if (board) {
          const defaultSwimlane = Swimlanes.findOne({
            boardId: doc.boardId,
            type: { $ne: 'template-swimlane' },
            archived: false,
          }, { sort: { sort: 1 } });

          if (defaultSwimlane) {
            doc.swimlaneId = defaultSwimlane._id;
          } else {
            console.warn('No default swimlane found for new card, creating one');
            const swimlaneId = Swimlanes.insert({
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
    Cards.before.update(function(userId, doc, fieldNames, modifier) {
      if (modifier.$unset && modifier.$unset.swimlaneId) {
        delete modifier.$unset.swimlaneId;
        console.warn('Prevented removal of swimlaneId from card', doc._id);
      }

      if (modifier.$set && modifier.$set.swimlaneId === null) {
        const defaultSwimlane = Swimlanes.findOne({
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
