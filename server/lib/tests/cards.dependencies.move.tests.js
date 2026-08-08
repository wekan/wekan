/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import Cards from '/models/cards';
import Attachments from '/models/attachments';
import { ReactiveCache } from '/imports/reactiveCache';

// #3392: card-to-card dependencies ("Red Strings") only connect cards on the
// same board, so a card that moves to another board must lose its own
// cross-board dependencies AND the inbound references to it from the cards left
// behind. These are pure-logic stub tests of the model helper (there is no
// `cards.move` Meteor method — the client calls the helper directly).
//
// #6572 split those two halves apart, and this file changed with it. move()
// clears the moved card's own dependencies as before, in the by-_id update. It
// must NOT do the inbound half: that needs a multi-document update with a
// compound selector, and this helper runs in the CLIENT bundle, where Meteor
// allows updates only by id. It threw "Not permitted. Untrusted code may only
// updateAsync documents by ID" on every cross-board move — before the move
// itself ran, whether or not the card had any dependencies — so the inbound
// cleanup is a Cards.after.update hook in server/models/cards.js now, where a
// selector is allowed and which also covers the REST and import paths that never
// called this helper. tests/cardMoveUntrustedUpdate.test.cjs pins that side.

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
  // Async like the real helper (#6560): move() awaits it, and a stub that is not
  // a promise would stop this test from noticing if that await were dropped.
  card.mapCustomFieldsToBoard = async () => [];
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

  it('clears the moved card deps, and leaves the inbound half to the server', async function () {
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

    // #6572: and it does NOT do the inbound half itself. Every update this
    // helper makes must be BY ID - a selector, or `multi: true`, is rejected on
    // the client with "Untrusted code may only updateAsync documents by ID", and
    // that is what used to fail the whole move before it started.
    // `{ _id: x }` is allowed - Meteor's rule is "by id", not "not an object" -
    // so only a selector that asks for anything else is the violation.
    const selectorCall = updateStub.getCalls().find(c => {
      const sel = c.args[0];
      if (!sel || typeof sel !== 'object') return false;
      const keys = Object.keys(sel);
      return keys.length !== 1 || keys[0] !== '_id';
    });
    expect(
      selectorCall,
      selectorCall
        ? `move() ran a selector update the client may not make: ${JSON.stringify(selectorCall.args[0])}`
        : '',
    ).to.not.exist;
    const multiCall = updateStub.getCalls().find(c => c.args[2] && c.args[2].multi);
    expect(multiCall, 'move() ran a multi-document update, which the client may not').to.not.exist;
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
