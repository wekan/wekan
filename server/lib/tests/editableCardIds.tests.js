import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Cards from '/models/cards';
import { canEditCardOrLinkedCard, editableCardIds } from '/server/lib/linkedCardPermission';

// The Scrum view asks editableCardIds for every card of a board in one batch;
// it must answer exactly what canEditCardOrLinkedCard answers card by card.
describe('editableCardIds', function () {
  this.timeout(30000);
  it('agrees with the per-card check for writers, readers with and without links, and blocked roles', async function () {
    if (!Meteor.isAppTest) this.skip();
    const [writer, reader, commenter, outsider] = [Random.id(), Random.id(), Random.id(), Random.id()];
    const source = Random.id(), mine = Random.id(), theirs = Random.id();
    const [linkedHere, linkedTheirs, plain] = [Random.id(), Random.id(), Random.id()];
    try {
      await Boards.rawCollection().insertMany([
        { _id: source, title: 'Source', permission: 'public', members: [
          { userId: writer, isAdmin: false, isActive: true },
          { userId: reader, isAdmin: false, isActive: true, isNoComments: false, isCommentOnly: false, isReadOnly: true },
          { userId: commenter, isAdmin: false, isActive: true, isCommentOnly: true }] },
        { _id: mine, title: 'Reader writes here', permission: 'private', members: [
          { userId: reader, isAdmin: true, isActive: true }, { userId: commenter, isAdmin: true, isActive: true },
          { userId: outsider, isAdmin: true, isActive: true }] },
        { _id: theirs, title: 'Reader only reads here', permission: 'private', members: [
          { userId: reader, isAdmin: false, isActive: true, isReadOnly: true },
          { userId: outsider, isAdmin: false, isActive: true, isReadOnly: true }] },
      ]);
      await Cards.rawCollection().insertMany([
        { _id: linkedHere, boardId: source, title: 'Linked where the reader writes' },
        { _id: linkedTheirs, boardId: source, title: 'Linked where the reader reads' },
        { _id: plain, boardId: source, title: 'Not linked' },
        { _id: Random.id(), boardId: mine, type: 'cardType-linkedCard', linkedId: linkedHere, title: 'link' },
        { _id: Random.id(), boardId: theirs, type: 'cardType-linkedCard', linkedId: linkedTheirs, title: 'link' },
      ]);
      const board = await Boards.findOneAsync(source);
      const cards = await Cards.find({ boardId: source }).fetchAsync();
      for (const userId of [writer, reader, commenter, outsider, null]) {
        const batch = await editableCardIds(userId, cards, board);
        for (const card of cards) {
          assert.equal(batch.has(card._id), await canEditCardOrLinkedCard(userId, card, board, { recordDenial: false }),
            `${userId === reader ? 'reader' : userId === commenter ? 'commenter' : userId === writer ? 'writer' : 'other'}: ${card.title}`);
        }
      }
      // Someone with no role on the (public) source board edits through a link
      // on a board they write, and only there; an explicit read-only role on
      // the source is a ceiling.
      assert.deepEqual([...await editableCardIds(outsider, cards, board)], [linkedHere], 'only through a writable link');
      assert.deepEqual([...await editableCardIds(reader, cards, board)], [], 'a read-only role blocks links');
      assert.equal((await editableCardIds(writer, cards, board)).size, cards.length);
    } finally {
      await Cards.rawCollection().deleteMany({ boardId: { $in: [source, mine, theirs] } });
      await Boards.rawCollection().deleteMany({ _id: { $in: [source, mine, theirs] } });
    }
  });

  // GHSA-r4gm-mjj9-g3x8: board roles apply to every view. A normal-assigned-only
  // member's role carries `write`, but on a card that is a card answer: only
  // the cards assigned to them, in the batch and card by card alike, and also
  // for a card fetched without its assignees (the Cards allow rule fetches
  // only boardId).
  it('an assigned-only member edits only their own cards', async function () {
    if (!Meteor.isAppTest) this.skip();
    const [member, other] = [Random.id(), Random.id()];
    const boardId = Random.id(), own = Random.id(), notOwn = Random.id();
    try {
      await Boards.rawCollection().insertOne({ _id: boardId, title: 'Assigned only', permission: 'private', members: [
        { userId: member, isAdmin: false, isActive: true, isNormalAssignedOnly: true },
        { userId: other, isAdmin: false, isActive: true }] });
      await Cards.rawCollection().insertMany([
        { _id: own, boardId, title: 'Mine', assignees: [member] },
        { _id: notOwn, boardId, title: 'Theirs', assignees: [other] },
      ]);
      const board = await Boards.findOneAsync(boardId);
      const cards = await Cards.find({ boardId }).fetchAsync();
      assert.deepEqual([...await editableCardIds(member, cards, board)], [own]);
      assert.equal(await canEditCardOrLinkedCard(member, cards.find(c => c._id === own), board, { recordDenial: false }), true);
      assert.equal(await canEditCardOrLinkedCard(member, cards.find(c => c._id === notOwn), board, { recordDenial: false }), false);
      // Fetched with only boardId: the assignees are read, not assumed.
      assert.equal(await canEditCardOrLinkedCard(member, { _id: own, boardId }, board, { recordDenial: false }), true);
      assert.equal(await canEditCardOrLinkedCard(member, { _id: notOwn, boardId }, board, { recordDenial: false }), false);
      // An ordinary member is not narrowed (negative).
      assert.equal((await editableCardIds(other, cards, board)).size, 2);
    } finally {
      await Cards.rawCollection().deleteMany({ boardId });
      await Boards.rawCollection().deleteMany({ _id: boardId });
    }
  });
});
