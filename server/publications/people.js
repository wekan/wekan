Meteor.publish('people', function(query, limit) {
  check(query, Match.OneOf(Object, null));
  check(limit, Number);

  if (!Match.test(this.userId, String)) {
    return [];
  }

  const user = Users.findOne(this.userId);
  if (user && user.isAdmin) {
    return Users.find(query, {
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
    });
  }

  return [];
});
