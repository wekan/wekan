'use strict';

// "Download my data": everything WeKan holds about one person, machine
// readable (docs/Compliance/README.md WP-5, row 1.1; [GDPR] Art. 15(3) and
// 20(1), [CCPA] § 1798.110(a), [PIPEDA] Principle 4.9, [AUPA] APP 12.1,
// [HIPAA] § 164.524).
//
// Driven by the personal-data inventory (models/lib/personalDataInventory.js,
// WP-3): every collection it says holds personal data is either asked for the
// person's rows here, or named in the export's manifest with the reason it is
// not - so a collection added to WeKan is in the export the moment it is in
// the inventory, and none is left out without saying so
// (tests/personalDataExport.test.cjs).
//
// Secrets are never exported: a field whose name says it is a password, a
// token, a secret, a key, a hash or a credential is removed at every depth,
// and of the account itself only the profile and the settings are taken -
// never `services`, which holds the password hash and the login tokens.
//
// Pure and Meteor-free; server/lib/personalDataExport.js runs it.

const { INVENTORY } = require('./personalDataInventory');

// A field path the subjectField text can name: letters, digits, _ and dots.
const FIELD = /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/;

// Collections not queried here, and why. Every personal-data collection of the
// inventory is either queried or listed here; the test fails on one that is
// neither.
const NOT_QUERIED = Object.freeze({
  users: 'the account itself: exported as user.json, without services (password hash, login tokens)',
  email_bounces: 'keyed by e-mail address: exported by the account\'s addresses (see addressRows)',
  invitation_codes: 'keyed by e-mail address: exported by the account\'s addresses (see addressRows)',
  loginAddresses: 'the account\'s own sign-in addresses are in user.json (loginAddresses); this collection is the per-address view of every account',
  activityPubFollowers: 'remote people with no WeKan account',
  actions: 'board rules, not linked to a person',
  listSyncRuleEmailOutcomes: 'addressed by e-mail and compacted with their command; not linked to an account',
  notificationWebhookJobs: 'no account field: the body is the payload a board webhook receives',
  activityNotificationPlans: 'recipients inside an integrity-checked plan; the notifications themselves are exported',
  listSyncNotificationPlans: 'recipients inside an integrity-checked plan; the notifications themselves are exported',
});

// Field names that are never exported, at any depth.
const SECRET = /(password|passwd|secret|token|apikey|api_key|privatekey|private_key|credential|bcrypt|hash|salt|otp|seed|challenge|signature|cookie|session_?key)/i;

function isPersonal(entry) {
  return Array.isArray(entry.categories) && !(entry.categories.length === 1 && entry.categories[0] === 'none');
}

// The fields of a subjectField text that are plain field paths.
function subjectFields(text) {
  return String(text || '').split(/[,;]/).map(s => s.trim().replace(/\s*\(.*\)$/, ''))
    .filter(s => FIELD.test(s));
}

// Subject fields that hold a USERNAME rather than an id, and those that are
// not a field holding a person at all (eventlog's actors is a tally keyed by
// a hash; the person's own rows are found by userId and username).
const BY_USERNAME = new Set(['username']);
const NOT_A_PERSON_FIELD = new Set(['actors']);

// { collection, selector } for each queried collection, and { collection,
// reason } for each personal one that is not. `user` is the account
// ({ _id, username }); a bare id is accepted for the id fields alone.
function exportPlan(user, inventory = INVENTORY) {
  const userId = typeof user === 'string' ? user : user && user._id;
  const username = user && typeof user === 'object' && typeof user.username === 'string' ? user.username : null;
  if (typeof userId !== 'string' || !userId) return null;
  const queries = [];
  const skipped = [];
  for (const entry of inventory) {
    if (!isPersonal(entry)) continue;
    if (NOT_QUERIED[entry.collection]) {
      skipped.push({ collection: entry.collection, reason: NOT_QUERIED[entry.collection] });
      continue;
    }
    const fields = subjectFields(entry.subjectField)
      .filter(f => !NOT_A_PERSON_FIELD.has(f) && (!BY_USERNAME.has(f) || username));
    if (!fields.length) {
      skipped.push({ collection: entry.collection, reason: `no account field to find the person by (${entry.subjectField || 'none'})` });
      continue;
    }
    const or = fields.map(f => ({ [f]: BY_USERNAME.has(f) ? username : userId }));
    queries.push({ collection: entry.collection, selector: or.length === 1 ? or[0] : { $or: or } });
  }
  return { queries, skipped };
}

// Rows keyed by e-mail address, for the account's addresses.
function addressRows(emails) {
  const list = (emails || []).map(e => String(e || '').trim().toLowerCase()).filter(Boolean);
  if (!list.length) return [];
  return ['email_bounces', 'invitation_codes'].map(collection => ({ collection, selector: { email: { $in: list } } }));
}

// Boards, cards and lists hold other people's content and memberships too:
// the person's export has what identifies the row and THEIR part in it. The
// content itself is in the board exports, which have their own access rules.
const PERSONAL_PART = Object.freeze({
  boards: (row, id) => ({
    _id: row._id, title: row.title,
    members: (row.members || []).filter(m => m && m.userId === id),
    watchers: (row.watchers || []).filter(w => w && w.userId === id),
  }),
  cards: (row, id) => ({
    _id: row._id, title: row.title, boardId: row.boardId, listId: row.listId,
    createdByMe: row.userId === id,
    roles: ['members', 'assignees', 'requesters', 'assigners', 'watchers']
      .filter(f => Array.isArray(row[f]) && row[f].includes(id)),
  }),
  lists: (row, id) => ({ _id: row._id, title: row.title, boardId: row.boardId, watching: true }),
});

// One exported row: the person's part where the row is shared, without secrets.
function exportRow(collection, row, userId) {
  const part = PERSONAL_PART[collection];
  return redact(part ? part(row, userId) : row);
}

// A copy of a row without its secrets.
function redact(value, depth = 0) {
  if (depth > 40) return '[too deep]';
  if (Array.isArray(value)) return value.map(v => redact(v, depth + 1));
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (SECRET.test(k)) continue;
      out[k] = redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

// The account itself, as the person sees it: never services.
function userRecord(user) {
  const { services, ...rest } = user || {};
  return redact(rest);
}

module.exports = {
  exportPlan, addressRows, exportRow, redact, userRecord, subjectFields, NOT_QUERIED, SECRET, PERSONAL_PART, isPersonal,
};
