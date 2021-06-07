Meteor.publish('org', function(query, limit) {
  check(query, Match.OneOf(Object, null));
  check(limit, Number);

  if (!Match.test(this.userId, String)) {
    return [];
  }

  const user = Users.findOne(this.userId);
  if (user && user.isAdmin) {
    return Org.find(query, {
      limit,
      sort: { createdAt: -1 },
      fields: {
        orgDisplayName: 1,
        orgDesc: 1,
        orgShortName: 1,
        orgWebsite: 1,
        orgTeams: 1,
        createdAt: 1,
        orgIsActive: 1,
      },
    });
  }

  return [];
});
