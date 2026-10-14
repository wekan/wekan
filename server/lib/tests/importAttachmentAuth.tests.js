import assert from 'node:assert/strict';
import http from 'node:http';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Attachments from '/models/attachments';
import RecoveryEvents from '/models/recoveryEvents';
import { JiraCreator } from '/models/jiraCreator';
import { KanboardCreator } from '/models/kanboardCreator';
import { EXTERNAL_PARSERS } from '/models/lib/externalParsers';

// The attachment files of an import (models/lib/importAttachmentAuth.js),
// through a real import: a file the export embeds lands on the card; a Jira
// file without a sign-in, or behind an address the SSRF guard refuses, is a
// loss of the import - and the sign-in never reaches that address.
describe('Import attachment files', function () {
  this.timeout(30000);
  const run = (actor, fn) => DDP._CurrentMethodInvocation.withValue(
    { userId: actor, isSimulation: false, connection: null, setUserId() {}, unblock() {} }, fn);
  const lossesOf = async boardId => (await RecoveryEvents.rawCollection().find({ boardIds: boardId }).toArray())
    .map(e => e.detail).join('\n');
  const cleanup = async (actor, boardId) => {
    if (boardId) {
      await Attachments.collection.rawCollection().deleteMany({ 'meta.boardId': boardId });
      await Cards.rawCollection().deleteMany({ boardId });
      await Boards.rawCollection().deleteOne({ _id: boardId });
      await RecoveryEvents.rawCollection().deleteMany({ boardIds: boardId });
    }
    await Meteor.users.rawCollection().deleteOne({ _id: actor });
  };

  it('an Asana file the export embeds is attached to its card', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id();
    let boardId;
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `att-${actor}`, isAdmin: true });
      const doc = { data: [{ gid: '1', name: 'With a file', memberships: [{ project: { name: `Asana ${actor}` }, section: { name: 'Todo' } }],
        attachments: [{ name: 'notes.txt', file: Buffer.from('hello from asana').toString('base64') }] }] };
      boardId = await run(actor, () => new KanboardCreator({}, 'asana').create(EXTERNAL_PARSERS.asana(doc)));
      const card = await Cards.rawCollection().findOne({ boardId, title: 'With a file' });
      const files = await Attachments.collection.rawCollection().find({ 'meta.cardId': card._id }).toArray();
      assert.deepEqual(files.map(f => f.name), ['notes.txt']);
    } finally {
      await cleanup(actor, boardId);
    }
  });

  it('negative: without a sign-in a Jira file is reported, and the selection can leave files out', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id();
    let boardId;
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `att-${actor}`, isAdmin: true });
      const data = { board: { name: `Jira files ${actor}` }, issues: [{ key: 'F-1', fields: { summary: 'Has a file', status: { name: 'To Do' },
        attachment: [{ id: '1', filename: 'spec.pdf', content: 'https://acme.atlassian.net/rest/api/3/attachment/content/1' }] } }] };
      boardId = await run(actor, () => new JiraCreator(data).create(data));
      assert.equal(await Attachments.collection.rawCollection().countDocuments({ 'meta.boardId': boardId }), 0);
      assert.match(await lossesOf(boardId), /spec\.pdf: not downloaded: give the Jira address, email and API token on the import page/);
    } finally {
      await cleanup(actor, boardId);
    }
  });

  it('negative: the sign-in never reaches an address the guard refuses', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id();
    let boardId;
    let hits = 0;
    const server = http.createServer((req, res) => { hits += 1; res.end('secret'); });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `att-${actor}`, isAdmin: true });
      const auth = { url: origin, username: 'me@acme.test', token: 'jira-token' };
      const data = { attachmentAuth: auth, board: { name: `Jira guard ${actor}` }, issues: [{ key: 'G-1',
        fields: { summary: 'Internal', status: { name: 'To Do' },
          attachment: [{ id: '1', filename: 'internal.txt', content: `${origin}/rest/api/3/attachment/content/1` }] } }] };
      const creator = new JiraCreator(data);
      assert.doesNotMatch(JSON.stringify(creator), /jira-token/, 'the creator does not carry the sign-in');
      boardId = await run(actor, () => creator.create(data));
      assert.equal(hits, 0, 'not one request reached the internal address');
      assert.equal(await Attachments.collection.rawCollection().countDocuments({ 'meta.boardId': boardId }), 0);
      const losses = await lossesOf(boardId);
      assert.match(losses, /internal\.txt: not downloaded \(/);
      assert.doesNotMatch(losses, /jira-token|bWVAYWNtZS50ZXN0/, 'the report names no sign-in');
    } finally {
      server.close();
      await cleanup(actor, boardId);
    }
  });
});
