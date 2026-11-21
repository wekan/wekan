/* eslint-env mocha */
import { expect } from 'chai';
import {
  isSelectedSubtaskList,
  isSelectedSubtaskBoard,
} from '/models/lib/subtaskSettings';

/**
 * Unit tests for the board "Subtasks" landing settings helpers
 * (#3414, #3876, #4849, #4947).
 *
 * Bugs:
 *  - The "Landing list for subtasks deposited here" setting appeared not to
 *    save / showed the wrong selected list, because the selected-option helper
 *    compared the list against subtasksDefaultBoardId instead of
 *    subtasksDefaultListId.
 *
 * Where a new subtask lands is Boards.getDefaultSubtasksBoardAsync() and
 * getDefaultSubtasksListAsync() in models/boards.js; a resolveSubtaskLanding()
 * helper tested here was never called by them and is removed.
 */
describe('subtask landing settings (#3414/#3876/#4849/#4947)', function() {
  describe('isSelectedSubtaskList', function() {
    it('matches the stored subtasksDefaultListId (#3876/#4947)', function() {
      const board = { subtasksDefaultBoardId: 'B1', subtasksDefaultListId: 'L1' };
      expect(isSelectedSubtaskList(board, 'L1')).to.equal(true);
    });

    it('does not match a different list id', function() {
      const board = { subtasksDefaultListId: 'L1' };
      expect(isSelectedSubtaskList(board, 'L2')).to.equal(false);
    });

    it('does not match the board id (the original bug)', function() {
      const board = { subtasksDefaultBoardId: 'B1', subtasksDefaultListId: 'L1' };
      // Passing the board id must NOT select a list option.
      expect(isSelectedSubtaskList(board, 'B1')).to.equal(false);
    });

    it('returns false when no list is configured', function() {
      expect(isSelectedSubtaskList({ subtasksDefaultListId: null }, 'L1')).to.equal(false);
    });
  });

  describe('isSelectedSubtaskBoard', function() {
    it('matches the stored subtasksDefaultBoardId', function() {
      const board = { subtasksDefaultBoardId: 'B1' };
      expect(isSelectedSubtaskBoard(board, 'B1')).to.equal(true);
    });

    it('returns false when no board is configured', function() {
      expect(isSelectedSubtaskBoard({ subtasksDefaultBoardId: null }, 'B1')).to.equal(false);
    });
  });
});
