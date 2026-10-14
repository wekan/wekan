import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import { canEditCardOrLinkedCard, editableCardIds } from '/server/lib/linkedCardPermission';
import { canWriteInList, canCommentInList, assertListNotRefused } from '/server/lib/listPermissionGate';

// #4527 on a running server: a list's exceptions decide card writes and
// comments in that list, both ways, and only a board admin can set them.
describe('Per-list permissions (runtime)', function () {
  this.timeout(60000);
  const admin = Random.id(), normal = Random.id(), reader = Random.id(), stranger = Random.id();
  const boardId = Random.id(), open = Random.id(), closed = Random.id(), plain = Random.id();
  const [inOpen, inClosed, inPlain] = [Random.id(), Random.id(), Random.id()];
  const call = (userId, name, ...args) => Meteor.server.method_handlers[name].apply({ userId }, args);
  const board = () => Boards.findOneAsync(boardId);

  before(async function () {
    if (!Meteor.isAppTest) this.skip();
    await Boards.rawCollection().insertOne({ _id: boardId, title: 'Read-only board', type: 'board', permission: 'public',
      archived: false, members: [
        { userId: admin, isAdmin: true, isActive: true },
        { userId: normal, isAdmin: false, isActive: true },
        { userId: reader, isAdmin: false, isActive: true, isReadOnly: true }] });
    await Lists.rawCollection().insertMany([
      { _id: open, boardId, title: 'Ideas', archived: false, sort: 0 },
      { _id: closed, boardId, title: 'Approved', archived: false, sort: 1 },
      { _id: plain, boardId, title: 'Other', archived: false, sort: 2 },
    ]);
    await Cards.rawCollection().insertMany([
      { _id: inOpen, boardId, listId: open, title: 'a', archived: false, type: 'cardType-card' },
      { _id: inClosed, boardId, listId: closed, title: 'b', archived: false, type: 'cardType-card' },
      { _id: inPlain, boardId, listId: plain, title: 'c', archived: false, type: 'cardType-card' },
    ]);
  });

  after(async function () {
    if (!Meteor.isAppTest) return;
    await Cards.rawCollection().deleteMany({ boardId });
    await Lists.rawCollection().deleteMany({ boardId });
    await Boards.rawCollection().deleteOne({ _id: boardId });
  });

  it('only a board admin may set a list\'s exceptions (negative)', async () => {
    await assert.rejects(() => call(normal, 'lists.setRoleExceptions', open, { 'read-only': { write: true } }));
    await assert.rejects(() => call(stranger, 'lists.setRoleExceptions', open, { 'signed-in': { write: true } }));
    assert.equal((await Lists.findOneAsync(open)).roleExceptions, undefined);
  });

  it('the admin\'s exceptions are saved cleaned, and an empty set clears them', async () => {
    const saved = await call(admin, 'lists.setRoleExceptions', open,
      { 'read-only': { write: true, comment: true }, 'signed-in': { comment: true }, 'board-admin': { write: false }, normal: { write: 'yes' } });
    assert.deepEqual(saved, { 'read-only': { write: true, comment: true }, 'signed-in': { comment: true } });
    await call(admin, 'lists.setRoleExceptions', closed, { normal: { write: false, comment: false } });
    await call(admin, 'lists.setRoleExceptions', plain, { normal: { write: false } });
    await call(admin, 'lists.setRoleExceptions', plain, {});
    assert.equal((await Lists.findOneAsync(plain)).roleExceptions, undefined);
  });

  it('a list may let a read-only member, and everyone signed in, do more', async () => {
    const b = await board();
    assert.equal(await canWriteInList(reader, b, open), true);
    assert.equal(await canEditCardOrLinkedCard(reader, await Cards.findOneAsync(inOpen), b), true);
    assert.equal(await canCommentInList(stranger, b, open), true);
    assert.equal(await canWriteInList(stranger, b, open), false, 'only comment was granted');
  });

  it('a list may refuse a Normal member what the board allows (negative)', async () => {
    const b = await board();
    assert.equal(await canWriteInList(normal, b, closed), false);
    assert.equal(await canCommentInList(normal, b, closed), false);
    assert.equal(await canEditCardOrLinkedCard(normal, await Cards.findOneAsync(inClosed), b), false);
    await assert.rejects(() => assertListNotRefused(normal, b, closed), /Forbidden/);
  });

  it('lists without exceptions, and board admins, follow the board', async () => {
    const b = await board();
    assert.equal(await canWriteInList(normal, b, plain), true);
    assert.equal(await canWriteInList(reader, b, plain), false);
    assert.equal(await canWriteInList(admin, b, closed), true);
    await assertListNotRefused(normal, b, plain);
  });

  it('the Scrum view\'s batch answer agrees card by card', async () => {
    const b = await board();
    const cards = await Cards.find({ boardId }).fetchAsync();
    for (const userId of [normal, reader]) {
      const batch = await editableCardIds(userId, cards, b);
      for (const card of cards) {
        assert.equal(batch.has(card._id), await canEditCardOrLinkedCard(userId, card, b, { recordDenial: false }),
          `${userId === normal ? 'normal' : 'reader'} / ${card.title}`);
      }
    }
  });
});
