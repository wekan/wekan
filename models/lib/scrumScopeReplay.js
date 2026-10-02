'use strict';
// Event-level sprint scope and burndown, replayed from History
// (docs/Features/Right-Sidebar/Board-Settings/Board-View/Scrum-Design.md:
// "replay scope and estimate history; never present current estimates as
// historical facts").
//
// The daily observations (server/scrumDailySnapshots.js) sample a sprint once
// a day. This replays every recorded change in between, from the History
// rows the board already keeps:
//
//   * sprint membership - Scrum History rows (group 'scrum'), whose record
//     snapshots carry the card's `scrum.sprintId` before and after;
//   * estimates - the card's custom fields or planning poker, as the sprint's
//     estimate source says (group 'customFields');
//   * completion - dueComplete (group 'dates'), or the card's list for the
//     done-lists policy (group 'position');
//   * archiving (group 'lifecycle').
//
// Each card's state at the sprint's start is reconstructed BACKWARDS from its
// state now through every row since then; the rows are then replayed forwards
// and a point is emitted after each one that changes the sprint's totals. The
// start (and, for a closed sprint, the close) totals are compared with the
// sprint's own snapshots: a mismatch means History is missing writes (writes
// made with recording off, imports, direct database edits) and the result is
// marked inconsistent rather than presented as fact. Pure: tested by
// tests/scrumScopeReplay.test.cjs.
const { getCardEstimate } = require('./scrum');
const { valueFromContent } = require('./changeHistoryGroups');

const FIELDS = ['sprintId', 'customFields', 'poker', 'dueComplete', 'listId', 'archived'];
const MAX_ROWS = 20000;

// What one History row changes, as [cardId, field, before, after] tuples.
function changesOf(row) {
  if (!row || !(row.createdAt instanceof Date)) return [];
  if (row.group === 'scrum') {
    const side = content => new Map(((content && content.records) || [])
      .filter(record => record && record.type === 'card' && typeof record.id === 'string')
      .map(record => [record.id, record.document]));
    const before = side(row.previousContent), after = side(row.newContent);
    return [...new Set([...before.keys(), ...after.keys()])].map(id => [id, 'sprintId',
      before.get(id)?.scrum?.sprintId ?? null, after.get(id)?.scrum?.sprintId ?? null]);
  }
  if (row.entityType !== 'card' || typeof row.entityId !== 'string') return [];
  if (row.group === 'position') {
    const list = content => (content && typeof content.listId === 'string' ? content.listId : null);
    return [[row.entityId, 'listId', list(row.previousContent), list(row.newContent)]];
  }
  const field = row.newContent?.field || row.previousContent?.field;
  if (!['customFields', 'poker', 'dueComplete', 'archived'].includes(field)) return [];
  const read = content => {
    try { const value = valueFromContent(content); return value === undefined ? null : value; } catch (_) { return null; }
  };
  return [[row.entityId, field, read(row.previousContent), read(row.newContent)]];
}

function stateOf(card) {
  return { sprintId: card.scrum?.sprintId ?? null, customFields: card.customFields ?? null, poker: card.poker ?? null,
    dueComplete: card.dueComplete === true, listId: card.listId ?? null, archived: card.archived === true };
}

// `sprint` is the stored sprint (with startedAt and startSnapshot, and for a
// closed one completedAt and closeSnapshot); `cards` the current documents of
// every card the sprint ever held or holds; `rows` the board's History rows
// for those cards since the sprint started, oldest first; `doneListIds` the
// done lists for the done-lists policy; `now` the reading time.
function replaySprintScope({ sprint, cards, rows, doneListIds = [], now = new Date() }) {
  const snapshot = sprint && sprint.startSnapshot;
  if (!snapshot || !(sprint.startedAt instanceof Date)) return null;
  const settings = { estimateSource: snapshot.estimateSource, estimateCustomFieldId: snapshot.estimateCustomFieldId,
    completionPolicy: snapshot.completionPolicy };
  const done = new Set(doneListIds);
  const truncated = rows.length > MAX_ROWS;
  const replayed = rows.slice(0, MAX_ROWS).filter(row => row.createdAt >= sprint.startedAt && row.createdAt <= now)
    .sort((a, b) => a.createdAt - b.createdAt);
  // Backwards: each card as it was when the sprint started.
  const state = new Map(cards.map(card => [card._id, stateOf(card)]));
  const current = new Map(cards.map(card => [card._id, stateOf(card)]));
  for (const row of [...replayed].reverse()) {
    for (const [cardId, field, before] of changesOf(row)) {
      if (!state.has(cardId)) continue;
      state.get(cardId)[field] = field === 'dueComplete' || field === 'archived' ? before === true : before;
    }
  }
  const totals = (cardsNow = state) => {
    let scope = 0, completed = 0, unknown = 0, count = 0;
    for (const card of cardsNow.values()) {
      if (card.sprintId !== sprint._id || card.archived) continue;
      count += 1;
      const estimate = getCardEstimate(card, settings);
      if (estimate === null) { unknown += 1; continue; }
      scope += estimate;
      const isDone = settings.completionPolicy === 'doneLists' ? done.has(card.listId) : card.dueComplete === true;
      if (isDone) completed += estimate;
    }
    return { scope, completed, remaining: scope - completed, unknown, cards: count };
  };
  const points = [{ at: new Date(sprint.startedAt), ...totals(), cause: 'start' }];
  // The start snapshot is the commitment: History that does not reproduce it
  // is missing writes.
  const atStart = points[0];
  const consistency = [];
  if (atStart.scope !== snapshot.totalEstimate || atStart.unknown !== snapshot.missingEstimates) {
    consistency.push('start');
  }
  const until = sprint.completedAt instanceof Date ? sprint.completedAt : now;
  for (const row of replayed) {
    if (row.createdAt > until) break;
    let touched = false;
    for (const [cardId, field, , after] of changesOf(row)) {
      if (!state.has(cardId)) continue;
      state.get(cardId)[field] = field === 'dueComplete' || field === 'archived' ? after === true : after;
      touched = true;
    }
    if (!touched) continue;
    const next = totals(), last = points[points.length - 1];
    if (['scope', 'completed', 'unknown', 'cards'].some(key => next[key] !== last[key])) {
      points.push({ at: new Date(row.createdAt), ...next, cause: row.group });
    }
  }
  if (sprint.closeSnapshot) {
    // The close snapshot also lists archived cards, which carry no scope here.
    const kept = sprint.closeSnapshot.cards.filter(card => !card.archived && card.estimate !== null);
    const last = points[points.length - 1];
    if (last.scope !== kept.reduce((sum, card) => sum + card.estimate, 0) ||
        last.completed !== kept.filter(card => card.done).reduce((sum, card) => sum + card.estimate, 0)) {
      consistency.push('close');
    }
  }
  // An open sprint replayed to now must arrive at the cards as they are: a
  // whole-value row (custom fields, poker) reconstructs the start even past a
  // write History never saw, which then shows here.
  if (!(sprint.completedAt instanceof Date)) {
    const actual = totals(current), last = points[points.length - 1];
    if (['scope', 'completed', 'unknown', 'cards'].some(key => actual[key] !== last[key])) consistency.push('now');
  }
  // Rows beyond the limit were not read: the reconstruction cannot be trusted.
  if (truncated) consistency.push('truncated');
  return { points, truncated, consistent: consistency.length === 0, inconsistentAt: consistency,
    unit: snapshot.unit, from: new Date(sprint.startedAt), until: new Date(until) };
}

module.exports = { replaySprintScope, changesOf, SCOPE_REPLAY_FIELDS: FIELDS, MAX_SCOPE_REPLAY_ROWS: MAX_ROWS };
