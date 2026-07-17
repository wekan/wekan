'use strict';

// Cleanup planning for user deletion (issue #1289: "Error after deleting a
// user").
//
// Deleting a user — Admin Panel / People (Meteor method `removeUser`), the
// self-service "delete account" button, or `DELETE /api/users/:userId` — only
// removed the `users` document itself. Every reference to that user stayed
// behind as a dangling id:
//
//   - boards.members   ([{ userId, isAdmin, ... }])  -> "ghost" members with
//     empty avatars that confused boards for years (see the issue thread:
//     2017, 2019, 2021, 2022 and 2025 reports),
//   - boards.watchers  ([{ userId, level }], complexWatchable),
//   - cards.members    ([userId]),
//   - cards.assignees  ([userId]),
//   - cards.watchers   ([userId], simpleWatchable),
//   - lists.watchers   ([userId], simpleWatchable),
//   - the user's uploaded avatar files (Avatars FilesCollection).
//
// While the client now null-guards missing users (so nothing crashes any
// more), the ghost references themselves previously had to be cleaned up by
// hand, board by board, or by editing MongoDB directly. This module computes
// the cleanup a user deletion implies; models/users.js applies it from a
// `Users.after.remove` collection hook, so every deletion path (method, REST,
// direct removeAsync) is covered.
//
// Activities and comments authored by the user are intentionally KEPT — the
// issue discussion settled on preserving history ("Replacing the username of
// every deleted user ... leaves a lot of conversations indecipherable"), and
// their rendering handles a missing author.
//
// Pure and Meteor-free so tests/userDeletionCleanup.test.cjs can exercise it
// in plain Node (same pattern as models/lib/apiLogout.js and
// models/lib/teamBoardMemberSync.js).

// A userId acceptable in a Mongo selector: a non-empty string. Anything else
// (undefined, null, objects — including selector-injection attempts like
// { $ne: null } — numbers, empty string) yields no cleanup plan.
function isValidUserId(userId) {
  return typeof userId === 'string' && userId.length > 0;
}

// Build the collection-by-collection cleanup implied by deleting `userId`.
// Returns null when userId is not a valid id (callers skip cleanup entirely
// rather than run an overly-broad selector).
//
// Shapes follow the schemas:
//   boards.members / boards.watchers hold OBJECTS with a userId field, so the
//   $pull argument is a sub-document match ({ members: { userId } });
//   cards.members / cards.assignees / cards.watchers / lists.watchers hold
//   plain userId STRINGS, so the $pull argument is the id itself.
function buildUserDeletionCleanupPlan(userId) {
  if (!isValidUserId(userId)) {
    return null;
  }
  return {
    boards: {
      selector: {
        $or: [{ 'members.userId': userId }, { 'watchers.userId': userId }],
      },
      modifier: {
        $pull: { members: { userId }, watchers: { userId } },
      },
    },
    cards: {
      selector: {
        $or: [{ members: userId }, { assignees: userId }, { watchers: userId }],
      },
      modifier: {
        $pull: { members: userId, assignees: userId, watchers: userId },
      },
    },
    lists: {
      selector: { watchers: userId },
      modifier: { $pull: { watchers: userId } },
    },
    avatars: {
      // Avatars is an ostrio:files FilesCollection: removeAsync(selector)
      // deletes both the records and the stored files, returning the number
      // removed (0 when none match — no throw).
      selector: { userId },
    },
  };
}

// Apply a cleanup plan against the given collections. Collections are
// dependency-injected ({ boards, cards, lists, avatars }) so the logic is
// unit-testable with fakes; any collection may be omitted and is then
// skipped. boards/cards/lists need `updateAsync(selector, modifier, options)`
// (multi-update), avatars needs `removeAsync(selector)`.
//
// Returns { boards, cards, lists, avatars } — the per-collection counts the
// drivers reported (0 for skipped collections).
async function applyUserDeletionCleanup(plan, collections) {
  const result = { boards: 0, cards: 0, lists: 0, avatars: 0 };
  if (!plan || !collections) {
    return result;
  }
  const { boards, cards, lists, avatars } = collections;
  if (boards && typeof boards.updateAsync === 'function') {
    result.boards =
      (await boards.updateAsync(plan.boards.selector, plan.boards.modifier, {
        multi: true,
      })) || 0;
  }
  if (cards && typeof cards.updateAsync === 'function') {
    result.cards =
      (await cards.updateAsync(plan.cards.selector, plan.cards.modifier, {
        multi: true,
      })) || 0;
  }
  if (lists && typeof lists.updateAsync === 'function') {
    result.lists =
      (await lists.updateAsync(plan.lists.selector, plan.lists.modifier, {
        multi: true,
      })) || 0;
  }
  if (avatars && typeof avatars.removeAsync === 'function') {
    result.avatars = (await avatars.removeAsync(plan.avatars.selector)) || 0;
  }
  return result;
}

module.exports = {
  isValidUserId,
  buildUserDeletionCleanupPlan,
  applyUserDeletionCleanup,
};
