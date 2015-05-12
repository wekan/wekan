// Sandstorm context is detected using the METEOR_SETTINGS environment variable
// in the package definition.
var isSandstorm = Meteor.settings && Meteor.settings.public &&
                  Meteor.settings.public.sandstorm;

// In sandstorm we only have one board per sandstorm instance. Since we want to
// keep most of our code unchanged, we simply hard-code a board `_id` and
// redirect the user to this particular board.
var sandstormBoard = {
  _id: 'sandstorm',
  slug: 'board',

  // XXX Should be shared with the grain instance name.
  title: 'LibreBoard',
  permission: 'public',
  background: {
    type: 'color',
    color: '#16A085'
  },

  // XXX Not certain this is a bug, but we except these fields to get inserted
  // by the `Lists.before.insert` collection-hook. Since this hook is not called
  // in this case, we have to duplicate the logic and set them here.
  archived: false,
  createdAt: new Date()
};

// On the first launch of the instance a user is automatically created thanks to
// the `accounts-sandstorm` package. After its creation we insert the unique
// board document. Note that when the `Users.after.insert` hook is called, the
// user is inserted into the database but not connected. So despite the
// appearances `userId` is null in this block.
//
// If the hard-coded board already exists and we are inserting a new user, we
// assume that the owner of the board want to share write privileges with the
// new user.
// XXX Improve that when the Sandstorm sharing model (“Powerbox”) arrives.
if (isSandstorm && Meteor.isServer) {
  Users.after.insert(function(userId, doc) {
    if (! Boards.findOne(sandstormBoard._id)) {
      Boards.insert(_.extend(sandstormBoard, { userId: doc._id }));
      Boards.update(sandstormBoard._id, {
        $set: {
          'members.0.userId': doc._id
        }
      });
      Activities.update({
        activityTypeId: sandstormBoard._id
      }, {
        $set: {
          userId: doc._id
        }
      });
    } else {
      Boards.update({
        _id: sandstormBoard._id,
        permission: 'public'
      }, {
        $push: {
          members: doc._id
        }
      });
    }
  });
}

// On the client, redirect the user to the hard-coded board. On the first launch
// the user will be redirected to the board before its creation. But that’s not
// a problem thanks to the reactive board publication.
if (isSandstorm && Meteor.isClient) {
  Router.go('Board', {
    boardId: sandstormBoard._id,
    slug: getSlug(sandstormBoard.title)
  });

  // XXX Hack. `Meteor.absoluteUrl` doesn't work in Sandstorm, since every
  // session has a different URL whereas Meteor computes absoluteUrl based on
  // the ROOT_URL environment variable. So we overwrite this function on a
  // sandstorm client to return relative paths instead of absolutes.
  var _absoluteUrl = Meteor.absoluteUrl;
  var _defaultOptions = Meteor.absoluteUrl.defaultOptions;
  Meteor.absoluteUrl = function(path, options) {
    var url = _absoluteUrl(path, options);
    return url.replace(/^https?:\/\/127\.0\.0\.1:[0-9]{2,5}/, '');
  };
  Meteor.absoluteUrl.defaultOptions = _defaultOptions;
}

// We use this blaze helper in the UI to hide some template that does not make
// sense in the context of sandstorm, like board staring, board archiving, user
// name edition, etc.
Blaze.registerHelper('isSandstorm', function() {
  return isSandstorm;
});
