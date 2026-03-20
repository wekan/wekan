import { ReactiveCache } from '/imports/reactiveCache';

Meteor.publish('team', async function(query, limit, skip = 0) {
  check(query, Match.OneOf(Object, null));
  check(limit, Number);
  check(skip, Match.OneOf(Number, null, undefined));

  const user = await ReactiveCache.getCurrentUser();

  let ret = [];
  if (user && user.isAdmin) {
    ret = await ReactiveCache.getTeams(query,
      {
        limit,
        skip: skip || 0,
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
