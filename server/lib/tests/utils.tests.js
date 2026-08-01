/* eslint-env mocha */
import { Random } from 'meteor/random';
import { expect } from 'chai';
import sinon from 'sinon';
import Boards from '/models/boards';
import {
  allowIsBoardAdmin,
  allowIsBoardMember,
  allowIsAnyBoardMember,
  allowIsBoardMemberCommentOnly,
  allowIsBoardMemberNoComments,
  allowIsBoardMemberByCard,
} from '../utils';

describe('utils', function() {
  afterEach(function() {
    sinon.restore();
  });

  describe(allowIsBoardAdmin.name, function() {
    it('returns if a board has an admin', function() {
      const userId = Random.id();
      const board = {
        hasAdmin: id => {
          return id === userId;
        }
      };

      expect(allowIsBoardAdmin(userId, board)).to.equal(true);
      expect(allowIsBoardAdmin(Random.id(), board)).to.equal(false);
    });
  });

  describe(allowIsBoardMember.name, function() {
    it('returns if a board has a member', function() {
      const userId = Random.id();
      const board = {
        hasMember: id => {
          return id === userId;
        }
      };

      expect(allowIsBoardMember(userId, board)).to.equal(true);
      expect(allowIsBoardMember(Random.id(), board)).to.equal(false);
    });
  });

  describe(allowIsAnyBoardMember.name, function() {
    it('returns if any board has a member', function() {
      const userId = Random.id();
      const boardsExpectedTrue = [{
        hasMember: id => {
          return id === userId;
        }
      }];

      expect(allowIsAnyBoardMember(userId, boardsExpectedTrue)).to.equal(true);
      expect(allowIsAnyBoardMember(Random.id(), boardsExpectedTrue)).to.equal(false);

      const boardsExpectedFalse = [{
        hasMember: () => false
      }];

      expect(allowIsAnyBoardMember(userId, boardsExpectedFalse)).to.equal(false);
      expect(allowIsAnyBoardMember(Random.id(), boardsExpectedFalse)).to.equal(false);
    });
  });

  describe(allowIsBoardMemberCommentOnly.name, function() {
    it('returns if a board has a member that can post comments', function() {
      // The stub is a board's MEMBERS now, not a set of hasX() methods. This
      // function used to ask the board `hasMember` / `hasReadOnly` /
      // `hasNoComments` and spell the rule out as a list of flags; it asks the
      // one capability table instead (models/lib/boardRoleCapabilities.js), and
      // that table reads `board.members`. A stub with the old methods and no
      // `members` array answered false for everyone, because there was no
      // member to find - the test was describing an implementation that is gone
      // rather than a behaviour that changed.
      //
      // `isActive: true` is required by memberRoleOf: an inactive member has no
      // role at all, which is what makes a removed member unable to comment.
      const userId = Random.id();
      const board = {
        members: [{ userId, isActive: true }],
      };

      expect(allowIsBoardMemberCommentOnly(userId, board)).to.equal(true);
      expect(allowIsBoardMemberCommentOnly(Random.id(), board)).to.equal(false);
    });

    it('and a member who may not comment cannot', function() {
      // The point of the function, and what the old stub could not express:
      // it is the ROLE that decides, not membership.
      const userId = Random.id();
      const noComments = { members: [{ userId, isActive: true, isNoComments: true }] };
      expect(allowIsBoardMemberCommentOnly(userId, noComments)).to.equal(false);

      const readOnly = { members: [{ userId, isActive: true, isReadOnly: true }] };
      expect(allowIsBoardMemberCommentOnly(userId, readOnly)).to.equal(false);

      // ...and an INACTIVE member of any role: a removed member is not a member.
      const inactive = { members: [{ userId, isActive: false }] };
      expect(allowIsBoardMemberCommentOnly(userId, inactive)).to.equal(false);
    });
  });

  describe(allowIsBoardMemberNoComments.name, function() {
    it('returns if a board has a member that has comment any comments', function() {
      const userId = Random.id();
      const board = {
        hasMember: id => {
          return id === userId;
        },
        hasNoComments: id => {
          return id !== userId;
        }
      };

      expect(allowIsBoardMemberNoComments(userId, board)).to.equal(true);
      expect(allowIsBoardMemberNoComments(Random.id(), board)).to.equal(false);
    });
  });

  describe(allowIsBoardMemberByCard.name, function() {
    it('returns if the board for a given card has a member', async function() {
      const userId = Random.id();
      const board = {
        hasMember: id => id === userId,
      };
      const card = { boardId: 'board1' };
      sinon.stub(Boards, 'findOneAsync').resolves(board);

      expect(await allowIsBoardMemberByCard(userId, card)).to.equal(true);
      expect(await allowIsBoardMemberByCard(Random.id(), card)).to.equal(false);
    });
  });
});
