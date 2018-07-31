import { Meteor } from 'meteor/meteor';
import { describe, beforeEach, afterEach, it } from 'meteor/practicalmeteor:mocha';
import { stubs, sinon } from 'meteor/practicalmeteor:sinon';
import { expect } from 'meteor/practicalmeteor:chai';
import { BoardsHooks } from './boards-hooks';
import '/models/cards';
import '/models/lists';
import '/models/users';

if (Meteor.isServer) {
  describe('Boards', () => {

    const userId = 'userId';

    function removeAllStubs() {
      stubs.restoreAll();
    }

    describe('CollectionHooks', () => {

      afterEach(removeAllStubs);

      it('addActivityForBoardCreated() should insert a new Activity document', () => {
        const Activities = global.Activities;

        Activities.insert = sinon.stub();
        const board = { _id: 'boardId' };
        BoardsHooks.addActivityForBoardCreated(userId, board);

        expect(Activities.insert).to.be.calledOnce;

        expect(Activities.insert.firstCall.args[0]).to.be.eql({
          activityTypeId: board._id,
          type: 'board',
          activityType: 'createBoard',
          boardId: board._id,
          userId,
        });
      });

      describe('removeLabelFromCardsInBoard()', () => {
        const Cards = global.Cards;

        const emptyBoard = {};
        const emptyFieldNames = [];
        const labelFieldNames = ['labels'];
        const emptyModifier = {};
        const labelModifierButNotById = { $pull: { labels: { lorem: 'ipsum' } } };

        beforeEach(() => {
          Cards.update = sinon.stub();
        });

        afterEach(removeAllStubs);

        it('should not update Cards when field \'labels\' not modified', () => {
          BoardsHooks.removeLabelFromCardsInBoard(userId, emptyBoard, emptyFieldNames, emptyModifier);
          expect(Cards.update).to.not.be.called;

          BoardsHooks.removeLabelFromCardsInBoard(userId, emptyBoard, labelFieldNames, labelModifierButNotById);
          expect(Cards.update).to.not.be.called;
        });

        it('should modify all Cards in Board when label has been removed', () => {

          const labelId = 'labelId';
          const boardId = 'boardId';
          BoardsHooks.removeLabelFromCardsInBoard(userId, { _id: boardId }, labelFieldNames, { $pull: { labels: { _id: labelId } } });

          expect(Cards.update).to.be.called;

          const args = Cards.update.firstCall.args;
          const selector = args[0];
          const modifier = args[1];
          const multi = args[2];
          expect(selector).to.eql({ boardId });
          expect(modifier).to.eql({ $pull: { labelIds: labelId } });
          expect(multi).to.eql({ multi: true });
        });
      });

      describe('removeUserFromBoardObjects()', () => {
        /* Boards.before.update */
        const Cards = global.Cards;
        const Lists = global.Lists;
        const Users = global.Users;

        const emptyBoard = {};

        beforeEach(() => {
          Cards.update = sinon.stub();
          Lists.update = sinon.stub();
          Users.update = sinon.stub();
        });

        afterEach(removeAllStubs);

        const deactivateUserModifier = { $set: { 'members.0.isActive': false } };

        it('should not update Cards when field \'members\' not modified', () => {

          const emptyFieldNames = [];
          BoardsHooks.removeUserFromBoardObjects(userId, emptyBoard, emptyFieldNames, {});
          expect(Cards.update).to.not.be.called;
          expect(Lists.update).to.not.be.called;
          expect(Users.update).to.not.be.called;

          BoardsHooks.removeUserFromBoardObjects(userId, emptyBoard, ['members'], { $pull: { lorem: 'ipsum' } });
          expect(Cards.update).to.not.be.called;
          expect(Lists.update).to.not.be.called;
          expect(Users.update).to.not.be.called;
        });

        it('should not update cards/lists/users when activating user', () => {
          BoardsHooks.removeUserFromBoardObjects(userId, emptyBoard, ['members'], { $set: { 'members.0.isActive': true } });

          expect(Cards.update).to.not.be.called;
          expect(Lists.update).to.not.be.called;
          expect(Users.update).to.not.be.called;
        });

        it('should modify all cards/lists in board when member is to be deactivated/removed', () => {
          const boardId = 'boardId';
          Boards._helpers.prototype.setWatcher = sinon.stub();

          const board = Boards._transform({
            _id: boardId,
            members: [{ userId }],
            permission: 'public',    // update 'profile.starredBoards' by testing separately
          });

          BoardsHooks.removeUserFromBoardObjects(userId, board, ['members'], deactivateUserModifier);

          expect(Cards.update).to.be.called;

          const cardsArgs = Cards.update.firstCall.args;
          expect(cardsArgs[0]).to.eql({ boardId });
          expect(cardsArgs[1]).to.eql({ $pull: { members: userId, watchers: userId } });
          expect(cardsArgs[2]).to.eql({ multi: true });
          expect(cardsArgs.length).to.equal(3);

          expect(Lists.update).to.be.called;
          const listsArgs = Lists.update.firstCall.args;
          expect(listsArgs[0]).to.eql({ boardId });
          expect(listsArgs[1]).to.eql({ $pull: { watchers: userId } });
          expect(listsArgs[2]).to.eql({ multi: true });
          expect(listsArgs.length).to.equal(3);

          // profile.starredBoards update only for private boards
          expect(Users.update).to.not.be.called;
        });

        it('foreachRemovedMember() should evaluate predicate', () => {
          const board = Boards._transform({
            _id: 'boardId',
            members: [{ userId: 'iAmATeam', isTeam: true }, { userId }],
          });

          const modifier = {
            'members.0.isActive': false,
            'members.0.isAdmin': false,
            'members.1.isActive': false,
            'members.1.isAdmin': false,
          };

          const predicateStub = sinon.stub();
          BoardsHooks.Internals.foreachRemovedMember(board, modifier, predicateStub);

          expect(predicateStub.firstCall.args[1]).to.eql('0');
          expect(predicateStub.secondCall.args[1]).to.eql('1');
        });

        it('should remove private board from starred boards of removed user', () => {
          const board = {
            _id: 'boardId',
            members: [{ userId }],
            permission: 'private',
          };
          BoardsHooks.removeUserFromBoardObjects(userId, board, ['members'], deactivateUserModifier);

          expect(Users.update).to.be.called;
          const args = Users.update.firstCall.args;

          expect(args[0]).to.eql(userId);
          expect(args[1]).to.eql({ $pull: { 'profile.starredBoards': board._id } });
          expect(args.length).to.equal(2);
        });
      });

      describe('addActivityWhenMemberAddedOrRemoved()', () => {

        beforeEach(() => {
          global.Activities.insert = sinon.stub();
        });

        afterEach(removeAllStubs);

        it('should not create activities when field \'members\' is untouched', () => {
          BoardsHooks.addActivityWhenMemberAddedOrRemoved(userId, {}, [], {});
          expect(Activities.insert).to.not.be.called;

          // $push adds new members
          BoardsHooks.addActivityWhenMemberAddedOrRemoved(userId, {}, ['members'], { $push: { lorem: 'ipsum' } });
          expect(Activities.insert).to.not.be.called;

          // $set deactivate/remove Members
          BoardsHooks.addActivityWhenMemberAddedOrRemoved(userId, {}, ['members'], { $set: { lorem: 'ipsum' } });
          expect(Activities.insert).to.not.be.called;
        });

        it('should create an activity for a new member', () => {
          const memberId = 'id-of-member';
          const boardId = 'boardId';
          BoardsHooks.addActivityWhenMemberAddedOrRemoved(userId, { _id: boardId }, ['members'], { $push: { members: { userId: memberId } } });

          expect(Activities.insert).to.be.called;

          const activity = Activities.insert.firstCall.args[0];
          expect(activity.userId).to.equal(userId);
          expect(activity.memberId).to.equal(memberId);
          expect(activity.type).to.equal('member');
          expect(activity.activityType).to.equal('addBoardMember');
          expect(activity.boardId).to.equal(boardId);
        });

        it('should create an activity for each removed/deactivated member', () => {
          const boardId = 'boardId';
          const otherMemberId = 'otherMemberId';
          const aMemberId = 'aMemberId';

          const board = {
            _id: boardId,
            members: [
              { userId: aMemberId },
              { userId: otherMemberId },
            ],
          };

          BoardsHooks.addActivityWhenMemberAddedOrRemoved(userId, board, ['members'], {
            $set: {
              'members.0.isActive': false,
              'members.1.isActive': false,
            },
          });

          expect(Activities.insert).to.be.calledTwice;
          expectActivity(Activities.insert.firstCall.args[0], aMemberId);
          expectActivity(Activities.insert.secondCall.args[0], otherMemberId);

          function expectActivity(activity, memberId) {
            expect(activity.userId).to.equal(userId);
            expect(activity.memberId).to.equal(memberId);
            expect(activity.type).to.equal('member');
            expect(activity.activityType).to.equal('removeBoardMember');
            expect(activity.boardId).to.equal(boardId);
          }
        });
      });

      it('teamPredicate() should be true for team memberships', () => {
        const board = {
          members: [
            { userId: 'team', isTeam: true },
            { userId: 'user', isTeam: false },
            { userId: 'user2' },
          ],
        };

        expect(BoardsHooks.Internals.teamPredicate(board, '0')).to.eql(true);
        expect(BoardsHooks.Internals.teamPredicate(board, '1')).to.eql(false);
        expect(BoardsHooks.Internals.teamPredicate(board, '2')).to.eql(false);
      });

      it('userPredicate() should be true for user memberships', () => {
        const board = {
          members: [
            { userId: 'team', isTeam: true },
            { userId: 'user', isTeam: false },
            { userId: 'user2' },
          ],
        };

        expect(BoardsHooks.Internals.userPredicate(board, '0')).to.eql(false);
        expect(BoardsHooks.Internals.userPredicate(board, '1')).to.eql(true);
        expect(BoardsHooks.Internals.userPredicate(board, '2')).to.eql(true);
      });
    });
  });
}
