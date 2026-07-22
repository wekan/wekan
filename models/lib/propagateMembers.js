'use strict';

// Pure decision logic for the per-org/team "Propagate Members To Boards" flag
// (#4737 / #5850). Extracted from server/propagateOrgTeamMembers.js so the
// add-only membership computation is unit-testable without Meteor.
//
// The propagation is strictly ADD-ONLY: a user who is a member of a flagged
// org/team is added as a normal (active, non-admin) board member of every
// regular board that lists that org/team, and existing board members are never
// removed or modified.

// Given a board's current `members` array and the org/team member userIds,
// return the NEW member entries to append (for the users not already members).
// Returns [] when there is nothing to add. Does not mutate the inputs.
function membersToAddToBoard(existingMembers, memberUserIds) {
  const existing = new Set(
    (Array.isArray(existingMembers) ? existingMembers : [])
      .map(m => m && m.userId)
      .filter(Boolean),
  );
  const seen = new Set();
  const toAdd = [];
  for (const userId of Array.isArray(memberUserIds) ? memberUserIds : []) {
    if (!userId || typeof userId !== 'string') continue;
    if (existing.has(userId) || seen.has(userId)) continue;
    seen.add(userId);
    toAdd.push({
      userId,
      isAdmin: false,
      isActive: true,
      isNoComments: false,
      isCommentOnly: false,
      isWorker: false,
    });
  }
  return toAdd;
}

module.exports = { membersToAddToBoard };
