// This is the publication used to display the organization list. We publish all the
// non-archived organizations:
// 1. that the user is a member of
// 2. the user has starred$or
Meteor.publish('organizations', function() {
  // Ensure that the user is connected. If it is not, we need to return an empty
  // array to tell the client to remove the previously published docs.
  // if (! Match.test(this.userId, String))
  //   return [];

  return Organizations.find({
    archived: false,
    'members.userId': this.userId,
  }, {
    fields: {
      _id: 1,
      shortName: 1,
      description: 1,
      slug: 1,
      title: 1,
      members: 1,
      sort: 1,
    },
  });
});

Meteor.publishComposite('organization', function(shortName) {
  check(shortName, String);
  return {
    find() {
      return Organizations.find({
        shortName,
        archived: false,
        // If the organization is not public the user has to be a member of it to see
        // it.
        'members.userId': this.userId,
      }, { limit: 1 });
    },
    children: [
      // Boards
      {
        find(organization) {
          return Boards.find({
            organizationId: organization._id,
          });
        },
      },

      // Cards and cards comments
      // XXX Originally we were publishing the card documents as a child of the
      // list publication defined above using the following selector `{ listId:
      // list._id }`. But it was causing a race condition in publish-composite,
      // that I documented here:
      //
      //   https://github.com/englue/meteor-publish-composite/issues/29
      //
      // I then tried to replace publish-composite by cottz:publish, but it had
      // a similar problem:
      //
      //   https://github.com/Goluis/cottz-publish/issues/4
      //   https://github.com/libreorganization/libreorganization/pull/78
      //
      // The current state of relational publishing in meteor is a bit sad,
      // there are a lot of various packages, with various APIs, some of them
      // are unmaintained. Fortunately this is something that will be fixed by
      // meteor-core at some point:
      //
      //   https://trello.com/c/BGvIwkEa/48-easy-joins-in-subscriptions
      //
      // And in the meantime our code below works pretty well -- it's not even a
      // hack!
      

      // Board members. This publication also includes former organization members that
      // aren't members anymore but may have some activities attached to them in
      // the history.
      {
        find(organization) {
          return Users.find({
            _id: { $in: _.pluck(organization.members, 'userId') },
          });
        },
        // Presence indicators
        children: [
          {
            find(user) {
              return presences.find({userId: user._id});
            },
          },
        ],
      },
    ],
  };
});
