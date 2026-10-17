'use strict';

// The at-risk mark (docs/Features/Cards/At-Risk.md): a card that looks like it
// will not get done in time, as a weighted score - what ClickUp and Jira call
// AI risk prediction, here five rules anybody can read.
//
// Pure, no Meteor. The minicard passes what it already has; the opened card
// also passes how often the card was moved back. Tests: tests/cardRisk.test.cjs.

const THRESHOLD = 3;
const DAY = 24 * 60 * 60 * 1000;
const DUE_SOON_DAYS = 2;
const IDLE_DAYS = 14;
const SENT_BACK_MOVES = 2;

const WEIGHTS = { overdue: 3, dueSoon: 2, blocked: 2, idle: 2, sentBack: 1 };

function time(value) {
  const t = value ? new Date(value).getTime() : NaN;
  return Number.isNaN(t) ? null : t;
}

function isComplete(card) {
  return !!card && (card.dueComplete === true || !!card.endAt || card.archived === true);
}

// card: { dueAt, dueComplete, endAt, archived, dateLastActivity, modifiedAt }
// context: {
//   now,
//   checklist: { finished, total },
//   blockers: [{ title }]   - open cards this one is blocked by,
//   inMiddleList: Boolean   - neither the board's first nor last list,
//   backMoves: Number       - moves to an earlier list (opened card only)
// }
// Returns { atRisk, score, reasons: [{ kind, ...values }] }.
function cardRisk(card, context = {}) {
  const none = { atRisk: false, score: 0, reasons: [] };
  if (!card || isComplete(card)) return none;
  const now = time(context.now) || Date.now();
  const reasons = [];
  const due = time(card.dueAt);
  if (due !== null && due < now) {
    reasons.push({ kind: 'overdue' });
  } else if (due !== null && due - now <= DUE_SOON_DAYS * DAY) {
    const { finished = 0, total = 0 } = context.checklist || {};
    if (total > 0 && finished / total < 0.5) reasons.push({ kind: 'dueSoon' });
  }
  const blockers = (context.blockers || []).filter(Boolean);
  if (blockers.length) reasons.push({ kind: 'blocked', card: blockers.map(b => b.title).join(', ') });
  const last = time(card.dateLastActivity) || time(card.modifiedAt);
  if (context.inMiddleList && last !== null && now - last >= IDLE_DAYS * DAY) {
    reasons.push({ kind: 'idle', days: Math.floor((now - last) / DAY) });
  }
  if ((context.backMoves || 0) >= SENT_BACK_MOVES) reasons.push({ kind: 'sentBack', count: context.backMoves });
  const score = reasons.reduce((n, r) => n + WEIGHTS[r.kind], 0);
  return { atRisk: score >= THRESHOLD, score, reasons };
}

// Moves to an earlier list: listSort maps a list id to its position.
function countBackMoves(moves, listSort) {
  let n = 0;
  for (const m of moves || []) {
    const from = listSort[m.oldListId];
    const to = listSort[m.listId];
    if (typeof from === 'number' && typeof to === 'number' && to < from) n += 1;
  }
  return n;
}

// The i18n key of each reason, and its values.
const REASON_KEYS = {
  overdue: 'at-risk-reason-overdue',
  dueSoon: 'at-risk-reason-due-soon',
  blocked: 'at-risk-reason-blocked',
  idle: 'at-risk-reason-idle',
  sentBack: 'at-risk-reason-sent-back',
};

module.exports = { THRESHOLD, WEIGHTS, IDLE_DAYS, DUE_SOON_DAYS, isComplete, cardRisk, countBackMoves, REASON_KEYS };
