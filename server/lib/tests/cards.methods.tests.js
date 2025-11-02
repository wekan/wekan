/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import { Meteor } from 'meteor/meteor';
import '/models/cards';

// Helpers to access method handlers
const voteHandler = () => Meteor.server.method_handlers['cards.vote'];
const pokerVoteHandler = () => Meteor.server.method_handlers['cards.pokerVote'];

// Preserve originals to restore after stubbing
const origGetCard = ReactiveCache.getCard;
const origGetBoard = ReactiveCache.getBoard;

describe('cards methods security', function() {
  let updateStub;

  beforeEach(function() {
    // Stub collection update to capture modifiers
    updateStub = sinon.stub(Cards, 'update').returns(1);
  });

  afterEach(function() {
    if (updateStub) updateStub.restore();
    ReactiveCache.getCard = origGetCard;
    ReactiveCache.getBoard = origGetBoard;
  });

  describe('cards.vote', function() {
    it('denies non-member when allowNonBoardMembers=false', function() {
      const cardId = 'card1';
      const callerId = 'user-nonmember';
      const board = { hasMember: id => id === 'someone-else' };
      const card = { _id: cardId, boardId: 'board1', vote: { allowNonBoardMembers: false } };

      ReactiveCache.getCard = () => card;
      ReactiveCache.getBoard = () => board;

      const callMethod = () => voteHandler().call({ userId: callerId }, cardId, true);
      expect(callMethod).to.throw();
      expect(updateStub.called).to.equal(false);
    });

    it('allows non-member only for own userId when allowNonBoardMembers=true', function() {
      const cardId = 'card2';
      const callerId = 'user-guest';
      const board = { hasMember: id => id === 'someone-else' };
      const card = { _id: cardId, boardId: 'board2', vote: { allowNonBoardMembers: true } };

      ReactiveCache.getCard = () => card;
      ReactiveCache.getBoard = () => board;

      voteHandler().call({ userId: callerId }, cardId, true);

      expect(updateStub.calledOnce).to.equal(true);
      const [, modifier] = updateStub.getCall(0).args;
      expect(modifier.$addToSet['vote.positive']).to.equal(callerId);
      expect(modifier.$pull['vote.negative']).to.equal(callerId);
      expect(modifier.$set.modifiedAt).to.be.instanceOf(Date);
      expect(modifier.$set.dateLastActivity).to.be.instanceOf(Date);
    });

    it('ensures member votes only affect caller userId', function() {
      const cardId = 'card3';
      const callerId = 'member1';
      const otherId = 'member2';
      const board = { hasMember: id => (id === callerId || id === otherId) };
      const card = { _id: cardId, boardId: 'board3', vote: { allowNonBoardMembers: false } };

      ReactiveCache.getCard = () => card;
      ReactiveCache.getBoard = () => board;

      voteHandler().call({ userId: callerId }, cardId, true);

      expect(updateStub.calledOnce).to.equal(true);
      const [, modifier] = updateStub.getCall(0).args;
      // Only callerId present in modifier
      expect(modifier.$addToSet['vote.positive']).to.equal(callerId);
      expect(modifier.$pull['vote.negative']).to.equal(callerId);
    });
  });

  describe('cards.pokerVote', function() {
    it('denies non-member when allowNonBoardMembers=false', function() {
      const cardId = 'card4';
      const callerId = 'nm';
      const board = { hasMember: id => id === 'someone-else' };
      const card = { _id: cardId, boardId: 'board4', poker: { allowNonBoardMembers: false } };

      ReactiveCache.getCard = () => card;
      ReactiveCache.getBoard = () => board;

      const callMethod = () => pokerVoteHandler().call({ userId: callerId }, cardId, 'five');
      expect(callMethod).to.throw();
      expect(updateStub.called).to.equal(false);
    });

    it('allows non-member only for own userId when allowNonBoardMembers=true', function() {
      const cardId = 'card5';
      const callerId = 'guest';
      const board = { hasMember: id => id === 'someone-else' };
      const card = { _id: cardId, boardId: 'board5', poker: { allowNonBoardMembers: true } };

      ReactiveCache.getCard = () => card;
      ReactiveCache.getBoard = () => board;

      pokerVoteHandler().call({ userId: callerId }, cardId, 'eight');

      expect(updateStub.calledOnce).to.equal(true);
      const [, modifier] = updateStub.getCall(0).args;
      expect(modifier.$addToSet['poker.eight']).to.equal(callerId);
      // Ensure removal from other buckets includes callerId
      expect(modifier.$pull['poker.one']).to.equal(callerId);
      expect(modifier.$set.modifiedAt).to.be.instanceOf(Date);
      expect(modifier.$set.dateLastActivity).to.be.instanceOf(Date);
    });
  });
});
