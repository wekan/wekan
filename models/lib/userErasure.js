'use strict';

// Erasing a person: what happens to the rows OUTSIDE the users document when
// an account is deleted or anonymised (docs/Compliance/README.md WP-4, row
// 1.4; [GDPR] Art. 17(1), [CCPA] § 1798.105(a), [LGPD] Art. 18, [PIPL]
// Art. 47).
//
// models/lib/userDeletionCleanup.js already pulls a deleted user out of board,
// card and list memberships and removes their avatars. The personal-data
// inventory (models/lib/personalDataInventory.js, WP-3) listed the rest - the
// collections whose rows should go with the person but did not. This is that
// list as rules, one per collection, applied the same way on deletion
// (models/users.js, Users.after.remove) and on anonymisation
// (server/models/users.js, anonymizeUser).
//
// Each rule is one of:
//   remove     delete every row the selector matches;
//   unset      $unset the person's fields on the rows that name them;
//   transform  read each matching row and compute its update in JS - for a
//              person inside an array or a keyed tally, where an operator that
//              FerretDB v1 does not support (all-positional $[]) would be the
//              alternative.
//
// Rows of integrity-checked delivery records (activity and list-sync
// notification plans and intents, rule e-mail commands and outcomes, webhook
// jobs) are NOT rewritten here: each carries a checksum that protects it
// against replay, a changed row would be refused, and delivery to a recipient
// who no longer exists is already skipped. They are reduced to ids by their
// compaction (their inventory entries say where).
//
// Pure and Meteor-free; tests/userErasure.test.cjs runs every rule against an
// in-memory database.

function validUser(user) {
  return !!(user && typeof user._id === 'string' && user._id.length > 0);
}

// The e-mail addresses of the account, lower-cased - for rows keyed by address.
function emailsOf(user) {
  return [...new Set((user.emails || [])
    .map(e => (e && typeof e.address === 'string' ? e.address.trim().toLowerCase() : ''))
    .filter(Boolean))];
}

// Who the person is in rows that name them by username rather than id.
function namesOf(user) {
  return [user.username, user._id].filter(v => typeof v === 'string' && v.length > 0);
}

// The rules. `user` is the users document as it was before the erasure.
// `mode` 'delete' (the account is gone) or 'anonymize' (the account stays,
// without its name): an anonymised account keeps its references - a checklist
// item stays assigned to it, as cards keep it as a member - so the rules that
// only remove a REFERENCE are left out in that mode.
function buildUserErasure(user, mode = 'delete') {
  if (!validUser(user)) return null;
  const id = user._id;
  const emails = emailsOf(user);
  const names = namesOf(user);
  const rules = [
    // Rows that exist only for this person.
    ...[
      'board_email_addresses', 'cloudChatMessages', 'github_import_jobs', 'idleSessions',
      'notificationEmailCommands', 'notificationEmailJobs', 'notificationTrayReceipts', 'orgUser',
      'passkeyChallenges', 'presences', 'sandstorm_api_grants', 'sessiondata', 'shortPasswordLogins',
      'trello_export_jobs', 'trello_import_jobs', 'unsaved-edits', 'userPositionHistory', 'windowsSsoTokens',
      'cfs.avatars.filerecord',
    ].map(collection => ({ collection, action: 'remove', selector: { userId: id } })),
    // A SQRL session names the account by either field.
    { collection: 'sqrlSessions', action: 'remove', selector: { $or: [{ userId: id }, { authUserId: id }] } },
    // Keyed by the user id itself.
    ...['notificationEmailControls', 'notificationEmailLeases', 'trello_api_credentials']
      .map(collection => ({ collection, action: 'remove', selector: { _id: id } })),
    // A member's own hourly rate is their pay; who set somebody else's rate is
    // only a reference.
    { collection: 'billingRates', action: 'remove', selector: { userId: id } },
    { collection: 'billingRates', action: 'unset', selector: { createdBy: id }, fields: ['createdBy'] },
    // Time entries, on deletion: removed, unless invoiced - bookkeeping keeps
    // an invoiced entry, which then keeps its hours and amount but no longer
    // the person. An anonymised account keeps its entries: they are its cards'
    // logged time, linked only to the anonymous id.
    ...(mode === 'delete' ? [
      { collection: 'timeEntries', action: 'remove', selector: { userId: id, invoiceId: { $in: [null, ''] } } },
      { collection: 'timeEntries', action: 'unset', selector: { userId: id }, fields: ['userId'] },
      { collection: 'timeEntries', action: 'unset', selector: { approvedBy: id }, fields: ['approvedBy'] },
    ] : []),
    // Who an invitation was for, and who sent it.
    ...(emails.length ? [{ collection: 'invitation_codes', action: 'remove', selector: { email: { $in: emails } } },
      { collection: 'email_bounces', action: 'remove', selector: { email: { $in: emails } } }] : []),
    { collection: 'invitation_codes', action: 'unset', selector: { authorId: id }, fields: ['authorId'] },
    // A list sync that acted as this account no longer does: an administrator
    // picks another account for it (the sync refuses to run without one).
    { collection: 'listSyncCredentials', action: 'unset', selector: { runAsUserId: id }, fields: ['runAsUserId'] },
    // Assigned to a checklist item: the item stays, unassigned.
    ...(mode === 'delete' ? [
      { collection: 'checklistItems', action: 'unset', selector: { assigneeId: id }, fields: ['assigneeId'] },
    ] : []),
    // The data-access log (WP-11) keeps that a download happened, not who
    // made it or from where: the anonymous id stays, as in the audit log.
    { collection: 'dataAccessLog', action: 'unset', selector: { userId: id }, fields: ['username', 'ip'] },
    // Recovery events keep what happened to the board, not who did it.
    { collection: 'recoveryEvents', action: 'unset', selector: { userId: id },
      fields: ['userId', 'username', 'ipv4', 'ipv6', 'location'] },
    // A reaction: the person leaves every reaction they gave.
    { collection: 'card_comment_reactions', action: 'transform', selector: { 'reactions.userIds': id },
      update: doc => ({ $set: { reactions: (doc.reactions || []).map(r => ({
        ...r, userIds: (r.userIds || []).filter(u => u !== id) })) } }) },
    // Admin Panel / Problems summaries: the person leaves the tally, and the
    // row's "most recent" fields when they were the most recent.
    ...(names.length ? [{
      collection: 'eventlog', action: 'transform',
      selector: { $or: [{ userId: id }, { username: { $in: names } }] },
      update: doc => eventLogErasure(doc, id, names),
    }, {
      collection: 'eventlog', action: 'transform',
      selector: { actors: { $exists: true } },
      // Every row with a tally: the person is found by the value, not by the
      // key, which is a hash of it.
      filter: doc => actorKeysOf(doc, names).length > 0,
      update: doc => eventLogErasure(doc, id, names),
    }, {
      collection: 'loginAddresses', action: 'transform',
      selector: { users: { $exists: true } },
      filter: doc => tallyKeysOf(doc, names).length > 0,
      update: doc => ({ $unset: Object.fromEntries(tallyKeysOf(doc, names).map(k => [`users.entries.${k}`, ''])) }),
    }] : []),
  ];
  return rules;
}

function actorKeysOf(doc, names) {
  const actors = (doc && doc.actors) || {};
  return Object.keys(actors).filter(k => actors[k] && actors[k].kind === 'user' && names.includes(actors[k].value));
}

function tallyKeysOf(doc, names) {
  const entries = (doc && doc.users && doc.users.entries) || {};
  return Object.keys(entries).filter(k => entries[k] && names.includes(entries[k].value));
}

function eventLogErasure(doc, id, names) {
  const $unset = {};
  if (doc.userId === id || names.includes(doc.username)) {
    for (const f of ['userId', 'username', 'ip', 'ipv4', 'ipv6', 'location']) $unset[f] = '';
  }
  for (const k of actorKeysOf(doc, names)) $unset[`actors.${k}`] = '';
  return Object.keys($unset).length ? { $unset } : null;
}

// Apply the rules. `collectionNamed(name)` answers a MongoDB driver collection
// (find().toArray, deleteMany, updateMany, updateOne) or null when the
// collection does not exist in this build (the Sandstorm package has no
// passkeys, for one). Every rule runs on its own: one that fails is reported
// and the others still run, so a single error never leaves the rest of a
// person's data behind.
async function applyUserErasure(rules, collectionNamed, onError = () => {}) {
  const done = {};
  for (const rule of rules || []) {
    const coll = collectionNamed(rule.collection);
    if (!coll) continue;
    try {
      let n = 0;
      if (rule.action === 'remove') {
        n = ((await coll.deleteMany(rule.selector)) || {}).deletedCount || 0;
      } else if (rule.action === 'unset') {
        const $unset = Object.fromEntries(rule.fields.map(f => [f, '']));
        n = ((await coll.updateMany(rule.selector, { $unset })) || {}).modifiedCount || 0;
      } else if (rule.action === 'transform') {
        for (const doc of await coll.find(rule.selector).toArray()) {
          if (rule.filter && !rule.filter(doc)) continue;
          const update = rule.update(doc);
          if (!update) continue;
          await coll.updateOne({ _id: doc._id }, update);
          n += 1;
        }
      }
      done[rule.collection] = (done[rule.collection] || 0) + n;
    } catch (error) {
      onError(rule.collection, error);
    }
  }
  return done;
}

// The collections these rules erase from - the inventory points at this file
// for each (tests/userErasure.test.cjs checks the two agree).
const ERASED_COLLECTIONS = Object.freeze([...new Set((buildUserErasure({
  _id: 'u', username: 'n', emails: [{ address: 'a@b' }] }) || []).map(r => r.collection))].sort());

module.exports = { buildUserErasure, applyUserErasure, ERASED_COLLECTIONS, emailsOf };
