'use strict';

// Suggested members (docs/Features/Cards/Suggested-Members.md): the people who
// usually handle cards like this one on this board - Jira's and ClickUp's
// AI-suggested assignee, here points from shared labels, list and swimlane.
//
// Pure, no Meteor. Tests: tests/memberSuggestions.test.cjs.

const LIMIT = 3;
const POINTS = { label: 2, list: 1, swimlane: 1 };

// card: { _id, labelIds, listId, swimlaneId, members, assignees }
// others: the board's other open cards; activeIds: the board's active members.
// field: which of the card's people the popup edits ('members' or 'assignees');
// those already there are not suggested.
function suggestMembers(card, others, activeIds, { field = 'members', limit = LIMIT } = {}) {
  if (!card) return [];
  const active = new Set(activeIds || []);
  const already = new Set(card[field] || []);
  const labels = new Set(card.labelIds || []);
  const score = new Map();
  for (const other of others || []) {
    if (!other || other._id === card._id || other.archived) continue;
    let points = 0;
    for (const id of other.labelIds || []) if (labels.has(id)) points += POINTS.label;
    if (card.listId && other.listId === card.listId) points += POINTS.list;
    if (card.swimlaneId && other.swimlaneId === card.swimlaneId) points += POINTS.swimlane;
    if (!points) continue;
    for (const userId of new Set([...(other.members || []), ...(other.assignees || [])])) {
      if (!active.has(userId) || already.has(userId)) continue;
      score.set(userId, (score.get(userId) || 0) + points);
    }
  }
  return [...score.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
    .slice(0, limit)
    .map(([userId, points]) => ({ userId, points }));
}

module.exports = { LIMIT, POINTS, suggestMembers };
