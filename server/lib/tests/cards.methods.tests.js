/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import { Meteor } from 'meteor/meteor';
import Cards from '/models/cards';
import { ReactiveCache } from '/imports/reactiveCache';
// The `meteor test` entry only loads what test files import; the app registers
// these Meteor methods via server/main.js → /server/imports. Load the file that
// registers cards.vote / cards.pokerVote so their handlers exist.
import '/server/models/cards';

// Helpers to access method handlers
const voteHandler = () => Meteor.server.method_handlers['cards.vote'];
const pokerVoteHandler = () => Meteor.server.method_handlers['cards.pokerVote'];

// Preserve originals to restore after stubbing
const origGetCard = ReactiveCache.getCard;
const origGetBoard = ReactiveCache.getBoard;

describe('cards methods security', function() {
  let updateStub;

  beforeEach(function() {
    // The cards.vote / cards.pokerVote methods persist via Cards.updateAsync
    // (async server API), so stub that to capture modifiers.
    updateStub = sinon.stub(Cards, 'updateAsync').resolves(1);
  });

  afterEach(function() {
    if (updateStub) updateStub.restore();
    ReactiveCache.getCard = origGetCard;
    ReactiveCache.getBoard = origGetBoard;
  });

  describe('cards.vote', function() {
    it('denies non-member when allowNonBoardMembers=false', async function() {
      const cardId = 'card1';
      const callerId = 'user-nonmember';
      const board = { hasMember: id => id === 'someone-else' };
      const card = { _id: cardId, boardId: 'board1', vote: { allowNonBoardMembers: false } };

      ReactiveCache.getCard = () => card;
      ReactiveCache.getBoard = () => board;

      let thrown;
      try {
        await voteHandler().call({ userId: callerId }, cardId, true);
      } catch (error) {
        thrown = error;
      }
      expect(thrown).to.exist;
      expect(updateStub.called).to.equal(false);
    });

    it('allows non-member only for own userId when allowNonBoardMembers=true', async function() {
      const cardId = 'card2';
      const callerId = 'user-guest';
      const board = { hasMember: id => id === 'someone-else' };
      const card = { _id: cardId, boardId: 'board2', vote: { allowNonBoardMembers: true } };

      ReactiveCache.getCard = () => card;
      ReactiveCache.getBoard = () => board;

      await voteHandler().call({ userId: callerId }, cardId, true);

      expect(updateStub.calledOnce).to.equal(true);
      const [, modifier] = updateStub.getCall(0).args;
      expect(modifier.$addToSet['vote.positive']).to.equal(callerId);
      expect(modifier.$pull['vote.negative']).to.equal(callerId);
      expect(modifier.$set.modifiedAt).to.be.instanceOf(Date);
      expect(modifier.$set.dateLastActivity).to.be.instanceOf(Date);
    });

    it('ensures member votes only affect caller userId', async function() {
      const cardId = 'card3';
      const callerId = 'member1';
      const otherId = 'member2';
      const board = { hasMember: id => (id === callerId || id === otherId) };
      const card = { _id: cardId, boardId: 'board3', vote: { allowNonBoardMembers: false } };

      ReactiveCache.getCard = () => card;
      ReactiveCache.getBoard = () => board;

      await voteHandler().call({ userId: callerId }, cardId, true);

      expect(updateStub.calledOnce).to.equal(true);
      const [, modifier] = updateStub.getCall(0).args;
      // Only callerId present in modifier
      expect(modifier.$addToSet['vote.positive']).to.equal(callerId);
      expect(modifier.$pull['vote.negative']).to.equal(callerId);
    });
  });

  describe('cards.pokerVote', function() {
    it('denies non-member when allowNonBoardMembers=false', async function() {
      const cardId = 'card4';
      const callerId = 'nm';
      const board = { hasMember: id => id === 'someone-else' };
      const card = { _id: cardId, boardId: 'board4', poker: { allowNonBoardMembers: false } };

      ReactiveCache.getCard = () => card;
      ReactiveCache.getBoard = () => board;

      let thrown;
      try {
        await pokerVoteHandler().call({ userId: callerId }, cardId, 'five');
      } catch (error) {
        thrown = error;
      }
      expect(thrown).to.exist;
      expect(updateStub.called).to.equal(false);
    });

    it('allows non-member only for own userId when allowNonBoardMembers=true', async function() {
      const cardId = 'card5';
      const callerId = 'guest';
      const board = { hasMember: id => id === 'someone-else' };
      // cards.pokerVote delegates modifier-building to the card's setPoker helper,
      // then adds modifiedAt/dateLastActivity before Cards.updateAsync.
      const card = {
        _id: cardId,
        boardId: 'board5',
        poker: { allowNonBoardMembers: true },
        setPoker: (userId, state) => ({
          $addToSet: { [`poker.${state}`]: userId },
          $pull: { 'poker.one': userId },
        }),
      };

      ReactiveCache.getCard = () => card;
      ReactiveCache.getBoard = () => board;

      await pokerVoteHandler().call({ userId: callerId }, cardId, 'eight');

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
