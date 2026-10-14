// #5148: ntfy as a per-member notification channel (models/lib/ntfy.js).
// The topic address and token are the member's own: read and saved through
// their own methods, kept outside `profile`, and never published, so other
// members cannot read them.
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { TAPi18n } from '/imports/i18n';
import { formatActivityNotificationTitle } from '/server/lib/activityNotificationTitle';

const { cleanNtfySettings, ntfyRequest } = require('/models/lib/ntfy');
const { redactForRecipient } = require('/models/lib/notificationDelivery');

async function sendToNtfy(user, settings, title, description, params) {
  if (!settings || !settings.enabled) return;
  const lan = typeof user.getLanguage === 'function' ? user.getLanguage() : 'en';
  await TAPi18n.ensureLanguageLoaded(lan);
  const Boards = require('/models/boards').default;
  const board = params.boardId ? await Boards.findOneAsync(params.boardId) : null;
  // A value of an admin-only custom field (#3141) reaches only board admins.
  const safe = redactForRecipient(params, { isBoardAdmin: !!(board && board.hasAdmin && board.hasAdmin(user._id)) });
  const request = ntfyRequest(settings, {
    title: formatActivityNotificationTitle(title, safe, TAPi18n.__.bind(TAPi18n), lan),
    message: `${safe.user || ''} ${TAPi18n.__(description, safe, lan)}`.trim(),
    click: safe.url,
  });
  if (!request) return;
  const { webhookFetch } = require('/server/sandstormEgress');
  await webhookFetch(request.url, { method: 'POST', headers: request.headers, body: request.body, timeoutMs: 10000 });
}

// Called with an activity's prepared notification (server/models/activities.js
// prepareActivityNotification): the same recipients the tray and e-mail get -
// board access, watching and muted activity kinds already applied. Best
// effort, like a phone push, and outside the e-mail/tray plan: an ntfy server
// that is down never holds up or fails anybody's other notifications.
export function sendActivityToNtfy({ users, title, description, params } = {}) {
  const recipients = (Array.isArray(users) ? users : []).filter(user => user && user._id);
  if (!recipients.length) return;
  Meteor.defer(async () => {
    try {
      // One read per activity, for only the recipients who turned ntfy on.
      const own = await Meteor.users.find({ _id: { $in: recipients.map(u => u._id) }, 'ntfy.enabled': true,
        loginDisabled: { $ne: true } }, { fields: { ntfy: 1 } }).fetchAsync();
      const settingsOf = new Map(own.map(u => [u._id, cleanNtfySettings(u.ntfy).value]));
      for (const user of recipients) {
        if (!settingsOf.has(user._id)) continue;
        try {
          await sendToNtfy(user, settingsOf.get(user._id), title, description, params);
        } catch (error) {
          console.warn(`ntfy notification not delivered: ${error && error.message}`);
        }
      }
    } catch (error) {
      console.warn(`ntfy notifications skipped: ${error && error.message}`);
    }
  });
}

Meteor.methods({
  async getNtfySettings() {
    if (!this.userId) throw new Meteor.Error('not-logged-in');
    const user = await Meteor.users.findOneAsync(this.userId, { fields: { ntfy: 1 } });
    return cleanNtfySettings(user && user.ntfy).value;
  },
  async saveNtfySettings(input) {
    check(input, Object);
    if (!this.userId) throw new Meteor.Error('not-logged-in');
    const { value, error } = cleanNtfySettings(input);
    if (error) throw new Meteor.Error(error);
    await Meteor.users.updateAsync(this.userId, { $set: { ntfy: value } });
    return value;
  },
});
