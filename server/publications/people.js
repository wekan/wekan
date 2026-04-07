import { ReactiveCache } from '/imports/reactiveCache';

Meteor.publish('people', async function(query, limit, skip = 0) {
  check(query, Match.OneOf(Object, null));
  check(limit, Number);
  check(skip, Match.OneOf(Number, null, undefined));

  let ret = [];
  const user = await ReactiveCache.getCurrentUser();

  if (user && user.isAdmin) {
    ret = await ReactiveCache.getUsers(query, {
      limit,
      skip: skip || 0,
      sort: { createdAt: -1 },
      fields: {
        username: 1,
        'profile.fullname': 1,
        'profile.initials': 1,
        'profile.avatarUrl': 1,
        isAdmin: 1,
        emails: 1,
        createdAt: 1,
        loginDisabled: 1,
        authenticationMethod: 1,
        importUsernames: 1,
        orgs: 1,
        teams: 1,
      },
    },
    true);
  }

  return ret;
});
