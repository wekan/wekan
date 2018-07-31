import { expect } from 'meteor/practicalmeteor:chai';
import { describe, it } from 'meteor/practicalmeteor:mocha';
import { Meteor } from 'meteor/meteor';
import { BoardsRestrictions } from './boards-restrictions';

if (Meteor.isServer) {
  describe('BoardsRestrictions', function () {

    const userId = 'editingUserId';
    const memberFieldNames = ['members'];
    const memberModifier = { $pull: { members: { userId } } };

    it('denyUserIsLastAdmin() should return false if not modifying board members', function () {
      expect(BoardsRestrictions.denyUserIsLastAdmin(null, null, [], {})).to.be.false;
    });

    it('denyUserIsLastAdmin() should return false if not $pull-ing from board members', function () {
      expect(BoardsRestrictions.denyUserIsLastAdmin(null, null, memberFieldNames, {})).to.be.false;
      expect(BoardsRestrictions.denyUserIsLastAdmin(null, null, memberFieldNames, { $pull: { labels: { userId: 'ignored' } } })).to.be.false;
    });

    it('denyUserIsLastAdmin() should return false if board has more than 1 active admin member', function () {
      expect(BoardsRestrictions.denyUserIsLastAdmin(null, {
        members: [
          { isAdmin: true, isActive: true },
          { isAdmin: true, isActive: true },
        ],
      }, memberFieldNames, memberModifier)).to.be.false;
    });

    it('denyUserIsLastAdmin() should return true if userId is the only active admin member of board', function () {
      expect(BoardsRestrictions.denyUserIsLastAdmin(null, {
        members: [
          { userId, isAdmin: true, isActive: true },
        ],
      }, memberFieldNames, memberModifier)).to.be.true;

      expect(BoardsRestrictions.denyUserIsLastAdmin(null, {
        members: [
          { userId, isAdmin: true, isActive: true },
          { userId: 'otherUserId', isAdmin: true, isActive: true },
        ],
      }, memberFieldNames, memberModifier)).to.be.false;
    });
  });
}

if (Meteor.isClient) {
  describe('BoardsRestrictions', function () {
    it('should be undefined', () => expect(BoardsRestrictions).to.be.undefined);
  });
}
