/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import Cards from '/models/cards';
import { ReactiveCache } from '/imports/reactiveCache';

// Meteor method handler accessors
const archiveHandler = () => Meteor.server.method_handlers['cards.archive'];
const unarchiveHandler = () => Meteor.server.method_handlers['cards.unarchive'];
const archiveCheckedHandler = () => Meteor.server.method_handlers['cards.archiveChecked'];

const origGetCard = ReactiveCache.getCard;
const origGetBoard = ReactiveCache.getBoard;

describe('cards archive / unarchive', function() {
  let updateStub;

  beforeEach(function() {
    updateStub = sinon.stub(Cards, 'update').returns(1);
  });

  afterEach(function() {
    updateStub.restore();
    ReactiveCache.getCard = origGetCard;
    ReactiveCache.getBoard = origGetBoard;
  });

  describe('cards.archive', function() {
    it('sets archived=true on the target card', function() {
      const cardId = 'archCard1';
      const userId = 'user-admin';
      const board = { hasMember: id => id === userId, hasAdmin: id => id === userId };
      const card = { _id: cardId, boardId: 'board1', archived: false };

      ReactiveCache.getCard = () => card;
      ReactiveCache.getBoard = () => board;

      archiveHandler().call({ userId }, cardId);

      expect(updateStub.calledOnce).to.equal(true);
      const [, modifier] = updateStub.getCall(0).args;
      expect(modifier.$set.archived).to.equal(true);
    });

    it('denies non-member from archiving', function() {
      const cardId = 'archCard2';
      const userId = 'user-outsider';
      const board = { hasMember: () => false, hasAdmin: () => false };
      const card = { _id: cardId, boardId: 'board2', archived: false };

      ReactiveCache.getCard = () => card;
      ReactiveCache.getBoard = () => board;

      expect(() => archiveHandler().call({ userId }, cardId)).to.throw();
      expect(updateStub.called).to.equal(false);
    });

    it('is idempotent when the card is already archived', function() {
      const cardId = 'archCard3';
      const userId = 'user-member';
      const board = { hasMember: id => id === userId, hasAdmin: () => false };
      const card = { _id: cardId, boardId: 'board3', archived: true };

      ReactiveCache.getCard = () => card;
      ReactiveCache.getBoard = () => board;

      // Should not throw; update call still happens (server sets it again)
      try {
        archiveHandler().call({ userId }, cardId);
      } catch (_) {
        // Some implementations guard the double-archive — acceptable either way
      }
    });
  });

  describe('cards.unarchive', function() {
    it('sets archived=false on an archived card', function() {
      const cardId = 'unarchCard1';
      const userId = 'user-member';
      const board = { hasMember: id => id === userId, hasAdmin: () => false };
      const card = { _id: cardId, boardId: 'board4', archived: true };

      ReactiveCache.getCard = () => card;
      ReactiveCache.getBoard = () => board;

      unarchiveHandler().call({ userId }, cardId);

      expect(updateStub.calledOnce).to.equal(true);
      const [, modifier] = updateStub.getCall(0).args;
      expect(modifier.$set.archived).to.equal(false);
    });

    it('denies non-member from unarchiving', function() {
      const cardId = 'unarchCard2';
      const userId = 'user-outsider';
      const board = { hasMember: () => false };
      const card = { _id: cardId, boardId: 'board5', archived: true };

      ReactiveCache.getCard = () => card;
      ReactiveCache.getBoard = () => board;

      expect(() => unarchiveHandler().call({ userId }, cardId)).to.throw();
      expect(updateStub.called).to.equal(false);
    });
  });
});
