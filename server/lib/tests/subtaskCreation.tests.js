/* eslint-env mocha */
import { expect } from 'chai';
import {
  wouldCreateCycle,
  subtaskCustomFields,
} from '../subtaskHelpers';

/**
 * Unit tests for the pure subtask-creation helpers (server/lib/subtaskHelpers.js).
 *
 * These cover three distinct subtask CREATION bugs whose pure logic was
 * extracted out of models/cards.js so it can be tested Meteor-free:
 *
 *  - #3328 circular subtask guard: the old guard tested `crtParentId in array`,
 *    which compares ARRAY INDICES ("0","1",...) rather than the stored ids, so
 *    it never matched and a card could become its own ancestor (hanging the
 *    board). wouldCreateCycle compares by VALUE.
 *  - #4037 / #3562 custom fields: a new subtask card must receive the board's
 *    automaticallyOnCard / alwaysOnCard custom fields, exactly like a normal
 *    new card does. subtaskCustomFields builds that array.
 */
describe('subtask creation helpers', function() {
  describe('wouldCreateCycle (#3328)', function() {
    it('returns true when the new parent is the card itself', function() {
      expect(wouldCreateCycle('cardA', 'cardA', [])).to.equal(true);
    });

    it('returns true when the card is among the new parent ancestors (by VALUE)', function() {
      // cardA would become a subtask of cardC, but cardA is already an ancestor
      // of cardC -> cycle. The buggy `in` check compared indices and missed this.
      expect(wouldCreateCycle('cardA', 'cardC', ['cardC', 'cardB', 'cardA'])).to.equal(true);
    });

    it('returns false for a normal, acyclic assignment', function() {
      expect(wouldCreateCycle('cardX', 'cardP', ['cardP', 'cardG'])).to.equal(false);
    });

    it('returns false when clearing the parent (top-level card)', function() {
      expect(wouldCreateCycle('cardA', '', ['anything'])).to.equal(false);
      expect(wouldCreateCycle('cardA', null, ['cardA'])).to.equal(false);
      expect(wouldCreateCycle('cardA', undefined, ['cardA'])).to.equal(false);
    });

    it('is NOT fooled by an id that merely equals a numeric array index', function() {
      // Regression for the exact #3328 bug: with the old `cardId in array`
      // logic, an id of "1" would falsely match index 1. Here "1" is the card,
      // it is NOT in the ancestor chain, so there must be no cycle.
      expect(wouldCreateCycle('1', 'cardP', ['cardP', 'cardG'])).to.equal(false);
      // And when "1" really IS an ancestor, it is detected by value.
      expect(wouldCreateCycle('1', 'cardP', ['cardP', '1'])).to.equal(true);
    });

    it('tolerates a non-array ancestor argument', function() {
      expect(wouldCreateCycle('cardA', 'cardP', undefined)).to.equal(false);
      expect(wouldCreateCycle('cardA', 'cardP', null)).to.equal(false);
    });
  });

  describe('subtaskCustomFields (#4037/#3562)', function() {
    it('includes fields flagged automaticallyOnCard', function() {
      const boardFields = [
        { _id: 'f1', automaticallyOnCard: true },
        { _id: 'f2', automaticallyOnCard: false },
      ];
      expect(subtaskCustomFields(boardFields)).to.deep.equal([
        { _id: 'f1', value: null },
      ]);
    });

    it('includes fields flagged alwaysOnCard', function() {
      const boardFields = [
        { _id: 'f1', alwaysOnCard: true },
        { _id: 'f2' },
      ];
      expect(subtaskCustomFields(boardFields)).to.deep.equal([
        { _id: 'f1', value: null },
      ]);
    });

    it('includes a field flagged by either flag, only once', function() {
      const boardFields = [
        { _id: 'f1', automaticallyOnCard: true, alwaysOnCard: true },
      ];
      expect(subtaskCustomFields(boardFields)).to.deep.equal([
        { _id: 'f1', value: null },
      ]);
    });

    it('returns an empty array when no field is automatic', function() {
      const boardFields = [
        { _id: 'f1', automaticallyOnCard: false, alwaysOnCard: false },
        { _id: 'f2' },
      ];
      expect(subtaskCustomFields(boardFields)).to.deep.equal([]);
    });

    it('returns an empty array for missing / non-array input', function() {
      expect(subtaskCustomFields(undefined)).to.deep.equal([]);
      expect(subtaskCustomFields(null)).to.deep.equal([]);
      expect(subtaskCustomFields({})).to.deep.equal([]);
    });

    it('every produced entry has value null (mirrors a normal new card)', function() {
      const boardFields = [
        { _id: 'a', automaticallyOnCard: true },
        { _id: 'b', alwaysOnCard: true },
      ];
      const result = subtaskCustomFields(boardFields);
      expect(result).to.have.length(2);
      result.forEach(entry => {
        expect(entry).to.have.property('value', null);
        expect(entry).to.have.property('_id');
      });
    });
  });
});
