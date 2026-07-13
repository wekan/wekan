/* eslint-env mocha */
import { expect } from 'chai';
import { Random } from 'meteor/random';
import { canUpdateBoardSort } from '../utils';

// Unit tests for canUpdateBoardSort policy

describe('boards security', function() {
  describe(canUpdateBoardSort.name, function() {
    it('denies anonymous updates even if fieldNames include sort', function() {
      const userId = null;
      const board = {
        hasMember: () => true,
      };
      const fieldNames = ['sort'];

      expect(canUpdateBoardSort(userId, board, fieldNames)).to.equal(false);
    });

    it('denies updates by non-members', function() {
      const userId = Random.id();
      const board = {
        hasMember: (id) => id === 'someone-else',
      };
      const fieldNames = ['sort'];

      expect(canUpdateBoardSort(userId, board, fieldNames)).to.equal(false);
    });

    it('allows updates when user is a member and updating sort', function() {
      const userId = Random.id();
      const board = {
        hasMember: (id) => id === userId,
      };
      const fieldNames = ['sort'];

      expect(canUpdateBoardSort(userId, board, fieldNames)).to.equal(true);
    });

    it('denies updates when not updating sort', function() {
      const userId = Random.id();
      const board = {
        hasMember: (id) => id === userId,
      };
      const fieldNames = ['title'];

      expect(canUpdateBoardSort(userId, board, fieldNames)).to.equal(false);
    });

    // SortBleed (GHSA-xm8x-c8wg-jhmf): a member must not be able to smuggle
    // other fields (members, permission, title, ...) into the same modifier as
    // sort. The sort rule may only approve an update that touches sort ALONE.
    it('denies multi-field updates that smuggle other fields alongside sort', function() {
      const userId = Random.id();
      const board = {
        hasMember: (id) => id === userId,
      };

      expect(
        canUpdateBoardSort(userId, board, ['sort', 'members']),
      ).to.equal(false);
      expect(
        canUpdateBoardSort(userId, board, ['sort', 'permission', 'title']),
      ).to.equal(false);
      expect(
        canUpdateBoardSort(userId, board, ['members', 'sort']),
      ).to.equal(false);
    });

    it('denies an empty fieldNames array', function() {
      const userId = Random.id();
      const board = {
        hasMember: (id) => id === userId,
      };

      expect(canUpdateBoardSort(userId, board, [])).to.equal(false);
    });
  });
});
