// Pure helper for issue #3011: group a flat, date-sorted list of card
// comments so each reply renders directly under its (flattened, one-level)
// parent instead of interleaved by date with unrelated top-level comments.
//
// No Meteor imports on purpose - it is plain array logic, unit-testable with
// plain node (see tests/commentThreading.test.cjs), and reused as-is by the
// `comments` Blaze template (client/components/activities/comments.js).
//
// Threading is already capped at one level before a comment ever reaches
// here (models/cardComments.js `resolveParentId`, enforced both client-side
// on reply-click and server-side on insert), so a comment's parentId - when
// set - always points at a genuine top-level comment. This function does not
// re-flatten; it only groups. A parentId that does not match any comment in
// the list (e.g. the parent was deleted) falls back to rendering as
// top-level, rather than being silently dropped.
export function groupCommentsByThread(comments) {
  if (!Array.isArray(comments)) {
    return [];
  }

  const byId = new Set(comments.map(c => c._id));
  const repliesByParent = new Map();
  const topLevel = [];

  comments.forEach(comment => {
    const parentId = comment.parentId && byId.has(comment.parentId)
      ? comment.parentId
      : '';
    if (parentId) {
      if (!repliesByParent.has(parentId)) {
        repliesByParent.set(parentId, []);
      }
      repliesByParent.get(parentId).push(comment);
    } else {
      topLevel.push(comment);
    }
  });

  const grouped = [];
  topLevel.forEach(comment => {
    grouped.push(comment);
    const replies = repliesByParent.get(comment._id);
    if (replies) {
      grouped.push(...replies);
    }
  });

  return grouped;
}

export default groupCommentsByThread;
