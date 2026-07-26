// Pure, dependency-free helpers for issue #6116:
// "Only add to board people from same Organization or Team".
//
// There are two admin settings now, one per kind, each shown beside the thing it is
// about - `boardMembersFromSameOrgOnly` in Admin Panel / People / Organizations and
// `boardMembersFromSameTeamOnly` in / Teams. A user may only be added to a board if
// they share at least one of the ENABLED kinds with the user performing the add.
// This module holds the pure decision logic so it can be unit-tested without any
// Meteor/Mongo runtime.

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
 * The two restrictions, read off the admin Settings document. They live in Admin
 * Panel / People / Organizations and / Teams - one checkbox each, beside the thing
 * it is about - and replace the single "same Organization OR Team" setting, which
 * is still read here so an install that has not been migrated yet behaves the same.
 */
export function boardMemberRestriction(setting) {
  const legacy = !!(setting && setting.boardMembersFromSameOrgOrTeamOnly);
  return {
    org: !!(setting && setting.boardMembersFromSameOrgOnly) || legacy,
    team: !!(setting && setting.boardMembersFromSameTeamOnly) || legacy,
  };
}

/**
 * Decide whether a candidate user may be added to a board.
 *
 * @param {Object}   opts
 * @param {boolean}  opts.restrictOrgEnabled   "Only from the same Organization".
 * @param {boolean}  opts.restrictTeamEnabled  "Only from the same Team".
 * @param {boolean}  opts.restrictEnabled      The setting these two replace: the
 *                                             same as enabling both.
 * @param {string[]} opts.adderOrgs        Org ids of the user performing the add
 *                                         (or the union of board members' orgs).
 * @param {string[]} opts.adderTeams       Team ids of the adder / board members.
 * @param {string[]} opts.candidateOrgs    Org ids of the user being added.
 * @param {string[]} opts.candidateTeams   Team ids of the user being added.
 * @return {boolean} true when the add is allowed.
 */
export function canAddUserToBoard({
  restrictOrgEnabled,
  restrictTeamEnabled,
  restrictEnabled,
  adderOrgs,
  adderTeams,
  candidateOrgs,
  candidateTeams,
} = {}) {
  const org = !!restrictOrgEnabled || !!restrictEnabled;
  const team = !!restrictTeamEnabled || !!restrictEnabled;
  // Neither restriction => preserve the unrestricted behaviour.
  if (!org && !team) {
    return true;
  }
  // Allow when the candidate shares at least one of the ENABLED kinds. With both
  // enabled that is "a shared Org OR a shared Team" - the rule the single setting
  // had - and with one enabled it is only that one.
  return (
    (org && hasIntersection(adderOrgs, candidateOrgs)) ||
    (team && hasIntersection(adderTeams, candidateTeams))
  );
}

export default canAddUserToBoard;
