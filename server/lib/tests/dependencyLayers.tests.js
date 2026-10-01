import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Cards from '/models/cards';
import { hasForbiddenUserUpdateField } from '/models/users';

// #6732: showing dependencies is each user's own choice; Board Dependencies
// are edited by roles that may edit or move cards; My Dependencies live in the
// user's profile; imports only add what is missing.
describe('Board and My Dependencies (#6732)', function () {
  this.timeout(30000);
  it('applies visibility per user, the edit rule, and merge-only imports', async function () {
    if (!Meteor.isAppTest) this.skip();
    const ids = { admin: Random.id(), worker: Random.id(), reader: Random.id(), assigned: Random.id(), stranger: Random.id() };
    const boardId = Random.id(), [c1, c2, c3] = [Random.id(), Random.id(), Random.id()];
    const call = (who, method, ...args) => {
      const context = { userId: ids[who], isSimulation: false, connection: null, setUserId() {}, unblock() {} };
      return DDP._CurrentMethodInvocation.withValue(context, () => Meteor.server.method_handlers[method].apply(context, args));
    };
    const profile = async who => ((await Meteor.users.findOneAsync(ids[who])) || {}).profile || {};
    const deps = async id => ((await Cards.findOneAsync(id)) || {}).cardDependencies || [];
    try {
      await Meteor.users.rawCollection().insertMany(Object.entries(ids).map(([name, _id]) => ({ _id, username: `${name}-${_id}`, profile: {} })));
      await Boards.rawCollection().insertOne({ _id: boardId, title: 'Deps', permission: 'private', archived: false, members: [
        { userId: ids.admin, isAdmin: true, isActive: true },
        { userId: ids.worker, isWorker: true, isActive: true },
        { userId: ids.reader, isReadOnly: true, isActive: true },
        { userId: ids.assigned, isNormalAssignedOnly: true, isActive: true },
      ] });
      await Cards.rawCollection().insertMany([c1, c2, c3].map((_id, i) => ({ _id, boardId, listId: 'l', swimlaneId: 's',
        title: `Card ${i + 1}`, cardNumber: i + 1, archived: false, sort: i, assignees: i === 0 ? [ids.assigned] : [] })));

      // Visibility: one user's switch is theirs alone; a read-only member may use it.
      await call('reader', 'setDependencyVisibility', 'board', true);
      assert.equal((await profile('reader')).showBoardDependencies, true);
      assert.equal((await profile('admin')).showBoardDependencies, undefined, 'nobody else is affected');
      await call('admin', 'setDependencyVisibility', 'mine', true);
      assert.deepEqual([(await profile('admin')).showMyDependencies, (await profile('reader')).showMyDependencies], [true, undefined]);

      // Board Dependencies: a Worker (moves, cannot edit) may; read-only and strangers may not.
      await call('worker', 'setBoardDependency', c1, c2, { type: 'blocks' });
      assert.deepEqual((await deps(c1)).map(d => [d.cardId, d.type]), [[c2, 'blocks']]);
      await assert.rejects(call('reader', 'setBoardDependency', c2, c3, {}), /not-authorized/);
      await assert.rejects(call('stranger', 'setBoardDependency', c2, c3, {}), /not-authorized/);
      await assert.rejects(call('reader', 'removeBoardDependency', c1, c2), /not-authorized/);
      // Assigned-only: both cards must be theirs to see.
      await assert.rejects(call('assigned', 'setBoardDependency', c1, c3, {}), /not-authorized/);
      await Cards.rawCollection().updateOne({ _id: c3 }, { $set: { assignees: [ids.assigned] } });
      await call('assigned', 'setBoardDependency', c1, c3, { type: 'fixes' });
      assert.equal((await deps(c1)).length, 2);
      await call('assigned', 'removeBoardDependency', c1, c3);
      assert.equal((await deps(c1)).length, 1);

      // Import combines: the existing line stays as it is, a missing one is added.
      const res = await call('admin', 'importBoardDependencies', boardId, [
        { from: c1, to: c2, type: 'fixes' },
        { fromCardNumber: 2, toCardNumber: 3, type: 'related-to' },
        { fromTitle: 'No such card', toTitle: 'Card 1' },
      ]);
      assert.deepEqual(res, { imported: 1, skipped: 1, unmatched: 1 });
      assert.equal((await deps(c1))[0].type, 'blocks', 'never overwritten');
      assert.deepEqual((await deps(c2)).map(d => d.cardId), [c3]);
      await assert.rejects(call('reader', 'importBoardDependencies', boardId, [{ from: c3, to: c1 }]), /not-authorized/,
        'only roles that may edit or move cards import Board Dependencies');

      // My Dependencies: in the profile, theirs alone; a read-only member may keep them.
      await call('reader', 'setMyDependency', c3, c1, { type: 'blocks' });
      const mine = (await profile('reader')).myDependencies;
      assert.deepEqual(mine.map(row => [row.boardId, row.cardId, row.targetCardId, row.type]), [[boardId, c3, c1, 'blocks']]);
      assert.equal((await deps(c3)).length, 0, 'nothing written on the board');
      const merged = await call('reader', 'importMyDependencies', boardId, [{ from: c3, to: c1, type: 'fixes' }, { from: c2, to: c1 }]);
      assert.deepEqual(merged, { imported: 1, skipped: 1, unmatched: 0 });
      assert.equal((await profile('reader')).myDependencies.find(row => row.cardId === c3).type, 'blocks');
      await call('reader', 'removeMyDependency', boardId, c2, c1);
      assert.equal((await profile('reader')).myDependencies.length, 1);
      // A private board's cards are not a stranger's to link (negative); a public board's are.
      await assert.rejects(call('stranger', 'setMyDependency', c1, c2, {}), /not-authorized/);
      await Boards.rawCollection().updateOne({ _id: boardId }, { $set: { permission: 'public' } });
      await call('stranger', 'setMyDependency', c1, c2, {});
      assert.equal((await profile('stranger')).myDependencies.length, 1);

      // The client cannot write My Dependencies directly (only through the checks above).
      assert.equal(hasForbiddenUserUpdateField(['profile.myDependencies'], { $set: { 'profile.myDependencies': [] } }), true);
      assert.equal(hasForbiddenUserUpdateField(['profile'], { $set: { profile: { myDependencies: [] } } }), true);
      assert.equal(hasForbiddenUserUpdateField(['profile.showMyDependencies'], { $set: { 'profile.showMyDependencies': true } }), false);
    } finally {
      await Cards.rawCollection().deleteMany({ boardId });
      await Boards.rawCollection().deleteMany({ _id: boardId });
      await Meteor.users.rawCollection().deleteMany({ _id: { $in: Object.values(ids) } });
    }
  });
});
