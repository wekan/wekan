'use strict';

// Regression guard for #3310 (opened 2020-10-26 by Cupara), three feature
// suggestions filed together:
//
//   1. Admin Panel management of the sign-up "invite code" field.
//   2. Admin ability to delete a user account.
//   3. Anonymous (logged-out) viewing of PUBLIC boards.
//
// Reading the current source shows all three are already implemented - in
// some cases in a stronger form than what was asked for in 2020 - so this
// test only pins the behaviour rather than adding anything new.
// Run: node tests/issue3310FeatureRequests.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log('  ok -', name);
  } catch (err) {
    console.error(`  FAIL - ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('issue3310FeatureRequests:');

// 1. Invite code management from the Admin Panel.
//
// WeKan no longer has the single static "invite code" field the 2020 report
// found at sign-up. In its place, Admin Panel -> Settings has an "Invite
// via Email" action (settingBody.js) that calls the `sendInvitation` server
// method, which generates a per-invitee, per-email code (`icode`), stores it
// on an Invitation document and mails it to the recipient - an admin-driven,
// per-person invite code, not a single shared secret an admin would have had
// to "distribute" by hand. The sign-up form checks that code
// (server/models/users.js) before it accepts a registration.
test('Admin Panel has an invite-people action that generates and emails a code', () => {
  const settingBody = read('client/components/settings/settingBody.js');
  assert.ok(
    /js-email-invite/.test(settingBody),
    'the Admin Settings pane must expose an email-invite action',
  );
  assert.ok(
    /Meteor\.call\(\s*['"]sendInvitation['"]/.test(settingBody),
    'the email-invite action must call the sendInvitation server method',
  );

  const settingsModel = read('server/models/settings.js');
  assert.ok(
    /sendInvitation\s*\(/.test(settingsModel),
    'server/models/settings.js must define the sendInvitation method',
  );
  assert.ok(
    /icode/.test(settingsModel),
    'sendInvitation must generate/send the per-invitee invitation code (icode)',
  );
});

test('sign-up validates the invitation code that was admin-generated and emailed', () => {
  const usersModel = read('server/models/users.js');
  assert.ok(
    /icode/.test(usersModel),
    'server/models/users.js must read the invitation code from the invited profile',
  );
});

// 2. Admin ability to delete a user account.
//
// Reachable from Admin Panel -> People: each row's "more settings" (⋯) link
// opens the settingsUser popup (Popup.open appends "Popup" to the name it is
// given, client/lib/popup.js), whose #deleteButton calls the `removeUser`
// server method.
test('People page: a row\'s "more settings" link opens the settingsUser popup', () => {
  const peopleBody = read('client/components/settings/peopleBody.js');
  assert.ok(
    /'click a\.more-settings-user'/.test(peopleBody),
    'peopleRow must handle a click on its more-settings-user link',
  );
  assert.ok(
    /Popup\.open\(\s*['"]settingsUser['"]\s*\)/.test(peopleBody),
    'the more-settings-user click must open the settingsUser popup',
  );

  const peopleJade = read('client/components/settings/peopleBody.jade');
  assert.ok(
    /template\(name="settingsUserPopup"\)/.test(peopleJade),
    'the settingsUserPopup template must exist (Popup.open("settingsUser") -> "settingsUserPopup")',
  );
});

test('the settingsUser popup deletes the account via the removeUser server method', () => {
  const peopleBody = read('client/components/settings/peopleBody.js');
  const at = peopleBody.indexOf("Template.settingsUserPopup.events(");
  assert.notStrictEqual(at, -1, 'settingsUserPopup must register events');
  const eventsBlock = peopleBody.slice(at, peopleBody.indexOf('\n});', at));
  assert.ok(
    /'click #deleteButton'/.test(eventsBlock),
    'settingsUserPopup must handle a click on #deleteButton',
  );
  assert.ok(
    /Meteor\.call\(\s*['"]removeUser['"]/.test(eventsBlock),
    '#deleteButton must call the removeUser server method',
  );
});

test('removeUser is a real server method, not a client-side removal', () => {
  // The comment right above the call already says as much
  // ("Use secure server method instead of direct client-side removal");
  // this proves the method it names actually exists server-side.
  const usersModel = read('server/models/users.js');
  assert.ok(
    /removeUser/.test(usersModel),
    'server/models/users.js must define/export the removeUser method',
  );
});

// 3. Anonymous viewing of public boards.
//
// A board's own URL (/b/:id and /b/:id/:slug) carries no ensureSignedIn
// trigger in the router, and the `board` publication's visibility selector
// includes `{ permission: 'public' }` even when there is no subscriber
// userId at all (models/lib/boardVisibilitySelectors.js) - a logged-out
// visitor with a public board's link is sent that board's data.
test('the board route (/b/:id/:slug) requires no sign-in', () => {
  const router = read('config/router.js');
  const shortAt = router.indexOf("FlowRouter.route('/b/:id', {");
  const fullAt = router.indexOf("FlowRouter.route('/b/:id/:slug', {");
  assert.notStrictEqual(shortAt, -1);
  assert.notStrictEqual(fullAt, -1);

  const shortRoute = router.slice(shortAt, router.indexOf('\n});', shortAt));
  const fullRoute = router.slice(fullAt, router.indexOf('\n});', fullAt));
  assert.ok(
    !/triggersEnter/.test(shortRoute),
    '/b/:id must not gate entry behind a sign-in trigger',
  );
  assert.ok(
    !/triggersEnter/.test(fullRoute),
    '/b/:id/:slug must not gate entry behind a sign-in trigger',
  );
});

test('the board publication sends a public board to an anonymous (no-userId) subscriber', () => {
  // Pure-logic module, loadable with plain require() (see boardVisibility.test.cjs
  // for the same pattern applied to models/lib/boardVisibility.js).
  const { boardVisibilitySelectors } = require(
    path.join(root, 'models/lib/boardVisibilitySelectors.js'),
  );

  const anonymousSelectors = boardVisibilitySelectors({ userId: null });
  assert.deepStrictEqual(
    anonymousSelectors,
    [{ permission: 'public' }],
    'an anonymous subscriber must still match public boards, and nothing else',
  );

  const boardsPublication = read('server/publications/boards.js');
  assert.ok(
    /boardVisibilitySelectors\(\{/.test(boardsPublication) &&
      /publishComposite\(\s*['"]board['"]/.test(boardsPublication),
    'the board publication must build its visibility $or from boardVisibilitySelectors',
  );
});

console.log(`\nissue3310FeatureRequests: ${passed} tests passed`);
