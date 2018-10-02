Meteor.publish('user-miniprofile', function(userId) {
  check(userId, String);

  return Users.find(userId, {
    fields: {
      'username': 1,
      'profile.fullname': 1,
      'profile.avatarUrl': 1,
    },
  });
});

Meteor.publish('user-admin', function() {
  return Meteor.users.find(this.userId, {
    fields: {
      isAdmin: 1,
    },
  });
});

Meteor.publish('user-connection-method', function(match) {
  check(match, String);

  return Users.find({$or: [{email: match},{username: match}]}, {
    fields: {
      ldap: 1,
    },
  });
});