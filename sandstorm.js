import { ReactiveCache } from '/imports/reactiveCache';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Accounts } from 'meteor/accounts-base';
// Collections became ES module default exports in the Meteor 3.x migration (they
// used to be implicit globals). This file only runs on Sandstorm, so it was missed
// and kept referencing the old globals — which now throw "Users is not defined" at
// server boot. Import them explicitly.
import Users from '/models/users';
import Activities from '/models/activities';
import {
  claimUniqueUsername,
  usernameCaseInsensitiveRegex,
} from '/models/lib/sandstormUsername';

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

  // sandstorm-http-bridge historically advertises "Accept-Encoding: gzip" to the
  // app regardless of what the browser actually sent, so Meteor serves gzip/brotli
  // -encoded responses that the browser then fails to decode — the grain loads but
  // the page shows "Corrupted Content Error" (NS_ERROR_NET_CORRUPTED_CONTENT).
  // Strip Accept-Encoding on the way in so Meteor serves uncompressed responses;
  // rawHandlers runs before Meteor's static/boilerplate middleware, and bandwidth
  // is a non-issue behind the local bridge. (See Sandstorm CHANGELOG: "apps were
  // always being told Accept-Encoding: gzip whether or not the client sent it".)
  WebApp.rawHandlers.use((req, res, next) => {
    delete req.headers['accept-encoding'];
    next();
  });

  // Rewrite ROOT_URL per request to the grain's ACTUAL URL. The launcher can only
  // set a fixed ROOT_URL (http://127.0.0.1:4000 — the internal bridge target), but
  // Sandstorm serves each grain at a per-session host (ui-<hash>.<host>) via
  // sandstorm-http-bridge. Without this, the client would send its DDP connection
  // and dynamic-import fetches to 127.0.0.1:4000 — cross-origin and unreachable from
  // the browser — so dynamic imports fail with CORS errors and the login handshake
  // never completes ("Must be logged in"). X-Sandstorm-Base-Path carries the grain's
  // real base URL, so point ROOT_URL at it (and re-assert the SANDSTORM flag that
  // triggers the client's header-based auto-login) in the runtime config sent to the
  // client, so it talks to the same origin it loaded from.
  WebApp.addRuntimeConfigHook(({ request, encodedCurrentConfig }) => {
    const base = request.headers['x-sandstorm-base-path'];
    if (!base) return undefined;
    const config = WebApp.decodeRuntimeConfig(encodedCurrentConfig);
    config.ROOT_URL = base.endsWith('/') ? base : base + '/';
    config.SANDSTORM = true;
    return WebApp.encodeRuntimeConfig(config);
  });

  // WeKan on Sandstorm runs behind sandstorm-http-bridge. Login and user identity
  // come from the X-Sandstorm-* HTTP headers (see the wekan-accounts-sandstorm
  // package) and need NO Cap'n Proto. Only the two advanced features below —
  // Powerbox identity-claim (sandstormClaimIdentityRequest) and Sandstorm activity
  // notifications (Activities.after.insert -> reportActivity) — use node-capnp
  // (capnp.node). That native addon is currently built for an older Node ABI and
  // fails to load on the bundled Node 24 (NODE_MODULE_VERSION mismatch,
  // ERR_DLOPEN_FAILED), which previously crashed the whole grain on boot. Load it
  // lazily and degrade gracefully instead: the grain boots and core WeKan (login +
  // kanban) works; only powerbox invites and activity events are skipped until
  // capnp is rebuilt for Node 24, or reimplemented over the bridge's HTTP/JSON API
  // (see the Sandstorm CHANGELOG: use "Cap'n Proto APIs without Cap'n Proto").
  let Capnp = null;
  let Package, Powerbox, Identity, SandstormHttpBridge, bridgeConfig;
  try {
    Capnp = Npm.require('capnp');
    Package = Capnp.importSystem('sandstorm/package.capnp');
    Powerbox = Capnp.importSystem('sandstorm/powerbox.capnp');
    Identity = Capnp.importSystem('sandstorm/identity.capnp');
    SandstormHttpBridge = Capnp.importSystem(
      'sandstorm/sandstorm-http-bridge.capnp',
    ).SandstormHttpBridge;
    bridgeConfig = Capnp.parse(
      Package.BridgeConfig,
      fs.readFileSync('/sandstorm-http-bridge-config'),
    );
  } catch (e) {
    Capnp = null;
    console.error(
      "** WeKan/Sandstorm: Cap'n Proto (capnp.node) unavailable — Powerbox " +
        'identity-claim and activity notifications are disabled. Login and core ' +
        'features still work via sandstorm-http-bridge headers. Reason:',
      (e && e.message) || e,
    );
  }

  let httpBridge = null;
  let capnpConnection = null;

  function getHttpBridge() {
    if (!httpBridge) {
      capnpConnection = Capnp.connect('unix:/tmp/sandstorm-api');
      httpBridge = capnpConnection.restore(null, SandstormHttpBridge);
    }
    return httpBridge;
  }

  // Powerbox identity-claim needs Cap'n Proto; only register it when capnp loaded.
  if (Capnp) Meteor.methods({
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
    // Reporting activity to Sandstorm goes over the Cap'n Proto bridge session;
    // without capnp there is no way to send it, so skip registering the hook.
    if (!Capnp) return;
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
            const activeMembers = ReactiveCache.getBoard(sandstormBoard._id).activeMembers()
              .map(x => x.userId);
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

          await reportActivity(sessionId, path, defIdx, Object.values(users), caption);
        }
      }
    });
  });

  async function updateUserPermissions(userId, permissions) {
    // Multi-board Sandstorm grain: there is no single hard-coded board to add the
    // user to, so map the grain's Sandstorm permissions to the user's GLOBAL WeKan
    // role instead. 'configure' (the grain owner / admin) becomes a WeKan admin;
    // everyone else is a regular user who can create and manage their own boards.
    // (Per-board membership is handled inside WeKan when a user creates/shares a
    // board.)
    const isAdmin = permissions.indexOf('configure') > -1;
    await Users.updateAsync(userId, { $set: { isAdmin } });
  }

  // NOTE: there used to be a WebApp.handlers.get('/') here that redirected the grain
  // root to a single hard-coded board ('/b/sandstorm/libreboard'). WeKan on Sandstorm
  // now supports MANY boards and no longer auto-creates that libreboard, so a
  // redirect to it is wrong. Removing the handler lets '/' fall through to WeKan's
  // normal serving, whose client route '/' ('home' in config/router.js) renders the
  // All Boards list — exactly what a multi-board grain should open on. (It also
  // avoids the Meteor-3.x server-side redirect bug: FlowRouter.path() does not
  // resolve on the server, and a bare redirect with a mismatched Content-Length made
  // the browser show a "Corrupted Content Error".)

  // On the first launch of the instance a user is automatically created thanks
  // to the `accounts-sandstorm` package. Note that when the `Users.after.insert`
  // hook is called, the user is inserted into the database but not connected. So
  // despite the appearances `userId` is null in this block.
  Users.after.insert(async (userId, doc) => {
    // Only Sandstorm-authenticated users carry services.sandstorm; this hook derives
    // the username/fullname/avatar/permissions from it. Imported placeholder members
    // (and any other non-Sandstorm insert) have no services.sandstorm, so skip them —
    // otherwise reading doc.services.sandstorm.preferredHandle throws and aborts the
    // insert (e.g. when importing a board full of original members into a grain).
    if (!doc || !doc.services || !doc.services.sandstorm) return;

    // No board is auto-created for a new grain/user: WeKan on Sandstorm is
    // multi-board now, and the user creates their own boards from the All Boards
    // page. (Previously a single hard-coded 'sandstorm'/libreboard board was
    // inserted here with a Default swimlane.)

    // We rely on username uniqueness for the user mention feature, but
    // Sandstorm doesn't enforce this property -- see #352. Our strategy to
    // generate unique usernames from the Sandstorm `preferredHandle` is to
    // append a number that we increment until we generate a username that no
    // one already uses (eg, 'max', 'max1', 'max2'). Meteor usernames are
    // case-preserving but case-insensitively unique, so the probe uses an
    // anchored case-insensitive regex (escaped, see #574), and the update is
    // retried with the next number when a concurrent insert wins the race to
    // the same name (unique-index duplicate-key error).
    const username = doc.services.sandstorm.preferredHandle;
    await claimUniqueUsername(
      username,
      async candidate =>
        !!(await Meteor.users.findOneAsync({
          _id: { $ne: doc._id },
          username: usernameCaseInsensitiveRegex(candidate),
        })),
      candidate =>
        Users.updateAsync(doc._id, {
          $set: {
            username: candidate,
            'profile.fullname': doc.services.sandstorm.name,
            'profile.avatarUrl': doc.services.sandstorm.picture,
          },
        }),
    );

    await updateUserPermissions(doc._id, doc.services.sandstorm.permissions);
  });

  Meteor.startup(async () => {
    // Migrated grains: a user imported from an older WeKan Sandstorm grain already
    // exists, so `Users.after.insert` never derives their WeKan admin role, and the
    // observeChanges hook below only re-derives isAdmin when services.sandstorm
    // actually CHANGES on login. Sandstorm auto-login uses connection.setUserId(),
    // which bypasses accounts-base (no Accounts.onLogin fires); and when a migrated
    // user's stored services.sandstorm.permissions already equals the grain's
    // current permissions, the login `$set` is a no-op that produces no oplog entry,
    // so the change hook never fires. Old WeKan on Sandstorm had no global Admin
    // Panel, so such users have no isAdmin flag and the grain owner cannot reach
    // Admin Panel / Attachments / Sandstorm to delete leftover files. Reconcile at
    // boot (a migrated grain reboots once migration completes): grant WeKan admin to
    // every Sandstorm user whose stored permissions include the grain-owner
    // 'configure' capability. Promote only — never revoke admin here; that is the
    // change hook's job on a real Sandstorm permission change, so a stale/empty
    // stored permissions set can never lock the owner out of the Admin Panel.
    const sandstormUsers = await Users.find(
      { 'services.sandstorm.permissions': 'configure' },
      { fields: { isAdmin: 1 } },
    ).fetchAsync();
    for (const user of sandstormUsers) {
      if (!user.isAdmin) {
        await Users.updateAsync(user._id, { $set: { isAdmin: true } });
      }
    }

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

  // NOTE: a legacy monkey patch of `HTTP.methods` (to inject Sandstorm auth into
  // the old meteor/http server methods, working around
  // https://github.com/sandstorm-io/meteor-accounts-sandstorm/pull/31) used to live
  // here. The `meteor/http` package was removed in the Meteor 3.x migration, so
  // `HTTP` is now undefined and the patch crashed the Sandstorm server at boot with
  // "HTTP is not defined". WeKan's REST API no longer uses HTTP.methods (it uses
  // WebApp/JsonRoutes with header-based auth), so the patch is obsolete and removed.
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

  // Keep the Sandstorm shell's grain URL in sync with the in-app route. The shell
  // listens for a { setPath } postMessage and rewrites the outer grain URL to
  // /grain/<id><path> via history.replaceState (see the setPath handler in
  // sandstorm shell/imports/client/grain-client.js — it requires the path to start
  // with "/"). Use TWO mechanisms for reliability:
  //   1. FlowRouter.triggers.enter fires with the fresh entering path on every
  //      navigation. This is exactly what the last working Sandstorm build (v6.15)
  //      used, and it is event-driven so it does not depend on FlowRouter's reactive
  //      internals being ready at module-load time.
  //   2. A reactive autorun on watchPathChange() as a backup, wrapped in
  //      Meteor.startup so FlowRouter is fully initialised before it establishes its
  //      reactive dependency (a bare top-level autorun could run before FlowRouter's
  //      path tracking was ready and then never re-run, leaving the grain URL stuck
  //      on the root — the "URL doesn't update when switching boards" symptom).
  FlowRouter.triggers.enter([
    ({ path }) => {
      updateSandstormMetaData({ setPath: path || '/' });
    },
  ]);

  Meteor.startup(() => {
    Tracker.autorun(() => {
      FlowRouter.watchPathChange();
      const current = FlowRouter.current();
      updateSandstormMetaData({ setPath: (current && current.path) || '/' });
    });

    // Reflect the page title into the Sandstorm shell too. Runs after startup and
    // reactively on route change (watchPathChange) so the grain tab title tracks the
    // current board; document.title itself is not a reactive source.
    Tracker.autorun(() => {
      FlowRouter.watchPathChange();
      updateSandstormMetaData({ setTitle: document.title });
    });
  });

  // Sandstorm auto-logs the user in asynchronously via connection.setUserId()
  // (which bypasses accounts-base's normal login flow, so no Accounts.onLogin
  // fires). The home route's renderBoardList() runs once and, finding
  // Meteor.userId() still null, redirects to the sign-in page ('atSignIn') — where
  // the user is then stranded even though login completes moments later. Reactively
  // bounce back to the boards list once the Sandstorm login lands.
  Tracker.autorun(() => {
    if (Meteor.userId() && FlowRouter.getRouteName() === 'atSignIn') {
      FlowRouter.go('home');
    }
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
