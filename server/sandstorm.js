// WeKan on Sandstorm - the server half. sandstorm.js holds what the client
// needs as well (the grain-shell postMessage bridge, the isSandstorm helper);
// this file is server-only so that the client bundle never sees the Cap'n Proto
// bridge client it loads, which needs node:net.
import { ReactiveCache } from '/imports/reactiveCache';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { Accounts } from 'meteor/accounts-base';
import { check, Match } from 'meteor/check';
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

if (isSandstorm) {
  const fs = require('fs');

  // A waiting-page request may reconnect after the launcher has released its
  // port. The app only accepts HTTP after Meteor's startup hooks finish.
  WebApp.rawHandlers.use('/.sandstorm-startup-ready', (req, res) => {
    res.writeHead(204, { 'Cache-Control': 'no-store' });
    res.end();
  });

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
  // package) and need NO Cap'n Proto. Two features do: Powerbox identity claims
  // (sandstormClaimIdentityRequest) and Sandstorm activity events
  // (Activities.after.insert -> reportActivity). Both are Cap'n Proto calls on the
  // bridge's /tmp/sandstorm-api socket - the bridge's HTTP proxy has no route for
  // either (sandstorm src/sandstorm/bridge-proxy.c++). They used node-capnp
  // (capnp.node), a native addon built for Node 14 that cannot load on Node 26, so
  // a grain ran without them. imports/sandstorm/bridgeClient.mjs now makes the same
  // calls in plain JavaScript with @wekanteam/capnp-es (npm-packages/capnp-es); it
  // is loaded on first use, so a non-Sandstorm server never loads it.
  let bridgeClientModule = null;
  let bridgeConnection = null;
  async function bridgeClient() {
    if (!bridgeClientModule) {
      bridgeClientModule = await import('/imports/sandstorm/bridgeClient.mjs');
      bridgeConnection = bridgeClientModule.createBridge();
    }
    return { api: bridgeClientModule, bridge: bridgeConnection.bridge };
  }

  // An activity type is sent as its index in the pkgdef's
  // bridgeConfig.viewInfo.eventTypes, which Sandstorm puts in every grain as
  // /sandstorm-http-bridge-config.
  let eventTypeNames = null;
  function activityTypeIndex(api, name) {
    if (!eventTypeNames) {
      eventTypeNames = api.parseEventTypeNames(fs.readFileSync('/sandstorm-http-bridge-config'));
    }
    return eventTypeNames.indexOf(name);
  }

  Meteor.methods({
    // The sidebar's Powerbox button: redeem the person the user picked, and when
    // a board is given, invite them to it exactly as WeKan's own member picker
    // does - inviteUserToBoard, run as the caller, applies board membership, the
    // Admin Panel's invite roles and the organization/team restrictions.
    async sandstormClaimIdentityRequest(token, descriptor, boardId) {
      check(token, String);
      check(descriptor, String);
      check(boardId, Match.Maybe(String));
      if (!this.userId) throw new Meteor.Error('error-notAuthorized');

      const sessionId = this.connection.sandstormSessionId();
      const { api, bridge } = await bridgeClient();
      const permissions = api.parseIdentityRequestPermissions(descriptor);
      const sandstormInfo = await api.claimIdentity(bridge, sessionId, token, permissions);

      const login = await Accounts.updateOrCreateUserFromExternalService(
        'sandstorm',
        sandstormInfo,
        { profile: { name: sandstormInfo.name } },
      );

      await updateUserPermissions(login.userId, permissions);

      if (boardId) {
        await Meteor.callAsync('inviteUserToBoard', login.userId, boardId);
      }
      return { userId: login.userId };
    },
  });

  Meteor.startup(() => {
    Activities.after.insert(async (userId, doc) => {
      // HACK: We need the connection that's making the request in order to read the
      // Sandstorm session ID. Read it before the first await: the invocation is
      // only current until then.
      const invocation = DDP._CurrentInvocation.get(); // eslint-disable-line no-undef
      if (!invocation) return;
      const sessionId = invocation.connection.sandstormSessionId();

      try {
        const { api, bridge } = await bridgeClient();
        const defIdx = activityTypeIndex(api, doc.activityType);
        if (defIdx < 0) return;

        const users = {};
        async function ensureUserListed(userId) {
          if (!users[userId]) {
            const user = await Meteor.users.findOneAsync(userId);
            if (user && user.services && user.services.sandstorm) {
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
          caption = comment.text;
          const board = ReactiveCache.getBoard(doc.boardId);
          const activeMembers = board ? board.activeMembers().map(x => x.userId) : [];
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

        await api.reportActivity(bridge, sessionId, {
          path,
          type: defIdx,
          users: Object.values(users),
          caption,
        });
      } catch (e) {
        // A notification that could not be sent must not fail the change that
        // caused it.
        console.error('** WeKan/Sandstorm: activity event not sent:', (e && e.message) || e);
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
