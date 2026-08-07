'use strict';

// #3113: an outgoing webhook said who did something by DISPLAY name, and had no
// field for the login name.
//
// `params.user` comes from getActivityUserName(), which prefers `getName()` -
// the full name - because the same params feed the e-mail notification text,
// where "Lauri Ojansivu commented on ..." is what a person wants to read. A
// webhook consumer needs the identifier instead: it received "Lauri Ojansivu"
// where it needed "xet7", and matching users by display name is wrong the moment
// two people share one.
//
// Changing what `user` means would break every consumer already reading it, and
// that is what left this "needs a maintainer decision" for years. It needs no
// decision: the username travels as its OWN field. Nothing that reads `user`
// changes, and the missing identifier is simply there.
//
// Run: node tests/webhookUsername.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const activities = read('server/models/activities.js');
const outgoing = read('server/notifications/outgoing.js');
const code = src => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('webhookUsername:');

test('the payload carries the login name as its own field', () => {
  const src = code(activities);
  assert.ok(/params\.username = user\.username \|\| ''/.test(src),
    'params.username is the username, and empty rather than undefined when a '
    + 'user somehow has none - a webhook consumer parsing JSON should not have '
    + 'to distinguish "absent" from "unknown"');
  // Right where the display name is set, from the same user document.
  const userAt = src.indexOf('params.user = getActivityUserName');
  const nameAt = src.indexOf('params.username =');
  assert.ok(userAt !== -1 && nameAt > userAt && nameAt - userAt < 400,
    'both are set from the same user, together, or one drifts from the other');
});

test('and `user` still means what it always did', () => {
  // The e-mail text is `${params.user} ${descriptionText}`, so this field is a
  // display name by design. The fix must not have changed it.
  const src = code(activities);
  assert.ok(/params\.user = getActivityUserName\(user, activity\.userId\)/.test(src),
    'the display name is untouched');
  assert.ok(/user\.getName\?\.\(\) \|\| user\.username/.test(src),
    'and getActivityUserName still prefers the full name for it');
  assert.ok(/\$\{params\.user\} \$\{descriptionText\}/.test(code(outgoing)),
    'which is what the notification text reads');
});

test('username is in the default webhook attribute list', () => {
  const list = /webhooksAtbts = \([\s\S]*?\) \|\| \[([\s\S]*?)\];/.exec(code(outgoing));
  assert.ok(list, 'the default attribute list must be there');
  const fields = [...list[1].matchAll(/'([a-zA-Z]+)'/g)].map(m => m[1]);
  assert.ok(fields.includes('username'), 'or the new field is computed and never sent');
  assert.ok(fields.includes('user'), 'beside the display name, not instead of it');
});

test('WEBHOOKS_ATTRIBUTES still overrides the whole list', () => {
  // A deployment that pinned its own field list keeps exactly what it asked for:
  // the default only applies when the variable is unset.
  assert.ok(/process\.env\.WEBHOOKS_ATTRIBUTES &&\s*process\.env\.WEBHOOKS_ATTRIBUTES\.split\(','\)/
    .test(code(outgoing).replace(/\s+/g, ' ')),
    'the env var replaces the list rather than adding to it');
});

console.log(`\n${passed} tests passed`);
