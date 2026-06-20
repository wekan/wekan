/* eslint-env mocha */
import { expect } from 'chai';
import {
  resolveSubtaskLanding,
  isSelectedSubtaskList,
  isSelectedSubtaskBoard,
} from '../subtaskSettings';

/**
 * Unit tests for the board "Subtasks" landing settings helpers
 * (#3414, #3876, #4849, #4947).
 *
 * Bugs:
 *  - The "Landing list for subtasks deposited here" setting appeared not to
 *    save / showed the wrong selected list, because the selected-option helper
 *    compared the list against subtasksDefaultBoardId instead of
 *    subtasksDefaultListId.
 *  - When no landing target is configured, a fallback must be used (the parent
 *    board's default board/list), and a configured value must never be
 *    overridden by that fallback.
 */
describe('subtask landing settings (#3414/#3876/#4849/#4947)', function() {
  const fallback = {
    boardId: 'fbBoard',
    listId: 'fbList',
    swimlaneId: 'fbSwim',
  };

  describe('resolveSubtaskLanding', function() {
    it('returns the configured board/list/swimlane when set', function() {
      const board = {
        subtasksDefaultBoardId: 'B1',
        subtasksDefaultListId: 'L1',
        subtasksDefaultSwimlaneId: 'S1',
      };
      expect(resolveSubtaskLanding(board, fallback)).to.deep.equal({
        boardId: 'B1',
        listId: 'L1',
        swimlaneId: 'S1',
      });
    });

    it('falls back when nothing is configured', function() {
      const board = {
        subtasksDefaultBoardId: null,
        subtasksDefaultListId: null,
      };
      expect(resolveSubtaskLanding(board, fallback)).to.deep.equal({
        boardId: 'fbBoard',
        listId: 'fbList',
        swimlaneId: 'fbSwim',
      });
    });

    it('falls back on undefined / empty / "null" string values', function() {
      const board = {
        subtasksDefaultBoardId: undefined,
        subtasksDefaultListId: '',
        subtasksDefaultSwimlaneId: 'null',
      };
      expect(resolveSubtaskLanding(board, fallback)).to.deep.equal(fallback);
    });

    it('does NOT override a configured value with the fallback (#4849)', function() {
      const board = {
        subtasksDefaultBoardId: 'keepBoard',
        subtasksDefaultListId: 'keepList',
      };
      const resolved = resolveSubtaskLanding(board, fallback);
      expect(resolved.boardId).to.equal('keepBoard');
      expect(resolved.listId).to.equal('keepList');
    });

    it('resolves each field independently', function() {
      const board = {
        subtasksDefaultBoardId: 'B2',
        subtasksDefaultListId: null,
      };
      const resolved = resolveSubtaskLanding(board, fallback);
      expect(resolved.boardId).to.equal('B2');
      expect(resolved.listId).to.equal('fbList');
    });

    it('handles a null board', function() {
      expect(resolveSubtaskLanding(null, fallback)).to.deep.equal(fallback);
    });
  });

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
