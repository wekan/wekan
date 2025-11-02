/* eslint-env mocha */
import { expect } from 'chai';
import '../utils';
import '/models/cards';

// Unit tests for canUpdateCard policy (deny direct vote updates)
describe('cards security', function() {
  describe(canUpdateCard.name, function() {
    const userId = 'user1';
    const board = {
      hasMember: (id) => id === userId,
    };
    const doc = { boardId: 'board1' };

    // Patch ReactiveCache.getBoard for this unit test scope if not defined
    const origGetBoard = ReactiveCache && ReactiveCache.getBoard;
    before(function() {
      if (typeof ReactiveCache === 'object') {
        ReactiveCache.getBoard = () => board;
      }
    });
    after(function() {
      if (typeof ReactiveCache === 'object') {
        ReactiveCache.getBoard = origGetBoard;
      }
    });

    it('denies anonymous users', function() {
      expect(canUpdateCard(null, doc, ['title'])).to.equal(false);
    });

    it('denies direct vote updates', function() {
      expect(canUpdateCard(userId, doc, ['vote'])).to.equal(false);
      expect(canUpdateCard(userId, doc, ['vote', 'modifiedAt', 'dateLastActivity'])).to.equal(false);
      expect(canUpdateCard(userId, doc, ['vote.positive'])).to.equal(false);
      expect(canUpdateCard(userId, doc, ['vote.negative'])).to.equal(false);
    });

    it('denies direct poker updates', function() {
      expect(canUpdateCard(userId, doc, ['poker'])).to.equal(false);
      expect(canUpdateCard(userId, doc, ['poker.one'])).to.equal(false);
      expect(canUpdateCard(userId, doc, ['poker.allowNonBoardMembers'])).to.equal(false);
      expect(canUpdateCard(userId, doc, ['poker.end'])).to.equal(false);
    });

    it('allows member updates when not touching vote', function() {
      expect(canUpdateCard(userId, doc, ['title'])).to.equal(true);
      expect(canUpdateCard(userId, doc, ['description', 'modifiedAt'])).to.equal(true);
    });

    it('denies non-members even when not touching vote', function() {
      const nonMemberId = 'user2';
      expect(canUpdateCard(nonMemberId, doc, ['title'])).to.equal(false);
    });
  });
});
