import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Cards from '/models/cards';
import Activities from '/models/activities';

// AssignedBleed copy sibling (2026-10-03), through the real copyCard method:
// a copy carries only the subtasks the copier could read and copy themselves.
describe('Card copies carry only the subtasks the copier may copy', function () {
  this.timeout(30000);
  it('an assigned-only member copies their own subtasks, a full member every readable one', async function () {
    if (!Meteor.isAppTest) this.skip();
    const [limited, full, other, team, privateBoard, list, lane, otherList, otherLane] = Array.from({ length: 9 }, () => Random.id());
    const ids = { parent: Random.id(), mine: Random.id(), theirs: Random.id(), elsewhere: Random.id() };
    const call = (userId, ...args) => {
      const context = { userId, isSimulation: false, connection: null, setUserId() {}, unblock() {} };
      return DDP._CurrentMethodInvocation.withValue(context, () => Meteor.server.method_handlers.copyCard.apply(context, args));
    };
    const copiesOf = async parentId => (await Cards.rawCollection().find({ parentId }).toArray()).map(card => card.title).sort();
    try {
      await Meteor.users.rawCollection().insertMany([{ _id: limited, username: `limited-${limited}` },
        { _id: full, username: `full-${full}` }, { _id: other, username: `other-${other}` }]);
      await Boards.rawCollection().insertMany([
        { _id: team, title: 'Team', permission: 'private', archived: false, members: [
          { userId: limited, isActive: true, isNormalAssignedOnly: true }, { userId: full, isActive: true, isAdmin: true }] },
        { _id: privateBoard, title: 'Private', permission: 'private', archived: false, members: [{ userId: other, isActive: true, isAdmin: true }] }]);
      await Swimlanes.rawCollection().insertMany([{ _id: lane, boardId: team, title: 'Lane', sort: 0, archived: false },
        { _id: otherLane, boardId: privateBoard, title: 'Lane', sort: 0, archived: false }]);
      await Lists.rawCollection().insertMany([{ _id: list, boardId: team, title: 'List', sort: 0, archived: false },
        { _id: otherList, boardId: privateBoard, title: 'List', sort: 0, archived: false }]);
      const card = (_id, title, boardId, assignees, parentId = '') => ({ _id, title, boardId, parentId, assignees, archived: false, sort: 0,
        listId: boardId === team ? list : otherList, swimlaneId: boardId === team ? lane : otherLane, userId: full });
      await Cards.rawCollection().insertMany([card(ids.parent, 'Parent', team, [limited]),
        card(ids.mine, 'Mine', team, [limited], ids.parent), card(ids.theirs, 'Theirs', team, [full], ids.parent),
        card(ids.elsewhere, 'Private subtask', privateBoard, [limited, other], ids.parent)]);

      const limitedCopy = await call(limited, ids.parent, team, lane, list, false, {});
      assert.deepEqual(await copiesOf(limitedCopy), ['Mine'], 'only the subtask assigned to them, on a board they read');
      const fullCopy = await call(full, ids.parent, team, lane, list, false, {});
      assert.deepEqual(await copiesOf(fullCopy), ['Mine', 'Theirs'], 'every subtask on boards they read, not the private one');
      // NEGATIVE: the subtask on the board neither may read was never copied.
      assert.equal(await Cards.rawCollection().countDocuments({ title: 'Private subtask' }), 1);
    } finally {
      await Cards.rawCollection().deleteMany({ boardId: { $in: [team, privateBoard] } });
      await Activities.rawCollection().deleteMany({ boardId: { $in: [team, privateBoard] } });
      await Lists.rawCollection().deleteMany({ boardId: { $in: [team, privateBoard] } });
      await Swimlanes.rawCollection().deleteMany({ boardId: { $in: [team, privateBoard] } });
      await Boards.rawCollection().deleteMany({ _id: { $in: [team, privateBoard] } });
      await Meteor.users.rawCollection().deleteMany({ _id: { $in: [limited, full, other] } });
    }
  });
});
