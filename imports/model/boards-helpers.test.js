import { expect } from 'meteor/practicalmeteor:chai';
import { it, describe, beforeEach, afterEach } from 'meteor/practicalmeteor:mocha';
import { sinon, stubs } from 'meteor/practicalmeteor:sinon';
import { Meteor } from 'meteor/meteor';
import { Teams } from '/imports/model/teams';

if (Meteor.isServer) {
  require('../../server/lib/utils');
}

require('../../models/boards');
require('../../models/activities');
require('../../models/lists');

describe('Boards', function () {

  const userId = 'test-userId';
  const boardId = 'test-boardId';
  let board;

  describe('helpers', function () {
    function resetBoard() {
      board = Boards._transform({
        _id: boardId,
      });
    }

    beforeEach(function () {
      resetBoard();
    });

    afterEach(function () {
      stubs.restoreAll();
    });

    it('isVisibleBy() returns always true for public boards', function () {
      board.isPublic = sinon.stub().returns(true);
      expect(board.isVisibleBy(userId)).to.be.true;
    });

    it('isVisibleBy() returns true for private boards when user is board member', function () {
      const user = {
        _id: userId,
      };

      board.isPublic = sinon.stub().returns(false);
      board.isActiveMember = sinon.stub();
      board.isActiveMember.onCall(0).returns(false);
      board.isActiveMember.returns(true);

      expect(board.isVisibleBy(user)).to.be.false;

      board.isActiveMember.returns(true);
      expect(board.isVisibleBy(user)).to.be.true;
    });

    it('isActiveMember() returns false when no userId specified', function () {
      expect(board.isActiveMember()).to.be.false;
    });

    it('isActiveMember() returns undefined if no matching member found', function () {
      const members = [];
      board.organizationMembers = sinon.stub().returns(members);

      expect(board.isActiveMember(userId)).to.be.undefined;

      members.push({
        userId,
        isActive: false,
      });

      expect(board.isActiveMember(userId)).to.be.undefined;
    });

    it('isActiveMember() returns the matching membership if user is member and the membership is active', function () {
      const document = {
        userId,
        isActive: true,
      };
      board.members = [document];

      expect(board.isActiveMember(userId)).to.equal(document);
    });

    it('isPublic() should return public if permissions field is set to `public`', function () {
      board.permission = 'public';
      expect(board.isPublic()).to.be.true;

      board.permission = 'something-else';
      expect(board.isPublic()).to.be.false;

      delete board.permission;
      expect(board.isPublic()).to.be.false;

      board.permission = {};
      expect(board.isPublic()).to.be.false;
    });

    it('lists() should query unarchived lists of board', function () {
      global.Lists.find = sinon.stub();
      board.lists();
      expect(Lists.find).calledWith({ boardId, archived: false }, { sort: { sort: 1 } });
      global.Lists.find.reset();
    });

    it('activities() should query activitites collection with boardId', function () {
      global.Activities.find = sinon.stub();
      board.activities();
      expect(Activities.find).calledWith({ boardId }, { sort: { createdAt: -1 } });
      global.Activities.find.reset();
    });

    it('activeMembers() should use isActive flag', function () {
      const inactiveOne = { id: 1, active: true };
      const activeOne = { id: 2, isActive: true, isTeam: true };
      const activeTwo = { id: 22, isActive: true, isTeam: false };
      const activeThree = { id: 222, isActive: true };
      const inactiveTwo = { id: 3, active: true };
      const inactiveThree = { id: 33 };

      board.organizationMembers = sinon.stub().returns([inactiveOne, activeOne, inactiveTwo, activeTwo, activeThree, inactiveThree]);
      const activeMembers = board.activeMembers();

      expect(activeMembers).to.deep.contain.members([activeTwo, activeThree, activeOne]);
      expect(activeMembers).to.not.deep.contain.members([inactiveTwo, inactiveOne, inactiveThree]);
    });

    it('activeAdmins() should use isActive and isAdmin flags', function () {
      const activeMember = { id: 1, isActive: true, isAdmin: false };
      const activeAdmin = { id: 2, isActive: true, isAdmin: true };
      const inactiveAdmin = { id: 3, isActive: false, isAdmin: true };
      const inactiveMember = { id: 4, isActive: false, isAdmin: false };

      board.organizationMembers = sinon.stub().returns([activeAdmin, activeMember, inactiveAdmin, inactiveMember]);
      const activeAdmins = board.activeAdmins();

      expect(activeAdmins).to.deep.contain.members([activeAdmin]);
      expect(activeAdmins).to.not.deep.contain.members([inactiveMember, inactiveAdmin, activeMember]);
    });

    it('memberUsers() should query Users collection by userIds of board members, includes members of teams', function () {
      global.Users.find = sinon.stub();

      board.organizationMembers = sinon.stub().returns([
        { userId },
        { userId: 'testingcodeuser1' },
        { userId: 'testingcodeuser2' },
        { userId: 'testingcodeuser3' },
        {
          userId: 'testingteam',
          isTeam: true,
        },
      ]);

      board.memberUsers();

      expect(Users.find).calledWith({ _id: { $in: [userId, 'testingcodeuser1', 'testingcodeuser2', 'testingcodeuser3'] } });
      global.Users.find.reset();
    });

    it('memberTeams() should query Teams collection', function () {
      Teams.find = sinon.stub();
      const teamId = 'teamId';

      board.members = [{ userId, isTeam: false }, { userId: teamId, isTeam: true }];
      board.memberTeams();
      expect(Teams.find).calledWith({ _id: { $in: [teamId] } });
    });

    it('getLabel() should find label by name and color', function () {
      const result = { name: 'blue label', color: 'blue' };
      board.labels = [
        { name: 'a blue label', color: 'blue' },
        { name: 'blue label' },
        { color: 'blue' },
        result,
        { name: 'label with blue color', color: 'blue' },
      ];

      expect(board.getLabel('blue label', 'blue')).to.equal(result);
      expect(board.getLabel('not a label', 'blue')).to.be.undefined;
    });

    it('labelIndex should return index of label by its _id field', function () {
      board.labels = [
        { _id: 'five' }, { _id: 'twelve' }, { _id: 'minus eight' },
      ];

      expect(board.labelIndex('unavailable')).to.equal(-1);
      expect(board.labelIndex('five')).to.equal(0);
      expect(board.labelIndex('twelve')).to.equal(1);
      expect(board.labelIndex('minus eight')).to.equal(2);
    });

    it('memberIndex should return index of a member by its _userId field', function () {
      board.members = [
        { userId: 'five' }, { userId: 'twelve' }, { userId: 'minus eight' },
      ];

      expect(board.memberIndex('unavailable')).to.equal(-1);
      expect(board.memberIndex('five')).to.equal(0);
      expect(board.memberIndex('twelve')).to.equal(1);
      expect(board.memberIndex('minus eight')).to.equal(2);
    });

    it('organizationMembers() should generate a membership for each active user in each team and keep attributes', function () {
      const teamId = 'teamId';
      Teams.find = sinon.stub().returns([{ _id: teamId, members: ['teamUserA', 'teamUserB'] }]);

      board.members = [
        { userId, isTeam: false, isActive: true, isAdmin: false },
        { userId: 'inactiveUser', isTeam: false, isActive: false, isAdmin: false },
        { userId: teamId, isTeam: true, isActive: true, isAdmin: false },
      ];

      const allMembers = board.organizationMembers();
      expect(_.isArray(allMembers)).to.be.true;
      expect(allMembers.length).to.equal(4);
      expect(allMembers).to.deep.contain.members([
        { userId, isTeam: false, isActive: true, isAdmin: false },
        { userId: teamId, isTeam: true, isActive: true, isAdmin: false },
        { userId: 'teamUserA', isTeam: false, isActive: true, isAdmin: false },
        { userId: 'teamUserB', isTeam: false, isActive: true, isAdmin: false },
      ]);
    });

    it('organizationMembers() should not contain duplicates', () => {
      const teamId = 'teamId';
      board.members = [
        { userId: teamId, isTeam: true, isAdmin: false, isActive: true },
        { userId, isTeam: false, isAdmin: true, isActive:true },
      ];

      Teams.find = sinon.stub().returns([{ _id: teamId, members: [userId] }]);
      const organizationMembers = board.organizationMembers();
      expect(organizationMembers.length).to.eql(2);
      expect(organizationMembers).to.deep.contain.members([
        { userId, isTeam: false, isActive: true, isAdmin: true },
        { userId: teamId, isTeam: true, isActive: true, isAdmin: false },
      ]);
    });

    it('hasMember() ignores inactive members', function () {
      Teams.find = sinon.stub().returns([]);

      board.members = [
        { userId, isActive: false, isTeam: false },
        { userId, isActive: false, isTeam: true },
      ];
      expect(board.hasMember(userId)).to.be.false;

      board.members = [{ userId, isActive: true, isTeam: false }];
      expect(board.hasMember(userId)).to.be.true;
    });

    it('hasAdmin() ignores inactive admins', function () {
      Teams.find = sinon.stub().returns([]);

      board.members = [{ userId, isActive: true, isAdmin: false }];
      expect(board.hasAdmin(userId)).to.be.false;

      board.members = [{ userId, isActive: false, isAdmin: true }];
      expect(board.hasAdmin(userId)).to.be.false;

      board.members = [{ userId, isActive: true, isAdmin: true }];
      expect(board.hasAdmin(userId)).to.be.true;
    });

    it('absoluteUrl() should query FlowRouter.url', function () {
      global.FlowRouter.url = sinon.stub();
      board.slug = 'slug';

      board.absoluteUrl();

      expect(FlowRouter.url).calledWith('board', { id: boardId, slug: 'slug' });
      global.FlowRouter.url.reset();
    });

    it('colorClass() should return blaze expression for css class name', function () {
      board.color = 'whatever';
      expect(board.colorClass()).to.be.equal('board-color-whatever');
    });

    it('pushLabel() should return id of newly created label', function () {
      global.Boards.direct.update = sinon.stub();
      const name = 'name', color = 'color';
      const generatedLabelId = board.pushLabel(name, color);

      const args = global.Boards.direct.update.args[0];
      expect(args[1].$push.labels._id).to.equal(generatedLabelId);
      global.Boards.direct.update.reset();
    });
  });
});
