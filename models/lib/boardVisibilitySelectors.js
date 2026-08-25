// Pure, dependency-free construction of the Mongo `$or` that answers "which
// boards may this user see". No Meteor imports, so it is unit tested directly
// with plain Node (tests/boardVisibilitySelectors.test.cjs).
//
// GHSA-gwc4-fw7p-gw58: this was written out TWICE, and the two copies disagreed.
// Boards.userBoards() - the All Boards list - matched org/team/domain shares
// with `$elemMatch: { ..., isActive: true }`, but the `board` publication (the
// one that sends the board and all its cards) matched them with a dotted
// `'orgs.orgId': { $in: [...] }`, which ignores isActive entirely. isActive is
// the REVOKE switch: setting a share to `isActive: false` made the board vanish
// from All Boards, as it should, while a user who still knew the boardId could
// subscribe to it and receive the whole private board. A revoke that the primary
// data publication does not honour is not a revoke.
//
// So there is one builder now, and both callers use it. A share entry counts
// only while it is active, everywhere.

/**
 * @param {object} args
 * @param {string} [args.userId] the subscriber; omitted/falsy means anonymous
 * @param {string[]} [args.orgIds] organisations the user belongs to
 * @param {string[]} [args.teamIds] teams the user belongs to
 * @param {string[]} [args.emailDomains] the user's verified email domains (#5850)
 * @param {boolean} [args.includePublic=true] include `{ permission: 'public' }`,
 *        which is not a relationship to the user at all but "anybody may open
 *        this" - wanted for direct/public discovery, not in a relationship-only
 *        list or a search over all boards.
 * @return {object[]} the `$or` clauses, in a stable order
 */
function boardVisibilitySelectors({
  userId,
  orgIds = [],
  teamIds = [],
  emailDomains = [],
  includePublic = true,
} = {}) {
  const selectors = [];

  if (includePublic) {
    selectors.push({ permission: 'public' });
  }

  if (!userId) {
    return selectors;
  }

  const clean = (values) =>
    Array.isArray(values) ? values.filter((v) => typeof v === 'string' && v) : [];

  selectors.push({ members: { $elemMatch: { userId, isActive: true } } });
  const cleanOrgIds = clean(orgIds);
  if (cleanOrgIds.length) selectors.push({
    orgs: { $elemMatch: { orgId: { $in: cleanOrgIds }, isActive: true } },
  });
  const cleanTeamIds = clean(teamIds);
  if (cleanTeamIds.length) selectors.push({
    teams: { $elemMatch: { teamId: { $in: cleanTeamIds }, isActive: true } },
  });
  // #5850: domain-based board sharing — board shared with the user's email domain.
  const cleanDomains = clean(emailDomains);
  if (cleanDomains.length) selectors.push({
    domains: { $elemMatch: { domain: { $in: cleanDomains }, isActive: true } },
  });

  return selectors;
}

module.exports = { boardVisibilitySelectors };
