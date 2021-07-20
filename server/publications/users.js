Meteor.publish('user-miniprofile', function(usernames) {
  check(usernames, Array);

  // eslint-disable-next-line no-console
  // console.log('usernames:', usernames);
  return Users.find(
    {
      $or: [
        { username: { $in: usernames } },
        { importUsernames: { $in: usernames } },
      ],
    },
    {
      fields: {
        ...Users.safeFields,
        importUsernames: 1,
      },
    },
  );
});

Meteor.publish('user-admin', function() {
  return Meteor.users.find(this.userId, {
    fields: {
      isAdmin: 1,
    },
  });
});

Meteor.publish('user-authenticationMethod', function(match) {
  check(match, String);
  return Users.find(
    { $or: [{ _id: match }, { email: match }, { username: match }] },
    {
      fields: {
        authenticationMethod: 1,
      },
    },
  );
});
