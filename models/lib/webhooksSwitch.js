'use strict';

// Admin Panel / Settings / Features / Turn off all webhooks
// (docs/Features/Admin-Panel/Settings/Turn-Off-All-Webhooks.md).
//
// One switch, instance-wide, site administrators only, stored on the Settings
// document as `webhooksDisabled: true`. While it is on:
//   * every webhook screen is hidden - the board menu's Outgoing Webhooks,
//     Admin Panel / Settings / Global Webhooks, the Bots view, the "Dispatch
//     to bot" rule action, the due-reminder and per-webhook delivery settings;
//   * the server SENDS NOTHING: every webhook sender listed in SENDERS asks
//     webhooksOff() (server/webhooksSwitch.js) before it builds a request;
//   * the server REFUSES to add or change a webhook - the Integrations
//     allow/deny rules, the REST routes, the delivery-settings method, the
//     login and registration webhook - and records the refusal in Admin
//     Panel / Problems ('authz.webhooks-disabled'), because no screen offers
//     those calls while the switch is on;
//   * nothing stored is deleted: integrations, their tokens, the login and
//     registration webhook and the queued jobs are kept, so turning the switch
//     off again brings every webhook back as it was.
// Removing a webhook stays allowed: it is the cleanup, never a new send.
//
// Pure CommonJS, no Meteor: the server, the client and tests/*.test.cjs load
// this one decision.

const SETTING_FIELD = 'webhooksDisabled';

function webhooksDisabled(setting) {
  return !!(setting && setting[SETTING_FIELD] === true);
}

// The answer a refused write gets: a Meteor.Error code and its REST twin.
const WEBHOOKS_DISABLED = Object.freeze({ error: 'webhooks-disabled', reason: 'Webhooks are turned off' });

// Every server file that sends a webhook. tests/webhooksSwitch.test.cjs holds
// each to asking the switch, and fails when a file that calls webhookFetch()
// (server/sandstormEgress.js) is in neither this list nor NOT_WEBHOOKS.
const SENDERS = [
  // Board and global webhooks, two-way replies, Mattermost direct messages.
  'server/notifications/outgoing.js',
  // Grouped and scheduled webhooks, and the bots' dispatches.
  'server/notifications/webhookQueue.js',
  // The webhooks of durable Sync (List sync, recovery).
  'server/notifications/storedWebhooks.js',
  // Admin Panel / Settings / Global Webhooks / Login and registration webhook.
  'server/accountWebhook.js',
  // Board Settings / Bots: a dispatch is a webhook to the bot's runner.
  'server/bots.js',
];

// Files that send through webhookFetch() only for its SSRF guard and are not
// webhooks, with why they keep working while webhooks are off.
const NOT_WEBHOOKS = {
  'server/notifications/ntfy.js': 'a member\'s own push-notification channel (Member Settings / ntfy), not a webhook an administrator or board admin added',
  'server/caldavSync.js': 'a CalDAV calendar a board syncs with, read and written as a calendar, not a webhook',
  'server/notifications/storedWebhookHttp.js': 'the HTTP adapter of storedWebhooks.js, which asks the switch before calling it',
};

// ── The report (Admin Panel / Problems / Webhooks) ──────────────────────────

// A secret is never shown, only whether one is set.
const isSet = value => typeof value === 'string' ? value.length > 0 : value !== undefined && value !== null;

// Query parameters whose value is a credential. A chat webhook's secret is
// often in its path (Slack, Mattermost, Teams), which is why only site
// administrators read this report - they can already read every URL - but a
// token in the query string or a password in the address is hidden here too.
const SECRET_PARAM = /token|key|secret|sig|signature|password|passwd|pass|auth|code|access/i;

function maskUrl(raw) {
  if (typeof raw !== 'string' || !raw) return '';
  let url;
  try { url = new URL(raw); } catch (e) { return raw.slice(0, 2048); }
  if (url.password) url.password = '***';
  for (const key of [...url.searchParams.keys()]) {
    if (SECRET_PARAM.test(key)) url.searchParams.set(key, '***');
  }
  return url.toString().slice(0, 2048);
}

const ONEWAY = 'outgoing-webhooks';
const TWOWAY = 'bidirectional-webhooks';
const GLOBAL_WEBHOOK_ID = '_global';

// What kind of webhook it is, as a translation key: the same words as the
// type select of the webhook form, and Bots for a bot's runner.
function typeKey(integration) {
  if (integration && integration.bot === true) return 'bots';
  return integration && integration.type === TWOWAY ? 'bidirectional-webhooks' : 'outgoing-webhooks';
}

// One row of the report, from the stored integration and what it points at.
// Only display fields: the token is reduced to "set or not", and the URL is
// masked by maskUrl().
function webhookReportRow(integration, { board, owner } = {}) {
  const doc = integration || {};
  const isGlobal = doc.boardId === GLOBAL_WEBHOOK_ID;
  const activities = Array.isArray(doc.activities) ? doc.activities.filter(a => typeof a === 'string') : [];
  return {
    _id: String(doc._id || ''),
    isGlobal,
    boardId: isGlobal ? '' : String(doc.boardId || ''),
    boardTitle: isGlobal ? '' : String((board && board.title) || ''),
    boardSlug: isGlobal ? '' : String((board && board.slug) || ''),
    boardMissing: !isGlobal && !board,
    ownerId: String(doc.userId || ''),
    ownerUsername: String((owner && owner.username) || ''),
    ownerFullname: String((owner && owner.profile && owner.profile.fullname) || ''),
    title: String(doc.title || ''),
    url: maskUrl(doc.url),
    typeKey: typeKey(doc),
    type: String(doc.type || ONEWAY),
    enabled: doc.enabled !== false,
    activities,
    allActivities: activities.length === 0 || activities.includes('all'),
    tokenSet: isSet(doc.token),
    mattermostDirectMessages: doc.mattermostDirectMessages === true,
    bot: doc.bot === true,
    ownDelivery: !!(doc.notificationDelivery && typeof doc.notificationDelivery === 'object' &&
      Object.keys(doc.notificationDelivery).length),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt : null,
    modifiedAt: doc.modifiedAt instanceof Date ? doc.modifiedAt : null,
  };
}

// The fields the report reads from the database. The token is read so that
// "set or not" can be shown, and never leaves webhookReportRow().
const REPORT_FIELDS = Object.freeze({
  boardId: 1, userId: 1, title: 1, url: 1, type: 1, enabled: 1, activities: 1, token: 1,
  mattermostDirectMessages: 1, bot: 1, notificationDelivery: 1, createdAt: 1, modifiedAt: 1,
});

const REPORT_FILTERS = ['all', 'on', 'off'];
const DEFAULT_REPORT_FILTER = 'all';

// The Mongo selector of one filter; an unknown filter is 'all'.
function reportSelector(filter) {
  if (filter === 'on') return { enabled: { $ne: false } };
  if (filter === 'off') return { enabled: false };
  return {};
}

// The search box matches the title, the URL's host and path, the board title
// and the owner's username or full name - text, never a pattern.
function matchesSearch(row, search) {
  const term = typeof search === 'string' ? search.trim().toLowerCase() : '';
  if (!term) return true;
  return [row.title, row.url, row.boardTitle, row.ownerUsername, row.ownerFullname]
    .some(value => typeof value === 'string' && value.toLowerCase().includes(term));
}

const REPORT_MAX_LIMIT = 100;

function cleanReportQuery(input) {
  const q = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const filter = REPORT_FILTERS.includes(q.filter) ? q.filter : DEFAULT_REPORT_FILTER;
  const search = typeof q.search === 'string' ? q.search.slice(0, 200) : '';
  const limit = Number.isInteger(q.limit) && q.limit > 0 ? Math.min(q.limit, REPORT_MAX_LIMIT) : 25;
  const skip = Number.isInteger(q.skip) && q.skip > 0 ? q.skip : 0;
  return { filter, search, limit, skip };
}

module.exports = {
  SETTING_FIELD,
  webhooksDisabled,
  WEBHOOKS_DISABLED,
  SENDERS,
  NOT_WEBHOOKS,
  maskUrl,
  typeKey,
  webhookReportRow,
  REPORT_FIELDS,
  REPORT_FILTERS,
  DEFAULT_REPORT_FILTER,
  reportSelector,
  matchesSearch,
  cleanReportQuery,
  REPORT_MAX_LIMIT,
};
