import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Cards from '/models/cards';
import CardComments from '/models/cardComments';
import Swimlanes from '/models/swimlanes';
import Activities from '/models/activities';
import ChangeHistory from '/models/changeHistory';
import { syncOneList } from '/server/listSync';

// #2698: List Sync writes WeKan's changes back to GitLab
// (server/lib/listSyncWriteBack.js). GitLab here is a fake that keeps its
// issues in memory and answers writes the way GitLab's API does.
describe('List Sync GitLab write-back', function () {
  this.timeout(120000);
  it('writes edits, comments, closing and reopening to GitLab, and nothing it should not', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), boardId = Random.id(), listId = Random.id(), laneId = Random.id();
    const context = { userId: actor, isSimulation: false, connection: null, setUserId() {}, unblock() {} };
    const as = work => DDP._CurrentMethodInvocation.withValue(context, work);
    const web = 'https://gitlab.example.org/team/app/-/issues/7';
    let issues = [];
    let writes = [];
    let refuse = null;
    let noteId = 100;
    const fetch = async () => issues.map(issue => ({ ...issue }));
    const write = async (source, credential, method, path, body) => {
      if (refuse) { const error = new Error(refuse); error.status = 403; throw error; }
      writes.push([method, path, body]);
      const issue = issues.find(i => path.startsWith(`issues/${i.iid}`));
      if (path.endsWith('/notes')) return { id: (noteId += 1), body: body.body };
      if (body.title !== undefined) issue.title = body.title;
      if (body.description !== undefined) issue.description = body.description;
      if (body.state_event === 'close') issue.state = 'closed';
      if (body.state_event === 'reopen') issue.state = 'opened';
      return { ...issue };
    };
    const run = () => as(async () => syncOneList(await Lists.findOneAsync(listId),
      { fetchers: { gitlab: fetch }, writeBackIo: { readIssues: fetch, write } }));
    const card = () => Cards.rawCollection().findOne({ boardId, syncExternalId: '7' });
    const save = writeBack => as(() => Meteor.server.method_handlers.setListSyncSource.apply(context, [listId,
      { type: 'gitlab', url: 'https://gitlab.example.org', projectKey: 'team/app', token: 'token', fields: ['title', 'description'], writeBack }]));
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `wb-${actor}`, profile: {} });
      await Boards.rawCollection().insertOne({ _id: boardId, title: 'GitLab', permission: 'private', archived: false,
        members: [{ userId: actor, isAdmin: true, isActive: true }] });
      await Swimlanes.rawCollection().insertOne({ _id: laneId, boardId, title: 'Lane', archived: false, sort: 0 });
      await Lists.rawCollection().insertOne({ _id: listId, boardId, title: 'Issues', archived: false, sort: 0,
        swimlaneId: laneId, syncCredentialIncarnation: Random.id() });
      issues = [{ iid: 7, title: 'Pump', description: 'Old text', state: 'opened', web_url: web, references: { full: 'team/app#7' } }];

      // Negative: without write-back, a local edit stays local.
      await save(false);
      assert.equal((await run()).error, undefined);
      await Cards.rawCollection().updateOne({ _id: (await card())._id }, { $set: { title: 'Pump, local only' } });
      await run();
      assert.deepEqual(writes, [], 'write-back off writes nothing');
      assert.equal(issues[0].title, 'Pump');

      // A comment from before write-back was switched on is never sent.
      await CardComments.rawCollection().insertOne({ _id: Random.id(), boardId, cardId: (await card())._id, userId: actor,
        text: 'An old comment', createdAt: new Date(Date.now() - 60000), modifiedAt: new Date() });
      await save(true);
      const list = await Lists.findOneAsync(listId);
      assert.equal(list.syncSource.writeBack, true);
      assert.ok(list.syncSource.writeBackSince instanceof Date);

      // A title and a description edited in WeKan, and a new comment.
      const footer = `Source: team/app#7 ${web}`;
      await Cards.rawCollection().updateOne({ _id: (await card())._id },
        { $set: { title: 'Pump v2', description: `New text\n\n${footer}` } });
      const commentId = Random.id();
      await CardComments.rawCollection().insertOne({ _id: commentId, boardId, cardId: (await card())._id, userId: actor,
        text: 'Checked the seals', createdAt: new Date(Date.now() + 1000), modifiedAt: new Date() });
      const result = await run();
      assert.equal(result.error, undefined, JSON.stringify(result));
      assert.deepEqual(writes, [
        ['PUT', 'issues/7', { title: 'Pump v2', description: 'New text' }],
        ['POST', 'issues/7/notes', { body: 'Checked the seals' }],
      ], 'the footer Sync added is not sent, the old comment is not sent');
      assert.equal(issues[0].title, 'Pump v2');
      const synced = await card();
      assert.deepEqual([synced.title, synced.description], ['Pump v2', `New text\n\n${footer}`]);
      assert.deepEqual([synced.syncLastSource.title, synced.syncLastSource.description], ['Pump v2', `New text\n\n${footer}`],
        'both sides agree, so the next run has nothing to resolve');
      assert.equal((await CardComments.rawCollection().findOne({ _id: commentId })).syncCommentId, '101');

      // Negative: a second run writes nothing again.
      writes = [];
      await run();
      assert.deepEqual(writes, []);

      // Negative: both sides changed the title - nothing is written, it is a conflict.
      issues[0].title = 'Pump (GitLab)';
      await Cards.rawCollection().updateOne({ _id: (await card())._id }, { $set: { title: 'Pump (WeKan)' } });
      await run();
      assert.deepEqual(writes, [], 'a conflict is never written over');
      assert.equal(issues[0].title, 'Pump (GitLab)');
      await Cards.rawCollection().updateOne({ _id: (await card())._id }, { $set: { title: 'Pump (GitLab)' } });
      await run();

      // Archived in WeKan: the issue closes; restored: it reopens.
      writes = [];
      await Cards.rawCollection().updateOne({ _id: (await card())._id }, { $set: { archived: true, archivedAt: new Date(Date.now() + 2000) } });
      await run();
      assert.deepEqual(writes, [['PUT', 'issues/7', { state_event: 'close' }]]);
      assert.equal(issues[0].state, 'closed');
      assert.equal((await card()).syncClosedByWeKan, true);
      assert.equal((await card()).archived, true, 'the card stays archived');
      writes = [];
      await Cards.rawCollection().updateOne({ _id: (await card())._id }, { $set: { archived: false } });
      await run();
      assert.deepEqual(writes, [['PUT', 'issues/7', { state_event: 'reopen' }]]);
      assert.equal(issues[0].state, 'opened');
      assert.equal((await card()).syncClosedByWeKan, undefined);
      // Negative: an issue closed in GitLab is not reopened by WeKan.
      issues[0].state = 'closed';
      writes = [];
      await run();
      assert.deepEqual(writes, []);

      // A refused write is shown on the list, and the read sync still runs.
      issues[0].state = 'opened';
      refuse = 'HTTP 403';
      await Cards.rawCollection().updateOne({ _id: (await card())._id }, { $set: { title: 'Pump v3' } });
      const refused = await run();
      assert.equal(refused.error, undefined, 'the read sync went on');
      assert.match((await Lists.findOneAsync(listId)).syncWriteBackError, /HTTP 403/);
      refuse = null;
      await run();
      assert.equal((await Lists.findOneAsync(listId)).syncWriteBackError, undefined, 'cleared once it works');
      assert.equal(issues[0].title, 'Pump v3');
    } finally {
      for (const model of [Cards, CardComments, Lists, Swimlanes, Activities, ChangeHistory]) {
        await model.rawCollection().deleteMany({ boardId });
      }
      await Boards.rawCollection().deleteMany({ _id: boardId });
      await Meteor.users.rawCollection().deleteMany({ _id: actor });
    }
  });
});
