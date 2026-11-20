'use strict';

// Three Kanban practices for a board's lists (docs/Features/Lists/Flow-Policies.md):
//
//   List policies      each list's explicit policy - when a card may come in
//                      and when it is done there (`list.policy`), shown at the
//                      list header ("make policies explicit", Kanban Guide)
//   Commitment point   the list from which work is committed to
//                      (`board.commitmentListId`); the lists before it are
//                      options, marked at that list's header
//   WIP per person     how many open cards one person may hold on the board
//                      (`board.personWipLimit`); the opened card warns about
//                      each of its people over it
//
// Each is turned on in Board Settings / List and is a feature of Admin Panel /
// Settings / Visibility / Features (models/lib/instanceFeatures.js), so it can
// be hidden on a board and on the whole instance. Off until turned on. Pure
// CommonJS: tests/boardFlowPolicies.test.cjs.

const MAX_POLICY = 2000;
const MAX_PERSON_WIP = 99;

const FEATURE_OF = Object.freeze({
  listPolicies: 'list-policies',
  commitmentPoint: 'commitment-point',
  personWip: 'person-wip-limit',
});

// A list's policy as stored: trimmed text, '' clears it. Throws on what is
// not text or is too long.
function normalizePolicy(value) {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'string') throw new Error('invalid-list-policy');
  const text = value.replace(/\r\n?/g, '\n').trim();
  if (text.length > MAX_POLICY) throw new Error('invalid-list-policy');
  return text;
}

// The board's WIP limit per person: a whole number 1-99, or null for none.
function normalizePersonWipLimit(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > MAX_PERSON_WIP) throw new Error('invalid-person-wip-limit');
  return n;
}

// The people a card is with: its assignees, or its members when nobody is
// assigned (the same rule as the Workload report).
function peopleOf(card) {
  const assignees = Array.isArray(card && card.assignees) ? card.assignees.filter(Boolean) : [];
  if (assignees.length) return [...new Set(assignees)];
  return [...new Set(Array.isArray(card && card.members) ? card.members.filter(Boolean) : [])];
}

const isOpen = card => card && !card.archived && !card.dueComplete && card.type !== 'template-card';

// userId -> how many open cards of the board they hold.
function openCardsPerPerson(cards) {
  const counts = new Map();
  for (const card of cards || []) {
    if (!isOpen(card)) continue;
    for (const userId of peopleOf(card)) counts.set(userId, (counts.get(userId) || 0) + 1);
  }
  return counts;
}

// The people of `card` over the board's limit: [{ userId, count, limit }].
// Nothing when there is no limit or the card is not open.
function overPersonWip(card, boardCards, limit) {
  if (!limit || !isOpen(card)) return [];
  const counts = openCardsPerPerson(boardCards);
  return peopleOf(card)
    .map(userId => ({ userId, count: counts.get(userId) || 0, limit }))
    .filter(row => row.count > limit);
}

// Whether `listId` is at or after the board's commitment point, by the
// lists' order (`sort`). False when the board has none or the list is unknown.
function isCommitted(listId, lists, commitmentListId) {
  if (!commitmentListId) return false;
  const ordered = [...(lists || [])].sort((a, b) => (a.sort || 0) - (b.sort || 0));
  const at = ordered.findIndex(list => list._id === commitmentListId);
  const own = ordered.findIndex(list => list._id === listId);
  return at !== -1 && own !== -1 && own >= at;
}

module.exports = {
  MAX_POLICY, MAX_PERSON_WIP, FEATURE_OF,
  normalizePolicy, normalizePersonWipLimit, peopleOf, openCardsPerPerson, overPersonWip, isCommitted,
};
