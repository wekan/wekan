import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import SharedLabels from '/models/sharedLabels';

// Shared labels (#2761, #4698) on a running server: only a site admin edits
// the catalog; a board writer uses a shared label (copied once); renaming it
// renames every copy; a team's label is not offered to another board;
// deleting keeps the copy as the board's own.
describe('Shared labels (runtime)', function () {
  this.timeout(60000);
  const call = (userId, name, ...args) => Meteor.server.method_handlers[name].apply({ userId }, args);
  const admin = Random.id(), writer = Random.id(), boardId = Random.id();
  let everyId, teamId;

  before(async function () {
    if (!Meteor.isAppTest) this.skip();
    await Meteor.users.rawCollection().insertMany([
      { _id: admin, username: `sl-admin-${admin}`, isAdmin: true, profile: {} },
      { _id: writer, username: `sl-writer-${writer}`, profile: {} },
    ]);
    await Boards.rawCollection().insertOne({ _id: boardId, title: 'Labels', type: 'board', permission: 'private', labels: [],
      members: [{ userId: writer, isAdmin: true, isActive: true }] });
  });

  after(async function () {
    if (!Meteor.isAppTest) return;
    await Boards.rawCollection().deleteOne({ _id: boardId });
    await Meteor.users.rawCollection().deleteMany({ _id: { $in: [admin, writer] } });
    await SharedLabels.rawCollection().deleteMany({ _id: { $in: [everyId, teamId].filter(Boolean) } });
  });

  it('only a site admin edits the catalog (negative: a board admin is refused)', async () => {
    await assert.rejects(call(writer, 'sharedLabels.save', null, { name: 'X', color: 'red', scope: 'instance' }), /not-authorized/);
    everyId = await call(admin, 'sharedLabels.save', null, { name: 'Urgent', color: 'red', scope: 'instance' });
    teamId = await call(admin, 'sharedLabels.save', null, { name: 'Ops only', color: 'blue', scope: 'team', scopeId: Random.id() });
  });

  it('a board writer uses one, once; another team\'s label is refused', async () => {
    const id1 = await call(writer, 'boards.useSharedLabel', boardId, everyId);
    const id2 = await call(writer, 'boards.useSharedLabel', boardId, everyId);
    assert.equal(id1, id2, 'copied once');
    const copy = (await Boards.findOneAsync(boardId)).labels.find(l => l._id === id1);
    assert.deepEqual([copy.name, copy.color, copy.sharedLabelId], ['Urgent', 'red', everyId]);
    await assert.rejects(call(writer, 'boards.useSharedLabel', boardId, teamId), /not-found/);
  });

  it('renaming it renames the copy; deleting it keeps the copy, unlinked', async () => {
    await call(admin, 'sharedLabels.save', everyId, { name: 'Critical', color: 'crimson', scope: 'instance' });
    let copy = (await Boards.findOneAsync(boardId)).labels.find(l => l.sharedLabelId === everyId);
    assert.deepEqual([copy.name, copy.color], ['Critical', 'crimson']);
    await call(admin, 'sharedLabels.remove', everyId);
    copy = (await Boards.findOneAsync(boardId)).labels.find(l => l.name === 'Critical');
    assert.ok(copy, 'the board keeps it');
    assert.equal(copy.sharedLabelId, undefined);
    everyId = null;
  });
});
