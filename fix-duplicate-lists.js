#!/usr/bin/env node

/**
 * Standalone script to fix duplicate lists created by WeKan 8.10
 * 
 * Usage:
 *   node fix-duplicate-lists.js
 * 
 * This script will:
 * 1. Connect to the MongoDB database
 * 2. Identify boards with duplicate lists/swimlanes
 * 3. Fix the duplicates by merging them
 * 4. Report the results
 */

const { MongoClient } = require('mongodb');

// Configuration - adjust these for your setup
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/wekan';
const DB_NAME = process.env.MONGO_DB_NAME || 'wekan';

class DuplicateListsFixer {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    console.log('Connecting to MongoDB...');
    this.client = new MongoClient(MONGO_URL);
    await this.client.connect();
    this.db = this.client.db(DB_NAME);
    console.log('Connected to MongoDB');
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log('Disconnected from MongoDB');
    }
  }

  async getReport() {
    console.log('Analyzing boards for duplicate lists...');
    
    const boards = await this.db.collection('boards').find({}).toArray();
    const report = [];

    for (const board of boards) {
      const swimlanes = await this.db.collection('swimlanes').find({ boardId: board._id }).toArray();
      const lists = await this.db.collection('lists').find({ boardId: board._id }).toArray();
      
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
      totalBoards: boards.length,
      boardsWithDuplicates: report.length,
      report
    };
  }

  async fixBoard(boardId) {
    console.log(`Fixing duplicate lists for board ${boardId}...`);
    
    // Fix duplicate swimlanes
    const swimlaneResult = await this.fixDuplicateSwimlanes(boardId);
    
    // Fix duplicate lists
    const listResult = await this.fixDuplicateLists(boardId);
    
    return {
      boardId,
      fixedSwimlanes: swimlaneResult.fixed,
      fixedLists: listResult.fixed,
      fixed: swimlaneResult.fixed + listResult.fixed
    };
  }

  async fixDuplicateSwimlanes(boardId) {
    const swimlanes = await this.db.collection('swimlanes').find({ boardId }).toArray();
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
    for (const [title, group] of Object.entries(swimlaneGroups)) {
      if (group.length > 1) {
        // Sort by creation date, keep the oldest
        group.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        const keepSwimlane = group[0];
        const removeSwimlanes = group.slice(1);

        console.log(`Found ${group.length} duplicate swimlanes with title "${title}", keeping oldest (${keepSwimlane._id})`);

        // Move all lists from duplicate swimlanes to the kept swimlane
        for (const swimlane of removeSwimlanes) {
          const lists = await this.db.collection('lists').find({ swimlaneId: swimlane._id }).toArray();
          for (const list of lists) {
            // Check if a list with the same title already exists in the kept swimlane
            const existingList = await this.db.collection('lists').findOne({
              boardId,
              swimlaneId: keepSwimlane._id,
              title: list.title
            });

            if (existingList) {
              // Move cards to existing list
              await this.db.collection('cards').updateMany(
                { listId: list._id },
                { $set: { listId: existingList._id } }
              );
              // Remove duplicate list
              await this.db.collection('lists').deleteOne({ _id: list._id });
              console.log(`Moved cards from duplicate list "${list.title}" to existing list in kept swimlane`);
            } else {
              // Move list to kept swimlane
              await this.db.collection('lists').updateOne(
                { _id: list._id },
                { $set: { swimlaneId: keepSwimlane._id } }
              );
              console.log(`Moved list "${list.title}" to kept swimlane`);
            }
          }

          // Remove duplicate swimlane
          await this.db.collection('swimlanes').deleteOne({ _id: swimlane._id });
          fixed++;
        }
      }
    }

    return { fixed };
  }

  async fixDuplicateLists(boardId) {
    const lists = await this.db.collection('lists').find({ boardId }).toArray();
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
    for (const [key, group] of Object.entries(listGroups)) {
      if (group.length > 1) {
        // Sort by creation date, keep the oldest
        group.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        const keepList = group[0];
        const removeLists = group.slice(1);

        console.log(`Found ${group.length} duplicate lists with title "${keepList.title}" in swimlane ${keepList.swimlaneId}, keeping oldest (${keepList._id})`);

        // Move all cards from duplicate lists to the kept list
        for (const list of removeLists) {
          await this.db.collection('cards').updateMany(
            { listId: list._id },
            { $set: { listId: keepList._id } }
          );
          
          // Remove duplicate list
          await this.db.collection('lists').deleteOne({ _id: list._id });
          fixed++;
          console.log(`Moved cards from duplicate list "${list.title}" to kept list`);
        }
      }
    }

    return { fixed };
  }

  async fixAllBoards() {
    console.log('Starting duplicate lists fix for all boards...');
    
    const allBoards = await this.db.collection('boards').find({}).toArray();
    let totalFixed = 0;
    let totalBoardsProcessed = 0;

    for (const board of allBoards) {
      try {
        const result = await this.fixBoard(board._id);
        totalFixed += result.fixed;
        totalBoardsProcessed++;
        
        if (result.fixed > 0) {
          console.log(`Fixed ${result.fixed} duplicate lists in board "${board.title}" (${board._id})`);
        }
      } catch (error) {
        console.error(`Error fixing board ${board._id}:`, error);
      }
    }

    console.log(`Duplicate lists fix completed. Processed ${totalBoardsProcessed} boards, fixed ${totalFixed} duplicate lists.`);
    
    return {
      message: `Fixed ${totalFixed} duplicate lists across ${totalBoardsProcessed} boards`,
      totalFixed,
      totalBoardsProcessed
    };
  }
}

// Main execution
async function main() {
  const fixer = new DuplicateListsFixer();
  
  try {
    await fixer.connect();
    
    // Get report first
    const report = await fixer.getReport();
    
    if (report.boardsWithDuplicates === 0) {
      console.log('No duplicate lists found!');
      return;
    }

    console.log(`Found ${report.boardsWithDuplicates} boards with duplicate lists:`);
    report.report.forEach(board => {
      console.log(`- Board "${board.boardTitle}" (${board.boardId}): ${board.duplicateSwimlanes} duplicate swimlanes, ${board.duplicateLists} duplicate lists`);
    });

    // Perform the fix
    const result = await fixer.fixAllBoards();
    console.log('Fix completed:', result);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await fixer.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = DuplicateListsFixer;
