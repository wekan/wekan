/**
 * Pure, dependency-free helper for removing a board member entry by userId.
 *
 * This module intentionally has NO Meteor / collection imports so it can be
 * imported directly by unit tests (mocha + chai) without a running app, while
 * still being the single source of truth used by models/boards.js when a member
 * must be hard-removed from board.members.
 *
 * #5330 "Remove a non-existent (removed user) from a board member is not
 * working": after a user account is deleted the user still appears in some
 * boards' member lists, and removing them did nothing because the removal flow
 * looked the user up and bailed out when the Users document no longer existed.
 *
 * The member entry on a board references the user only by userId, so removal
 * must work purely on that id, regardless of whether the Users document still
 * exists.
 */

/**
 * Return a new members array with the entry matching userId removed.
 *
 * Works whether or not the referenced user still exists, since matching is by
 * the stored userId only. If no entry matches, the (copied) array is returned
 * unchanged (no-op).
 *
 * @param {Array<{userId:string}>} members - board.members
 * @param {string} userId - userId of the member entry to remove
 * @returns {Array<{userId:string}>} members without the matching entry
 */
export function pullMemberById(members, userId) {
  const list = Array.isArray(members) ? members : [];
  return list.filter(member => !(member && member.userId === userId));
}
