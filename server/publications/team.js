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
        teamDisplayName: 1,
        teamDesc: 1,
        teamShortName: 1,
        teamWebsite: 1,
        teams: 1,
        createdAt: 1,
        teamIsActive: 1,
      },
    });
  }

  return [];
});
