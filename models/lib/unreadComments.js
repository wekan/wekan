'use strict';

// Whether a minicard should show the "has unread comments" highlight (#3078).
//
// A user has no way today to tell, without opening a card, whether it has
// comments they have not seen yet. This is the pure decision behind that
// highlight, kept dependency-free so it can be unit-tested without a server
// or a database and reused by both the minicard helper and its tests.
//
//   comments      array of comment documents belonging to the card (only
//                 `createdAt` is read)
//   lastViewedAt  Date/ISO-string the current user last opened this card, or
//                 null/undefined if they never have (models/users.js
//                 getCardLastViewedAt)
//
// Rules:
//   - a card with zero comments is never flagged, viewed or not;
//   - a card never viewed by this user is flagged whenever it has ANY
//     comment - there is nothing to compare against, so any comment counts
//     as unseen;
//   - a card that was viewed is flagged only when at least one comment was
//     created AFTER that last-viewed time.
function hasUnreadComments(comments, lastViewedAt) {
  const list = Array.isArray(comments) ? comments : [];
  if (list.length === 0) return false;

  if (!lastViewedAt) return true;

  const lastViewedTime = new Date(lastViewedAt).getTime();
  if (Number.isNaN(lastViewedTime)) return true;

  return list.some(comment => {
    const createdAt = comment && comment.createdAt;
    if (!createdAt) return false;
    const createdAtTime = new Date(createdAt).getTime();
    return !Number.isNaN(createdAtTime) && createdAtTime > lastViewedTime;
  });
}

// #6745: the write behind "opened this card". It $sets ONE entry,
// profile.cardLastViews.<cardId>, instead of rewriting the whole map: a client
// reading only that entry (client/lib/currentUserWith.js) then sees one card
// change, not every card the user ever opened. The map is also capped - it grew
// by one entry per card ever opened and lives in the profile every page loads.
// At the cap the least recently viewed entries are dropped; such a card counts
// as never viewed again, which only means an old comment can show as unread.
const CARD_LAST_VIEWS_MAX = 5000;

function viewedTime(value) {
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isNaN(time) ? 0 : time;
}

function cardLastViewsModifier(views, cardId, now, max = CARD_LAST_VIEWS_MAX) {
  const current = views && typeof views === 'object' ? views : {};
  const ids = Object.keys(current);
  if (Object.prototype.hasOwnProperty.call(current, cardId) || ids.length < max) {
    return { $set: { [`profile.cardLastViews.${cardId}`]: now } };
  }
  const next = {};
  ids
    .sort((a, b) => viewedTime(current[b]) - viewedTime(current[a]))
    .slice(0, Math.max(0, max - 1))
    .forEach(id => { next[id] = current[id]; });
  next[cardId] = now;
  return { $set: { 'profile.cardLastViews': next } };
}

export { hasUnreadComments, cardLastViewsModifier, CARD_LAST_VIEWS_MAX };
