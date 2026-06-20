// Pure, dependency-free helper for issue #6116:
// "Only add to board people from same Organization or Team".
//
// When the global admin setting `boardMembersFromSameOrgOrTeamOnly` is enabled,
// a user may only be added to a board if they share at least one Organization OR
// at least one Team with the user performing the add. This module holds the pure
// decision logic so it can be unit-tested without any Meteor/Mongo runtime.

/**
 * Return true iff the two arrays share at least one element (string ids).
 * Null/undefined are treated as empty arrays.
 */
function hasIntersection(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0) {
    return false;
  }
  const setB = new Set(b);
  return a.some(item => setB.has(item));
}

/**
 * Decide whether a candidate user may be added to a board.
 *
 * @param {Object}   opts
 * @param {boolean}  opts.restrictEnabled  Global admin setting. When false the
 *                                         result is always true (current,
 *                                         unrestricted behaviour).
 * @param {string[]} opts.adderOrgs        Org ids of the user performing the add
 *                                         (or the union of board members' orgs).
 * @param {string[]} opts.adderTeams       Team ids of the adder / board members.
 * @param {string[]} opts.candidateOrgs    Org ids of the user being added.
 * @param {string[]} opts.candidateTeams   Team ids of the user being added.
 * @return {boolean} true when the add is allowed.
 */
export function canAddUserToBoard({
  restrictEnabled,
  adderOrgs,
  adderTeams,
  candidateOrgs,
  candidateTeams,
} = {}) {
  // Disabled => preserve current unrestricted behaviour.
  if (!restrictEnabled) {
    return true;
  }
  // Enabled => allow only when a shared Org OR a shared Team exists.
  return (
    hasIntersection(adderOrgs, candidateOrgs) ||
    hasIntersection(adderTeams, candidateTeams)
  );
}

export default canAddUserToBoard;
