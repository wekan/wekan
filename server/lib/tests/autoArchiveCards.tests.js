import assert from 'node:assert/strict';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Cards from '/models/cards';
import Activities from '/models/activities';
import { autoArchiveBoard, scanAutoArchive } from '/server/autoArchiveCards';

// Nextcloud Deck-style auto-archive against the real collections: stale cards
// on an opted-in board are archived with their activity; recent cards,
// templates and boards without the setting are not.
describe('Card auto-archive', function () {
  this.timeout(30000);
  it('archives only stale cards of boards that opted in', async function () {
    const owner = Random.id(), on = Random.id(), off = Random.id(), listOn = Random.id(), listOff = Random.id();
    const now = new Date('2026-09-29T12:00:00Z');
    const daysAgo = n => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
    const card = (boardId, listId, title, last, extra = {}) => ({
      _id: Random.id(), boardId, listId, swimlaneId: 's', title, userId: owner, archived: false,
      dateLastActivity: last, type: 'cardType-card', sort: 0, ...extra,
    });
    const stale = card(on, listOn, 'Stale', daysAgo(40));
    const recent = card(on, listOn, 'Recent', daysAgo(5));
    const template = card(on, listOn, 'Template', daysAgo(400), { type: 'template-card' });
    const elsewhere = card(off, listOff, 'Other board', daysAgo(400));
    try {
      await Boards.rawCollection().insertMany([
        { _id: on, title: 'Auto', type: 'board', archived: false, createdBy: owner, autoArchiveInactiveDays: 30,
          permission: 'private', members: [{ userId: owner, isActive: true, isAdmin: true }] },
        { _id: off, title: 'Manual', type: 'board', archived: false, createdBy: owner,
          permission: 'private', members: [{ userId: owner, isActive: true, isAdmin: true }] },
      ]);
      await Lists.rawCollection().insertMany([{ _id: listOn, boardId: on, title: 'L' }, { _id: listOff, boardId: off, title: 'L' }]);
      await Cards.rawCollection().insertMany([stale, recent, template, elsewhere]);

      await scanAutoArchive(now);
      const state = async id => (await Cards.rawCollection().findOne({ _id: id })).archived;
      assert.equal(await state(stale._id), true, 'a card untouched for 40 days on a 30-day board');
      assert.equal(await state(recent._id), false, 'a card touched 5 days ago');
      assert.equal(await state(template._id), false, 'templates are never archived');
      assert.equal(await state(elsewhere._id), false, 'a board without the setting');
      const activity = await Activities.rawCollection().findOne({ cardId: stale._id, activityType: 'archivedCard' });
      assert.ok(activity, 'the archive is recorded like any other');
      assert.equal(activity.userId, owner, 'as the board creator, like scheduled rules');

      // Running again changes nothing; a malformed setting means off.
      assert.equal(await autoArchiveBoard({ _id: on, autoArchiveInactiveDays: 30, createdBy: owner }, now), 0);
      await Cards.rawCollection().updateOne({ _id: recent._id }, { $set: { dateLastActivity: daysAgo(90) } });
      assert.equal(await autoArchiveBoard({ _id: on, autoArchiveInactiveDays: 'x', createdBy: owner }, now), 0);
      assert.equal(await state(recent._id), false);
    } finally {
      await Cards.rawCollection().deleteMany({ boardId: { $in: [on, off] } });
      await Lists.rawCollection().deleteMany({ boardId: { $in: [on, off] } });
      await Boards.rawCollection().deleteMany({ _id: { $in: [on, off] } });
      await Activities.rawCollection().deleteMany({ boardId: { $in: [on, off] } });
    }
  });
});
