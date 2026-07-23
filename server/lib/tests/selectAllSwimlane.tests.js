/* eslint-env mocha */
import { expect } from 'chai';
import { filterCardsByListAndSwimlane } from '../cardScope';

/**
 * Unit tests for swimlane-scoped "select all cards" (#5623).
 *
 * Bug: the list "select all cards" action selected cards across ALL swimlanes
 * of that list, because models/lists.js `allCards()` filtered by listId only.
 * The pure helper `filterCardsByListAndSwimlane` scopes a set of cards to a
 * list and (optionally) a single swimlane. When invoked from a swimlane
 * context the handler passes the current swimlaneId; without a swimlaneId the
 * historical list-wide behavior is preserved.
 *
 * Shared/orphaned cards (swimlaneId null / '' / missing / a deleted swimlane)
 * surface ONCE, in the FIRST swimlane, to match the doubled-cards render fix
 * (c90d6eaa4). `allCards()` conveys this by passing the OTHER swimlanes' ids as
 * the 4th `otherSwimlaneIds` argument, which `orphanedCardsSwimlaneIds()`
 * returns only for the first swimlane (undefined otherwise). So:
 *   - FIRST swimlane (otherSwimlaneIds passed) -> own + shared/orphaned cards;
 *   - NON-first swimlane (no otherSwimlaneIds) -> ONLY its own cards.
 */
describe('select all cards scoped to swimlane (#5623)', function() {
  const cards = [
    { _id: 'c1', listId: 'L1', swimlaneId: 'S1' },
    { _id: 'c2', listId: 'L1', swimlaneId: 'S1' },
    { _id: 'c3', listId: 'L1', swimlaneId: 'S2' },
    { _id: 'c4', listId: 'L2', swimlaneId: 'S1' }, // different list
    { _id: 'c5', listId: 'L1', swimlaneId: null }, // orphaned (no swimlane)
    { _id: 'c6', listId: 'L1', swimlaneId: '' }, // shared-lists era empty
    { _id: 'c7', listId: 'L1' }, // missing swimlaneId field
  ];

  const ids = result => result.map(c => c._id);

  describe('with a swimlaneId (swimlane context)', function() {
    it('in the FIRST swimlane, returns cards in that list AND swimlane, plus orphaned cards', function() {
      // First swimlane: allCards() passes the OTHER swimlanes' ids (['S2']).
      const result = filterCardsByListAndSwimlane(cards, 'L1', 'S1', ['S2']);
      // c1, c2 (S1) + c5 (null), c6 ('') c7 (missing). Not c3 (S2), not c4 (L2).
      expect(ids(result).sort()).to.deep.equal(['c1', 'c2', 'c5', 'c6', 'c7']);
    });

    it('in a NON-first swimlane, returns ONLY its own cards (orphaned surface in the first)', function() {
      // No otherSwimlaneIds: shared/orphaned cards are not duplicated here.
      const result = filterCardsByListAndSwimlane(cards, 'L1', 'S1');
      expect(ids(result).sort()).to.deep.equal(['c1', 'c2']);
    });

    it('does not leak cards from other swimlanes of the same list', function() {
      const result = filterCardsByListAndSwimlane(cards, 'L1', 'S2');
      expect(ids(result)).to.include('c3');
      expect(ids(result)).to.not.include('c1');
      expect(ids(result)).to.not.include('c2');
    });

    it('does not leak cards from other lists', function() {
      const result = filterCardsByListAndSwimlane(cards, 'L1', 'S1', ['S2']);
      expect(ids(result)).to.not.include('c4');
    });
  });

  describe('without a swimlaneId (no swimlane context)', function() {
    it('returns all cards in the list regardless of swimlane', function() {
      const result = filterCardsByListAndSwimlane(cards, 'L1', undefined);
      expect(ids(result).sort()).to.deep.equal([
        'c1',
        'c2',
        'c3',
        'c5',
        'c6',
        'c7',
      ]);
    });

    it('still excludes cards from other lists', function() {
      const result = filterCardsByListAndSwimlane(cards, 'L1', undefined);
      expect(ids(result)).to.not.include('c4');
    });
  });

  describe('edge cases', function() {
    it('returns an empty array for non-array input', function() {
      expect(filterCardsByListAndSwimlane(null, 'L1')).to.deep.equal([]);
      expect(filterCardsByListAndSwimlane(undefined, 'L1')).to.deep.equal([]);
    });

    it('ignores null/undefined entries in the array', function() {
      const messy = [null, undefined, { _id: 'c1', listId: 'L1', swimlaneId: 'S1' }];
      const result = filterCardsByListAndSwimlane(messy, 'L1', 'S1');
      expect(ids(result)).to.deep.equal(['c1']);
    });
  });
});
