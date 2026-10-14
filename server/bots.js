// Board Settings / Bots (models/lib/botRuns.js, docs/Features/Automation/Bots.md):
// handing a card to a bot, and what its runner reports back.
//
// A bot has no rights in WeKan of its own:
//   - WeKan sends it a dispatch through the ordinary outgoing-webhook queue
//     (server/notifications/webhookQueue.js: the SSRF guard, signing with the
//     bot's token, retries, Sandstorm's Powerbox), and nothing else;
//   - its runner changes the board only through WeKan's REST API, with its
//     own WeKan user's token and that user's board role; the one route here,
//     the run report, needs write access to the board like every card write.
// Handing a card over is a board admin's choice: the Bots view, or a Rule a
// board admin made.
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { WebApp } from 'meteor/webapp';
import { ReactiveCache } from '/imports/reactiveCache';
import Integrations from '/models/integrations';
import CardComments from '/models/cardComments';
import BotRuns from '/models/botRuns';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';
import { publicErrorData } from '/server/lib/apiResponseHelpers';
import { allowIsBoardAdmin } from '/server/lib/utils';
import { canCommentInList } from '/server/lib/listPermissionGate';
import { ensureIndex } from '/server/lib/mongoStartup';

const runs = require('/models/lib/botRuns');

function outbox() {
  return require('/server/notifications/webhookQueue').webhookOutbox;
}

async function enqueue(bot, eventId, body) {
  await outbox().enqueue({ integrationId: bot._id, eventId, groupKey: eventId, body, deliverAt: Date.now() });
}

/**
 * Hand a card to a bot of its own board: a run, and a dispatch to the bot.
 * A card already with that bot keeps its run. Returns the run id.
 */
export async function dispatchToBot({ integrationId, cardId, userId, source }) {
  const card = await ReactiveCache.getCard(cardId);
  if (!card) throw new Meteor.Error('not-found');
  const bot = await Integrations.findOneAsync({ _id: integrationId, boardId: card.boardId });
  if (!runs.isBot(bot)) throw new Meteor.Error('bot-not-found');
  const active = await BotRuns.findOneAsync({ cardId, integrationId, status: { $in: runs.ACTIVE } });
  if (active) return active._id;
  const board = await ReactiveCache.getBoard(card.boardId);
  const list = await ReactiveCache.getList(card.listId);
  const comments = await CardComments.find({ cardId }, { sort: { createdAt: 1 }, limit: 20 }).fetchAsync();
  const now = new Date();
  const run = { _id: Random.id(), boardId: card.boardId, cardId, integrationId, status: 'queued', source: source || 'button',
    createdBy: userId || null, createdAt: now, updatedAt: now, events: [{ text: 'dispatched', status: 'queued', at: now }],
    options: [], question: null };
  await BotRuns.insertAsync(run);
  await enqueue(bot, run._id, runs.dispatchBody({ run, bot, board, card, list, comments, baseUrl: Meteor.absoluteUrl('').replace(/\/$/, '') }));
  return run._id;
}

async function runForAdmin(userId, runId) {
  const run = await BotRuns.findOneAsync(runId);
  if (!run) throw new Meteor.Error('not-found');
  const board = await ReactiveCache.getBoard(run.boardId);
  if (!userId || !allowIsBoardAdmin(userId, board)) throw new Meteor.Error('not-authorized');
  const bot = await Integrations.findOneAsync({ _id: run.integrationId, boardId: run.boardId });
  return { run, board, bot };
}

// A reply or an answer is a comment on the card - written by the person, under
// their own right to comment - and the bot is told.
async function commentAndTell(userId, runId, kind, text, payload) {
  const { run, board, bot } = await runForAdmin(userId, runId);
  const card = await ReactiveCache.getCard(run.cardId);
  if (!card || !(await canCommentInList(userId, board, card.listId))) throw new Meteor.Error('not-authorized');
  const commentId = await CardComments.insertAsync({ text, boardId: card.boardId, cardId: card._id, userId });
  if (runs.isBot(bot)) await enqueue(bot, `${run._id}:${kind}:${commentId}`, runs.followUpBody(kind, run, { ...payload, text, commentId }));
  if (run.status === 'awaiting_input') await BotRuns.updateAsync(run._id, { $set: { status: 'running', question: null, options: [], updatedAt: new Date() } });
  return commentId;
}

Meteor.methods({
  async botDispatch(cardId, integrationId) {
    check(cardId, String);
    check(integrationId, String);
    const card = await ReactiveCache.getCard(cardId);
    const board = card && await ReactiveCache.getBoard(card.boardId);
    if (!this.userId || !allowIsBoardAdmin(this.userId, board)) throw new Meteor.Error('not-authorized');
    return dispatchToBot({ integrationId, cardId, userId: this.userId, source: 'button' });
  },
  async botAnswer(runId, value) {
    check(runId, String);
    check(value, String);
    const run = await BotRuns.findOneAsync(runId);
    const option = run && (run.options || []).find(o => o.value === value);
    if (!option) throw new Meteor.Error('bot-option-not-found');
    return commentAndTell(this.userId, runId, 'answer', `↳ ${option.label}`, { value });
  },
  async botReply(runId, text) {
    check(runId, String);
    check(text, String);
    const body = text.trim().slice(0, 65536);
    if (!body) throw new Meteor.Error('bot-reply-empty');
    return commentAndTell(this.userId, runId, 'reply', body, {});
  },
  async botStop(runId) {
    check(runId, String);
    const { run, bot } = await runForAdmin(this.userId, runId);
    if (runs.FINAL.includes(run.status)) return run.status;
    const now = new Date();
    await BotRuns.updateAsync(run._id, { $set: { status: 'stopped', finishedAt: now, updatedAt: now },
      $push: { events: { $each: [{ text: 'stopped', status: 'stopped', at: now }], $slice: -runs.MAX_EVENTS } } });
    if (runs.isBot(bot)) await enqueue(bot, `${run._id}:stop`, runs.followUpBody('stop', run));
    return 'stopped';
  },
});

// The bots' runs of a board, for its admins' Bots view.
Meteor.publish('botRuns', async function botRunsPublication(boardId) {
  check(boardId, String);
  const board = await ReactiveCache.getBoard(boardId);
  if (!this.userId || !allowIsBoardAdmin(this.userId, board)) return this.ready();
  return BotRuns.find({ boardId }, { sort: { updatedAt: -1 }, limit: 300 });
});

// The runner reports: POST /api/boards/:boardId/cards/:cardId/bot-runs/:runId
// { status, text, tool, question, options, tokens, costUsd }, with a WeKan
// API token whose user may write this board - the same check as every card
// write of the REST API.
WebApp.handlers.post('/api/boards/:boardId/cards/:cardId/bot-runs/:runId', async function botRunReport(req, res) {
  try {
    const { boardId, cardId, runId } = req.params;
    await Authentication.checkBoardWriteAccess(req.userId, boardId);
    const run = await BotRuns.findOneAsync({ _id: runId, boardId, cardId });
    if (!run) {
      sendJsonResult(res, { code: 404, data: { error: 'Run not found' } });
      return;
    }
    const result = runs.applyRunUpdate(run, runs.cleanRunUpdate(req.body || {}));
    if (result.error) {
      sendJsonResult(res, { code: 400, data: { error: result.error } });
      return;
    }
    const { _id, ...fields } = result.run;
    await BotRuns.updateAsync({ _id: runId, boardId, cardId }, { $set: { ...fields, reportedBy: req.userId } });
    sendJsonResult(res, { code: 200, data: { _id: runId, status: result.run.status } });
  } catch (error) {
    sendJsonResult(res, publicErrorData(error));
  }
});

Meteor.startup(async () => {
  await ensureIndex(BotRuns, { boardId: 1, updatedAt: -1 });
  await ensureIndex(BotRuns, { cardId: 1, integrationId: 1, status: 1 });
});
