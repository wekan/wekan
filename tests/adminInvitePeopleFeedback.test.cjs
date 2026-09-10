'use strict';

// Regression coverage for #5707 ("Environment specific: Issue when trying to
// invite a user to join a board via email").
//
// The reporter saw "sending email failed" with no way to tell what went
// wrong (this happens whenever the server's mail transport is not
// configured -- server/models/settings.js's sendInvitationEmail() already
// throws a descriptive Meteor.Error('email-fail', e.message) in that case).
// The member "Invite People" popup (client/components/users/userHeader.js)
// already surfaces that failure to the user via a red/green
// #invite-people-infos message. But the Admin Panel -> Accounts -> "Invite
// People" form (client/components/settings/settingBody.js) called the very
// same 'sendInvitation' method with a callback that took NO parameters at
// all -- it ignored both the error and the result and left a commented-out
// "TODO - show more info to user". So an admin using THAT form got no
// feedback whatsoever: the Send button just stopped spinning, whether the
// invitation succeeded or a mail-send failure happened, exactly the
// confusing silence the issue describes.
//
// Fix: settingBody.js's handler now reads the callback's error argument and
// writes the same success/error message into a new #invite-people-infos
// element (added to settingBody.jade) that userHeader.js's popup already
// uses -- so both invite-by-email entry points behave the same way.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingBodyJsPath = path.join(
  __dirname,
  '../client/components/settings/settingBody.js',
);
const settingBodyJadePath = path.join(
  __dirname,
  '../client/components/settings/settingBody.jade',
);
const userHeaderJsPath = path.join(
  __dirname,
  '../client/components/users/userHeader.js',
);

const settingBodyJs = fs.readFileSync(settingBodyJsPath, 'utf8');
const settingBodyJade = fs.readFileSync(settingBodyJadePath, 'utf8');
const userHeaderJs = fs.readFileSync(userHeaderJsPath, 'utf8');

const tests = [];
function test(name, fn) {
  tests.push([name, fn]);
}

function extractHandler(source, marker) {
  const start = source.indexOf(marker);
  assert.ok(start !== -1, `expected to find ${marker}`);
  // Grab a generous window after the handler starts -- enough to contain the
  // whole Meteor.call(...) block without needing a full JS parser.
  return source.slice(start, start + 1800);
}

// ---------------------------------------------------------------- positive

test('settingBody.js reads the sendInvitation callback error argument', () => {
  const handler = extractHandler(settingBodyJs, "'click button.js-email-invite'");
  const call = handler.slice(handler.indexOf('Meteor.call'));
  const callbackMatch = call.match(/Meteor\.call\(\s*'sendInvitation',[^,]+,[^,]+,\s*\(([^)]*)\)\s*=>/);
  assert.ok(callbackMatch, 'expected a sendInvitation Meteor.call with a callback');
  const params = callbackMatch[1].trim();
  assert.notEqual(
    params,
    '',
    'the sendInvitation callback must accept the error argument, not ignore it',
  );
});

test('settingBody.js writes a success/error message into #invite-people-infos', () => {
  const handler = extractHandler(settingBodyJs, "'click button.js-email-invite'");
  assert.match(handler, /invite-people-infos/);
  assert.match(handler, /invite-people-success/);
  assert.match(handler, /invite-people-error/);
});

test('settingBody.jade renders the #invite-people-infos element', () => {
  assert.match(settingBodyJade, /#invite-people-infos/);
});

// The two "Invite People" entry points (Admin Panel and the member popup)
// should now behave the same way when the mail send fails.
test('both invite-by-email entry points surface invite-people-error on failure', () => {
  assert.match(settingBodyJs, /invite-people-error/);
  assert.match(userHeaderJs, /invite-people-error/);
});

// ---------------------------------------------------------------- negative

test(
  'negative: no remaining sendInvitation call site uses a parameterless callback',
  () => {
    const clientDir = path.join(__dirname, '../client');
    const offenders = [];

    function walk(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
          const src = fs.readFileSync(full, 'utf8');
          // Match `sendInvitation(..., ..., () => {` -- a callback with an
          // empty parameter list, the exact shape that used to swallow the
          // error silently.
          const re = /Meteor\.call\(\s*'sendInvitation'[^)]*?,\s*\(\s*\)\s*=>/gs;
          if (re.test(src)) {
            offenders.push(full);
          }
        }
      }
    }
    walk(clientDir);

    assert.deepEqual(
      offenders,
      [],
      `sendInvitation call sites with a parameterless (error-swallowing) callback: ${offenders.join(', ')}`,
    );
  },
);

// ------------------------------------------------------------- test runner

let passed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    passed += 1;
    console.log(`ok - ${name}`);
  } catch (e) {
    console.error(`not ok - ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}
console.log(`${passed}/${tests.length} passed`);
