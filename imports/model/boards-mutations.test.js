import { expect } from 'meteor/practicalmeteor:chai';
import { it, describe, beforeEach, afterEach } from 'meteor/practicalmeteor:mocha';
import { sinon, stubs } from 'meteor/practicalmeteor:sinon';
import { Meteor } from 'meteor/meteor';

if (Meteor.isServer) {
  require('../../server/lib/utils.js');
}

require('../../models/boards.js');

describe('Boards', function () {

  let board;
  const boardId = 'test-boardId';

  function createBoardsStub() {
    global.Boards.update = sinon.stub();
  }

  function resetAllStubs() {
    stubs.restoreAll();
  }

  function createBoard() {
    board = Boards._transform({
      _id: boardId,
    });
  }

  describe('mutations', function () {

    beforeEach(function () {
      createBoardsStub();
      createBoard();
    });

    afterEach(resetAllStubs);

    it('archive() should set archived flag = true', function () {
      board.archive();
      expect(Boards.update).calledWith(boardId, { $set: { archived: true } });
    });

    it('restore() should set archived flag = false', function () {
      board.restore();
      expect(Boards.update).calledWith(boardId, { $set: { archived: false } });
    });

    it('rename() should modify the board\'s name', function () {
      const title = 'new title';
      board.rename(title);
      expect(Boards.update).calledWith(boardId, { $set: { title } });
    });

    it('setDescription() should modify the board\'s description', function () {
      const description = 'new-description';
      board.setDescription(description);
      expect(Boards.update).calledWith(boardId, { $set: { description } });
    });

    it('setColor() should modify the board\'s color', function () {
      const color = 'new-color';
      board.setColor(color);
      expect(Boards.update).calledWith(boardId, { $set: { color } });
    });

    it('setVisibility() should modify the permission field', function () {
      const visibility = 'whatever';
      board.setVisibility(visibility);
      expect(Boards.update).calledWith(boardId, { $set: { permission: visibility } });
    });

    it('addLabel() should do nothing if label with same name AND color already exists', function () {
      board.getLabel = sinon.stub().returns(true);
      board.addLabel('no-one', 'cares');
      expect(Boards.update).calledWith(boardId, {});
    });

    it('addLabel() should add a new label to the board', function () {
      board.getLabel = sinon.stub().returns(false);
      board.addLabel('name', 'color');

      expect(Boards.update).to.be.called;
      // because addLabel generates the _id of the label with Random, and for Random no stub()
      // works: compare properties "by hand"
      const args = Boards.update.args[0];
      expect(args[1].$push.labels).to.have.property('name', 'name');
      expect(args[1].$push.labels).to.have.property('color', 'color');
    });

    it('editLabel() should do nothing if label with same name AND color already exists', function () {
      board.getLabel = sinon.stub().returns({ id: 'found' });
      board.editLabel('label-to-edit', 'new-label', 'new-color');
      expect(Boards.update).calledWith(boardId, {});
    });

    it('editLabel() should modify existing label by index', function () {
      const labelIndex = 5;
      board.getLabel = sinon.stub().returns(undefined);
      board.labelIndex = sinon.stub().returns(labelIndex);

      board.editLabel('labelId', 'new-name', 'new-color');

      expect(Boards.update).calledWith(boardId, {
        $set: {
          'labels.5.name': 'new-name',
          'labels.5.color': 'new-color',
        },
      });
    });

    it('removeLabel() should remove label by labelId', function () {
      const labelId = 'labelId';
      board.removeLabel(labelId);
      expect(Boards.update).calledWith(boardId, {
        $pull: {
          labels: {
            _id: labelId,
          },
        },
      });
    });

    it('addMember() should activate inactive member', function () {
      const inactiveUserId = 'memberId';
      board.members = [
        {
          userId: inactiveUserId,
          isActive: false,
        },
      ];

      board.addMember(inactiveUserId);

      expect(Boards.update).calledWith(boardId, {
        $set: {
          'members.0.isActive': true,
        },
      });
    });

    it('addMember() should add new member without admin flag as user by default', function () {
      const newMemberId = 'memberToAdd';
      board.addMember(newMemberId);
      expect(Boards.update).calledWith(boardId, {
        $push: {
          members: {
            userId: newMemberId,
            isAdmin: false,
            isActive: true,
            isCommentOnly: false,
            isTeam: false,
          },
        },
      });
    });

    it('addMember() should add new member team without admin flag', function () {
      const newMemberId = 'memberToAdd';
      board.addMember(newMemberId, true);
      expect(Boards.update).calledWith(boardId, {
        $push: {
          members: {
            userId: newMemberId,
            isAdmin: false,
            isActive: true,
            isCommentOnly: false,
            isTeam: true,
          },
        },
      });
    });

    it('removeMember() should not remove the last remaining board admin', function () {
      board.members = [
        { isAdmin: false },
        { isAdmin: true },
      ];

      board.memberIndex = sinon.stub().returns(1);
      board.activeAdmins = sinon.stub().returns(1);

      board.removeMember('stubbedAdmin');

      expect(Boards.update).calledWith(boardId, {
        $set: {
          'members.1.isActive': true,
        },
      });
    });

    it('removeMember() should deactivate admin member and revoke admin permission', function () {
      const arrayWithLengthGreaterThan1 = [1, 2, 3, 4, 5];
      board.members = [
        { isAdmin: true },
      ];
      board.memberIndex = sinon.stub().returns(0);
      board.activeAdmins = sinon.stub().returns(arrayWithLengthGreaterThan1);

      board.removeMember('notTheOnlyAdminOfTheBoard');

      expect(Boards.update).calledWith(boardId, {
        $set: {
          'members.0.isActive': false,
          'members.0.isAdmin': false,
        },
      });
    });

    it('removeMember() should deactivate normal member', function () {
      board.memberIndex = sinon.stub().returns(0);
      board.activeAdmins = sinon.stub().returns(1);
      board.members = [{ isAdmin: false }];

      board.removeMember('normalUserId');

      expect(Boards.update).calledWith(boardId, {
        $set: {
          'members.0.isActive': false,
          'members.0.isAdmin': false,
        },
      });
    });

    it('setMemberPermission() should not change permissions of self', function () {
      const selfUserId = 'self';
      const memberIndex = 0;
      Meteor.userId = sinon.stub().returns(selfUserId);
      board.memberIndex = sinon.stub().returns(memberIndex);

      changeOwnPermission(memberIndex, true, false, false);
      changeOwnPermission(memberIndex, false, true, false);

      function changeOwnPermission(memberIndex, fromPermission, toPermission, isCommentOnly) {
        board.members = [{ isAdmin: fromPermission }];
        board.setMemberPermission(selfUserId, toPermission, isCommentOnly);

        expect(Boards.update).calledWith(boardId, {
          $set: {
            [`members.${memberIndex}.isAdmin`]: fromPermission,
            [`members.${memberIndex}.isCommentOnly`]: isCommentOnly,
          },
        });
      }
    });

    it('setMemberPermission() should change permissions of others', function () {
      testSetPermission(true, false);
      testSetPermission(false, false);

      function testSetPermission(isAdmin, isCommentOnly) {
        board.memberIndex = sinon.stub().returns(5);
        board.setMemberPermission('memberId', isAdmin, isCommentOnly);
        expect(Boards.update).calledWith(boardId, {
          $set: {
            'members.5.isAdmin': isAdmin,
            'members.5.isCommentOnly': isCommentOnly,
          },
        });
      }
    });
  });

});
