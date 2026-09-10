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

export { hasUnreadComments };
