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
import ScrumReleases from '/models/scrumReleases';
import ScrumEvents from '/models/scrumEvents';
import { ScrumImportPending, ScrumImportSteps } from '/server/lib/scrumImportJournal';
import { exportScrumTransfer } from '/server/lib/scrumTransferExport';

// A native Scrum transfer imported INTO an existing board, through the real
// method (server/scrum.js scrum.importIntoBoard, server/lib/scrumTransferMerge.js):
// administrators only, a dry run writes nothing, the import goes through the
// journaled stage and into History, a second import changes nothing, and
// another board's cards and records are never touched. Pure coverage:
// tests/scrumTransferMerge.test.cjs.
describe('Scrum transfer imported into an existing board', function () {
  this.timeout(60000);
  it('matches cards, creates planning once, refuses members and other boards', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), member = Random.id();
    const [source, target, other] = [Random.id(), Random.id(), Random.id()];
    const as = userId => {
      const context = { userId, isSimulation: false, connection: null, setUserId() {}, unblock() {} };
      return (name, ...args) => DDP._CurrentMethodInvocation.withValue(context,
        () => Meteor.server.method_handlers[name].apply(context, args));
    };
    const call = as(actor);
    const boards = [source, target, other];
    try {
      await Meteor.users.rawCollection().insertMany([{ _id: actor, username: `merge-${actor}` }, { _id: member, username: `merge-${member}` }]);
      for (const boardId of boards) {
        await Boards.rawCollection().insertOne({ _id: boardId, title: `Merge ${boardId}`, permission: 'private', archived: false,
          members: [{ userId: actor, isAdmin: true, isActive: true }, { userId: member, isAdmin: false, isActive: true }] });
        await Swimlanes.rawCollection().insertOne({ _id: `${boardId}-lane`, boardId, title: 'Lane', sort: 0, archived: false });
        await Lists.rawCollection().insertOne({ _id: `${boardId}-list`, boardId, title: 'Doing', sort: 0, archived: false });
      }
      const card = (boardId, n, title) => ({ _id: Random.id(), boardId, listId: `${boardId}-list`, swimlaneId: `${boardId}-lane`,
        title, cardNumber: n, sort: n, archived: false });
      const sourceCards = [card(source, 1, 'Login'), card(source, 2, 'Logout'), card(source, 3, 'Only in source')];
      const targetCards = [card(target, 1, 'Login'), card(target, 2, 'Logout')];
      const otherCard = card(other, 1, 'Other board');
      await Cards.rawCollection().insertMany([...sourceCards, ...targetCards, otherCard]);
      const sprint = await call('scrum.saveSprint', source, null, { name: 'Sprint 7', plannedStart: '2026-10-01', plannedEnd: '2026-10-14' }, null);
      const release = await call('scrum.saveRelease', source, null, { name: 'v7' }, null);
      await call('scrum.updateCard', source, sourceCards[0]._id, { sprintId: sprint._id, releaseId: release._id, backlogRank: 3 }, 0);
      await call('scrum.updateCard', source, sourceCards[1]._id, { issueType: 'Bug' }, 0);
      await call('scrum.updateCard', source, sourceCards[2]._id, { sprintId: sprint._id }, 0);
      const otherSprint = await call('scrum.saveSprint', other, null, { name: 'Sprint 7' }, null);
      const { transfer, losses } = await exportScrumTransfer(source, sourceCards.map(c => c._id), [`${source}-list`], [`${source}-lane`]);
      // A card of another board named in the file: reported, never written.
      transfer.cards.push({ _id: otherCard._id, scrum: { sprintId: sprint._id } });
      const file = { _id: source, scrumTransfer: transfer, scrumTransferLosses: losses,
        cards: sourceCards.map(({ _id, title, cardNumber }) => ({ _id, title, cardNumber })), lists: [{ _id: `${source}-list`, title: 'Doing' }] };

      await assert.rejects(as(member)('scrum.importIntoBoard', target, file, { dryRun: true }), /not-authorized/);
      await assert.rejects(as(member)('scrum.importIntoBoard', target, file, {}), /not-authorized/);
      await assert.rejects(call('scrum.importIntoBoard', target, { title: 'No Scrum' }, {}), /invalid-scrum-transfer/);

      const preview = await call('scrum.importIntoBoard', target, file, { dryRun: true });
      assert.equal(preview.changed, false);
      assert.deepEqual(preview.sprints.created, ['Sprint 7']);
      assert.equal(preview.cards.updated, 2);
      assert.equal(await ScrumSprints.find({ boardId: target }).countAsync(), 0, 'a dry run writes nothing');

      const historyBefore = await ChangeHistory.find({ boardId: target }).countAsync();
      const result = await call('scrum.importIntoBoard', target, file, {});
      assert.equal(result.changed, true);
      const created = await ScrumSprints.findOneAsync({ boardId: target });
      assert.notEqual(created._id, sprint._id);
      assert.deepEqual(created.provenance, { system: 'wekan', recordId: sprint._id, projectId: source });
      assert.equal(created.scrumImportPending, undefined);
      const createdRelease = await ScrumReleases.findOneAsync({ boardId: target });
      const login = await Cards.findOneAsync(targetCards[0]._id);
      assert.equal(login.scrum.sprintId, created._id);
      assert.deepEqual(login.scrum.releaseIds, [createdRelease._id]);
      assert.equal(login.scrum.backlogRank, 3);
      assert.equal(login.scrumRevision, 1);
      assert.equal((await Cards.findOneAsync(targetCards[1]._id)).scrum.issueType, 'Bug');
      const reasons = Object.fromEntries(result.losses.filter(row => /^cards\.[^.]+$/.test(row.path)).map(row => [row.sourceId, row.reason]));
      assert.equal(reasons[sourceCards[2]._id], 'card-not-matched');
      assert.equal(reasons[otherCard._id], 'card-on-another-board');
      assert.equal((await Cards.findOneAsync(otherCard._id)).scrum, undefined, 'another board\'s card is never written');
      assert.equal((await ScrumSprints.findOneAsync(otherSprint._id)).boardId, other);
      assert.equal(await ScrumSprints.find({ boardId: other }).countAsync(), 1);
      assert.deepEqual((await Boards.findOneAsync(target)).scrumImportLosses, result.losses);
      assert.equal(await ScrumImportPending.find({ _id: target }).countAsync(), 0);
      assert.equal(await ScrumImportSteps.find({ boardId: target }).countAsync(), 0);
      assert.ok(await ChangeHistory.find({ boardId: target }).countAsync() > historyBefore, 'the import is in History');

      // The same file again: everything matches, nothing is written.
      const again = await call('scrum.importIntoBoard', target, file, {});
      assert.equal(again.changed, false);
      assert.deepEqual(again.sprints.created, []);
      assert.deepEqual(again.sprints.matched, ['Sprint 7']);
      assert.equal(again.cards.updated, 0);
      assert.equal(await ScrumSprints.find({ boardId: target }).countAsync(), 1);
      assert.equal(await ScrumReleases.find({ boardId: target }).countAsync(), 1);
      assert.equal((await Cards.findOneAsync(targetCards[0]._id)).scrumRevision, 1);
    } finally {
      for (const model of [Cards, Lists, Swimlanes, ScrumSprints, ScrumReleases, ScrumEvents, ChangeHistory]) {
        await model.rawCollection().deleteMany({ boardId: { $in: boards } });
      }
      await ScrumImportPending.rawCollection().deleteMany({ _id: { $in: boards } });
      await ScrumImportSteps.rawCollection().deleteMany({ boardId: { $in: boards } });
      await Boards.rawCollection().deleteMany({ _id: { $in: boards } });
      await Meteor.users.rawCollection().deleteMany({ _id: { $in: [actor, member] } });
    }
  });
});
