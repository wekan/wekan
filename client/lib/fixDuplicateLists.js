import { Meteor } from 'meteor/meteor';

/**
 * Client-side interface for fixing duplicate lists
 */
export const fixDuplicateLists = {
  
  /**
   * Get a report of all boards with duplicate lists/swimlanes
   */
  async getReport() {
    try {
      const result = await Meteor.callAsync('fixDuplicateLists.getReport');
      return result;
    } catch (error) {
      console.error('Error getting duplicate lists report:', error);
      throw error;
    }
  },

  /**
   * Fix duplicate lists for a specific board
   */
  async fixBoard(boardId) {
    try {
      const result = await Meteor.callAsync('fixDuplicateLists.fixBoard', boardId);
      console.log(`Fixed duplicate lists for board ${boardId}:`, result);
      return result;
    } catch (error) {
      console.error(`Error fixing board ${boardId}:`, error);
      throw error;
    }
  },

  /**
   * Fix duplicate lists for all boards
   */
  async fixAllBoards() {
    try {
      console.log('Starting fix for all boards...');
      const result = await Meteor.callAsync('fixDuplicateLists.fixAllBoards');
      console.log('Fix completed:', result);
      return result;
    } catch (error) {
      console.error('Error fixing all boards:', error);
      throw error;
    }
  },

  /**
   * Interactive fix with user confirmation
   */
  async interactiveFix() {
    try {
      // Get report first
      console.log('Getting duplicate lists report...');
      const report = await this.getReport();
      
      if (report.boardsWithDuplicates === 0) {
        console.log('No duplicate lists found!');
        return { message: 'No duplicate lists found!' };
      }

      console.log(`Found ${report.boardsWithDuplicates} boards with duplicate lists:`);
      report.report.forEach(board => {
        console.log(`- Board "${board.boardTitle}" (${board.boardId}): ${board.duplicateSwimlanes} duplicate swimlanes, ${board.duplicateLists} duplicate lists`);
      });

      // Ask for confirmation
      const confirmed = confirm(
        `Found ${report.boardsWithDuplicates} boards with duplicate lists. ` +
        `This will fix ${report.report.reduce((sum, board) => sum + board.duplicateSwimlanes + board.duplicateLists, 0)} duplicates. ` +
        'Continue?'
      );

      if (!confirmed) {
        return { message: 'Fix cancelled by user' };
      }

      // Perform the fix
      const result = await this.fixAllBoards();
      return result;
    } catch (error) {
      console.error('Error in interactive fix:', error);
      throw error;
    }
  }
};

// Make it available globally for console access
if (typeof window !== 'undefined') {
  window.fixDuplicateLists = fixDuplicateLists;
}
