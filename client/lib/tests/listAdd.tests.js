/* eslint-env mocha */
import { expect } from 'chai';
import {
  ADD_LIST_VIEW_MODES,
  canAddListInView,
  defaultSwimlaneIdForBoard,
} from '/client/components/lists/listAddHelpers';

// Issue #6142: "Lists" board-view mode must offer the same "add list"
// affordance as "Swimlanes" mode.
describe('listAddHelpers', function () {
  describe('canAddListInView', function () {
    it('allows adding a list in swimlanes view', function () {
      expect(canAddListInView('board-view-swimlanes')).to.equal(true);
    });

    it('allows adding a list in lists view (issue #6142)', function () {
      expect(canAddListInView('board-view-lists')).to.equal(true);
    });

    it('does not allow adding a list in calendar/gantt/table views', function () {
      expect(canAddListInView('board-view-cal')).to.equal(false);
      expect(canAddListInView('board-view-gantt')).to.equal(false);
      expect(canAddListInView('board-view-table')).to.equal(false);
    });

    it('returns false for unknown / empty view modes', function () {
      expect(canAddListInView('')).to.equal(false);
      expect(canAddListInView(undefined)).to.equal(false);
      expect(canAddListInView('nonsense')).to.equal(false);
    });

    it('exposes the two supported view modes', function () {
      expect(ADD_LIST_VIEW_MODES).to.have.members([
        'board-view-swimlanes',
        'board-view-lists',
      ]);
    });
  });

  describe('defaultSwimlaneIdForBoard', function () {
    it('prefers an explicitly provided swimlane id', function () {
      const board = { getDefaultSwimline: () => ({ _id: 'default-id' }) };
      expect(defaultSwimlaneIdForBoard(board, 'explicit-id')).to.equal(
        'explicit-id',
      );
    });

    it('falls back to the board default swimlane id', function () {
      const board = { getDefaultSwimline: () => ({ _id: 'default-id' }) };
      expect(defaultSwimlaneIdForBoard(board)).to.equal('default-id');
    });

    it('returns null when the board has no default swimlane', function () {
      const board = { getDefaultSwimline: () => undefined };
      expect(defaultSwimlaneIdForBoard(board)).to.equal(null);
    });

    it('returns null when the default swimlane has no id', function () {
      const board = { getDefaultSwimline: () => ({}) };
      expect(defaultSwimlaneIdForBoard(board)).to.equal(null);
    });

    it('returns null for a missing board with no explicit id', function () {
      expect(defaultSwimlaneIdForBoard(null)).to.equal(null);
      expect(defaultSwimlaneIdForBoard(undefined)).to.equal(null);
      expect(defaultSwimlaneIdForBoard({})).to.equal(null);
    });

    it('still honors an explicit id even with a broken board', function () {
      expect(defaultSwimlaneIdForBoard(null, 'explicit-id')).to.equal(
        'explicit-id',
      );
    });
  });
});
