/* eslint-env mocha */
import { expect } from 'chai';
import {
  computeTopSort,
  normalizeMoveParams,
  parseCardDate,
} from '../restCardHelpers';

/**
 * Unit tests for the pure helpers behind four REST card fixes:
 *   #5398 Card edit API duplicated/inconsistent board-move variable names
 *   #5399 Moving a card's list via API leads to random sorting
 *   #5537 Can't add due date (and other dates) to API created/edited cards
 *   #5546 Archived card visibility / de-archive via API
 *
 * The helpers are Meteor-free so these tests run standalone (mocha + chai).
 */
describe('REST card fixes helpers', function() {
  // --- #5399: move-to-list must land the card on TOP of the destination ---
  describe('computeTopSort', function() {
    it('returns one less than the current minimum so the card lands on top', function() {
      expect(computeTopSort([0, 1, 2])).to.equal(-1);
      expect(computeTopSort([5, 10, 3])).to.equal(2);
      expect(computeTopSort([-4, -2, 0])).to.equal(-5);
    });

    it('returns 0 for an empty destination list', function() {
      expect(computeTopSort([])).to.equal(0);
    });

    it('ignores non-numeric / NaN sort values', function() {
      expect(computeTopSort([2, undefined, null, NaN, 'x', 1])).to.equal(0);
      expect(computeTopSort([undefined, null])).to.equal(0);
    });

    it('is input-type safe (null / undefined / non-array)', function() {
      expect(computeTopSort(null)).to.equal(0);
      expect(computeTopSort(undefined)).to.equal(0);
      expect(computeTopSort('nope')).to.equal(0);
    });

    it('places strictly above the existing top (regression for random sorting)', function() {
      const existing = [0, 1, 2, 3];
      const top = computeTopSort(existing);
      expect(top).to.be.lessThan(Math.min(...existing));
    });
  });

  // --- #5398: one consistent set of board-move params ---
  describe('normalizeMoveParams', function() {
    it('flags a full cross-board move when all three new* params are present', function() {
      const r = normalizeMoveParams({
        newBoardId: 'b2',
        newSwimlaneId: 's2',
        newListId: 'l2',
      });
      expect(r.isBoardMove).to.equal(true);
      expect(r.newBoardId).to.equal('b2');
      expect(r.newSwimlaneId).to.equal('s2');
      expect(r.newListId).to.equal('l2');
    });

    it('is NOT a board move when any new* param is missing', function() {
      expect(normalizeMoveParams({ newBoardId: 'b2', newSwimlaneId: 's2' }).isBoardMove)
        .to.equal(false);
      expect(normalizeMoveParams({ newListId: 'l2' }).isBoardMove).to.equal(false);
    });

    it('passes through same-board list / swimlane params', function() {
      const r = normalizeMoveParams({ listId: 'l9', swimlaneId: 's9' });
      expect(r.isBoardMove).to.equal(false);
      expect(r.listId).to.equal('l9');
      expect(r.swimlaneId).to.equal('s9');
    });

    it('normalizes empty strings to undefined (no accidental move)', function() {
      const r = normalizeMoveParams({
        newBoardId: '',
        newSwimlaneId: '',
        newListId: '',
        listId: '',
        swimlaneId: '',
      });
      expect(r.isBoardMove).to.equal(false);
      expect(r.newBoardId).to.equal(undefined);
      expect(r.listId).to.equal(undefined);
      expect(r.swimlaneId).to.equal(undefined);
    });

    it('is null/undefined safe', function() {
      expect(normalizeMoveParams(null).isBoardMove).to.equal(false);
      expect(normalizeMoveParams(undefined).isBoardMove).to.equal(false);
    });
  });

  // --- #5537: ISO date string must parse into a real Date so it persists ---
  describe('parseCardDate', function() {
    it('parses an ISO 8601 string into a Date', function() {
      const d = parseCardDate('2026-06-20T12:00:00.000Z');
      expect(d).to.be.an.instanceof(Date);
      expect(d.toISOString()).to.equal('2026-06-20T12:00:00.000Z');
    });

    it('parses a date-only ISO string', function() {
      const d = parseCardDate('2026-06-20');
      expect(d).to.be.an.instanceof(Date);
      expect(Number.isNaN(d.getTime())).to.equal(false);
    });

    it('returns a Date unchanged', function() {
      const orig = new Date('2026-01-02T03:04:05.000Z');
      expect(parseCardDate(orig)).to.equal(orig);
    });

    it('parses a numeric epoch (number and numeric string)', function() {
      const ms = Date.UTC(2026, 0, 1);
      expect(parseCardDate(ms).getTime()).to.equal(ms);
      expect(parseCardDate(String(ms)).getTime()).to.equal(ms);
    });

    it('returns null for empty / clear-style values', function() {
      expect(parseCardDate('')).to.equal(null);
      expect(parseCardDate('   ')).to.equal(null);
      expect(parseCardDate(null)).to.equal(null);
      expect(parseCardDate(undefined)).to.equal(null);
    });

    it('returns null for an unparseable string (so it is not silently dropped as data)', function() {
      expect(parseCardDate('not-a-date')).to.equal(null);
      expect(parseCardDate('2026-13-99')).to.equal(null);
    });

    it('returns null for an invalid Date object', function() {
      expect(parseCardDate(new Date('nope'))).to.equal(null);
    });
  });
});
