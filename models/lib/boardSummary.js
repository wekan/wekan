'use strict';

// Board menu -> Summary (docs/Features/General/Summary/Summary.md): what
// happened on a board, person by person - the standup report ClickUp and
// Jira write with AI, written here from the board's activities and History.
//
// Pure, no Meteor. The server method (server/methods/boardSummary.js) reads
// the rows and the cards the reader may see; this sorts them into groups.
// Tests: tests/boardSummary.test.cjs.

const PERIODS = { day: 24 * 60 * 60 * 1000, week: 7 * 24 * 60 * 60 * 1000 };
const GROUPS = ['done', 'moved', 'added', 'commented', 'overdue'];

function sinceFor(period, now) {
  return new Date(now.getTime() - (PERIODS[period] || PERIODS.day));
}

// A History row that finished a card: Mark as complete ticked, or an end date
// set.
function finishes(row) {
  const content = row && row.newContent;
  if (!content) return false;
  if (content.field === 'dueComplete') return content.value === true;
  if (content.field === 'endAt') return content.value !== null && content.value !== undefined && content.value !== '';
  return false;
}

function isDone(card) {
  return !!card && (card.dueComplete === true || !!card.endAt || card.archived === true);
}

// activities: [{ activityType, userId, cardId, listId, createdAt }]
// history:    [{ userId, cardId, newContent, createdAt }]
// cards:      { id: { _id, title, dueAt, dueComplete, endAt, archived, members, assignees } }
//             - only the cards the reader may see; a row about another card is skipped
// lastListIds: the board's last list (per swimlane where lists are per swimlane)
// usernames:  { userId: username } - the board's members
function boardSummary({ activities = [], history = [], cards = {}, lastListIds = [], usernames = {}, since, now = new Date() }) {
  const people = new Map();
  const person = userId => {
    if (!people.has(userId)) {
      const groups = {};
      for (const g of GROUPS) groups[g] = new Map();
      people.set(userId, { userId, username: usernames[userId] || '', groups });
    }
    return people.get(userId);
  };
  const add = (userId, group, cardId) => {
    const card = cards[cardId];
    if (!userId || !card || !usernames[userId]) return;
    person(userId).groups[group].set(cardId, { _id: cardId, title: card.title || '' });
  };
  const inPeriod = row => {
    const t = new Date(row.createdAt).getTime();
    return !Number.isNaN(t) && (!since || t >= since.getTime()) && t <= now.getTime();
  };
  const last = new Set(lastListIds);

  for (const a of activities) {
    if (!a || !inPeriod(a)) continue;
    if (a.activityType === 'archivedCard') add(a.userId, 'done', a.cardId);
    else if (a.activityType === 'moveCard') add(a.userId, last.has(a.listId) ? 'done' : 'moved', a.cardId);
    else if (a.activityType === 'createCard') add(a.userId, 'added', a.cardId);
    else if (a.activityType === 'addComment') add(a.userId, 'commented', a.cardId);
  }
  for (const row of history) {
    if (row && inPeriod(row) && finishes(row)) add(row.userId, 'done', row.cardId);
  }
  // A card done in the period is not also "moved": the move was the finishing.
  for (const p of people.values()) {
    for (const id of p.groups.done.keys()) p.groups.moved.delete(id);
  }
  // Overdue now, whatever the period: the cards a member or assignee has past
  // their due date and not done.
  for (const card of Object.values(cards)) {
    if (!card || isDone(card) || !card.dueAt || new Date(card.dueAt).getTime() >= now.getTime()) continue;
    for (const userId of new Set([...(card.members || []), ...(card.assignees || [])])) add(userId, 'overdue', card._id);
  }

  const rows = [...people.values()].map(p => {
    const groups = {};
    let total = 0;
    for (const g of GROUPS) {
      groups[g] = [...p.groups[g].values()].sort((a, b) => a.title.localeCompare(b.title));
      if (g !== 'overdue') total += groups[g].length;
    }
    return { userId: p.userId, username: p.username, total, groups };
  });
  rows.sort((a, b) => b.total - a.total || b.groups.overdue.length - a.groups.overdue.length
    || a.username.localeCompare(b.username));
  return rows;
}

// The summary as Markdown, for Copy as text. `label(group)` names a group in
// the reader's language; `heading` is the first line.
function summaryMarkdown(rows, { heading = '', label = g => g, cardUrl = () => '' } = {}) {
  const lines = heading ? [`# ${heading}`, ''] : [];
  for (const row of rows) {
    lines.push(`## @${row.username}`);
    for (const g of GROUPS) {
      if (!row.groups[g].length) continue;
      lines.push(`- **${label(g)}:** ${row.groups[g].map(c => {
        const url = cardUrl(c._id);
        return url ? `[${c.title}](${url})` : c.title;
      }).join(', ')}`);
    }
    lines.push('');
  }
  return lines.join('\n').trim() + '\n';
}

module.exports = { PERIODS, GROUPS, sinceFor, finishes, boardSummary, summaryMarkdown };
