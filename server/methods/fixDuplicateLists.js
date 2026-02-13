import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Cards from '/models/cards';
import { ReactiveCache } from '/imports/reactiveCache';

/**
 * Fix duplicate lists and swimlanes created by WeKan 8.10
 * This method identifies and removes duplicate lists while preserving cards
 */
Meteor.methods({
  'fixDuplicateLists.fixAllBoards'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    if (!ReactiveCache.getUser(this.userId).isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin required');
    }

    if (process.env.DEBUG === 'true') {
      console.log('Starting duplicate lists fix for all boards...');
    }

    const allBoards = Boards.find({}).fetch();
    let totalFixed = 0;
    let totalBoardsProcessed = 0;

    for (const board of allBoards) {
      try {
        const result = fixDuplicateListsForBoard(board._id);
        totalFixed += result.fixed;
        totalBoardsProcessed++;

        if (result.fixed > 0 && process.env.DEBUG === 'true') {
          console.log(`Fixed ${result.fixed} duplicate lists in board "${board.title}" (${board._id})`);
        }
      } catch (error) {
        console.error(`Error fixing board ${board._id}:`, error);
      }
    }

    if (process.env.DEBUG === 'true') {
      console.log(`Duplicate lists fix completed. Processed ${totalBoardsProcessed} boards, fixed ${totalFixed} duplicate lists.`);
    }

    return {
      message: `Fixed ${totalFixed} duplicate lists across ${totalBoardsProcessed} boards`,
      totalFixed,
      totalBoardsProcessed
    };
  },

  'fixDuplicateLists.fixBoard'(boardId) {
    check(boardId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    const board = ReactiveCache.getBoard(boardId);
    if (!board || !board.hasAdmin(this.userId)) {
      throw new Meteor.Error('not-authorized');
    }

    return fixDuplicateListsForBoard(boardId);
  }
});

// Helper functions defined outside of Meteor.methods
function fixDuplicateListsForBoard(boardId) {
    if (process.env.DEBUG === 'true') {
      console.log(`Fixing duplicate lists for board ${boardId}...`);
    }

    // First, fix duplicate swimlanes
    const swimlaneResult = fixDuplicateSwimlanes(boardId);

    // Then, fix duplicate lists
    const listResult = fixDuplicateLists(boardId);

    return {
      boardId,
      fixedSwimlanes: swimlaneResult.fixed,
      fixedLists: listResult.fixed,
      fixed: swimlaneResult.fixed + listResult.fixed
    };
}

// Helper functions defined outside of Meteor.methods
function fixDuplicateSwimlanes(boardId) {
    const swimlanes = Swimlanes.find({ boardId }).fetch();
    const swimlaneGroups = {};
    let fixed = 0;

    // Group swimlanes by title
    swimlanes.forEach(swimlane => {
      const key = swimlane.title || 'Default';
      if (!swimlaneGroups[key]) {
        swimlaneGroups[key] = [];
      }
      swimlaneGroups[key].push(swimlane);
    });

    // For each group with duplicates, keep the oldest and remove the rest
    Object.keys(swimlaneGroups).forEach(title => {
      const group = swimlaneGroups[title];
      if (group.length > 1) {
        // Sort by creation date, keep the oldest
        group.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        const keepSwimlane = group[0];
        const removeSwimlanes = group.slice(1);

        if (process.env.DEBUG === 'true') {
          console.log(`Found ${group.length} duplicate swimlanes with title "${title}", keeping oldest (${keepSwimlane._id})`);
        }

        // Move all lists from duplicate swimlanes to the kept swimlane
        removeSwimlanes.forEach(swimlane => {
          const lists = Lists.find({ swimlaneId: swimlane._id }).fetch();
          lists.forEach(list => {
            // Check if a list with the same title already exists in the kept swimlane
            const existingList = Lists.findOne({
              boardId,
              swimlaneId: keepSwimlane._id,
              title: list.title
            });

            if (existingList) {
              // Move cards to existing list
              Cards.update(
                { listId: list._id },
                { $set: { listId: existingList._id } },
                { multi: true }
              );
              // Remove duplicate list
              Lists.remove(list._id);
              if (process.env.DEBUG === 'true') {
                console.log(`Moved cards from duplicate list "${list.title}" to existing list in kept swimlane`);
              }
            } else {
              // Move list to kept swimlane
              Lists.update(list._id, { $set: { swimlaneId: keepSwimlane._id } });
              if (process.env.DEBUG === 'true') {
                console.log(`Moved list "${list.title}" to kept swimlane`);
              }
            }
          });

          // Remove duplicate swimlane
          Swimlanes.remove(swimlane._id);
          fixed++;
        });
      }
    });

    return { fixed };
}

function fixDuplicateLists(boardId) {
    const lists = Lists.find({ boardId }).fetch();
    const listGroups = {};
    let fixed = 0;

    // Group lists by title and swimlaneId
    lists.forEach(list => {
      const key = `${list.swimlaneId || 'null'}-${list.title}`;
      if (!listGroups[key]) {
        listGroups[key] = [];
      }
      listGroups[key].push(list);
    });

    // For each group with duplicates, keep the oldest and remove the rest
    Object.keys(listGroups).forEach(key => {
      const group = listGroups[key];
      if (group.length > 1) {
        // Sort by creation date, keep the oldest
        group.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        const keepList = group[0];
        const removeLists = group.slice(1);

        if (process.env.DEBUG === 'true') {
          console.log(`Found ${group.length} duplicate lists with title "${keepList.title}" in swimlane ${keepList.swimlaneId}, keeping oldest (${keepList._id})`);
        }

        // Move all cards from duplicate lists to the kept list
        removeLists.forEach(list => {
          Cards.update(
            { listId: list._id },
            { $set: { listId: keepList._id } },
            { multi: true }
          );

          // Remove duplicate list
          Lists.remove(list._id);
          fixed++;
          if (process.env.DEBUG === 'true') {
            console.log(`Moved cards from duplicate list "${list.title}" to kept list`);
          }
        });
      }
    });

    return { fixed };
}

Meteor.methods({
  'fixDuplicateLists.getReport'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    if (!ReactiveCache.getUser(this.userId).isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin required');
    }

    const allBoards = Boards.find({}).fetch();
    const report = [];

    for (const board of allBoards) {
      const swimlanes = Swimlanes.find({ boardId: board._id }).fetch();
      const lists = Lists.find({ boardId: board._id }).fetch();

      // Check for duplicate swimlanes
      const swimlaneGroups = {};
      swimlanes.forEach(swimlane => {
        const key = swimlane.title || 'Default';
        if (!swimlaneGroups[key]) {
          swimlaneGroups[key] = [];
        }
        swimlaneGroups[key].push(swimlane);
      });

      // Check for duplicate lists
      const listGroups = {};
      lists.forEach(list => {
        const key = `${list.swimlaneId || 'null'}-${list.title}`;
        if (!listGroups[key]) {
          listGroups[key] = [];
        }
        listGroups[key].push(list);
      });

      const duplicateSwimlanes = Object.values(swimlaneGroups).filter(group => group.length > 1);
      const duplicateLists = Object.values(listGroups).filter(group => group.length > 1);

      if (duplicateSwimlanes.length > 0 || duplicateLists.length > 0) {
        report.push({
          boardId: board._id,
          boardTitle: board.title,
          duplicateSwimlanes: duplicateSwimlanes.length,
          duplicateLists: duplicateLists.length,
          totalSwimlanes: swimlanes.length,
          totalLists: lists.length
        });
      }
    }

    return {
      totalBoards: allBoards.length,
      boardsWithDuplicates: report.length,
      report
    };
  }
});

