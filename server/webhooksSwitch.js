// Admin Panel / Settings / Features / Turn off all webhooks
// (models/lib/webhooksSwitch.js): the switch on the server, the refusal of a
// webhook write while it is on, and Admin Panel / Problems / Webhooks.
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import Settings from '/models/settings';
import Integrations from '/models/integrations';

const switchLib = require('/models/lib/webhooksSwitch');

async function requireSiteAdmin(userId) {
  const user = userId && await Meteor.users.findOneAsync(userId, { fields: { isAdmin: 1 } });
  if (!user || user.isAdmin !== true) throw new Meteor.Error('not-authorized');
}

// Every activity asks, so the answer is cached for two seconds. Saving clears
// it in this process at once; another server process of the same WeKan sees
// the change within the two seconds.
const CACHE_MS = 2000;
let cached = { at: 0, off: false };

export async function webhooksOff() {
  if (Date.now() - cached.at < CACHE_MS) return cached.off;
  let off = false;
  try {
    const setting = await Settings.findOneAsync({}, { fields: { [switchLib.SETTING_FIELD]: 1 } });
    off = switchLib.webhooksDisabled(setting);
  } catch (e) {
    // A database that cannot be read keeps the last known answer.
    return cached.off;
  }
  cached = { at: Date.now(), off };
  return off;
}

export function clearWebhooksSwitchCache() {
  cached = { at: 0, off: false };
}

// A webhook write while the switch is on. No screen offers one then, so it is
// an attempt and is recorded in Admin Panel / Problems; the refusal stands even
// if the record cannot be written.
export function recordWebhookWriteRefused({ userId, source, detail }) {
  try {
    require('/server/lib/securityLog').record({
      key: 'authz.webhooks-disabled', action: 'blocked', source, userId,
      detail: String(detail || 'webhook write while webhooks are turned off').slice(0, 200),
    });
  } catch (e) { /* logging must never break the guard */ }
}

// For a Meteor method: throws 'webhooks-disabled' when the switch is on.
export async function refuseWebhookWriteWhenOff({ userId, source, detail }) {
  if (!(await webhooksOff())) return;
  recordWebhookWriteRefused({ userId, source, detail });
  throw new Meteor.Error(switchLib.WEBHOOKS_DISABLED.error, switchLib.WEBHOOKS_DISABLED.reason);
}

// The report: every integration, newest first, filtered and searched on the
// server. Board titles and owners are read for the page's rows only.
async function webhooksReportPage(input) {
  const Boards = require('/models/boards').default;
  const { filter, search, limit, skip } = switchLib.cleanReportQuery(input);
  const docs = await Integrations.find(switchLib.reportSelector(filter), {
    fields: switchLib.REPORT_FIELDS, sort: { createdAt: -1, _id: 1 }, transform: null,
  }).fetchAsync();
  const boardIds = [...new Set(docs.map(d => d.boardId).filter(id => id && id !== '_global'))];
  const userIds = [...new Set(docs.map(d => d.userId).filter(Boolean))];
  const [boards, users] = await Promise.all([
    boardIds.length ? Boards.find({ _id: { $in: boardIds } }, { fields: { title: 1, slug: 1 }, transform: null }).fetchAsync() : [],
    userIds.length ? Meteor.users.find({ _id: { $in: userIds } }, { fields: { username: 1, 'profile.fullname': 1 } }).fetchAsync() : [],
  ]);
  const boardOf = new Map(boards.map(b => [b._id, b]));
  const userOf = new Map(users.map(u => [u._id, u]));
  const rows = docs
    .map(doc => switchLib.webhookReportRow(doc, { board: boardOf.get(doc.boardId), owner: userOf.get(doc.userId) }))
    .filter(row => switchLib.matchesSearch(row, search));
  return { rows: rows.slice(skip, skip + limit), total: rows.length, webhooksOff: await webhooksOff() };
}

Meteor.methods({
  async saveWebhooksDisabled(value) {
    check(value, Boolean);
    await requireSiteAdmin(this.userId);
    const setting = await Settings.findOneAsync({});
    if (!setting) throw new Meteor.Error('settings-not-found');
    await Settings.updateAsync(setting._id, { $set: { [switchLib.SETTING_FIELD]: value } });
    clearWebhooksSwitchCache();
    return value;
  },
  async webhooksReportPage(input) {
    check(input, Match.Maybe(Object));
    await requireSiteAdmin(this.userId);
    return webhooksReportPage(input);
  },
});
