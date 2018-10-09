Meteor.publish('people', function(limit) {
  check(limit, Number);

  if (!Match.test(this.userId, String)) {
    return [];
  }

  const user = Users.findOne(this.userId);
  if (user && user.isAdmin) {
    return Users.find({}, {
      limit,
      sort: {createdAt: -1},
      fields: {
        'username': 1,
        'profile.fullname': 1,
        'isAdmin': 1,
        'emails': 1,
        'createdAt': 1,
        'loginDisabled': 1,
        'authenticationMethod': 1,
      },
    });
  } else {
    return [];
  }
});
