Meteor.publish('people', (limit) => {
  check(limit, Number);
  return Users.find({}, {
    limit,
    sort: {createdAt: -1},
  });
});
