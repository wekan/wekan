// #2026 / #1377: browser push notifications (models/lib/webPush.js), through
// the web-push library (pinned) with this WeKan's own VAPID keys, made once
// and kept server-side: the private key is never published.
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { TAPi18n } from '/imports/i18n';
import { formatActivityNotificationTitle } from '/server/lib/activityNotificationTitle';

const { cleanSubscription, subscriptionsAfterAdd, pushPayload } = require('/models/lib/webPush');
const { redactForRecipient } = require('/models/lib/notificationDelivery');

// One document, { _id: 'vapid', publicKey, privateKey }; never published.
export const WebPushKeys = new Mongo.Collection('webPushKeys');
WebPushKeys.deny({ insert: () => true, update: () => true, remove: () => true });

let keysPromise = null;
function vapidKeys() {
  if (!keysPromise) {
    keysPromise = (async () => {
      const found = await WebPushKeys.findOneAsync('vapid');
      if (found) return found;
      const generated = { _id: 'vapid', ...require('web-push').generateVAPIDKeys() };
      try { await WebPushKeys.insertAsync(generated); } catch (e) { return WebPushKeys.findOneAsync('vapid'); }
      return generated;
    })().catch(error => { keysPromise = null; throw error; });
  }
  return keysPromise;
}

function rootPath(url) {
  try { return new URL(url).pathname; } catch (e) { return '/'; }
}

async function pushTo(user, subscriptions, payload) {
  const webpush = require('web-push');
  const keys = await vapidKeys();
  const subject = (process.env.ROOT_URL && /^https:/.test(process.env.ROOT_URL)) ? process.env.ROOT_URL : 'mailto:webmaster@localhost';
  for (const sub of subscriptions) {
    const clean = cleanSubscription(sub);
    if (!clean) continue;
    try {
      await webpush.sendNotification(clean, payload, { TTL: 3600, timeout: 10000,
        vapidDetails: { subject, publicKey: keys.publicKey, privateKey: keys.privateKey } });
    } catch (error) {
      // Gone (unsubscribed, expired): forget it.
      if (error && (error.statusCode === 404 || error.statusCode === 410)) {
        await Meteor.users.updateAsync(user._id, { $pull: { webPushSubscriptions: { endpoint: clean.endpoint } } });
      } else {
        console.warn(`Browser push not delivered: ${error && (error.statusCode || error.message)}`);
      }
    }
  }
}

// Called with an activity's prepared notification, like ntfy: the same
// recipients the tray and e-mail get; best effort, after the activity.
export function sendActivityToWebPush({ users, title, description, params } = {}) {
  if (Meteor.settings?.public?.sandstorm) return;
  const recipients = (Array.isArray(users) ? users : []).filter(u => u && u._id);
  if (!recipients.length) return;
  Meteor.defer(async () => {
    try {
      const own = await Meteor.users.find({ _id: { $in: recipients.map(u => u._id) }, 'webPushSubscriptions.0': { $exists: true },
        loginDisabled: { $ne: true } }, { fields: { webPushSubscriptions: 1 } }).fetchAsync();
      if (!own.length) return;
      const Boards = require('/models/boards').default;
      const board = params.boardId ? await Boards.findOneAsync(params.boardId) : null;
      for (const row of own) {
        const user = recipients.find(u => u._id === row._id);
        const lan = typeof user.getLanguage === 'function' ? user.getLanguage() : 'en';
        await TAPi18n.ensureLanguageLoaded(lan);
        const safe = redactForRecipient(params, { isBoardAdmin: !!(board && board.hasAdmin && board.hasAdmin(user._id)) });
        await pushTo(row, row.webPushSubscriptions, pushPayload({
          title: formatActivityNotificationTitle(title, safe, TAPi18n.__.bind(TAPi18n), lan),
          body: `${safe.user || ''} ${TAPi18n.__(description, safe, lan)}`.trim(),
          url: rootPath(safe.url),
        }));
      }
    } catch (error) {
      console.warn(`Browser push skipped: ${error && error.message}`);
    }
  });
}

Meteor.methods({
  async webPushPublicKey() {
    if (!this.userId) throw new Meteor.Error('not-authorized');
    return (await vapidKeys()).publicKey;
  },
  async webPushSubscribe(subscription) {
    check(subscription, Object);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const clean = cleanSubscription(subscription);
    if (!clean) throw new Meteor.Error('web-push-invalid-subscription');
    const user = await Meteor.users.findOneAsync(this.userId, { fields: { webPushSubscriptions: 1 } });
    await Meteor.users.updateAsync(this.userId, { $set: {
      webPushSubscriptions: subscriptionsAfterAdd(user && user.webPushSubscriptions, clean) } });
    return true;
  },
  async webPushUnsubscribe(endpoint) {
    check(endpoint, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    await Meteor.users.updateAsync(this.userId, { $pull: { webPushSubscriptions: { endpoint } } });
    return true;
  },
});

for (const name of ['webPushPublicKey', 'webPushSubscribe', 'webPushUnsubscribe']) {
  DDPRateLimiter.addRule({ type: 'method', name, connectionId: () => true }, 10, 10000);
}
