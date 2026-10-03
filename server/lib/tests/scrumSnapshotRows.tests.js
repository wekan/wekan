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
import { ScrumRolloverRows } from '/server/lib/scrumRolloverStore';
import { rolloverJob } from '/server/scrum';
import { batchJob, ScrumBatchJobs } from '/server/lib/scrumBatchJobs';

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

  it('starts, closes, undoes and redoes a sprint past the old 10,000-card limit', async function () {
    if (!Meteor.isAppTest) this.skip();
    this.timeout(900000);
    const actor = Random.id(), boardId = Random.id(), listId = Random.id(), laneId = Random.id();
    const next = Random.id();
    const count = Number(process.env.WEKAN_LARGE_SPRINT_CARDS || 10500);
    const context = { userId: actor, isSimulation: false, connection: null, setUserId() {}, unblock() {} };
    const call = (name, ...args) => DDP._CurrentMethodInvocation.withValue(context,
      () => Meteor.server.method_handlers[name].apply(context, args));
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `large-${actor}` });
      await Boards.rawCollection().insertOne({ _id: boardId, title: 'Large', permission: 'private', archived: false,
        members: [{ userId: actor, isAdmin: true, isActive: true }] });
      await Swimlanes.rawCollection().insertOne({ _id: laneId, boardId, title: 'Lane', sort: 0, archived: false });
      await Lists.rawCollection().insertOne({ _id: listId, boardId, title: 'List', sort: 0, archived: false });
      const sprint = await call('scrum.saveSprint', boardId, null, { name: 'Large', plannedStart: '2026-09-01', plannedEnd: '2026-12-30' }, null);
      const rollover = await call('scrum.saveSprint', boardId, null, { name: 'Next', plannedStart: '2026-09-01', plannedEnd: '2026-12-30' }, null);
      const ids = Array.from({ length: count }, (_, i) => `${boardId}-${i}`);
      await Cards.rawCollection().insertMany(ids.map((_id, i) => ({ _id, boardId, listId, swimlaneId: laneId,
        title: `C${i}`, sort: i, archived: false, dueComplete: i % 2 === 0, poker: { estimation: 1 },
        scrum: { sprintId: sprint._id } })));
      await call('scrum.startSprint', boardId, sprint._id, sprint.revision);
      const active = await ScrumSprints.findOneAsync(sprint._id);
      assert.equal(active.startSnapshot.rowCount, count);
      // The close returns at once; the rollover runs in the background, with
      // its progress on the sprint for the Scrum view.
      const returned = await call('scrum.closeSprint', boardId, sprint._id, active.revision, rollover._id);
      assert.deepEqual([returned.state, returned.rolloverPending, returned.rolloverTotal], ['closed', true, count]);
      const shown = (await call('scrum.getBoardData', boardId)).sprints.find(row => row._id === sprint._id);
      assert.equal(shown.rolloverTotal, count);
      // NEGATIVE: nothing else on the board changes while it runs.
      await assert.rejects(call('scrum.saveSprint', boardId, null, { name: 'X', plannedStart: '2026-09-01', plannedEnd: '2026-12-30' }, null),
        /scrum-rollover-pending/);
      await rolloverJob(sprint._id);
      const closed = await ScrumSprints.findOneAsync(sprint._id);
      assert.equal(closed.state, 'closed');
      for (const field of ['rolloverPending', 'rolloverTotal', 'rolloverDone', 'rolloverError']) assert.equal(field in closed, false, field);
      assert.equal(await ScrumRolloverRows.find({ sprintId: sprint._id }).countAsync(), 0);
      // Unfinished cards rolled over, finished ones left the sprint.
      assert.equal(await Cards.find({ boardId, 'scrum.sprintId': rollover._id }).countAsync(), Math.floor(count / 2));
      assert.equal(await Cards.find({ boardId, 'scrum.sprintId': sprint._id }).countAsync(), 0);
      const report = (await call('scrum.getBoardData', boardId)).sprints.find(row => row._id === sprint._id).report;
      assert.deepEqual([report.committed.count, report.completed.count], [count, Math.ceil(count / 2)]);
      // History: several rows of one batch, each bounded.
      const rows = await ChangeHistory.find({ boardId, entityType: 'scrum', batchId: { $ne: null }, isCheckpoint: { $ne: true } }).fetchAsync();
      assert.ok(rows.length > 1);
      assert.equal(new Set(rows.map(row => row.batchId)).size, 1);
      assert.ok(rows.every(row => row.newContent.records.length <= 1000));
      assert.equal(rows.reduce((sum, row) => sum + row.newContent.records.length, 0), count + 1);
      // One undo reverses the whole close, in the background after its first
      // row; one redo makes it again.
      const undone = await call('changeHistory.undoLast', boardId, Random.id(24));
      assert.deepEqual([undone.undone, undone.continuing], [true, true]);
      const job = (await call('scrum.getBoardData', boardId)).historyJob;
      assert.equal(job.direction, 'undo');
      assert.ok(job.total > 1);
      // NEGATIVE: another undo or redo waits for it.
      await assert.rejects(call('changeHistory.redoLast', boardId, Random.id(24)), /scrum-history-running/);
      await assert.rejects(call('changeHistory.undoLast', boardId), /scrum-history-running/);
      await batchJob(boardId);
      assert.equal(await ScrumBatchJobs.findOneAsync(boardId), undefined);
      assert.equal((await ScrumSprints.findOneAsync(sprint._id)).state, 'active');
      assert.equal(await Cards.find({ boardId, 'scrum.sprintId': sprint._id }).countAsync(), count);
      await call('changeHistory.redoLast', boardId, Random.id(24));
      await batchJob(boardId);
      assert.equal((await ScrumSprints.findOneAsync(sprint._id)).state, 'closed');
      assert.equal(await Cards.find({ boardId, 'scrum.sprintId': rollover._id }).countAsync(), Math.floor(count / 2));
      // A job a restart or a failure stopped - here one never started, of
      // the plain path (no request ID) - is resumed by the next press, which
      // waits for it.
      const batch = (await ChangeHistory.findOneAsync({ boardId, entityType: 'scrum', batchId: /^scrum-close-/, undone: false, isCheckpoint: { $ne: true } })).batchId;
      await ScrumBatchJobs.rawCollection().insertOne({ _id: boardId, boardId, userId: actor, direction: 'undo', batchId: batch,
        requestId: null, index: 1, done: 0, total: 99, state: 'failed', error: 'stopped' });
      // NEGATIVE: while another server holds its lease, the job is left to it.
      await ScrumBatchJobs.rawCollection().updateOne({ _id: boardId },
        { $set: { lease: { owner: 'another-server', until: new Date(Date.now() + 60000) } } });
      await assert.rejects(call('changeHistory.undoLast', boardId), /scrum-history-running/);
      await batchJob(boardId);
      assert.equal((await ScrumBatchJobs.findOneAsync(boardId)).done, 0, 'nothing ran here');
      // Once the lease runs out, the next press takes it over.
      await ScrumBatchJobs.rawCollection().updateOne({ _id: boardId }, { $set: { 'lease.until': new Date(Date.now() - 1000) } });
      await assert.rejects(call('changeHistory.undoLast', boardId), /scrum-history-running/);
      await batchJob(boardId);
      assert.equal(await ScrumBatchJobs.findOneAsync(boardId), undefined);
      assert.equal(await Cards.find({ boardId, 'scrum.sprintId': sprint._id }).countAsync(), count);
      assert.equal((await ScrumSprints.findOneAsync(sprint._id)).state, 'active');
    } finally {
      await batchJob(boardId);
      await ScrumBatchJobs.rawCollection().deleteMany({ _id: boardId });
      for (const model of [Cards, Lists, Swimlanes, ChangeHistory, ScrumSprints, ScrumDailySnapshots, ScrumSnapshotRows, ScrumRolloverRows]) {
        await model.rawCollection().deleteMany({ boardId });
      }
      await Boards.rawCollection().deleteMany({ _id: boardId });
      await Meteor.users.rawCollection().deleteMany({ _id: actor });
    }
  });

  it('finishes a rollover interrupted after its plan was stored, and refuses other Scrum edits until then', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), boardId = Random.id(), listId = Random.id(), laneId = Random.id();
    const context = { userId: actor, isSimulation: false, connection: null, setUserId() {}, unblock() {} };
    const call = (name, ...args) => DDP._CurrentMethodInvocation.withValue(context,
      () => Meteor.server.method_handlers[name].apply(context, args));
    const originalUpdate = Cards.updateAsync;
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `resume-${actor}` });
      await Boards.rawCollection().insertOne({ _id: boardId, title: 'Resume', permission: 'private', archived: false,
        members: [{ userId: actor, isAdmin: true, isActive: true }] });
      await Lists.rawCollection().insertOne({ _id: listId, boardId, title: 'List', sort: 0, archived: false });
      const sprint = await call('scrum.saveSprint', boardId, null, { name: 'R', plannedStart: '2026-09-01', plannedEnd: '2026-12-30' }, null);
      const ids = [Random.id(), Random.id(), Random.id()];
      await Cards.rawCollection().insertMany(ids.map((_id, i) => ({ _id, boardId, listId, swimlaneId: laneId,
        title: `C${i}`, sort: i, archived: false, scrum: { sprintId: sprint._id } })));
      await call('scrum.startSprint', boardId, sprint._id, sprint.revision);
      const active = await ScrumSprints.findOneAsync(sprint._id);
      // The database fails on the second card of the rollover.
      let writes = 0;
      Cards.updateAsync = async function (...args) {
        if (args[1]?.$set?.scrum && ++writes === 2) throw new Error('lost connection');
        return originalUpdate.apply(this, args);
      };
      await assert.rejects(call('scrum.closeSprint', boardId, sprint._id, active.revision, null));
      Cards.updateAsync = originalUpdate;
      const interrupted = await ScrumSprints.findOneAsync(sprint._id);
      assert.equal(interrupted.rolloverPending, true);
      // The failure is kept for the Scrum view, which offers to resume.
      assert.match(interrupted.rolloverError, /lost connection/);
      assert.equal(await ScrumRolloverRows.find({ sprintId: sprint._id }).countAsync(), 1);
      // Negative: every other Scrum edit waits for the rollover.
      await assert.rejects(call('scrum.saveSprint', boardId, null, { name: 'X', plannedStart: '2026-09-01', plannedEnd: '2026-12-30' }, null),
        /scrum-rollover-pending/);
      assert.equal((await call('scrum.getBoardData', boardId)).sprints.find(row => row._id === sprint._id).rolloverPending, true);
      // NEGATIVE: while another server holds a live lease on the rollover,
      // a retry here leaves it alone and changes nothing.
      const foreign = { owner: 'another-server', until: new Date(Date.now() + 60000) };
      await ScrumSprints.rawCollection().updateOne({ _id: sprint._id }, { $set: { rolloverLease: foreign } });
      await assert.rejects(call('scrum.closeSprint', boardId, sprint._id, active.revision, null), /scrum-rollover-running/);
      assert.equal((await ScrumSprints.findOneAsync(sprint._id)).rolloverPending, true);
      assert.equal((await call('scrum.getBoardData', boardId)).sprints.find(row => row._id === sprint._id).rolloverLease, undefined,
        'the lease is not sent to the browser');
      // Once that lease runs out (the server went away), a retry takes over.
      await ScrumSprints.rawCollection().updateOne({ _id: sprint._id }, { $set: { 'rolloverLease.until': new Date(Date.now() - 1000) } });
      // The retry of the same close finishes it.
      await call('scrum.closeSprint', boardId, sprint._id, active.revision, null);
      const finished = await ScrumSprints.findOneAsync(sprint._id);
      assert.equal('rolloverPending' in finished, false);
      assert.equal('rolloverError' in finished, false);
      assert.equal(await ScrumRolloverRows.find({ sprintId: sprint._id }).countAsync(), 0);
      assert.equal(await Cards.find({ boardId, 'scrum.sprintId': sprint._id }).countAsync(), 0);
      assert.equal(await Cards.find({ boardId, 'scrum.pastSprintIds': sprint._id }).countAsync(), 3);
    } finally {
      Cards.updateAsync = originalUpdate;
      for (const model of [Cards, Lists, Swimlanes, ChangeHistory, ScrumSprints, ScrumDailySnapshots, ScrumSnapshotRows, ScrumRolloverRows]) {
        await model.rawCollection().deleteMany({ boardId });
      }
      await Boards.rawCollection().deleteMany({ _id: boardId });
      await Meteor.users.rawCollection().deleteMany({ _id: actor });
    }
  });
});
