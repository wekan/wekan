import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { WebApp } from 'meteor/webapp';
import { check } from 'meteor/check';
const { nextcloudIdentity, nextcloudUserId, nextcloudAdmin, matchesNextcloudUser } = require('/server/lib/nextcloudIdentity');

if (process.env.NEXTCLOUD_EXAPP === 'true') {
  if (!process.env.WEKAN_NEXTCLOUD_PROXY_KEY || !process.env.NEXTCLOUD_URL) {
    throw new Error('Nextcloud ExApp requires the trusted in-container gateway');
  }
  require('/server/lib/nextcloudTransport').installNextcloudTransport(
    WebApp.httpServer, Meteor.server.stream_server,
  );
  Meteor.settings.public.nextcloudExApp = true;
  Accounts.registerLoginHandler('nextcloud', async function(options) {
    if (!Object.prototype.hasOwnProperty.call(options, 'nextcloud')) return undefined;
    check(options, { nextcloud: Boolean });
    const identity = nextcloudIdentity(this.connection?.httpHeaders);
    if (!options.nextcloud || !identity) throw new Meteor.Error('not-authorized');
    const id = nextcloudUserId(identity);
    let user = await Meteor.users.findOneAsync(id);
    if (!user) {
      try {
        // Same trusted server-side creation path used by the administration API.
        // It does not depend on public registration or invitation codes.
        await Accounts.insertUserDoc({ from: 'admin' }, {
          _id: id, username: id, authenticationMethod: 'nextcloud',
          services: { nextcloud: { id: identity.userId, issuer: identity.issuer } },
          profile: { fullname: identity.userId, boardView: 'board-view-swimlanes' },
        });
      } catch (error) {
        // Two tabs may provision the same identity concurrently. Never link by
        // email/username or ignore an insert failure without checking the result.
        user = await Meteor.users.findOneAsync(id);
        if (!matchesNextcloudUser(user, identity)) throw error;
      }
      user = await Meteor.users.findOneAsync(id);
    }
    if (!matchesNextcloudUser(user, identity) || user.loginDisabled) throw new Meteor.Error('not-authorized');
    await Meteor.users.updateAsync(id, { $set: { isAdmin: nextcloudAdmin(identity.userId) } });
    return { userId: id };
  });
  // A stale cookie from another Nextcloud account must not resume its session.
  // All login methods, including Meteor's resume handler, are bound to the
  // identity verified on this DDP connection by the gateway.
  Accounts.validateLoginAttempt(attempt => {
    if (!attempt.allowed) return false;
    const identity = nextcloudIdentity(attempt.connection?.httpHeaders);
    return matchesNextcloudUser(attempt.user, identity) && !attempt.user.loginDisabled &&
      attempt.user.isAdmin === nextcloudAdmin(identity.userId);
  });
  WebApp.handlers.use('/_nextcloud/health', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ nextcloud: 1 }));
  });
}
