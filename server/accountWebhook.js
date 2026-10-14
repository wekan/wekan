// #2290: the login and registration webhook (models/lib/accountWebhook.js).
// Read and saved through site-admin methods, never published: the address
// and its token are the administrator's.
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { check } from 'meteor/check';
import Settings from '/models/settings';
import Users from '/models/users';

const { cleanAccountWebhook, sends, accountWebhookPayload } = require('/models/lib/accountWebhook');

async function requireSiteAdmin(userId) {
  const user = userId && await Meteor.users.findOneAsync(userId, { fields: { isAdmin: 1 } });
  if (!user || user.isAdmin !== true) throw new Meteor.Error('not-authorized');
}

// Every login asks, so the setting is cached briefly.
let cached = { at: 0, config: null };
async function accountWebhookConfig() {
  if (Date.now() - cached.at < 10000) return cached.config;
  const setting = await Settings.findOneAsync({}, { fields: { accountWebhook: 1 } });
  cached = { at: Date.now(), config: cleanAccountWebhook((setting && setting.accountWebhook) || {}).value };
  return cached.config;
}

// Fire and forget: a login must never wait for, or fail because of, the
// address it is reported to.
function send(event, user, ip) {
  Meteor.defer(async () => {
    try {
      const config = await accountWebhookConfig();
      if (!sends(config, event)) return;
      const headers = { 'Content-Type': 'application/json' };
      if (config.token) headers['X-Wekan-Token'] = config.token;
      const { webhookFetch } = require('/server/sandstormEgress');
      await webhookFetch(config.url, { method: 'POST', headers,
        body: JSON.stringify(accountWebhookPayload(event, user, { config, ip })), timeoutMs: 10000 });
    } catch (error) {
      console.warn(`Login and registration webhook: ${event} not delivered: ${error && error.message}`);
    }
  });
}

if (Meteor.isServer) {
  Accounts.onLogin((info) => {
    if (!info || !info.user) return;
    send('login', info.user, info.connection && info.connection.clientAddress);
  });
  Users.after.insert((userId, doc) => {
    if (doc) send('register', doc);
  });
}

Meteor.methods({
  async getAccountWebhook() {
    await requireSiteAdmin(this.userId);
    const setting = await Settings.findOneAsync({}, { fields: { accountWebhook: 1 } });
    return cleanAccountWebhook((setting && setting.accountWebhook) || {}).value;
  },
  async saveAccountWebhook(input) {
    check(input, Object);
    await requireSiteAdmin(this.userId);
    const { value, error } = cleanAccountWebhook(input);
    if (error) throw new Meteor.Error(error);
    const setting = await Settings.findOneAsync({});
    if (!setting) throw new Meteor.Error('settings-not-found');
    await Settings.updateAsync(setting._id, { $set: { accountWebhook: value } });
    cached = { at: 0, config: null };
    return value;
  },
});
