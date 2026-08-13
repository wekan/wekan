'use strict';

// "Silent does not respond. If we try to change it does not change. Nothing
// happens." - email report, 2026-08-13, with a screenshot of the board's
// Ändra bevaka (Change watch) popup. Run: node tests/boardWatchSilent.test.cjs
//
// Driven against a running WeKan, the popup works for a board MEMBER: the level
// is written, the check mark moves, the popup closes. It does nothing at all
// for somebody who reaches the board another way -
//
//   login as non-member admin: ok
//   watch -> ERROR error-board-notAMember
//
// - and that is the whole bug, in two halves:
//
//   1. THE REFUSAL. A board is shared four ways: membership, an organisation, a
//      team, and (since #5850) an email domain. Only the first puts anybody in
//      `members`, and the watch method asked `board.hasMember(userId)`. Everyone
//      sharing through an org, a team or a domain could open the board and see
//      the button, and was refused the moment they used it.
//
//   2. THE SILENCE. The popup's callback closed the popup on success and did
//      NOTHING otherwise. A refusal was indistinguishable from a dead button.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(repoRoot, f), 'utf8');
const method = read('server/notifications/watch.js');
const header = read('client/components/boards/boardHeader.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('boardWatchSilent:');

test('watching asks whether the user may SEE the board', () => {
  assert.ok(!/board\.permission === 'private' && !board\.hasMember\(userId\)/.test(method),
    'membership alone is not the question - org, team and domain shares are '
    + 'board access too');
  assert.ok(/canSeeBoard\(userId, board\)/.test(method), 'it asks that instead');
  assert.ok(/boardVisibilitySelectors/.test(method),
    'through the same builder the publications use, so a watch cannot be '
    + 'granted where the board itself is not visible');
});

test('the four ways a board is shared are all covered', () => {
  const fn = method.slice(method.indexOf('async function canSeeBoard'));
  const body = fn.slice(0, fn.indexOf('\n}'));
  assert.ok(/permission === 'public'/.test(body), 'public');
  assert.ok(/hasMember\(userId\)/.test(body), 'membership');
  assert.ok(/orgIds/.test(body) && /teamIds/.test(body) && /emailDomains/.test(body),
    'organisation, team and email domain');
});

test('a stranger is still refused (negative)', () => {
  // The guard against fixing this the easy way. boardVisibilitySelectors is
  // what GHSA-gwc4-fw7p-gw58 was about: a revoked share (isActive: false) must
  // not match, and neither must a user with no relationship to the board.
  const selectors = read('models/lib/boardVisibilitySelectors.js');
  assert.ok(/isActive: true/.test(selectors),
    'the shared builder only matches ACTIVE shares');
  assert.ok(/if \(!userId\) return false;/.test(method),
    'and an anonymous request to watch a private board is refused outright');
});

test('a refusal is shown, not swallowed', () => {
  const handler = header.slice(header.indexOf("'click .js-select-watch'"));
  const body = handler.slice(0, handler.indexOf('\n  },'));
  assert.ok(/if \(!err && ret\)/.test(body), 'success still closes the popup');
  assert.ok(/window\.alert|Popup\.alert|alert\(message\)/.test(body),
    'and a failure says something - a silent refusal reads as a broken button');
  assert.ok(/error-watch-disabled/.test(body) && /error-board-notAMember/.test(body),
    'naming both reasons the server has, so the message tells the admin what to change');
});

test('the strings the popup shows exist', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const key of ['error-watch-disabled', 'error-board-notAMember']) {
    assert.ok(en[key], `en.i18n.json needs ${key}, or the alert shows the key itself`);
  }
});

test('the level is read as a string, however Blaze hands it over', () => {
  const handler = header.slice(header.indexOf("'click .js-select-watch'"));
  const body = handler.slice(0, handler.indexOf('\n  },'));
  assert.ok(/String\(this\)/.test(body),
    'a boxed String from {{#with "watching"}} is not typeof "string", and the '
    + 'old guard silently did nothing when it got one');
  assert.ok(/if \(!level\) return;/.test(body), 'and an empty context is still ignored');
});

console.log(`\nboardWatchSilent: ${passed} tests passed`);
