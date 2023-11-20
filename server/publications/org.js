import { ReactiveCache } from '/imports/reactiveCache';

Meteor.publish('org', function(query, limit) {
  check(query, Match.OneOf(Object, null));
  check(limit, Number);

  let ret = [];
  const user = ReactiveCache.getCurrentUser();

  if (user && user.isAdmin) {
    ret = ReactiveCache.getOrgs(query,
      {
        limit,
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
        }
      },
      true,
    );
  }

  return ret;
});
