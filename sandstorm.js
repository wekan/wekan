import { ReactiveCache } from '/imports/reactiveCache';
import { Meteor } from 'meteor/meteor';
import { Picker } from 'meteor/communitypackages:picker';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

// Sandstorm context is detected using the METEOR_SETTINGS environment variable
// in the package definition.
const isSandstorm = Meteor.settings?.public?.sandstorm;

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
  const fs = require('fs');
  const Capnp = Npm.require('capnp');
  const Package = Capnp.importSystem('sandstorm/package.capnp');
  const Powerbox = Capnp.importSystem('sandstorm/powerbox.capnp');
  const Identity = Capnp.importSystem('sandstorm/identity.capnp');
  const SandstormHttpBridge = Capnp.importSystem(
    'sandstorm/sandstorm-http-bridge.capnp',
  ).SandstormHttpBridge;

  let httpBridge = null;
  let capnpConnection = null;

  const bridgeConfig = Capnp.parse(
    Package.BridgeConfig,
    fs.readFileSync('/sandstorm-http-bridge-config'),
  );

  function getHttpBridge() {
    if (!httpBridge) {
      capnpConnection = Capnp.connect('unix:/tmp/sandstorm-api');
      httpBridge = capnpConnection.restore(null, SandstormHttpBridge);
    }
    return httpBridge;
  }

  Meteor.methods({
    async sandstormClaimIdentityRequest(token, descriptor) {
      check(token, String);
      check(descriptor, String);

      const parsedDescriptor = Capnp.parse(
        Powerbox.PowerboxDescriptor,
        Buffer.from(descriptor, 'base64'),
        { packed: true },
      );

      const tag = Capnp.parse(
        Identity.Identity.PowerboxTag,
        parsedDescriptor.tags[0].value,
      );
      const permissions = [];
      if (tag.permissions[1]) {
        permissions.push('configure');
      }

      if (tag.permissions[0]) {
        permissions.push('participate');
      }

      const sessionId = this.connection.sandstormSessionId();
      const httpBridge = getHttpBridge();
      const session = httpBridge.getSessionContext(sessionId).context;
      const api = httpBridge.getSandstormApi(sessionId).api;

      const response = await session.claimRequest(token);
      const identity = response.cap.castAs(Identity.Identity);
      const [identityIdResult, profileResult] = await Promise.all([
        api.getIdentityId(identity),
        identity.getProfile(),
        httpBridge.saveIdentity(identity),
      ]);
      const identityId = identityIdResult.id.toString('hex').slice(0, 32);
      const profile = profileResult.profile;
      const pictureResponse = await profile.picture.getUrl();
      const sandstormInfo = {
        id: identityId,
        name: profile.displayName.defaultText,
        permissions,
        picture: `${pictureResponse.protocol}://${pictureResponse.hostPath}`,
        preferredHandle: profile.preferredHandle,
        pronouns: profile.pronouns,
      };

      const login = await Accounts.updateOrCreateUserFromExternalService(
        'sandstorm',
        sandstormInfo,
        { profile: { name: sandstormInfo.name } },
      );

      await updateUserPermissions(login.userId, permissions);
    },
  });

  async function reportActivity(sessionId, path, type, users, caption) {
    const httpBridge = getHttpBridge();
    const session = httpBridge.getSessionContext(sessionId).context;
    const maybeUsers = await Promise.all(
      users.map(async (user) => {
        try {
          const response = await httpBridge.getSavedIdentity(user.id);
          // Call getProfile() to make sure that the identity successfully resolves.
          // (In C++ we would instead call whenResolved() here.)
          const identity = response.identity;
          await identity.getProfile();
          return {
            identity,
            mentioned: !!user.mentioned,
            subscribed: !!user.subscribed,
          };
        } catch (e) {
          // Ignore identities that fail to restore. Either they were added before we set
          // `saveIdentityCaps` to true, or they have lost access to the board.
          return undefined;
        }
      }),
    );
    const resolvedUsers = maybeUsers.filter(u => !!u);
    const event = { path, type, users: resolvedUsers };
    if (caption) {
      event.notification = { caption };
    }
    await session.activity(event);
  }

  Meteor.startup(() => {
    Activities.after.insert(async (userId, doc) => {
      // HACK: We need the connection that's making the request in order to read the
      // Sandstorm session ID.
      const invocation = DDP._CurrentInvocation.get(); // eslint-disable-line no-undef
      if (invocation) {
        const sessionId = invocation.connection.sandstormSessionId();

        const eventTypes = bridgeConfig.viewInfo.eventTypes;

        const defIdx = eventTypes.findIndex(
          def => def.name === doc.activityType,
        );
        if (defIdx >= 0) {
          const users = {};
          async function ensureUserListed(userId) {
            if (!users[userId]) {
              const user = await Meteor.users.findOneAsync(userId);
              if (user) {
                users[userId] = { id: user.services.sandstorm.id };
              } else {
                return false;
              }
            }
            return true;
          }

          async function mentionedUser(userId) {
            if (await ensureUserListed(userId)) {
              users[userId].mentioned = true;
            }
          }

          async function subscribedUser(userId) {
            if (await ensureUserListed(userId)) {
              users[userId].subscribed = true;
            }
          }

          let path = '';
          let caption = null;

          if (doc.cardId) {
            path = `b/sandstorm/libreboard/${doc.cardId}`;
            const card = ReactiveCache.getCard(doc.cardId);
            if (card && card.members) {
              for (const memberId of card.members) {
                await subscribedUser(memberId);
              }
            }
          }

          if (doc.memberId) {
            await mentionedUser(doc.memberId);
          }

          if (doc.activityType === 'addComment') {
            const comment = ReactiveCache.getCardComment(doc.commentId);
            caption = { defaultText: comment.text };
            const activeMembers = _.pluck(
              ReactiveCache.getBoard(sandstormBoard._id).activeMembers(),
              'userId',
            );
            const mentions = comment.text.match(/\B@([\w.]*)/g) || [];
            for (const username of mentions) {
              const user = await Meteor.users.findOneAsync({
                username: username.slice(1),
              });
              if (user && activeMembers.indexOf(user._id) !== -1) {
                await mentionedUser(user._id);
              }
            }
          }

          await reportActivity(sessionId, path, defIdx, _.values(users), caption);
        }
      }
    });
  });

  async function updateUserPermissions(userId, permissions) {
    const isActive = permissions.indexOf('participate') > -1;
    const isAdmin = permissions.indexOf('configure') > -1;
    const isCommentOnly = false;
    const isNoComments = false;
    const isWorker = false;
    const permissionDoc = {
      userId,
      isActive,
      isAdmin,
      isNoComments,
      isCommentOnly,
      isWorker,
    };

    const boardMembers = ReactiveCache.getBoard(sandstormBoard._id).members;
    const memberIndex = _.pluck(boardMembers, 'userId').indexOf(userId);

    let modifier;
    if (memberIndex > -1)
      modifier = { $set: { [`members.${memberIndex}`]: permissionDoc } };
    else if (!isActive) modifier = {};
    else modifier = { $push: { members: permissionDoc } };

    await Boards.updateAsync(sandstormBoard._id, modifier);
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
  });

  // On the first launch of the instance a user is automatically created thanks
  // to the `accounts-sandstorm` package. After its creation we insert the
  // unique board document. Note that when the `Users.after.insert` hook is
  // called, the user is inserted into the database but not connected. So
  // despite the appearances `userId` is null in this block.
  Users.after.insert(async (userId, doc) => {
    if (!ReactiveCache.getBoard(sandstormBoard._id)) {
      await Boards.insertAsync(sandstormBoard, { validate: false });
      await Swimlanes.insertAsync({
        title: 'Default',
        boardId: sandstormBoard._id,
      });
      await Activities.updateAsync(
        { activityTypeId: sandstormBoard._id },
        { $set: { userId: doc._id } },
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
    while (
      await Meteor.users.findOneAsync({
        _id: { $ne: doc._id },
        username: generateUniqueUsername(username, appendNumber),
      })
    ) {
      appendNumber += 1;
    }

    await Users.updateAsync(doc._id, {
      $set: {
        username: generateUniqueUsername(username, appendNumber),
        'profile.fullname': doc.services.sandstorm.name,
        'profile.avatarUrl': doc.services.sandstorm.picture,
      },
    });

    await updateUserPermissions(doc._id, doc.services.sandstorm.permissions);
  });

  Meteor.startup(async () => {
    await Users.find().observeChangesAsync({
      async changed(userId, fields) {
        const sandstormData = (fields.services || {}).sandstorm || {};
        if (sandstormData.name) {
          await Users.updateAsync(userId, {
            $set: { 'profile.fullname': sandstormData.name },
          });
        }

        if (sandstormData.picture) {
          await Users.updateAsync(userId, {
            $set: { 'profile.avatarUrl': sandstormData.picture },
          });
        }

        if (sandstormData.permissions) {
          await updateUserPermissions(userId, sandstormData.permissions);
        }
      },
    });
  });

  // Wekan v0.8 didn’t implement the Sandstorm sharing model and instead kept
  // the visibility setting (“public” or “private”) in the UI as does the main
  // Meteor application. We need to enforce “public” visibility as the sharing
  // is now handled by Sandstorm.
  // See https://github.com/wekan/wekan/issues/346
  // Migration disabled - using backward compatibility approach
  /*
  Migrations.add('enforce-public-visibility-for-sandstorm', () => {
    Boards.update('sandstorm', { $set: { permission: 'public' } });
  });
  */

  // Monkey patch to work around the problem described in
  // https://github.com/sandstorm-io/meteor-accounts-sandstorm/pull/31
  const _httpMethods = HTTP.methods;
  HTTP.methods = newMethods => {
    Object.keys(newMethods).forEach(key => {
      if (newMethods[key].auth) {
        newMethods[key].auth = async function() {
          const sandstormID = this.req.headers['x-sandstorm-user-id'];
          const user = await Meteor.users.findOneAsync({
            'services.sandstorm.id': sandstormID,
          });
          return user && user._id;
        };
      }
    });
    _httpMethods(newMethods);
  };
}

if (isSandstorm && Meteor.isClient) {
  let rpcCounter = 0;
  const rpcs = {};

  window.addEventListener('message', event => {
    if (event.source === window) {
      // Meteor likes to postmessage itself.
      return;
    }

    if (
      event.source !== window.parent ||
      typeof event.data !== 'object' ||
      typeof event.data.rpcId !== 'number'
    ) {
      throw new Error(`got unexpected postMessage: ${event}`);
    }

    const handler = rpcs[event.data.rpcId];
    if (!handler) {
      throw new Error(`no such rpc ID for event ${event}`);
    }

    delete rpcs[event.data.rpcId];
    handler(event.data);
  });

  function sendRpc(name, message) {
    const id = rpcCounter++;
    message.rpcId = id;
    const obj = {};
    obj[name] = message;
    window.parent.postMessage(obj, '*');
    return new Promise((resolve, reject) => {
      rpcs[id] = response => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      };
    });
  }

  const powerboxDescriptors = {
    identity: 'EAhQAQEAABEBF1EEAQH_GN1RqXqYhMAAQAERAREBAQ',
    // Generated using the following code:
    //
    // Capnp.serializePacked(
    //  Powerbox.PowerboxDescriptor,
    //  { tags: [ {
    //    id: "13872380404802116888",
    //    value: Capnp.serialize(Identity.PowerboxTag, { permissions: [true, false] })
    //  }]}).toString('base64')
    //      .replace(/\//g, "_")
    //      .replace(/\+/g, "-");
  };

  function doRequest(serializedPowerboxDescriptor, onSuccess) {
    return sendRpc('powerboxRequest', {
      query: [serializedPowerboxDescriptor],
    }).then(response => {
      if (!response.canceled) {
        onSuccess(response);
      }
    });
  }

  window.sandstormRequestIdentity = function() {
    doRequest(powerboxDescriptors.identity, response => {
      Meteor.call(
        'sandstormClaimIdentityRequest',
        response.token,
        response.descriptor,
      );
    });
  };

  // Since the Sandstorm grain is displayed in an iframe of the Sandstorm shell,
  // we need to explicitly expose meta data like the page title or the URL path
  // so that they could appear in the browser window.
  // See https://docs.sandstorm.io/en/latest/developing/path/
  function updateSandstormMetaData(msg) {
    return window.parent.postMessage(msg, '*');
  }

  FlowRouter.triggers.enter([
    ({ path }) => {
      updateSandstormMetaData({ setPath: path });
    },
  ]);

  Tracker.autorun(() => {
    updateSandstormMetaData({ setTitle: document.title });
  });

  // Runtime redirection from the home page to the unique board -- since the
  // home page contains a list of a single board it's not worth to display.
  //
  // XXX Hack. The home route is already defined at this point so we need to
  // add the redirection trigger to the internal route object.
  //FlowRouter._routesMap.home._triggersEnter.push((context, redirect) => {
  //  redirect(FlowRouter.path('board', {
  //    id: sandstormBoard._id,
  //    slug: sandstormBoard.slug,
  //  }));
  //});

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

  // XXX Hack to fix https://github.com/wefork/wekan/issues/27
  // Sandstorm Wekan instances only ever have a single board, so there is no need
  // to cache per-board subscriptions.
  //SubsManager.prototype.subscribe = function(...params) {
  //  return Meteor.subscribe(...params);
  //};
}

// We use this blaze helper in the UI to hide some templates that does not make
// sense in the context of sandstorm, like board staring, board archiving, user
// name edition, etc.
Blaze.registerHelper('isSandstorm', isSandstorm);
