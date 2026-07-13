import Boards from '/models/boards';
import TableVisibilityModeSettings from '/models/tableVisibilityModeSettings';
import { findWhere, where } from '/imports/lib/collectionHelpers';
import { allowIsBoardAdmin, canUpdateBoardSort } from '/server/lib/utils';

Boards.allow({
  async insert(userId, doc) {
    // Check if user is logged in
    if (!userId) return false;

    // If allowPrivateOnly is enabled, only allow private boards
    const allowPrivateOnly = (await TableVisibilityModeSettings.findOneAsync('tableVisibilityMode-allowPrivateOnly'))?.booleanValue;
    if (allowPrivateOnly && doc.permission === 'public') {
      return false;
    }

    return true;
  },
  update: allowIsBoardAdmin,
  remove: allowIsBoardAdmin,
  fetch: ['members'],
});

// All logged in users are allowed to reorder boards by dragging at All Boards page and Public Boards page.
// SortBleed (GHSA-xm8x-c8wg-jhmf): canUpdateBoardSort only approves updates that
// touch the 'sort' field and NOTHING else, so a board member can never smuggle a
// members/permission/title change into the same modifier as sort.
Boards.allow({
  update(userId, board, fieldNames) {
    return canUpdateBoardSort(userId, board, fieldNames);
  },
  // Need members to verify membership in policy
  fetch: ['members'],
});

// The number of users that have starred this board is managed by trusted code
// and the user is not allowed to update it
Boards.deny({
  update(userId, board, fieldNames) {
    return (fieldNames || []).includes('stars');
  },
  fetch: [],
});

// We can't remove a member if it is the last administrator
Boards.deny({
  update(userId, doc, fieldNames, modifier) {
    if (!(fieldNames || []).includes('members')) return false;

    // Defense in depth (SortBleed, GHSA-xm8x-c8wg-jhmf): a wholesale
    // `$set: { members: [...] }` rewrite bypasses the $pull check below, so it
    // could drop the last active admin (evicting the legitimate owner). Reject
    // any $set of the members array that does not keep at least one active
    // admin, whenever the board currently has one.
    const setMembers = modifier.$set && modifier.$set.members;
    if (Array.isArray(setMembers)) {
      const hadAdmin =
        where(doc.members, { isActive: true, isAdmin: true }).length > 0;
      const keepsAdmin =
        where(setMembers, { isActive: true, isAdmin: true }).length > 0;
      if (hadAdmin && !keepsAdmin) return true;
    }

    // We only care in case of a $pull operation, ie remove a member
    const pullMembers = modifier.$pull && modifier.$pull.members;
    if (!(typeof pullMembers === 'object' && pullMembers !== null)) return false;

    // If there is more than one admin, it's ok to remove anyone
    const nbAdmins = where(doc.members, { isActive: true, isAdmin: true })
      .length;
    if (nbAdmins > 1) return false;

    // If all the previous conditions were verified, we can't remove
    // a user if it's an admin
    const removedMemberId = modifier.$pull.members.userId;
    return Boolean(
      findWhere(doc.members, {
        userId: removedMemberId,
        isAdmin: true,
      }),
    );
  },
  fetch: ['members'],
});

// Deny changing permission to public if allowPrivateOnly is enabled
Boards.deny({
  async update(userId, doc, fieldNames, modifier) {
    if (!(fieldNames || []).includes('permission')) return false;

    const allowPrivateOnly = (await TableVisibilityModeSettings.findOneAsync('tableVisibilityMode-allowPrivateOnly'))?.booleanValue;
    if (allowPrivateOnly && modifier.$set && modifier.$set.permission === 'public') {
      return true;
    }

    return false;
  },
  fetch: [],
});
