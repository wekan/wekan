import { ReactiveCache } from '/imports/reactiveCache';

// Multitenancy option D (D.7): the site admin sees every Organization, a per-tenant
// Global Admin sees the ones they administer. Same rule module as the people
// publication, so the two panes cannot disagree about who sees what.
import * as tenantAdmin from '/models/lib/tenantAdmin';

Meteor.publish('org', async function(query, limit, skip = 0) {
  check(query, Match.OneOf(Object, null));
  check(limit, Number);
  check(skip, Match.OneOf(Number, null, undefined));

  let ret = [];
  const user = await ReactiveCache.getCurrentUser();

  if (tenantAdmin.canOpenAdminPanel(user)) {
    ret = await ReactiveCache.getOrgs(tenantAdmin.orgScopeSelector(user, query),
      {
        limit,
        skip: skip || 0,
        sort: { createdAt: -1 },
        fields: {
          orgDisplayName: 1,
          orgDesc: 1,
          orgShortName: 1,
          orgAutoAddUsersWithDomainName: 1,
          orgWebsite: 1,
          orgTeams: 1,
          createdAt: 1,
          orgIsActive: 1,
          orgSharedTemplates: 1,
          orgPropagateMembersToBoards: 1,
          orgSyncMembersFromAuth: 1,
          // Multitenancy option D: the hostnames this org is served on, and the
          // branding that replaces the instance branding on them.
          orgDomains: 1,
          orgProductName: 1,
          orgThemeColor: 1,
          orgThemeCustomColors: 1,
          orgCustomLoginLogoImageUrl: 1,
          orgCustomLoginLogoLinkUrl: 1,
          orgTextBelowCustomLoginLogo: 1,
          orgCustomTopLeftCornerLogoImageUrl: 1,
          orgCustomTopLeftCornerLogoLinkUrl: 1,
          orgCustomHelpLinkUrl: 1,
          orgLegalNotice: 1,
        }
      },
      true,
    );
  }

  return ret;
});
