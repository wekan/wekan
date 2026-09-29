import assert from 'node:assert/strict';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';

// #3626 against the real collections and hooks: a subtask shared by B and C is
// not archived or deleted with C - it just loses C - while a subtask that only
// C has goes with C, as before.
describe('Cards with several parents', function () {
  this.timeout(30000);
  it('archive and delete take only the children a card is the one parent of', async function () {
    const boardId = Random.id(), owner = Random.id(), listId = Random.id(), swimlaneId = Random.id();
    const card = (id, extra = {}) => ({ _id: id, boardId, listId, swimlaneId, title: id, userId: owner,
      archived: false, sort: 0, type: 'cardType-card', parentId: '', ...extra });
    const b = Random.id(), c = Random.id(), shared = Random.id(), onlyC = Random.id();
    try {
      await Boards.rawCollection().insertOne({ _id: boardId, title: 'Parents', type: 'board', archived: false,
        permission: 'private', members: [{ userId: owner, isActive: true, isAdmin: true }] });
      await Lists.rawCollection().insertOne({ _id: listId, boardId, title: 'List', archived: false, sort: 0 });
      await Swimlanes.rawCollection().insertOne({ _id: swimlaneId, boardId, title: 'Lane', archived: false, sort: 0 });
      await Cards.rawCollection().insertMany([card(b), card(c),
        card(shared, { parentId: b, parentIds: [b, c] }), card(onlyC, { parentId: c, parentIds: [c] })]);
      const read = id => Cards.rawCollection().findOne({ _id: id });

      await (await Cards.findOneAsync(c)).archive();
      assert.equal((await read(onlyC)).archived, true, "C's own subtask is archived with it");
      assert.equal((await read(shared)).archived, false, 'the shared one is not');

      await Cards.removeAsync({ _id: c });
      assert.equal(await read(onlyC), null, "C's own subtask is deleted with it");
      const kept = await read(shared);
      assert.ok(kept, 'the shared subtask is kept');
      assert.deepEqual([kept.parentId, kept.parentIds], [b, [b]], 'and just loses C');
    } finally {
      await Cards.rawCollection().deleteMany({ boardId });
      await Lists.rawCollection().deleteMany({ boardId });
      await Swimlanes.rawCollection().deleteMany({ boardId });
      await Boards.rawCollection().deleteMany({ _id: boardId });
    }
  });
});
