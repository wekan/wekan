import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Blaze } from 'meteor/blaze';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

// Sandstorm context is detected using the METEOR_SETTINGS environment variable
// in the package definition.
const isSandstorm = Meteor.settings?.public?.sandstorm;

// The server half - login headers, Powerbox identity claims, activity events -
// is server/sandstorm.js. This file is imported by BOTH the client
// (client/imports.js) and the server (server/imports.js): the code below that
// talks to the Sandstorm shell, and the isSandstorm template helper, are
// client code, and before this was imported by the client they never ran in a
// browser at all.

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

if (isSandstorm && Meteor.isClient) {
  let rpcCounter = 0;
  const rpcs = {};

  window.addEventListener('message', event => {
    if (event.source === window) {
      // Meteor likes to postmessage itself.
      return;
    }

    // Only the Sandstorm shell's replies to our RPCs are ours. Other frames and
    // browser extensions post messages too; throwing on them (as this used to)
    // was harmless only while this file never ran in a browser.
    if (
      event.source !== window.parent ||
      !event.data ||
      typeof event.data !== 'object' ||
      typeof event.data.rpcId !== 'number'
    ) {
      return;
    }

    const handler = rpcs[event.data.rpcId];
    if (!handler) {
      return;
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

  // Opens the Sandstorm Powerbox to pick a person, then makes them a member of
  // boardId (the sidebar's members widget passes the open board): the server
  // redeems the request and invites them through inviteUserToBoard, with the
  // same permission checks as WeKan's own member picker.
  window.sandstormRequestIdentity = function(boardId) {
    return doRequest(powerboxDescriptors.identity, response => {
      Meteor.call(
        'sandstormClaimIdentityRequest',
        response.token,
        response.descriptor,
        boardId,
        error => {
          if (error) {
            console.error('Sandstorm Powerbox: could not add the person:', error);
            window.alert(error.reason || error.message || String(error));
          }
        },
      );
    });
  };

  // External HTTP APIs a user can let this grain reach, the way the Sandstorm
  // WordPress app reaches wordpress.org for plugin updates: an ApiSession
  // Powerbox request for the service's canonicalUrl. Each descriptor is built
  // by apiSessionDescriptor() on the server side, and
  // tests/sandstormApiEgress.test.cjs rebuilds it from
  // imports/sandstorm/egress.mjs EXTERNAL_APIS so the two cannot drift.
  const externalApiDescriptors = {
    // apiSessionDescriptor('https://api.trello.com/1')
    trello: 'EA1QAQEAABEBF1EEAQH_x80lxnnjecgAQAMRCcoAAf9odHRwczovLwJhcGkudHJlbGxvLmNvbS8xAAA=',
  };

  // Ask the user, through the Powerbox, to let this grain reach an external
  // API; the server redeems the claim and keeps the access token for this
  // user. Resolves true when granted, false when the user closed the Powerbox.
  window.sandstormRequestExternalApi = function(service, saveLabel) {
    const descriptor = externalApiDescriptors[service];
    if (!descriptor) return Promise.reject(new Error(`Unknown external API: ${service}`));
    return sendRpc('powerboxRequest', {
      query: [descriptor],
      saveLabel: { defaultText: saveLabel },
    }).then(response => {
      if (response.canceled) return false;
      return Meteor.callAsync('sandstormClaimApiGrant', service, response.token).then(() => true);
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
