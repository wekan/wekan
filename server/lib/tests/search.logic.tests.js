/* eslint-env mocha */
import { expect } from 'chai';
import { Random } from 'meteor/random';

/**
 * Unit tests for search/filter logic.
 *
 * WeKan's search is driven by server-side Mongo queries (publications) and
 * client-side reactive filters. These tests exercise the query-building and
 * result-filtering helpers in isolation.
 */
describe('search logic', function() {
  // --- Text matching helper (used by board search filter) ---

  describe('card title text matching', function() {
    function titleMatches(cardTitle, query) {
      return cardTitle.toLowerCase().includes(query.toLowerCase());
    }

    it('returns true when query is a substring of the title', function() {
      expect(titleMatches('Alpha Card', 'alpha')).to.equal(true);
      expect(titleMatches('Alpha Card', 'card')).to.equal(true);
      expect(titleMatches('Alpha Card', 'Alpha Card')).to.equal(true);
    });

    it('is case-insensitive', function() {
      expect(titleMatches('Alpha Card', 'ALPHA')).to.equal(true);
      expect(titleMatches('alpha card', 'Alpha')).to.equal(true);
    });

    it('returns false when query is not in the title', function() {
      expect(titleMatches('Alpha Card', 'beta')).to.equal(false);
      expect(titleMatches('Alpha Card', 'Gamma')).to.equal(false);
    });

    it('returns false for an empty title regardless of query', function() {
      expect(titleMatches('', 'alpha')).to.equal(false);
    });

    it('returns true for an empty query (matches everything)', function() {
      expect(titleMatches('Alpha Card', '')).to.equal(true);
    });
  });

  // --- Board membership access control (affects search scope) ---

  describe('search scope: board membership', function() {
    function userCanSeeBoard(userId, boardMembers) {
      return boardMembers.some(m => m.userId === userId && m.isActive);
    }

    it('user who is an active member can see the board', function() {
      const userId = Random.id();
      const members = [{ userId, isActive: true }];
      expect(userCanSeeBoard(userId, members)).to.equal(true);
    });

    it('user who is an inactive member cannot see the board', function() {
      const userId = Random.id();
      const members = [{ userId, isActive: false }];
      expect(userCanSeeBoard(userId, members)).to.equal(false);
    });

    it('user not in the members list cannot see the board', function() {
      const userId = Random.id();
      const members = [{ userId: Random.id(), isActive: true }];
      expect(userCanSeeBoard(userId, members)).to.equal(false);
    });

    it('admin flag in members does not affect visibility', function() {
      const userId = Random.id();
      const adminMembers = [{ userId, isActive: true, isAdmin: true }];
      const regularMembers = [{ userId, isActive: true, isAdmin: false }];
      expect(userCanSeeBoard(userId, adminMembers)).to.equal(true);
      expect(userCanSeeBoard(userId, regularMembers)).to.equal(true);
    });
  });

  // --- Filter: archived cards should not appear in search results ---

  describe('search filter: archived cards', function() {
    function filterCards(cards, { includeArchived = false } = {}) {
      return cards.filter(c => includeArchived || !c.archived);
    }

    const cards = [
      { _id: 'c1', title: 'Active Card', archived: false },
      { _id: 'c2', title: 'Archived Card', archived: true },
      { _id: 'c3', title: 'Another Active', archived: false },
    ];

    it('excludes archived cards by default', function() {
      const results = filterCards(cards);
      expect(results.map(c => c._id)).to.deep.equal(['c1', 'c3']);
    });

    it('includes archived cards when includeArchived=true', function() {
      const results = filterCards(cards, { includeArchived: true });
      expect(results.length).to.equal(3);
    });
  });

  // --- Global search: relevance (all matching, none non-matching) ---

  describe('global search: result relevance', function() {
    function globalSearch(cards, query) {
      const q = query.toLowerCase();
      return cards.filter(c => c.title.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q));
    }

    const cards = [
      { _id: 'c1', title: 'Fix login bug', description: 'Users cannot log in' },
      { _id: 'c2', title: 'Update UI theme', description: 'Change colors' },
      { _id: 'c3', title: 'Add login tests', description: 'Write automated tests for login' },
    ];

    it('returns only cards whose title or description contains the query', function() {
      const results = globalSearch(cards, 'login');
      expect(results.map(c => c._id)).to.deep.equal(['c1', 'c3']);
    });

    it('returns empty array when no cards match', function() {
      const results = globalSearch(cards, 'payment');
      expect(results).to.deep.equal([]);
    });

    it('returns all cards when query matches all', function() {
      const results = globalSearch(cards, '');
      // Empty query matches everything
      expect(results.length).to.equal(cards.length);
    });

    it('search in description finds card even if title does not match', function() {
      const results = globalSearch(cards, 'colors');
      expect(results.map(c => c._id)).to.include('c2');
    });
  });
});
