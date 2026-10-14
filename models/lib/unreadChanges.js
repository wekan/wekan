'use strict';

// #2111 / #1604: every change to any field of a card - title, description,
// attachments, checklists, members, dates, labels, comments - marks it unread
// on the minicard, until the member opens it, when Member Settings / "Mark
// cards changed since I last opened them" is on (off by default).
//
// The card's own fields bump its modifiedAt; checklists, their items,
// attachments and comments are their own documents, so the latest of all of
// them is the card's last change. A card is unread when that is after the
// member last opened it - and after the moment they turned the switch on, so
// switching it on does not mark every card they never opened.
// Pure: tests/unreadChanges.test.cjs.

function time(value) {
  const t = value ? new Date(value).getTime() : NaN;
  return Number.isNaN(t) ? 0 : t;
}

function latestChangeTime({ card, checklists = [], items = [], attachments = [], comments = [] } = {}) {
  let latest = 0;
  const take = v => { const t = time(v); if (t > latest) latest = t; };
  if (card) { take(card.modifiedAt); take(card.dateLastActivity); take(card.createdAt); }
  for (const c of checklists) if (c) { take(c.modifiedAt); take(c.createdAt); }
  for (const i of items) if (i) { take(i.modifiedAt); take(i.createdAt); }
  for (const a of attachments) if (a) { take(a.uploadedAt); take(a.updatedAt); take(a.createdAt); }
  for (const m of comments) if (m) { take(m.modifiedAt); take(m.createdAt); }
  return latest;
}

function hasUnreadChanges(latest, { lastViewedAt, enabledAt } = {}) {
  if (!enabledAt) return false;
  const since = Math.max(time(lastViewedAt), time(enabledAt));
  return latest > since;
}

module.exports = { latestChangeTime, hasUnreadChanges };
