'use strict';

// Board menu -> Since your last visit
// (docs/Features/General/Since-Last-Visit/Since-Last-Visit.md): what other
// people changed on a board since this user last had it open - the catch-up
// Jira and ClickUp write with AI, read here from the board's activities.
//
// Pure, no Meteor. Tests: tests/sinceLastVisit.test.cjs.

// A board never opened before shows its last seven days.
const FIRST_VISIT_DAYS = 7;
const MAX_VISITS = 500;
const MAX_CARDS = 100;

// The activities this view lists, and the i18n key of each one's sentence.
const KINDS = {
  createCard: 'since-visit-created',
  moveCard: 'since-visit-moved',
  addComment: 'since-visit-commented',
  'a-dueAt': 'since-visit-due',
  joinMember: 'since-visit-member',
  joinAssignee: 'since-visit-member',
  archivedCard: 'since-visit-archived',
  addedLabel: 'since-visit-label',
  'a-changedTitle': 'since-visit-edited',
  'a-changedDescription': 'since-visit-edited',
};
const TYPES = Object.keys(KINDS);

function sinceOf(previousVisit, now = new Date()) {
  const t = previousVisit ? new Date(previousVisit).getTime() : NaN;
  return Number.isNaN(t) ? new Date(now.getTime() - FIRST_VISIT_DAYS * 24 * 60 * 60 * 1000) : new Date(t);
}

// activities newest first or not; cards: { id: { _id, title } } - only the
// cards the reader may see; usernames: { id: username }. Returns
// [{ _id, title, at, changes: [{ key, username, list, at }] }], the most
// recently changed card first, the reader's own changes left out.
function sinceLastVisit({ activities = [], cards = {}, usernames = {}, userId, since, limit = MAX_CARDS }) {
  const byCard = new Map();
  for (const a of activities) {
    if (!a || !KINDS[a.activityType] || a.userId === userId || !cards[a.cardId]) continue;
    const at = new Date(a.createdAt);
    if (Number.isNaN(at.getTime()) || (since && at < since)) continue;
    if (!byCard.has(a.cardId)) byCard.set(a.cardId, { _id: a.cardId, title: cards[a.cardId].title || '', at, changes: [] });
    const entry = byCard.get(a.cardId);
    if (at > entry.at) entry.at = at;
    entry.changes.push({ key: KINDS[a.activityType], username: usernames[a.userId] || '', list: a.listName || '', at });
  }
  const out = [...byCard.values()];
  for (const entry of out) entry.changes.sort((x, y) => y.at - x.at);
  out.sort((x, y) => y.at - x.at);
  return out.slice(0, limit);
}

function changeCount(groups) {
  return groups.reduce((n, g) => n + g.changes.length, 0);
}

// The $set that remembers this visit, keeping at most MAX_VISITS boards (the
// least recently visited are forgotten), like profile.cardLastViews.
function boardVisitsModifier(visits, boardId, now, max = MAX_VISITS) {
  const current = visits && typeof visits === 'object' ? visits : {};
  const ids = Object.keys(current);
  if (Object.prototype.hasOwnProperty.call(current, boardId) || ids.length < max) {
    return { $set: { [`profile.boardVisits.${boardId}`]: now } };
  }
  const next = {};
  ids.sort((a, b) => new Date(current[b]) - new Date(current[a]))
    .slice(0, Math.max(0, max - 1))
    .forEach(id => { next[id] = current[id]; });
  next[boardId] = now;
  return { $set: { 'profile.boardVisits': next } };
}

module.exports = { FIRST_VISIT_DAYS, MAX_VISITS, KINDS, TYPES, sinceOf, sinceLastVisit, changeCount, boardVisitsModifier };
