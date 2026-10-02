import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Cards from '/models/cards';
import ChangeHistory from '/models/changeHistory';
import ScrumSprints from '/models/scrumSprints';
import ScrumDailySnapshots from '/models/scrumDailySnapshots';
import { ScrumSnapshotRows } from '/server/lib/scrumSnapshotStore';
import { exportScrumTransfer } from '/server/lib/scrumTransferExport';
import { importScrumTransfer } from '/server/lib/scrumTransferImport';

// A sprint's snapshot rows live outside the sprint document
// (server/lib/scrumSnapshotStore.js, maintainer decision of 2026-10-03:
// sprints with no card cap), through the real Scrum methods: start and close
// store chunks, the board data reports from the stored totals and never sends
// rows, an assigned-only reader's report counts only their cards, undo and redo
// keep the rows readable, and a transfer carries the rows whole.
describe('Scrum snapshot rows', function () {
  this.timeout(60000);
  it('stores start and close rows outside the sprint and reports from them', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), reader = Random.id(), boardId = Random.id(), copyId = Random.id();
    const listId = Random.id(), laneId = Random.id();
    const ids = [Random.id(), Random.id(), Random.id()];
    const as = userId => {
      const context = { userId, isSimulation: false, connection: null, setUserId() {}, unblock() {} };
      return (name, ...args) => DDP._CurrentMethodInvocation.withValue(context,
        () => Meteor.server.method_handlers[name].apply(context, args));
    };
    const call = as(actor);
    try {
      await Meteor.users.rawCollection().insertMany([{ _id: actor, username: `rows-${actor}` }, { _id: reader, username: `rows-${reader}` }]);
      await Boards.rawCollection().insertOne({ _id: boardId, title: 'Rows', permission: 'private', archived: false,
        members: [{ userId: actor, isAdmin: true, isActive: true }, { userId: reader, isActive: true, isNormalAssignedOnly: true }] });
      await Swimlanes.rawCollection().insertOne({ _id: laneId, boardId, title: 'Lane', sort: 0, archived: false });
      await Lists.rawCollection().insertOne({ _id: listId, boardId, title: 'List', sort: 0, archived: false });
      await Cards.rawCollection().insertMany(ids.map((_id, i) => ({ _id, boardId, listId, swimlaneId: laneId,
        title: `C${i}`, sort: i, archived: false, poker: { estimation: [3, 5, 2][i] }, assignees: i === 0 ? [reader] : [] })));
      const created = await call('scrum.saveSprint', boardId, null, { name: 'S1', plannedStart: '2026-09-01', plannedEnd: '2026-12-30' }, null);
      for (const id of ids) await call('scrum.updateCard', boardId, id, { sprintId: created._id }, 0);
      await call('scrum.startSprint', boardId, created._id, created.revision);
      await Cards.rawCollection().updateOne({ _id: ids[0] }, { $set: { dueComplete: true } });
      const active = await ScrumSprints.findOneAsync(created._id);
      await call('scrum.closeSprint', boardId, created._id, active.revision, null);

      // Stored: headers in the sprint, rows in chunks.
      const sprint = await ScrumSprints.findOneAsync(created._id);
      for (const [key, kind] of [['startSnapshot', 'start'], ['closeSnapshot', 'close']]) {
        assert.equal(sprint[key].stored, 'rows');
        assert.equal(sprint[key].rowCount, 3);
        assert.equal('cards' in sprint[key], false);
        const chunks = await ScrumSnapshotRows.find({ sprintId: created._id, kind }).fetchAsync();
        assert.deepEqual(chunks.map(chunk => chunk.rows.length), [3]);
        assert.equal(chunks[0].boardId, boardId);
      }
      assert.equal(sprint.reportTotals.committed.count, 3);

      // The board data: the report from the totals, never rows or totals.
      const data = await call('scrum.getBoardData', boardId);
      const sent = data.sprints.find(row => row._id === created._id);
      assert.deepEqual([sent.report.committed.count, sent.report.committed.estimate, sent.report.completed.count], [3, 10, 1]);
      assert.equal('reportTotals' in sent, false);
      assert.equal('cards' in sent.startSnapshot, false);
      assert.equal(sent.startSnapshot.rowCount, 3);

      // Negative: an assigned-only reader's report counts only their card.
      const restricted = (await as(reader)('scrum.getBoardData', boardId)).sprints.find(row => row._id === created._id);
      assert.deepEqual([restricted.report.committed.count, restricted.report.committed.estimate], [1, 3]);
      assert.equal('cards' in restricted.closeSnapshot, false);
      assert.equal('reportTotals' in restricted, false);

      // The scope replay reads the stored rows.
      const scope = await call('scrum.getScopeHistory', boardId, created._id);
      assert.equal(scope.points[0].scope, 10);

      // Undo the close and redo it: the header comes back naming the same rows.
      const undoId = Random.id();
      for (let i = 0; i < 5 && (await ScrumSprints.findOneAsync(created._id)).state === 'closed'; i += 1) {
        await call('changeHistory.undoLast', boardId, `${undoId}${i}`);
      }
      assert.equal((await ScrumSprints.findOneAsync(created._id)).state, 'active');
      const redoId = Random.id();
      for (let i = 0; i < 5 && (await ScrumSprints.findOneAsync(created._id)).state !== 'closed'; i += 1) {
        await call('changeHistory.redoLast', boardId, `${redoId}${i}`);
      }
      const redone = (await call('scrum.getBoardData', boardId)).sprints.find(row => row._id === created._id);
      assert.equal(redone.state, 'closed');
      assert.equal(redone.report.committed.count, 3);

      // A transfer carries the rows whole, and the import stores them again.
      const { transfer } = await exportScrumTransfer(boardId, ids, [listId], [laneId]);
      const exported = transfer.sprints.find(row => row._id === created._id);
      assert.equal(exported.startSnapshot.cards.length, 3);
      assert.equal('reportTotals' in exported, false);
      await Boards.rawCollection().insertOne({ _id: copyId, title: 'Copy', permission: 'private', archived: false,
        members: [{ userId: actor, isAdmin: true, isActive: true }] });
      const copyCards = Object.fromEntries(ids.map(id => [id, Random.id()]));
      const copyList = Random.id(), copyLane = Random.id();
      await Swimlanes.rawCollection().insertOne({ _id: copyLane, boardId: copyId, title: 'Lane', sort: 0, archived: false });
      await Lists.rawCollection().insertOne({ _id: copyList, boardId: copyId, title: 'List', sort: 0, archived: false });
      await Cards.rawCollection().insertMany(ids.map((id, i) => ({ _id: copyCards[id], boardId: copyId, listId: copyList,
        swimlaneId: copyLane, title: `C${i}`, sort: i, archived: false })));
      await DDP._CurrentMethodInvocation.withValue({ userId: actor }, () => importScrumTransfer(
        { cards: copyCards, lists: { [listId]: copyList }, swimlanes: { [laneId]: copyLane }, customFields: {}, members: { [actor]: actor } },
        { _id: boardId, scrumTransfer: transfer, scrumTransferLosses: [] }, copyId));
      const copied = await ScrumSprints.findOneAsync({ boardId: copyId, name: 'S1' });
      assert.equal(copied.startSnapshot.stored, 'rows');
      assert.equal('cards' in copied.startSnapshot, false);
      const copiedRows = (await ScrumSnapshotRows.find({ sprintId: copied._id, kind: 'start' }).fetchAsync()).flatMap(c => c.rows);
      assert.deepEqual(copiedRows.map(row => row.cardId).sort(), Object.values(copyCards).sort());
      const copiedData = (await call('scrum.getBoardData', copyId)).sprints.find(row => row._id === copied._id);
      assert.equal(copiedData.report.committed.count, 3);

      // Negative: a missing chunk is an error, never a silently shorter report.
      await ScrumSnapshotRows.rawCollection().deleteMany({ sprintId: copied._id, kind: 'start' });
      await assert.rejects(call('scrum.getScopeHistory', copyId, copied._id), /scrum-snapshot-missing/);

      // Removing a board removes its rows.
      await Boards.removeAsync(copyId);
      assert.equal(await ScrumSnapshotRows.find({ boardId: copyId }).countAsync(), 0);
    } finally {
      for (const id of [boardId, copyId]) {
        for (const model of [Cards, Lists, Swimlanes, ChangeHistory, ScrumSprints, ScrumDailySnapshots, ScrumSnapshotRows]) {
          await model.rawCollection().deleteMany({ boardId: id });
        }
        await Boards.rawCollection().deleteMany({ _id: id });
      }
      await Meteor.users.rawCollection().deleteMany({ _id: { $in: [actor, reader] } });
    }
  });
});
