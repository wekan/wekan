import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Cards from '/models/cards';

// #3257: a card attached to another card. Attaching needs edit rights on the
// card and read rights on the attached card; a viewer sees an attached card's
// title only when they can read it. Node test: tests/attachedCards.test.cjs.
describe('Attached cards', function () {
  this.timeout(30000);
  const call = (userId, name, ...args) => Meteor.server.method_handlers[name].apply({ userId }, args);

  it('attaches a readable card on any board, refuses the rest, and hides what a viewer cannot read', async function () {
    if (!Meteor.isAppTest) this.skip();
    const writer = Random.id(), outsider = Random.id();
    const mine = Random.id(), other = Random.id(), hidden = Random.id(), assigned = Random.id();
    const ids = { card: Random.id(), sameBoard: Random.id(), otherBoard: Random.id(), hiddenCard: Random.id(),
      assignedToOther: Random.id(), assignedToMe: Random.id() };
    const member = (userId, extra = {}) => ({ userId, isAdmin: false, isActive: true, ...extra });
    const boardIds = [mine, other, hidden, assigned];
    try {
      await Meteor.users.rawCollection().insertMany([
        { _id: writer, username: `attach-writer-${writer}` }, { _id: outsider, username: `attach-outsider-${outsider}` },
      ]);
      await Boards.rawCollection().insertMany([
        { _id: mine, title: 'Mine', permission: 'private', members: [member(writer)] },
        { _id: other, title: 'Other', permission: 'private', members: [member(writer), member(outsider)] },
        { _id: hidden, title: 'Hidden', permission: 'private', members: [member(outsider)] },
        { _id: assigned, title: 'Assigned', permission: 'private', members: [member(writer, { isNormalAssignedOnly: true })] },
      ]);
      for (const boardId of boardIds) {
        await Swimlanes.rawCollection().insertOne({ _id: `${boardId}-lane`, boardId, title: 'Lane', sort: 0 });
        await Lists.rawCollection().insertOne({ _id: `${boardId}-list`, boardId, title: 'List', sort: 0 });
      }
      const card = (_id, boardId, title, extra = {}) => ({ _id, boardId, listId: `${boardId}-list`,
        swimlaneId: `${boardId}-lane`, title, sort: 0, archived: false, ...extra });
      await Cards.rawCollection().insertMany([
        card(ids.card, mine, 'Order pump'), card(ids.sameBoard, mine, 'Quote'),
        card(ids.otherBoard, other, 'Install pump'), card(ids.hiddenCard, hidden, 'Secret'),
        card(ids.assignedToOther, assigned, 'Not mine', { assignees: [outsider] }),
        card(ids.assignedToMe, assigned, 'Mine to do', { assignees: [writer] }),
      ]);

      // A card of the same board, by id; one of another board, by its link.
      await call(writer, 'attachCardToCard', ids.card, ids.sameBoard);
      await call(writer, 'attachCardToCard', ids.card, `https://wekan.example/b/${other}/other/${ids.otherBoard}`);
      await call(writer, 'attachCardToCard', ids.card, ids.assignedToMe);
      // Negative: a card the writer cannot read is "not found", like one that
      // does not exist - on a board they are not in, or an assigned-only board's
      // card not assigned to them; and a card cannot be attached to itself.
      for (const target of [ids.hiddenCard, ids.assignedToOther, 'NoSuchCard123']) {
        await assert.rejects(call(writer, 'attachCardToCard', ids.card, target), /attach-card-not-found/, target);
      }
      await assert.rejects(call(writer, 'attachCardToCard', ids.card, ids.card), /attach-card-self/);
      // Negative: somebody who cannot edit the card cannot attach to it.
      await assert.rejects(call(outsider, 'attachCardToCard', ids.card, ids.otherBoard), /not-authorized/);
      assert.deepEqual((await Cards.rawCollection().findOne({ _id: ids.card })).attachedCardIds,
        [ids.sameBoard, ids.otherBoard, ids.assignedToMe]);

      const info = await call(writer, 'attachedCardsInfo', ids.card);
      assert.deepEqual(info.map(row => [row.cardId, row.title, row.boardTitle, row.listTitle]), [
        [ids.sameBoard, 'Quote', 'Mine', 'List'], [ids.otherBoard, 'Install pump', 'Other', 'List'],
        [ids.assignedToMe, 'Mine to do', 'Assigned', 'List'],
      ]);
      assert.equal(info[1].url, `/b/${other}/board/${ids.otherBoard}`);
      // Negative: somebody who cannot read the card learns nothing, and an
      // attached card the viewer cannot read shows no title.
      await assert.rejects(call(outsider, 'attachedCardsInfo', ids.card), /not-authorized/);
      await Cards.rawCollection().updateOne({ _id: ids.otherBoard }, { $set: { boardId: hidden } });
      const later = await call(writer, 'attachedCardsInfo', ids.card);
      assert.deepEqual(later[1], { cardId: ids.otherBoard, unavailable: true });

      await call(writer, 'detachCardFromCard', ids.card, ids.sameBoard);
      await assert.rejects(call(outsider, 'detachCardFromCard', ids.card, ids.assignedToMe), /not-authorized/);
      assert.deepEqual((await Cards.rawCollection().findOne({ _id: ids.card })).attachedCardIds,
        [ids.otherBoard, ids.assignedToMe]);
    } finally {
      await Cards.rawCollection().deleteMany({ boardId: { $in: boardIds } });
      await Lists.rawCollection().deleteMany({ boardId: { $in: boardIds } });
      await Swimlanes.rawCollection().deleteMany({ boardId: { $in: boardIds } });
      await Boards.rawCollection().deleteMany({ _id: { $in: boardIds } });
      await Meteor.users.rawCollection().deleteMany({ _id: { $in: [writer, outsider] } });
    }
  });
});
