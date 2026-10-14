import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Cards from '/models/cards';
import Settings from '/models/settings';

// The optional compatible APIs over real HTTP (models/lib/optionalApis.js,
// server/compatApi/): off means 404; on, a Trello, Jira or GitHub client
// reaches WeKan with a WeKan token and gets exactly what WeKan's own REST API
// would give that person - a non-member is refused, a read-only member can
// not write - because every call IS a call to WeKan's REST API as the caller.
describe('Optional APIs (Trello, Jira, GitHub, Gitea)', function () {
  this.timeout(60000);
  let savedApi;
  let setting;
  before(async function () {
    if (!Meteor.isAppTest) this.skip();
    savedApi = process.env.WITH_API;
    process.env.WITH_API = 'true';
    setting = await Settings.findOneAsync({});
    if (!setting) this.skip();
  });
  after(async function () {
    if (savedApi === undefined) delete process.env.WITH_API; else process.env.WITH_API = savedApi;
    if (setting) await Settings.updateAsync(setting._id, { $set: { optionalApis: setting.optionalApis || {} } });
  });

  async function userWithToken(name) {
    const userId = Random.id();
    const token = Random.secret();
    await Meteor.users.rawCollection().insertOne({ _id: userId, username: `${name}-${userId}`, profile: {}, emails: [],
      services: { resume: { loginTokens: [{ when: new Date(), hashedToken: Accounts._hashLoginToken(token) }] } } });
    return { userId, token };
  }
  const get = (path, init = {}) => fetch(Meteor.absoluteUrl(path.replace(/^\//, '')), init);
  const on = apis => Settings.updateAsync(setting._id, { $set: { optionalApis: apis } });

  it('answers only when ticked, with the caller\'s own WeKan rights', async function () {
    const alice = await userWithToken('alice');
    const reader = await userWithToken('reader');
    const stranger = await userWithToken('stranger');
    const boardId = Random.id();
    await Boards.rawCollection().insertOne({ _id: boardId, title: 'Compat', slug: 'compat', key: 'CMP', permission: 'private', archived: false,
      type: 'board', labels: [{ _id: 'lbl1', name: 'bug', color: 'red' }],
      members: [{ userId: alice.userId, isAdmin: true, isActive: true }, { userId: reader.userId, isAdmin: false, isActive: true, isReadOnly: true }] });
    const swimlaneId = await Swimlanes.rawCollection().insertOne({ _id: Random.id(), title: 'Default', boardId, archived: false, sort: 0 }).then(r => r.insertedId);
    const listId = await Lists.rawCollection().insertOne({ _id: Random.id(), title: 'To Do', boardId, archived: false, sort: 0 }).then(r => r.insertedId);
    try {
      // Off: as if the API did not exist.
      await on({});
      assert.equal((await get(`/api/compat/trello/1/members/me?token=${alice.token}`)).status, 404);

      await on({ trello: true, jira: true, github: true, gitea: true });
      const me = await get(`/api/compat/trello/1/members/me?key=x&token=${alice.token}`);
      assert.equal(me.status, 200);
      assert.equal((await me.json()).id, alice.userId);

      // No token: WeKan's REST API refuses, and so does the translation.
      assert.equal((await get('/api/compat/trello/1/members/me')).status, 401);

      const boards = await (await get(`/api/compat/trello/1/members/me/boards?token=${alice.token}`)).json();
      assert.ok(boards.some(b => b.id === boardId && b.name === 'Compat'));

      // A stranger is refused the board by WeKan's own check.
      const refused = await get(`/api/compat/trello/1/boards/${boardId}?token=${stranger.token}`);
      assert.ok([401, 403].includes(refused.status), `stranger got ${refused.status}`);

      // Alice creates a card the Trello way; it is a WeKan card.
      const made = await get(`/api/compat/trello/1/cards?token=${alice.token}`, { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idList: listId, idBoard: boardId, name: 'From a Trello client', desc: 'via the API', idLabels: 'lbl1' }) });
      assert.equal(made.status, 200);
      const madeCard = await made.json();
      const card = await Cards.findOneAsync(madeCard.id);
      assert.deepEqual([card.title, card.boardId, card.listId, card.labelIds], ['From a Trello client', boardId, listId, ['lbl1']]);
      assert.equal(card.swimlaneId, swimlaneId);

      // A read-only member can not write through it - WeKan refuses.
      const readOnly = await get(`/api/compat/trello/1/cards?token=${reader.token}`, { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idList: listId, idBoard: boardId, name: 'Not allowed' }) });
      assert.ok(readOnly.status >= 400, `read-only member got ${readOnly.status}`);
      assert.equal(await Cards.find({ boardId, title: 'Not allowed' }).countAsync(), 0);

      // Jira: the same card is CMP-<number>, found by JQL.
      const auth = { Authorization: `Basic ${Buffer.from(`any:${alice.token}`).toString('base64')}` };
      const found = await (await get(`/api/compat/jira/rest/api/2/search?jql=${encodeURIComponent('project = CMP')}`, { headers: auth })).json();
      assert.ok(found.issues.some(i => i.id === card._id && i.key === `CMP-${card.cardNumber}`));

      // GitHub: the board is a repository and the card an open issue.
      const issues = await (await get('/api/compat/github/repos/wekan/CMP/issues', { headers: { Authorization: `token ${alice.token}` } })).json();
      assert.ok(issues.some(i => i.id === card._id && i.state === 'open'));
    } finally {
      await Boards.rawCollection().deleteOne({ _id: boardId });
      await Cards.rawCollection().deleteMany({ boardId });
      await Lists.rawCollection().deleteMany({ boardId });
      await Swimlanes.rawCollection().deleteMany({ boardId });
      await Meteor.users.rawCollection().deleteMany({ _id: { $in: [alice.userId, reader.userId, stranger.userId] } });
    }
  });
});
