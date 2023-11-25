import { ReactiveCache } from '/imports/reactiveCache';

Meteor.publish('people', function(query, limit) {
  check(query, Match.OneOf(Object, null));
  check(limit, Number);

  let ret = [];
  const user = ReactiveCache.getCurrentUser();

  if (user && user.isAdmin) {
    ret = ReactiveCache.getUsers(query, {
      limit,
      sort: { createdAt: -1 },
      fields: {
        username: 1,
        'profile.fullname': 1,
        'profile.initials': 1,
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
