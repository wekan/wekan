// Pure, dependency-free construction of the "My Attachments" (#3461) query:
// which attachments the CURRENT user may see on their own listing page - only
// what THEY uploaded (`userId`), and only on a board they can see (a boardId
// from the visible set the caller already computed with
// models/lib/boardVisibilitySelectors.js). No Meteor imports, so it is unit
// tested directly with plain Node (tests/myAttachments.test.cjs).
//
// Kept separate from server/publications/cards.js so the SHAPE of the query -
// "mine, and only on a board I can see" - is checkable without a database,
// the same way dueCards/myCards' board-visibility filtering is checkable by
// reading the source in tests/databaseQueryBounds.test.cjs.

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

/**
 * @param {string} userId the current user - the UPLOADER, not just the viewer
 * @param {string[]} visibleBoardIds every board this user may currently see
 *   (public boards + boards they belong to; see boardVisibilitySelectors.js)
 * @return {object|null} the Mongo selector, or null when there is nothing to
 *   query - no signed-in user, or a user who can see no board at all
 */
function myAttachmentsSelector(userId, visibleBoardIds) {
  if (!userId || typeof userId !== 'string') return null;
  const boardIds = Array.isArray(visibleBoardIds)
    ? visibleBoardIds.filter(id => typeof id === 'string' && id)
    : [];
  if (boardIds.length === 0) return null;

  return {
    userId,
    'meta.boardId': { $in: boardIds },
  };
}

/**
 * Clamp caller-supplied paging to a safe range, the same way dueCards does.
 * @param {number} [limit]
 * @param {number} [skip]
 * @return {{limit: number, skip: number}}
 */
function myAttachmentsPageOptions(limit, skip) {
  return {
    limit: Math.max(1, Math.min(Math.floor(limit) || DEFAULT_LIMIT, MAX_LIMIT)),
    skip: Math.max(0, Math.floor(skip) || 0),
  };
}

module.exports = {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  myAttachmentsSelector,
  myAttachmentsPageOptions,
};
