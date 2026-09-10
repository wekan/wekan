'use strict';

// Regression coverage for #3136: inviting a user to a board must also send a
// PUSH notification, not just email - reusing the SAME push-notification
// helper other event types already use (card assignment, due dates,
// mentions, ...), not a new/duplicate implementation.
//
// `Users.inviteUserToBoard` (server/models/users.js) is a full Meteor method
// (Accounts, Boards, ReactiveCache) that cannot run outside a Meteor server,
// so - like the other source-inspection regression tests in this suite -
// this test reads the actual source and pins the exact shape of the fix:
//
// - it imports `Notifications` from the SAME module every other event type
//   subscribes to/notifies through (server/notifications/notifications.js);
// - it calls `Notifications.notify(user, title, description, params)` -
//   the exact helper signature used at server/models/activities.js:414 -
//   not a new push-sending function;
// - the call is guarded so it only fires for an EXISTING user (isNewUser is
//   false): a brand-new invitee created from an email address with no
//   matching WeKan account has no push/notification target yet, so they
//   stay email-only, with no error;
// - the email send itself remains UNGUARDED (still fires for both existing
//   and brand-new invitees, exactly as before).

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const usersSourcePath = path.join(__dirname, '..', 'server/models/users.js');
const usersSource = fs.readFileSync(usersSourcePath, 'utf8');

// 1) The push-notification helper is imported from the shared notifications
// module - the same one server/notifications/{email,profile}.js subscribe to
// and server/models/activities.js already calls for other event types.
assert.match(
  usersSource,
  /import\s*\{\s*Notifications\s*\}\s*from\s*['"]\/server\/notifications\/notifications['"]/,
  '#3136: inviteUserToBoard must reuse the existing Notifications module, not a new one',
);

// 2) Isolate the inviteUserToBoard method body so the assertions below can't
// accidentally match some unrelated method elsewhere in the file.
const methodMatch = usersSource.match(
  /async inviteUserToBoard\(username, boardId\) \{[\s\S]*?\n  \},\n\n  async impersonate/,
);
assert.ok(methodMatch, 'inviteUserToBoard method body must be found in server/models/users.js');
const methodBody = methodMatch[0];

// 3) It calls the exact same Notifications.notify(user, title, description,
// params) helper/signature used elsewhere (server/models/activities.js:414),
// not a bespoke push-sending call.
const activitiesSourcePath = path.join(__dirname, '..', 'server/models/activities.js');
const activitiesSource = fs.readFileSync(activitiesSourcePath, 'utf8');
assert.match(
  activitiesSource,
  /Notifications\.notify\(user, title, description, params\)/,
  'sanity check: server/models/activities.js still calls Notifications.notify(user, title, description, params) for other event types',
);
assert.match(
  methodBody,
  /Notifications\.notify\(\s*user,\s*['"]push-invite-title['"],\s*['"]push-invite-text['"],\s*params\s*\)/,
  '#3136: inviteUserToBoard must call Notifications.notify(user, title, description, params) - the same helper/shape other event types use',
);

// 4) Exactly one call site to Notifications.notify( in the whole method body
// - no duplicate/parallel push implementation was written.
const notifyCallCount = (methodBody.match(/Notifications\.notify\(/g) || []).length;
assert.equal(
  notifyCallCount,
  1,
  '#3136: exactly one Notifications.notify(...) call - reuse, not a second implementation',
);

// 5) The push call is guarded by `!isNewUser` (only an EXISTING user gets a
// push notification target) and sits after that guard, not unconditionally.
const guardIndex = methodBody.indexOf('if (!isNewUser)');
const notifyIndex = methodBody.indexOf('Notifications.notify(');
assert.ok(guardIndex !== -1, '#3136: the push notification must be guarded by `if (!isNewUser)`');
assert.ok(
  notifyIndex > guardIndex,
  '#3136: Notifications.notify(...) must be inside the `if (!isNewUser)` guard',
);

// 6) The email send remains unconditional (still runs for both existing and
// brand-new invitees) - email-invitation behaviour for non-existent users
// must not have changed.
const emailSubjectIndex = methodBody.indexOf("subject: 'email-invite-subject'");
assert.ok(emailSubjectIndex !== -1, 'the email invite must still be sent');
assert.ok(
  emailSubjectIndex < guardIndex,
  '#3136: the email send must remain outside/ahead of the push-only `if (!isNewUser)` guard',
);

// 7) A failing push notification must never break the invite itself - it is
// wrapped in its own try/catch, separate from the email try/catch above it.
assert.match(
  methodBody,
  /if \(!isNewUser\) \{\s*try \{\s*Notifications\.notify\(/,
  '#3136: the push notification call must be wrapped in its own try so a failure cannot break the invite',
);

// 8) i18n: the new push notification keys exist in en.i18n.json (the source
// of truth for keys/placeholders) and carry the same placeholders as their
// email-invite counterparts (no dangling/renamed tokens).
const enI18nPath = path.join(__dirname, '..', 'imports/i18n/data/en.i18n.json');
const enI18n = JSON.parse(fs.readFileSync(enI18nPath, 'utf8'));
assert.ok(
  typeof enI18n['push-invite-title'] === 'string' && enI18n['push-invite-title'].length > 0,
  '#3136: en.i18n.json must have a push-invite-title key',
);
assert.ok(
  typeof enI18n['push-invite-text'] === 'string' && enI18n['push-invite-text'].length > 0,
  '#3136: en.i18n.json must have a push-invite-text key',
);

function placeholderTokens(str) {
  return new Set((str.match(/__[a-zA-Z0-9]+__/g) || []));
}
assert.deepEqual(
  placeholderTokens(enI18n['push-invite-title']),
  placeholderTokens(enI18n['email-invite-subject']),
  'push-invite-title must carry the same placeholder tokens as email-invite-subject',
);
assert.deepEqual(
  placeholderTokens(enI18n['push-invite-text']),
  placeholderTokens(enI18n['email-invite-text']),
  'push-invite-text must carry the same placeholder tokens as email-invite-text',
);

// 9) Every one of the params built for the email (user, inviter, board, url)
// is available to the push call too - it is passed the exact same `params`
// object, so every placeholder above resolves.
['user:', 'inviter:', 'board:', 'url:'].forEach((field) => {
  assert.ok(
    methodBody.includes(field),
    `#3136: params passed to both email and push must build a "${field}" field`,
  );
});

// --- Negative / no-regression checks ----------------------------------------

// 10) Every locale file carries the same two keys, in the same position as
// en.i18n.json (allTranslationCompleteness.test.cjs already enforces exact
// key-order parity across all locales; this only pins that these two keys
// specifically made it into every file, not just English).
const dataDir = path.join(__dirname, '..', 'imports/i18n/data');
const localeFiles = fs.readdirSync(dataDir).filter((f) => f.endsWith('.i18n.json'));
let missing = [];
localeFiles.forEach((file) => {
  const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
  if (!('push-invite-title' in data) || !('push-invite-text' in data)) {
    missing.push(file);
  }
});
assert.deepEqual(missing, [], `every locale file must carry push-invite-title/push-invite-text: missing in ${missing.join(', ')}`);

console.log('boardInvitePushNotification: all assertions passed');
