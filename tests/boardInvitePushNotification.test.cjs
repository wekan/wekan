'use strict';

// Regression coverage for #3136: inviting an EXISTING user to a board also
// tells them in the in-app notification bell, not only by email.
//
// The first fix called Notifications.notify(user, 'push-invite-title',
// 'push-invite-text', params) - and this test pinned that call. It never
// delivered anything: `params` was a const inside the email try block, so the
// call threw a ReferenceError that its own catch logged; and with `params` in
// scope the tray service would still have refused it (the bell lists
// activities and tray delivery requires an activityId), while the email
// service queued a second email beside the invitation. The guard below pins
// the replacement instead: server/lib/boardInviteTray.js delivers the
// membership's own addBoardMember activity to the invitee's tray.
// tests/playwright/specs/board-invite-tray.e2e.js checks it in a real server.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const code = text => text.replace(/^\s*\/\/.*$/gm, '');
const usersSource = read('server/models/users.js');
const helper = read('server/lib/boardInviteTray.js');

const methodMatch = usersSource.match(
  /async inviteUserToBoard\(username, boardId\) \{[\s\S]*?\n  \},\n\n  async impersonate/,
);
assert.ok(methodMatch, 'inviteUserToBoard method body must be found in server/models/users.js');
const methodBody = methodMatch[0];

// 1) The invite uses the tray helper, only for an existing user, after the
// email, inside its own try so a failure cannot break the invite.
assert.match(methodBody,
  /if \(!isNewUser\) \{\s*try \{\s*await deliverBoardInviteToTray\(\{/,
  '#3136: an existing invitee gets the bell entry, guarded by its own try');
const emailIndex = methodBody.indexOf("subject: 'email-invite-subject'");
assert.ok(emailIndex !== -1, 'the email invite must still be sent');
assert.ok(emailIndex < methodBody.indexOf('if (!isNewUser)'), 'the email stays unconditional, before the bell');
// Only a membership that was inactive is recorded again; an active member
// re-invited adds nobody.
assert.match(methodBody, /reactivated: memberIndex >= 0 && board\.members\[memberIndex\]\.isActive !== true/);
assert.match(methodBody, /const invitedAt = new Date\(\);\s*\n\s*const memberIndex = /,
  'the activity is looked up from the moment before membership changes');

// 2) Negative: the dead shape is gone - no notify() with invite-only params,
// which has no activity for the tray and would email the invitee twice.
assert.doesNotMatch(code(methodBody), /Notifications\.notify\(/);
assert.doesNotMatch(usersSource, /import \{ Notifications \} from '\/server\/notifications\/notifications'/);

// 3) The helper delivers an activity, to the tray only, honouring settings.
assert.match(helper, /if \(!await prepareTrayNotification\(user, \{ boardId \}\)\) return null;/);
assert.match(helper, /activityType: 'addBoardMember', boardId, memberId: user\._id, createdAt: \{ \$gte: since \}/);
assert.match(helper, /await trayDelivery\.deliver\(user\._id, activity\._id\);/);
assert.doesNotMatch(code(helper), /emailOutbox|Notifications\.notify/, 'the invitation email is the only email');

// 4) Negative, app-wide: no server caller hands notify() a params object
// without an activityId - that is the shape tray delivery refuses.
const serverFiles = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(path.join(__dirname, '..', dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) { if (entry.name !== 'tests' && entry.name !== 'node_modules') walk(rel); }
    else if (entry.name.endsWith('.js')) serverFiles.push(rel);
  }
}('server'));
const callers = serverFiles.filter(file => /\bNotifications\.notify\(/.test(code(read(file))));
assert.deepEqual(callers, [], `Notifications.notify() callers need an activityId: ${callers.join(', ')}`);

// 5) The bell renders the activity it is given.
assert.match(read('client/components/notifications/notificationIcon.jade'), /'addBoardMember'/);

console.log('boardInvitePushNotification: all assertions passed');
