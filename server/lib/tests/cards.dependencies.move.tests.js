/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import Cards from '/models/cards';
import Attachments from '/models/attachments';
import { ReactiveCache } from '/imports/reactiveCache';

// #3392: card-to-card dependencies ("Red Strings") only connect cards on the
// same board. When a card is moved to another board, card.move() must drop the
// moved card's now cross-board dependencies and pull inbound references to it
// from the cards left behind on the old board. These are pure-logic stub tests
// of the model helper (there is no `cards.move` Meteor method — the client calls
// the helper directly).

const origGetBoard = ReactiveCache.getBoard;

// Build a card document with the model helpers attached (the collection shim's
// transform makes helpers like move()/mapCustomFieldsToBoard available).
function makeCard(props) {
  const card = Cards._transform(
    Object.assign(
      { members: [], watchers: [], customFields: [], labelIds: [], cardDependencies: [] },
      props,
    ),
  );
  // Avoid touching custom-field/board resolution in the cross-board branch.
  card.mapCustomFieldsToBoard = () => [];
  return card;
}

describe('cards move: dependency cleanup (#3392)', function () {
  let updateStub;
  let userIdStub;
  let attachStub;

  beforeEach(function () {
    updateStub = sinon.stub(Cards, 'updateAsync').resolves(1);
    // Skip the move-history block deterministically (Meteor.userId() would throw
    // outside a method invocation otherwise).
    userIdStub = sinon.stub(Meteor, 'userId').returns(null);
    if (Attachments.collection && typeof Attachments.collection.updateAsync === 'function') {
      attachStub = sinon.stub(Attachments.collection, 'updateAsync').resolves(1);
    }
  });

  afterEach(function () {
    updateStub.restore();
    userIdStub.restore();
    if (attachStub) {
      attachStub.restore();
      attachStub = null;
    }
    ReactiveCache.getBoard = origGetBoard;
  });

  it('clears the moved card deps and pulls inbound refs on a cross-board move', async function () {
    const oldBoardId = 'b-old';
    const newBoardId = 'b-new';
    ReactiveCache.getBoard = id => {
      if (id === newBoardId) {
        return { _id: newBoardId, members: [], labels: [], getNextCardNumber: async () => 7 };
      }
      return { _id: oldBoardId, members: [], labels: [] };
    };

    const card = makeCard({
      _id: 'cardA',
      boardId: oldBoardId,
      swimlaneId: 's1',
      listId: 'l1',
      cardDependencies: [{ cardId: 'cardB', type: 'blocks', color: '#eb144c', icon: 'link' }],
    });

    await card.move(newBoardId, 's2', 'l2');

    // Main update on the moved card clears its dependencies and moves the board.
    const mainCall = updateStub.getCalls().find(c => c.args[0] === 'cardA');
    expect(mainCall, 'main update by _id').to.exist;
    expect(mainCall.args[1].$set.cardDependencies).to.deep.equal([]);
    expect(mainCall.args[1].$set.boardId).to.equal(newBoardId);

    // A multi-update pulls inbound references to the moved card from the old board.
    const cleanupCall = updateStub
      .getCalls()
      .find(c => c.args[0] && c.args[0]['cardDependencies.cardId'] === 'cardA');
    expect(cleanupCall, 'inbound cleanup update').to.exist;
    expect(cleanupCall.args[0].boardId).to.equal(oldBoardId);
    expect(cleanupCall.args[1].$pull.cardDependencies).to.deep.equal({ cardId: 'cardA' });
    expect(cleanupCall.args[2]).to.deep.equal({ multi: true });
  });

  it('does not touch dependencies on a same-board move', async function () {
    const boardId = 'b1';
    ReactiveCache.getBoard = () => ({
      _id: boardId,
      members: [],
      labels: [],
      getNextCardNumber: async () => 1,
    });

    const card = makeCard({
      _id: 'cardA',
      boardId,
      swimlaneId: 's1',
      listId: 'l1',
      cardDependencies: [{ cardId: 'cardB', type: 'related-to', color: '#eb144c', icon: 'link' }],
    });

    await card.move(boardId, 's1', 'l2');

    // No inbound-cleanup update, and the main update does not clear deps.
    const cleanupCall = updateStub
      .getCalls()
      .find(c => c.args[0] && c.args[0]['cardDependencies.cardId']);
    expect(cleanupCall, 'no inbound cleanup on same-board move').to.not.exist;

    const mainCall = updateStub.getCalls().find(c => c.args[0] === 'cardA');
    expect(mainCall, 'main update by _id').to.exist;
    expect(mainCall.args[1].$set).to.not.have.property('cardDependencies');
  });
});
