'use strict';

// Board Settings / Bots: bots are external runners - an AI agent, a CI job, a
// script on someone's own server - that a board admin connects to a board and
// hands cards to, as kanbots does, in a view beside the Rules' Workflow view
// (design: docs/Features/Automation/Bots.md).
//
// A bot HAS NO RIGHTS IN WEKAN OF ITS OWN. It is:
//   - an outgoing webhook (an Integration marked `bot`) that WeKan sends a
//     signed dispatch to, through the SSRF guard - nothing else from the board
//     is ever sent to it;
//   - a runner that acts on the board only through WeKan's REST API, as an
//     ordinary WeKan user with the board role that user has.
// Like a Rule, it is started by a board admin's choice - a Dispatch button, or
// a Rule's "Dispatch to bot" action - and reports back what it is doing.
//
// This module is the run's state and what may change it. Pure:
// tests/botRuns.test.cjs.

const STATUSES = ['queued', 'running', 'awaiting_input', 'review', 'done', 'failed', 'stopped'];
const ACTIVE = ['queued', 'running', 'awaiting_input', 'review'];
const FINAL = ['done', 'failed', 'stopped'];
const MAX_EVENTS = 50;
const MAX_TEXT = 4000;
const MAX_OPTIONS = 8;

// The marker on an Integration that makes it a bot. It is an ordinary
// outgoing webhook, subscribed to this activity name only - which no board
// activity has - so it is sent dispatches and nothing else.
const BOT_ACTIVITY = 'bot-dispatch';

function isBot(integration) {
  return !!(integration && integration.bot === true && integration.enabled !== false);
}

const text = (v, max = MAX_TEXT) => (v === undefined || v === null ? undefined : String(v).slice(0, max));

/**
 * What a runner reports (POST /api/boards/:boardId/cards/:cardId/bot-runs/:runId):
 *   { status, text, tool, question, options: [{ value, label }], tokens, costUsd }
 * cleaned to known fields and bounded sizes, or { error }.
 */
function cleanRunUpdate(input) {
  const f = input && typeof input === 'object' ? input : {};
  if (f.status !== undefined && !STATUSES.includes(f.status)) return { error: `status must be one of ${STATUSES.join(', ')}` };
  const update = {};
  if (f.status !== undefined) update.status = f.status;
  const event = {};
  for (const key of ['text', 'tool']) if (f[key] !== undefined) event[key] = text(f[key], key === 'tool' ? 200 : MAX_TEXT);
  if (f.question !== undefined) update.question = text(f.question, 1000);
  if (f.options !== undefined) {
    if (!Array.isArray(f.options)) return { error: 'options must be a list' };
    update.options = f.options.slice(0, MAX_OPTIONS).map((o) => {
      const value = text(o && typeof o === 'object' ? o.value : o, 200);
      return { value, label: text(o && typeof o === 'object' && o.label !== undefined ? o.label : value, 200) };
    }).filter(o => o.value);
  }
  for (const key of ['tokens', 'costUsd']) {
    if (f[key] === undefined) continue;
    const n = Number(f[key]);
    if (!Number.isFinite(n) || n < 0 || n > 1e12) return { error: `${key} must be a number` };
    update[key] = n;
  }
  if (update.status && update.status !== 'awaiting_input') { update.question = null; update.options = []; }
  return { update, event: Object.keys(event).length ? event : null };
}

/** Whether a reported status may follow the current one: a finished run stays finished. */
function canMove(from, to) {
  if (!to || to === from) return true;
  return !FINAL.includes(from);
}

/** A run after an update, events newest last and bounded: { run } or { error }. */
function applyRunUpdate(run, cleaned, now = new Date()) {
  if (cleaned.error) return { error: cleaned.error };
  const { update, event } = cleaned;
  if (!canMove(run.status, update.status)) return { error: `the run is ${run.status}` };
  const next = { ...run, ...update, updatedAt: now };
  if (event) next.events = [...(run.events || []), { ...event, at: now, status: update.status || run.status }].slice(-MAX_EVENTS);
  if (update.status && FINAL.includes(update.status)) next.finishedAt = now;
  return { run: next };
}

/** The dispatch a bot is sent: the card it is handed, and where to report. */
function dispatchBody({ run, bot, board, card, list, comments = [], baseUrl = '' }) {
  return {
    event: 'bot.dispatch',
    runId: run._id,
    bot: { id: bot._id, title: bot.title || '' },
    board: { id: board._id, title: board.title || '', key: board.key || '' },
    card: {
      id: card._id,
      number: card.cardNumber || null,
      title: card.title || '',
      description: card.description || '',
      list: list ? { id: list._id, title: list.title || '' } : null,
      labels: (board.labels || []).filter(l => (card.labelIds || []).includes(l._id)).map(l => l.name || l.color),
      url: `${baseUrl}/b/${board._id}/${board.slug || 'board'}/${card._id}`,
    },
    comments: comments.slice(-20).map(c => ({ id: c._id, text: c.text || '', at: c.createdAt || null })),
    // Where the runner reports, with its own WeKan API token.
    report: `${baseUrl}/api/boards/${board._id}/cards/${card._id}/bot-runs/${run._id}`,
    api: `${baseUrl}/api`,
  };
}

/** The follow-ups a run's bot is sent: an answer, a reply, or stop. */
function followUpBody(kind, run, payload = {}) {
  return { event: `bot.${kind}`, runId: run._id, cardId: run.cardId, boardId: run.boardId, ...payload };
}

module.exports = {
  STATUSES, ACTIVE, FINAL, BOT_ACTIVITY, MAX_EVENTS,
  isBot, cleanRunUpdate, canMove, applyRunUpdate, dispatchBody, followUpBody,
};
