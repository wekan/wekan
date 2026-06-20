/* eslint-env mocha */
import { expect } from 'chai';
import {
  dueAtToTime,
  cardMatchesUser,
  filterAndSortDueCards,
} from '/client/components/main/dueCardsLogic';

/**
 * Unit tests for the Due Cards view logic.
 *
 * Covers regressions:
 *  - #5999: all due cards must be shown (no 5-/100-card cap).
 *  - #5930: list includes more than 5 cards.
 */
describe('dueCards logic', function() {
  describe('dueAtToTime', function() {
    it('returns the timestamp for a Date', function() {
      const d = new Date('2026-01-02T03:04:05Z');
      expect(dueAtToTime(d)).to.equal(d.getTime());
    });

    it('parses an ISO string', function() {
      expect(dueAtToTime('2026-01-02T03:04:05Z')).to.equal(
        new Date('2026-01-02T03:04:05Z').getTime(),
      );
    });

    it('sorts null/empty/invalid values last (far future)', function() {
      const far = dueAtToTime(null);
      expect(dueAtToTime(undefined)).to.equal(far);
      expect(dueAtToTime('')).to.equal(far);
      expect(dueAtToTime('not-a-date')).to.equal(far);
      expect(far).to.be.greaterThan(new Date('2099-01-01').getTime());
    });
  });

  describe('cardMatchesUser', function() {
    it('matches a member', function() {
      expect(cardMatchesUser({ members: ['u1'] }, 'u1')).to.equal(true);
    });
    it('matches an assignee', function() {
      expect(cardMatchesUser({ assignees: ['u1'] }, 'u1')).to.equal(true);
    });
    it('matches the author', function() {
      expect(cardMatchesUser({ userId: 'u1' }, 'u1')).to.equal(true);
    });
    it('does not match an unrelated user', function() {
      expect(
        cardMatchesUser({ members: ['u2'], assignees: ['u3'], userId: 'u4' }, 'u1'),
      ).to.equal(false);
    });
    it('returns false for missing card or user', function() {
      expect(cardMatchesUser(null, 'u1')).to.equal(false);
      expect(cardMatchesUser({ members: ['u1'] }, null)).to.equal(false);
    });
  });

  describe('filterAndSortDueCards', function() {
    const overdue = { _id: 'a', dueAt: '2020-01-01T00:00:00Z', members: ['u1'] };
    const soon = { _id: 'b', dueAt: '2030-06-01T00:00:00Z', assignees: ['u1'] };
    const future = { _id: 'c', dueAt: '2040-12-31T00:00:00Z', userId: 'u1' };
    const others = { _id: 'd', dueAt: '2025-05-05T00:00:00Z', members: ['u2'] };

    it('includes both overdue and future due cards', function() {
      const out = filterAndSortDueCards([future, overdue, soon], {
        allUsers: false,
        userId: 'u1',
      });
      const ids = out.map(c => c._id);
      expect(ids).to.include('a');
      expect(ids).to.include('c');
    });

    it('sorts ascending by due date', function() {
      const out = filterAndSortDueCards([future, overdue, soon], {
        allUsers: false,
        userId: 'u1',
      });
      expect(out.map(c => c._id)).to.eql(['a', 'b', 'c']);
    });

    it('filters to the current user when not allUsers', function() {
      const out = filterAndSortDueCards([overdue, others], {
        allUsers: false,
        userId: 'u1',
      });
      expect(out.map(c => c._id)).to.eql(['a']);
    });

    it('keeps all users cards when allUsers is true', function() {
      const out = filterAndSortDueCards([overdue, others], {
        allUsers: true,
        userId: 'u1',
      });
      expect(out.map(c => c._id).sort()).to.eql(['a', 'd']);
    });

    it('does not cap the number of results at 5 (issues #5999 / #5930)', function() {
      const many = [];
      for (let i = 0; i < 42; i++) {
        many.push({
          _id: `card-${i}`,
          // descending input order to also exercise the sort
          dueAt: new Date(2030, 0, 42 - i).toISOString(),
          members: ['u1'],
        });
      }
      const out = filterAndSortDueCards(many, { allUsers: false, userId: 'u1' });
      expect(out).to.have.lengthOf(42);
      // and it is sorted ascending
      const times = out.map(c => dueAtToTime(c.dueAt));
      for (let i = 1; i < times.length; i++) {
        expect(times[i]).to.be.at.least(times[i - 1]);
      }
    });

    it('does not mutate the input array', function() {
      const input = [soon, overdue];
      const copy = input.slice();
      filterAndSortDueCards(input, { allUsers: true, userId: 'u1' });
      expect(input).to.eql(copy);
    });

    it('handles empty / non-array input', function() {
      expect(filterAndSortDueCards(undefined, {})).to.eql([]);
      expect(filterAndSortDueCards([], { allUsers: true })).to.eql([]);
    });
  });
});
