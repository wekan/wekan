import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Cards from '/models/cards';
import Lists from '/models/lists';

// #6765 on a running server: archiving a normal list archives its cards, and
// restoring it restores those - not a card that was archived on its own.
describe('Archiving a list archives its cards (runtime)', function () {
  this.timeout(60000);
  const boardId = Random.id(), listId = Random.id();
  const [one, two, own] = [Random.id(), Random.id(), Random.id()];
  const earlier = new Date(Date.now() - 86400000);

  before(async function () {
    if (!Meteor.isAppTest) this.skip();
    await Lists.rawCollection().insertOne({ _id: listId, boardId, title: 'Doing', archived: false, sort: 0, type: 'list' });
    await Cards.rawCollection().insertMany([
      { _id: one, boardId, listId, title: 'one', archived: false, type: 'cardType-card' },
      { _id: two, boardId, listId, title: 'two', archived: false, type: 'cardType-card' },
      { _id: own, boardId, listId, title: 'own', archived: true, archivedAt: earlier, type: 'cardType-card' },
    ]);
  });

  after(async function () {
    if (!Meteor.isAppTest) return;
    await Cards.rawCollection().deleteMany({ listId });
    await Lists.rawCollection().deleteOne({ _id: listId });
  });

  it('archive: the list\'s cards are archived with the list\'s time', async () => {
    await (await Lists.findOneAsync(listId)).archive();
    const list = await Lists.findOneAsync(listId);
    for (const id of [one, two]) {
      const card = await Cards.findOneAsync(id);
      assert.equal(card.archived, true, id);
      assert.equal(card.archivedAt.getTime(), list.archivedAt.getTime());
    }
    assert.equal((await Cards.findOneAsync(own)).archivedAt.getTime(), earlier.getTime(), 'its own time is kept');
  });

  it('restore: those cards come back, the separately archived one does not (negative)', async () => {
    await (await Lists.findOneAsync(listId)).restore();
    assert.equal((await Cards.findOneAsync(one)).archived, false);
    assert.equal((await Cards.findOneAsync(two)).archived, false);
    assert.equal((await Cards.findOneAsync(own)).archived, true);
  });
});
