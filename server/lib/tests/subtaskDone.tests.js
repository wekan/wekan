import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Cards from '/models/cards';
import Activities from '/models/activities';
import ChangeHistory from '/models/changeHistory';

// #4693: ticking a subtask done from the parent card's Subtasks list goes
// through the setSubtaskDone method, which applies the card edit permission to
// the SUBTASK (on its own, deposit, board) - not to the parent.
describe('setSubtaskDone (#4693)', function () {
  this.timeout(30000);
  it('lets a writer of the subtask tick and untick it, and refuses everyone else', async function () {
    if (!Meteor.isAppTest) this.skip();
    const [admin, commentOnly, worker, readOnly, assignedOnly, outsider] = Array.from({ length: 6 }, () => Random.id());
    const [main, deposit, list, lane, depositList, depositLane] = Array.from({ length: 6 }, () => Random.id());
    const ids = { parent: Random.id(), subtask: Random.id(), mine: Random.id(), archived: Random.id(), stranger: Random.id() };
    const users = [admin, commentOnly, worker, readOnly, assignedOnly, outsider];
    const call = (userId, ...args) => {
      const context = { userId, isSimulation: false, connection: null, setUserId() {}, unblock() {} };
      return DDP._CurrentMethodInvocation.withValue(context, () => Meteor.server.method_handlers.setSubtaskDone.apply(context, args));
    };
    const done = async id => (await Cards.rawCollection().findOne({ _id: id })).dueComplete === true;
    const member = (userId, flags = {}) => ({ userId, isActive: true, ...flags });
    try {
      await Meteor.users.rawCollection().insertMany(users.map(_id => ({ _id, username: `subtask-done-${_id}` })));
      await Boards.rawCollection().insertMany([
        { _id: main, title: 'Main', permission: 'private', archived: false, subtasksDefaultBoardId: deposit,
          members: users.filter(id => id !== outsider).map(id => member(id, id === admin ? { isAdmin: true } : {})) },
        { _id: deposit, title: '^Main^', permission: 'private', archived: false, members: [
          member(admin, { isAdmin: true }), member(commentOnly, { isCommentOnly: true }), member(worker, { isWorker: true }),
          member(readOnly, { isReadOnly: true }), member(assignedOnly, { isNormalAssignedOnly: true })] }]);
      await Swimlanes.rawCollection().insertMany([{ _id: lane, boardId: main, title: 'Lane', sort: 0, archived: false },
        { _id: depositLane, boardId: deposit, title: 'Lane', sort: 0, archived: false }]);
      await Lists.rawCollection().insertMany([{ _id: list, boardId: main, title: 'List', sort: 0, archived: false },
        { _id: depositList, boardId: deposit, title: 'Queue', sort: 0, archived: false }]);
      const card = (_id, title, boardId, extra = {}) => ({ _id, title, boardId, parentId: '', assignees: [], archived: false, sort: 0,
        dueComplete: false, type: 'cardType-card', userId: admin,
        listId: boardId === main ? list : depositList, swimlaneId: boardId === main ? lane : depositLane, ...extra });
      await Cards.rawCollection().insertMany([
        card(ids.parent, 'Parent', main),
        card(ids.subtask, 'Subtask', deposit, { parentId: ids.parent }),
        card(ids.mine, 'Assigned subtask', deposit, { parentId: ids.parent, assignees: [assignedOnly] }),
        card(ids.archived, 'Archived subtask', deposit, { parentId: ids.parent, archived: true }),
        card(ids.stranger, 'Not a subtask', deposit)]);

      // POSITIVE: a writer of the deposit board ticks, then unticks.
      assert.equal(await call(admin, ids.parent, ids.subtask, true), true);
      assert.equal(await done(ids.subtask), true, 'ticked');
      const history = await ChangeHistory.rawCollection().findOne({ entityId: ids.subtask, group: 'dates', userId: admin });
      assert.ok(history, 'the tick is in the subtask\'s History, authored by the user');
      assert.equal(await call(admin, ids.parent, ids.subtask, false), false);
      assert.equal(await done(ids.subtask), false, 'unticked');

      // An assigned-only member ticks a subtask assigned to them...
      await call(assignedOnly, ids.parent, ids.mine, true);
      assert.equal(await done(ids.mine), true);

      // NEGATIVE: no write capability on the SUBTASK's board, whatever the
      // parent board says (all of them are normal members of the main board).
      for (const [who, userId] of [['comment-only', commentOnly], ['worker', worker], ['read-only', readOnly], ['non-member', outsider]]) {
        await assert.rejects(call(userId, ids.parent, ids.subtask, true), /not-authorized|not-found/, who);
      }
      // ...and not one assigned to somebody else.
      await assert.rejects(call(assignedOnly, ids.parent, ids.subtask, true), /not-authorized/, 'assigned-only, not assigned');
      // A card that is not a subtask of that parent, an archived subtask, a
      // missing card, and a non-boolean value are all refused.
      await assert.rejects(call(admin, ids.parent, ids.stranger, true), /not-a-subtask/);
      await assert.rejects(call(admin, ids.parent, ids.archived, true), /subtask-archived/);
      await assert.rejects(call(admin, ids.parent, Random.id(), true), /not-found/);
      await assert.rejects(call(admin, ids.parent, ids.subtask, 'yes'), /Match/);
      await assert.rejects(call(null, ids.parent, ids.subtask, true), /not-authorized/);
      assert.equal(await done(ids.subtask), false, 'no refused call changed the subtask');
      assert.equal(await done(ids.stranger), false);
    } finally {
      for (const model of [Cards, Activities, Lists, Swimlanes]) await model.rawCollection().deleteMany({ boardId: { $in: [main, deposit] } });
      await ChangeHistory.rawCollection().deleteMany({ boardId: { $in: [main, deposit] } });
      await Boards.rawCollection().deleteMany({ _id: { $in: [main, deposit] } });
      await Meteor.users.rawCollection().deleteMany({ _id: { $in: users } });
    }
  });
});
