import { ReactiveCache } from '/imports/reactiveCache';

Meteor.publish('team', function(query, limit) {
  check(query, Match.OneOf(Object, null));
  check(limit, Number);

  const user = ReactiveCache.getCurrentUser();

  let ret = [];
  if (user && user.isAdmin) {
    ret = ReactiveCache.getTeams(query,
      {
        limit,
        sort: { createdAt: -1 },
        fields: {
          teamDisplayName: 1,
          teamDesc: 1,
          teamShortName: 1,
          teamWebsite: 1,
          teams: 1,
          createdAt: 1,
          teamIsActive: 1,
        }
      },
      true,
    );
  }

  return ret;
});
