/**
 * Board Conversion Service
 * Handles conversion of boards from old database structure to new structure
 * without running migrations that could cause downtime
 */

import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveCache } from '/imports/reactiveCache';
import Lists from '/models/lists';

// Reactive variables for conversion progress
export const conversionProgress = new ReactiveVar(0);
export const conversionStatus = new ReactiveVar('');
export const conversionEstimatedTime = new ReactiveVar('');
export const isConverting = new ReactiveVar(false);

// Global tracking of converted boards (persistent across component reinitializations)
const globalConvertedBoards = new Set();

class BoardConverter {
  constructor() {
    this.conversionCache = new Map(); // Cache converted board IDs
  }

  /**
   * Check if a board has been converted
   * @param {string} boardId - The board ID
   * @returns {boolean} - True if board has been converted
   */
  isBoardConverted(boardId) {
    return globalConvertedBoards.has(boardId);
  }

  /**
   * Check if a board needs conversion
   * @param {string} boardId - The board ID to check
   * @returns {boolean} - True if board needs conversion
   */
  needsConversion(boardId) {
    if (this.conversionCache.has(boardId)) {
      return false; // Already converted
    }

    try {
      const board = ReactiveCache.getBoard(boardId);
      if (!board) return false;

      // Check if any lists in this board don't have swimlaneId
      const lists = ReactiveCache.getLists({
        boardId: boardId,
        $or: [
          { swimlaneId: { $exists: false } },
          { swimlaneId: '' },
          { swimlaneId: null }
        ]
      });

      return lists.length > 0;
    } catch (error) {
      console.error('Error checking if board needs conversion:', error);
      return false;
    }
  }

  /**
   * Convert a board from old structure to new structure
   * @param {string} boardId - The board ID to convert
   * @returns {Promise<boolean>} - True if conversion was successful
   */
  async convertBoard(boardId) {
    // Check if board has already been converted
    if (this.isBoardConverted(boardId)) {
      console.log(`Board ${boardId} has already been converted, skipping`);
      return true;
    }

    if (this.conversionCache.has(boardId)) {
      return true; // Already converted
    }

    isConverting.set(true);
    conversionProgress.set(0);
    conversionStatus.set('Starting board conversion...');

    try {
      const board = ReactiveCache.getBoard(boardId);
      if (!board) {
        throw new Error('Board not found');
      }

      // Get the default swimlane for this board
      const defaultSwimlane = board.getDefaultSwimline();
      if (!defaultSwimlane) {
        throw new Error('No default swimlane found for board');
      }

      // Get all lists that need conversion
      const listsToConvert = ReactiveCache.getLists({
        boardId: boardId,
        $or: [
          { swimlaneId: { $exists: false } },
          { swimlaneId: '' },
          { swimlaneId: null }
        ]
      });

      if (listsToConvert.length === 0) {
        this.conversionCache.set(boardId, true);
        globalConvertedBoards.add(boardId); // Mark board as converted
        isConverting.set(false);
        console.log(`Board ${boardId} has no lists to convert, marked as converted`);
        return true;
      }

      conversionStatus.set(`Converting ${listsToConvert.length} lists...`);

      const startTime = Date.now();
      const totalLists = listsToConvert.length;
      let convertedLists = 0;

      // Convert lists in batches to avoid blocking the UI
      const batchSize = 10;
      for (let i = 0; i < listsToConvert.length; i += batchSize) {
        const batch = listsToConvert.slice(i, i + batchSize);

        // Process batch
        await this.processBatch(batch, defaultSwimlane._id);

        convertedLists += batch.length;
        const progress = Math.round((convertedLists / totalLists) * 100);
        conversionProgress.set(progress);

        // Calculate estimated time remaining
        const elapsed = Date.now() - startTime;
        const rate = convertedLists / elapsed; // lists per millisecond
        const remaining = totalLists - convertedLists;
        const estimatedMs = remaining / rate;

        conversionStatus.set(`Converting list ${convertedLists} of ${totalLists}...`);
        conversionEstimatedTime.set(this.formatTime(estimatedMs));

        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Mark as converted
      this.conversionCache.set(boardId, true);
      globalConvertedBoards.add(boardId); // Mark board as converted

      conversionStatus.set('Board conversion completed!');
      conversionProgress.set(100);
      console.log(`Board ${boardId} conversion completed and marked as converted`);

      // Clear status after a delay
      setTimeout(() => {
        isConverting.set(false);
        conversionStatus.set('');
        conversionProgress.set(0);
        conversionEstimatedTime.set('');
      }, 2000);

      return true;

    } catch (error) {
      console.error('Error converting board:', error);
      conversionStatus.set(`Conversion failed: ${error.message}`);
      isConverting.set(false);
      return false;
    }
  }

  /**
   * Process a batch of lists for conversion
   * @param {Array} batch - Array of lists to convert
   * @param {string} defaultSwimlaneId - Default swimlane ID
   */
  async processBatch(batch, defaultSwimlaneId) {
    const updates = batch.map(list => ({
      _id: list._id,
      swimlaneId: defaultSwimlaneId
    }));

    // Update lists in batch
    updates.forEach(update => {
      Lists.update(update._id, {
        $set: { swimlaneId: update.swimlaneId }
      });
    });
  }

  /**
   * Format time in milliseconds to human readable format
   * @param {number} ms - Time in milliseconds
   * @returns {string} - Formatted time string
   */
  formatTime(ms) {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    }

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      const remainingSeconds = seconds % 60;
      return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Clear conversion cache (useful for testing)
   */
  clearCache() {
    this.conversionCache.clear();
  }
}

// Export singleton instance
export const boardConverter = new BoardConverter();
