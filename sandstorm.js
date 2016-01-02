// Sandstorm context is detected using the METEOR_SETTINGS environment variable
// in the package definition.
const isSandstorm = Meteor.settings && Meteor.settings.public &&
                    Meteor.settings.public.sandstorm;

// In sandstorm we only have one board per sandstorm instance. Since we want to
// keep most of our code unchanged, we simply hard-code a board `_id` and
// redirect the user to this particular board.
const sandstormBoard = {
  _id: 'sandstorm',

  // XXX Should be shared with the grain instance name.
  title: 'Wekan',
  slug: 'libreboard',
  members: [],

  // Board access security is handled by sandstorm, so in our point of view we
  // can alway assume that the board is public (unauthorized users won't be able
  // to access it anyway).
  permission: 'public',
};

if (isSandstorm && Meteor.isServer) {
  function updateUserPermissions(userId, permissions) {
    const isActive = permissions.indexOf('participate') > -1;
    const isAdmin = permissions.indexOf('configure') > -1;
    const permissionDoc = { userId, isActive, isAdmin };

    const boardMembers = Boards.findOne(sandstormBoard._id).members;
    const memberIndex = _.pluck(boardMembers, 'userId').indexOf(userId);

    let modifier;
    if (memberIndex > -1)
      modifier = { $set: { [`members.${memberIndex}`]: permissionDoc }};
    else if (!isActive)
      modifier = {};
    else
      modifier = { $push: { members: permissionDoc }};

    Boards.update(sandstormBoard._id, modifier);
  }

  Picker.route('/', (params, req, res) => {
    // Redirect the user to the hard-coded board. On the first launch the user
    // will be redirected to the board before its creation. But that's not a
    // problem thanks to the reactive board publication. We used to do this
    // redirection on the client side but that was sometimes visible on loading,
    // and the home page was accessible by pressing the back button of the
    // browser, a server-side redirection solves both of these issues.
    //
    // XXX Maybe the sandstorm http-bridge could provide some kind of "home URL"
    // in the manifest?
    const base = req.headers['x-sandstorm-base-path'];
    const { _id, slug } = sandstormBoard;
    const boardPath = FlowRouter.path('board', { id: _id, slug });

    res.writeHead(301, {
      Location: base + boardPath,
    });
    res.end();

    // `accounts-sandstorm` populate the Users collection when new users
    // accesses the document, but in case a already known user comes back, we
    // need to update his associated document to match the request HTTP headers
    // informations.
    // XXX We need to update this document even if the initial route is not `/`.
    // Unfortuanlty I wasn't able to make the Webapp.rawConnectHandlers solution
    // work.
    const user = Users.findOne({
      'services.sandstorm.id': req.headers['x-sandstorm-user-id'],
    });
    if (user) {
      // XXX At this point the user.services.sandstorm credentials haven't been
      // updated, which mean that the user will have to restart the application
      // a second time to see its updated name and avatar.
      Users.update(user._id, {
        $set: {
          'profile.fullname': user.services.sandstorm.name,
          'profile.avatarUrl': user.services.sandstorm.picture,
        },
      });
      updateUserPermissions(user._id, user.services.sandstorm.permissions);
    }
  });

  // On the first launch of the instance a user is automatically created thanks
  // to the `accounts-sandstorm` package. After its creation we insert the
  // unique board document. Note that when the `Users.after.insert` hook is
  // called, the user is inserted into the database but not connected. So
  // despite the appearances `userId` is null in this block.
  Users.after.insert((userId, doc) => {
    if (!Boards.findOne(sandstormBoard._id)) {
      Boards.insert(sandstormBoard, { validate: false });
      Activities.update(
        { activityTypeId: sandstormBoard._id },
        { $set: { userId: doc._id }}
      );
    }

    // We rely on username uniqueness for the user mention feature, but
    // Sandstorm doesn't enforce this property -- see #352. Our strategy to
    // generate unique usernames from the Sandstorm `preferredHandle` is to
    // append a number that we increment until we generate a username that no
    // one already uses (eg, 'max', 'max1', 'max2').
    function generateUniqueUsername(username, appendNumber) {
      return username + String(appendNumber === 0 ? '' : appendNumber);
    }

    const username = doc.services.sandstorm.preferredHandle;
    let appendNumber = 0;
    while (Users.findOne({
      _id: { $ne: doc._id },
      username: generateUniqueUsername(username, appendNumber),
    })) {
      appendNumber += 1;
    }

    Users.update(doc._id, {
      $set: {
        username: generateUniqueUsername(username, appendNumber),
        'profile.fullname': doc.services.sandstorm.name,
        'profile.avatarUrl': doc.services.sandstorm.picture,
      },
    });

    updateUserPermissions(doc._id, doc.services.sandstorm.permissions);
  });

  // Wekan v0.8 didn’t implement the Sandstorm sharing model and instead kept
  // the visibility setting (“public” or “private”) in the UI as does the main
  // Meteor application. We need to enforce “public” visibility as the sharing
  // is now handled by Sandstorm.
  // See https://github.com/wekan/wekan/issues/346
  Migrations.add('enforce-public-visibility-for-sandstorm', () => {
    Boards.update('sandstorm', { $set: { permission: 'public' }});
  });
}

if (isSandstorm && Meteor.isClient) {
  // Since the Sandstorm grain is displayed in an iframe of the Sandstorm shell,
  // we need to explicitly expose meta data like the page title or the URL path
  // so that they could appear in the browser window.
  // See https://docs.sandstorm.io/en/latest/developing/path/
  function updateSandstormMetaData(msg) {
    return window.parent.postMessage(msg, '*');
  }

  FlowRouter.triggers.enter([({ path }) => {
    updateSandstormMetaData({ setPath: path });
  }]);

  Tracker.autorun(() => {
    updateSandstormMetaData({ setTitle: DocHead.getTitle() });
  });

  // Runtime redirection from the home page to the unique board -- since the
  // home page contains a list of a single board it's not worth to display.
  //
  // XXX Hack. The home route is already defined at this point so we need to
  // add the redirection trigger to the internal route object.
  FlowRouter._routesMap.home._triggersEnter.push((context, redirect) => {
    redirect(FlowRouter.path('board', {
      id: sandstormBoard._id,
      slug: sandstormBoard.slug,
    }));
  });

  // XXX Hack. `Meteor.absoluteUrl` doesn't work in Sandstorm, since every
  // session has a different URL whereas Meteor computes absoluteUrl based on
  // the ROOT_URL environment variable. So we overwrite this function on a
  // sandstorm client to return relative paths instead of absolutes.
  const _absoluteUrl = Meteor.absoluteUrl;
  const _defaultOptions = Meteor.absoluteUrl.defaultOptions;
  Meteor.absoluteUrl = (path, options) => {
    const url = _absoluteUrl(path, options);
    return url.replace(/^https?:\/\/127\.0\.0\.1:[0-9]{2,5}/, '');
  };
  Meteor.absoluteUrl.defaultOptions = _defaultOptions;
}

// We use this blaze helper in the UI to hide some templates that does not make
// sense in the context of sandstorm, like board staring, board archiving, user
// name edition, etc.
Blaze.registerHelper('isSandstorm', isSandstorm);
