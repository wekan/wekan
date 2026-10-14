import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Cards from '/models/cards';
import CardComments from '/models/cardComments';
import Integrations from '/models/integrations';
import BotRuns from '/models/botRuns';
import { WebhookJobs } from '/server/notifications/webhookQueue';

// Board Settings / Bots on a running server (server/bots.js): a board admin
// hands a card to a bot - a run, and a dispatch queued for the bot's
// webhook; the runner reports through WeKan's REST API with its own token and
// board role, a stranger can not; an answer is the admin's own comment.
describe('Bots (runtime)', function () {
  this.timeout(60000);
  let savedApi;
  before(function () {
    if (!Meteor.isAppTest) this.skip();
    savedApi = process.env.WITH_API;
    process.env.WITH_API = 'true';
  });
  after(function () {
    if (savedApi === undefined) delete process.env.WITH_API; else process.env.WITH_API = savedApi;
  });
  const call = (userId, name, ...args) => Meteor.server.method_handlers[name].apply({ userId }, args);

  async function userWithToken(name) {
    const userId = Random.id();
    const token = Random.secret();
    await Meteor.users.rawCollection().insertOne({ _id: userId, username: `${name}-${userId}`, profile: {}, emails: [],
      services: { resume: { loginTokens: [{ when: new Date(), hashedToken: Accounts._hashLoginToken(token) }] } } });
    return { userId, token };
  }

  it('hands a card over, takes reports only from the board, and answers as the admin', async function () {
    const admin = await userWithToken('botadmin');
    const runner = await userWithToken('runner');
    const stranger = await userWithToken('stranger');
    const boardId = Random.id(), cardId = Random.id(), botId = Random.id(), otherBot = Random.id();
    await Boards.rawCollection().insertOne({ _id: boardId, title: 'Bots', permission: 'private', archived: false, type: 'board', labels: [],
      members: [{ userId: admin.userId, isAdmin: true, isActive: true }, { userId: runner.userId, isAdmin: false, isActive: true }] });
    await Cards.rawCollection().insertOne({ _id: cardId, boardId, listId: 'l1', swimlaneId: 's1', title: 'Do it', archived: false, sort: 0, userId: admin.userId });
    await Integrations.rawCollection().insertMany([
      { _id: botId, boardId, title: 'Coder', url: 'https://runner.example.com/hook', type: 'outgoing-webhooks', activities: ['bot-dispatch'], bot: true, enabled: true, userId: admin.userId },
      { _id: otherBot, boardId: 'another-board', title: 'Theirs', url: 'https://x.example.com', type: 'outgoing-webhooks', activities: ['bot-dispatch'], bot: true, enabled: true, userId: admin.userId },
    ]);
    try {
      // Only a board admin hands over, and only to this board's bots.
      await assert.rejects(call(runner.userId, 'botDispatch', cardId, botId), /not-authorized/);
      await assert.rejects(call(admin.userId, 'botDispatch', cardId, otherBot), /bot-not-found/);
      const runId = await call(admin.userId, 'botDispatch', cardId, botId);
      assert.equal(await call(admin.userId, 'botDispatch', cardId, botId), runId, 'a card already with the bot keeps its run');
      const job = await WebhookJobs.rawCollection().findOne({ integrationId: botId, eventId: runId });
      assert.equal(job.body.event, 'bot.dispatch');
      assert.equal(job.body.card.id, cardId);

      const report = (token, body) => fetch(Meteor.absoluteUrl(`api/boards/${boardId}/cards/${cardId}/bot-runs/${runId}`), {
        method: 'POST', headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      // The runner, a board member with write access, reports.
      assert.equal((await report(runner.token, { status: 'awaiting_input', tool: 'Plan', question: 'Which way?', options: ['left', 'right'] })).status, 200);
      const waiting = await BotRuns.findOneAsync(runId);
      assert.deepEqual([waiting.status, waiting.options.map(o => o.value)], ['awaiting_input', ['left', 'right']]);
      // A stranger can not.
      const refused = await report(stranger.token, { status: 'done' });
      assert.ok([401, 403].includes(refused.status), `stranger got ${refused.status}`);
      assert.equal((await BotRuns.findOneAsync(runId)).status, 'awaiting_input');

      // The admin answers: their own comment, the bot is told, the run goes on.
      await assert.rejects(call(admin.userId, 'botAnswer', runId, 'up'), /bot-option-not-found/);
      await call(admin.userId, 'botAnswer', runId, 'right');
      const [comment] = await CardComments.find({ cardId }).fetchAsync();
      assert.deepEqual([comment.userId, comment.text], [admin.userId, '↳ right']);
      assert.equal((await BotRuns.findOneAsync(runId)).status, 'running');
      assert.ok(await WebhookJobs.rawCollection().findOne({ integrationId: botId, 'body.event': 'bot.answer' }));

      // Done is final: a late report does not revive it.
      assert.equal((await report(runner.token, { status: 'done', text: 'Merged' })).status, 200);
      assert.equal((await report(runner.token, { status: 'running' })).status, 400);
    } finally {
      await Promise.all([
        Boards.rawCollection().deleteOne({ _id: boardId }),
        Cards.rawCollection().deleteMany({ boardId }),
        CardComments.rawCollection().deleteMany({ cardId }),
        Integrations.rawCollection().deleteMany({ _id: { $in: [botId, otherBot] } }),
        BotRuns.rawCollection().deleteMany({ boardId }),
        WebhookJobs.rawCollection().deleteMany({ integrationId: { $in: [botId, otherBot] } }),
        Meteor.users.rawCollection().deleteMany({ _id: { $in: [admin.userId, runner.userId, stranger.userId] } }),
      ]);
    }
  });
});
