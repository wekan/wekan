// Admin Panel / Settings / Global Webhooks / Internal destinations
// (models/lib/internalWebhookHosts.js): the hosts on WeKan's own network that
// outgoing webhooks may reach. Site administrators only, never published: the
// list describes the internal network.
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import Settings from '/models/settings';

const { cleanInternalHosts, isInternalHostAllowed } = require('/models/lib/internalWebhookHosts');

async function requireSiteAdmin(userId) {
  const user = userId && await Meteor.users.findOneAsync(userId, { fields: { isAdmin: 1 } });
  if (!user || user.isAdmin !== true) throw new Meteor.Error('not-authorized');
}

// A short cache: every webhook send asks.
let cached = { at: 0, hosts: [] };
export async function internalWebhookHosts() {
  if (Date.now() - cached.at < 10000) return cached.hosts;
  const setting = await Settings.findOneAsync({}, { fields: { webhookInternalHosts: 1 } });
  cached = { at: Date.now(), hosts: cleanInternalHosts((setting && setting.webhookInternalHosts) || []).hosts };
  return cached.hosts;
}

export async function webhookHostIsInternalAllowed(url) {
  return isInternalHostAllowed(url, await internalWebhookHosts());
}

Meteor.methods({
  async getWebhookInternalHosts() {
    await requireSiteAdmin(this.userId);
    return internalWebhookHosts();
  },
  async saveWebhookInternalHosts(input) {
    check(input, Match.OneOf(String, [String]));
    await requireSiteAdmin(this.userId);
    const { hosts, rejected } = cleanInternalHosts(input);
    const setting = await Settings.findOneAsync({});
    if (!setting) throw new Meteor.Error('settings-not-found');
    await Settings.updateAsync(setting._id, { $set: { webhookInternalHosts: hosts } });
    cached = { at: 0, hosts: [] };
    return { hosts, rejected };
  },
});
