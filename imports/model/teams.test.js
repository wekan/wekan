import { expect } from 'meteor/practicalmeteor:chai';
import { describe, it, beforeEach, afterEach } from 'meteor/practicalmeteor:mocha';
import { sinon, stubs } from 'meteor/practicalmeteor:sinon';
import { Teams } from './teams';
import { Meteor } from 'meteor/meteor';

const Boards = global.Boards;

describe('Teams', () => {

  describe('helpers', () => {

    let team;
    const teamId = 'test-team-id';

    beforeEach(() => {
      global.Users.find = sinon.stub();
      team = Teams._transform({_id: teamId});
    });

    afterEach(function () {
      stubs.restoreAll();
    });

    it('memberUsers() should list user documents of members', () => {
      team.members = ['testingcodeuser1', 'testingcodeuser2', 'testingcodeuser3'];
      team.memberUsers();
      expect(Users.find).calledWith({_id: {$in: team.members}});
    });

    it('addMember() should add userId to field \'members\'', () => {
      Teams.exists = sinon.stub().returns(false);
      Teams.update = sinon.stub();
      const userId = 'user-to-add';
      team.addMember(userId);
      expect(Teams.update).calledWith(teamId, {$addToSet: {members: userId}});
    });

    it('addMember() should deny adding sub-teams', () => {
      Teams.exists = sinon.stub().returns(true);
      Teams.update = sinon.stub();

      team.addMember('team-to-add');
      expect(Teams.update).to.not.be.called;
    });

    it('boards() should query Boards', () => {
      Boards.find = sinon.stub();
      team.boards();
      expect(Boards.find).calledWith({members: {$elemMatch: {userId: teamId, isTeam: true}}});
    });

    it('removeMember() should remove userId from field \'members\'', () => {
      Teams.update = sinon.stub();
      const memberId = 'teamMemberId';
      team.members = [memberId, 'anotherUserId'];
      team.removeMember(memberId);
      expect(Teams.update).calledWith(teamId, {$pull: {members: memberId}});
    });

    it('removeMember() should not remove last member', () => {
      Teams.update = sinon.stub();
      team.members = ['memberId'];
      team.removeMember('memberId');
      expect(Teams.update).not.to.be.called;
    });
  });

  if (Meteor.isServer) {

    describe('methods', () => {
      const memberId = 'memberId';
      const teamId = 'teamId';
      let team;

      beforeEach(() => {
        team = Teams._transform({
          _id: teamId,
          members: [memberId],
        });

        global.Users.find = sinon.stub();
        Teams.findOne = sinon.stub().returns(team);
      });

      afterEach(() => stubs.restoreAll());

      it('deleteTeam() should fail when user is not member of team', () => {
        Meteor.userId = sinon.stub().returns('not-a-team-member');
        Meteor.call('deleteTeam', teamId, (err, ret) => { // eslint-disable-line no-unused-vars
          expect(err).not.to.be.undefined;
        });
      });

      it('deleteTeam() should disable all board memberships of this team', () => {
        function makeBoardStubInstance(boardId, method) {
          const board = Boards._transform({_id: boardId});
          board[method] = sinon.stub();
          return board;
        }

        Meteor.userId = sinon.stub().returns(memberId);
        const board1 = makeBoardStubInstance('board1', 'removeMember');
        const board2 = makeBoardStubInstance('board2', 'removeMember');

        Users.find.returns([]);

        Boards.find = sinon.stub().returns([board1, board2]);

        Meteor.call('deleteTeam', teamId, (err, ret) => { // eslint-disable-line no-unused-vars
          expect(board1.removeMember).to.be.calledWith(teamId);
          expect(board2.removeMember).to.be.calledWith(teamId);
        });

        // Test if the board members are loaded; The stub returns []
        // because 'removeUserFromTeam' is not tested here (yet?).
        expect(Users.find).calledWith({_id: {$in: [memberId]}});
      });
    });
  }
});
