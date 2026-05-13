/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import Cards from '/models/cards';
import { ReactiveCache } from '/imports/reactiveCache';

const moveHandler = () => Meteor.server.method_handlers['cards.move'];

const origGetCard = ReactiveCache.getCard;
const origGetBoard = ReactiveCache.getBoard;
const origGetList = ReactiveCache.getList;

describe('cards.move', function() {
  let updateStub;

  beforeEach(function() {
    updateStub = sinon.stub(Cards, 'update').returns(1);
  });

  afterEach(function() {
    updateStub.restore();
    ReactiveCache.getCard = origGetCard;
    ReactiveCache.getBoard = origGetBoard;
    if (origGetList) ReactiveCache.getList = origGetList;
  });

  it('moves card to new list by updating listId, swimlaneId, boardId', function() {
    const cardId = 'moveCard1';
    const userId = 'user-member';
    const sourceBoardId = 'boardSrc';
    const targetBoardId = 'boardSrc'; // same board
    const targetListId = 'listTarget';
    const targetSwimlaneId = 'swimTarget';

    const board = { _id: sourceBoardId, hasMember: id => id === userId };
    const card = { _id: cardId, boardId: sourceBoardId, listId: 'listSrc', swimlaneId: 'swimSrc' };

    ReactiveCache.getCard = () => card;
    ReactiveCache.getBoard = () => board;

    moveHandler().call({ userId }, cardId, targetBoardId, targetSwimlaneId, targetListId);

    expect(updateStub.calledOnce).to.equal(true);
    const [selector, modifier] = updateStub.getCall(0).args;
    expect(modifier.$set.listId).to.equal(targetListId);
    expect(modifier.$set.boardId).to.equal(targetBoardId);
  });

  it('denies non-member from moving a card', function() {
    const cardId = 'moveCard2';
    const userId = 'user-outsider';
    const board = { _id: 'boardX', hasMember: () => false };
    const card = { _id: cardId, boardId: 'boardX', listId: 'listA' };

    ReactiveCache.getCard = () => card;
    ReactiveCache.getBoard = () => board;

    expect(() =>
      moveHandler().call({ userId }, cardId, 'boardX', 'swimB', 'listB')
    ).to.throw();
    expect(updateStub.called).to.equal(false);
  });

  it('moving a card does not duplicate it (update is called once)', function() {
    const cardId = 'moveCard3';
    const userId = 'user-member';
    const board = { _id: 'boardY', hasMember: id => id === userId };
    const card = { _id: cardId, boardId: 'boardY', listId: 'listA' };

    ReactiveCache.getCard = () => card;
    ReactiveCache.getBoard = () => board;

    moveHandler().call({ userId }, cardId, 'boardY', 'swimlaneA', 'listB');

    // update must be called exactly once — a duplicate call would mean a duplicate card
    expect(updateStub.callCount).to.equal(1);
  });

  it('modifiedAt and dateLastActivity are set on move', function() {
    const cardId = 'moveCard4';
    const userId = 'user-member';
    const board = { _id: 'boardZ', hasMember: id => id === userId };
    const card = { _id: cardId, boardId: 'boardZ', listId: 'listA' };

    ReactiveCache.getCard = () => card;
    ReactiveCache.getBoard = () => board;

    const before = new Date();
    moveHandler().call({ userId }, cardId, 'boardZ', 'swimlaneA', 'listB');
    const after = new Date();

    const [, modifier] = updateStub.getCall(0).args;
    expect(modifier.$set.modifiedAt).to.be.instanceOf(Date);
    expect(modifier.$set.modifiedAt.getTime()).to.be.within(before.getTime() - 1, after.getTime() + 1);
  });
});
