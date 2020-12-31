Meteor.publish('team', function(query, limit) {
  check(query, Match.OneOf(Object, null));
  check(limit, Number);

  if (!Match.test(this.userId, String)) {
    return [];
  }

  const user = Users.findOne(this.userId);
  if (user && user.isAdmin) {
    return Team.find(query, {
      limit,
      sort: { createdAt: -1 },
      fields: {
        displayName: 1,
        desc: 1,
        name: 1,
        website: 1,
        teams: 1,
        createdAt: 1,
        loginDisabled: 1,
      },
    });
  }

  return [];
});
