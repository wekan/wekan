// #2489: a WIP limit shared across SEVERAL lists (columns) together, not just
// WeKan's existing per-list WIP limit (models/lists.js `wipLimit`). This module
// is the pure arithmetic behind that: given a group's member list ids and a
// map of how many cards each list currently holds, what is the group's
// combined count, and is that combined count over the group's own shared
// limit? Kept independent of any single list's own individual `wipLimit` -
// a group is over its shared limit purely by its own total vs. its own limit,
// never by what any member list's individual limit says.
//
// Deliberately framework-free (no Meteor, no collections) so it is testable
// as plain arithmetic, the same reason lockoutDecision.js and
// loginFailureDecision.js are pure modules - see CLAUDE.md "Every security
// fix gets a TEST" for why this shape is preferred wherever the decision can
// be isolated from the database.

/**
 * Sum the card counts of every list that belongs to a WIP limit group.
 *
 * @param {Object<string, number>} cardCountsByListId - listId -> current card count.
 * @param {string[]} listIds - the group's member list ids.
 * @returns {number} the group's combined card count. Unknown/missing list ids
 *   (e.g. a list that was archived or deleted after joining the group) count
 *   as 0 rather than throwing, so a stale membership does not crash the count.
 */
export function combinedWipLimitGroupCount(cardCountsByListId, listIds) {
  if (!Array.isArray(listIds) || listIds.length === 0) {
    return 0;
  }
  const counts = cardCountsByListId || {};
  return listIds.reduce((total, listId) => {
    const count = counts[listId];
    return total + (Number.isFinite(count) ? count : 0);
  }, 0);
}

/**
 * Is a WIP limit group over its own shared limit? Mirrors the per-list
 * `exceededWipLimit` decision in client/components/lists/listHeader.js
 * (`value < count`, strictly greater than the limit, not `>=`) so the same
 * "exceeded" wording and the same visual threshold apply to both.
 *
 * @param {number} combinedCount - the group's combined card count.
 * @param {number} limit - the group's shared limit.
 * @returns {boolean}
 */
export function isWipLimitGroupExceeded(combinedCount, limit) {
  if (!Number.isFinite(limit) || limit <= 0) {
    return false;
  }
  return Number.isFinite(combinedCount) && combinedCount > limit;
}

/**
 * Has a WIP limit group reached (but not necessarily exceeded) its shared
 * limit? Mirrors the per-list `reachedWipLimit` decision (`value <= count`),
 * used the same way there is: to decide whether adding one more card is still
 * allowed (a hard group can hide/disable "add card" at the limit itself, not
 * only once it is passed).
 *
 * @param {number} combinedCount
 * @param {number} limit
 * @returns {boolean}
 */
export function hasWipLimitGroupReachedLimit(combinedCount, limit) {
  if (!Number.isFinite(limit) || limit <= 0) {
    return false;
  }
  return Number.isFinite(combinedCount) && combinedCount >= limit;
}

/**
 * Which of a board's WIP limit groups (if any) a given list belongs to.
 * A list can belong to more than one group in principle, though the settings
 * UI is not expected to encourage it - this stays a plain filter either way.
 *
 * @param {Array<{_id: string, listIds: string[], limit: number, enabled?: boolean}>} groups
 * @param {string} listId
 * @returns {Array} the groups (each unmodified) that contain `listId`.
 */
export function findWipLimitGroupsForList(groups, listId) {
  if (!Array.isArray(groups) || !listId) {
    return [];
  }
  return groups.filter(
    group =>
      group &&
      group.enabled !== false &&
      Array.isArray(group.listIds) &&
      group.listIds.includes(listId),
  );
}

/**
 * Is `listId` a member of any group that is currently over its shared limit?
 * This is the decision the list header's over-limit styling reuses: a list
 * shows the SAME "over limit" indicator already used for its own individual
 * `wipLimit` whenever a group it belongs to is exceeded - even if that list's
 * own individual limit (if it has one) is not itself exceeded.
 *
 * @param {Array<{_id: string, listIds: string[], limit: number, enabled?: boolean}>} groups
 * @param {string} listId
 * @param {Object<string, number>} cardCountsByListId - listId -> current card count.
 * @returns {boolean}
 */
export function isListInExceededWipLimitGroup(groups, listId, cardCountsByListId) {
  const memberGroups = findWipLimitGroupsForList(groups, listId);
  return memberGroups.some(group => {
    const combined = combinedWipLimitGroupCount(cardCountsByListId, group.listIds);
    return isWipLimitGroupExceeded(combined, group.limit);
  });
}

/**
 * #2380: a WIP limit on a whole SWIMLANE - the combined card count across
 * every list that belongs to that swimlane. WeKan lists carry an optional
 * `swimlaneId` (models/lists.js) when a list was created for one specific
 * swimlane rather than shared across all of a board's swimlanes; those are
 * exactly "this swimlane's lists" and their ids form a WIP limit GROUP's
 * `listIds` in the very same shape #2489 already uses. No separate counting
 * or enforcement logic is needed: a swimlane's combined count/limit is a WIP
 * limit group whose members happen to be one swimlane's lists, so
 * combinedWipLimitGroupCount / isWipLimitGroupExceeded above are reused
 * as-is once the membership is known - this helper only computes that
 * membership.
 *
 * @param {Array<{_id: string, swimlaneId?: string}>} lists - a board's lists.
 * @param {string} swimlaneId - the swimlane to collect list ids for.
 * @returns {string[]} the ids of the lists that belong to that swimlane.
 *   A list with no swimlaneId (shared across every swimlane) is not counted
 *   as belonging to any one swimlane specifically, so it is excluded here.
 */
export function listIdsForSwimlane(lists, swimlaneId) {
  if (!Array.isArray(lists) || !swimlaneId) {
    return [];
  }
  return lists
    .filter(list => list && list.swimlaneId === swimlaneId)
    .map(list => list._id);
}
