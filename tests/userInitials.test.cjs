'use strict';

// An avatar's initials never throw while rendering.
// Run: node tests/userInitials.test.cjs
//
// `getInitials()` ended with `this.username[0].toUpperCase()`, so a user
// document that arrived WITHOUT a username threw a TypeError - from a Blaze
// helper, during a render. Reported from a board:
//
//   Exception in Template.userAvatarInitials initials: getInitials@...
//   Exception in Template.userAvatarInitials viewPortWidth: getInitials@...
//   Odottamaton arvo 0 0  15 jäsennettäessä attribuuttia viewBox
//
// Two helpers call it, so each avatar threw twice, and the second throw left
// the SVG's viewBox with a hole in it ("0 0  15") - Firefox then refused the
// attribute and drew nothing. A display helper has to be total: a missing name
// is a blank circle, not a broken page.
//
// A fullname can also split into empty words ("  Ann  "), which used to put the
// literal string "undefined" in the circle.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const users = read('models/users.js');
const avatar = read('client/components/users/userAvatar.js');

const body = users.slice(users.indexOf('  getInitials() {'),
  users.indexOf('  getLimitToShowCardsCount()'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// The function under test, lifted out of the model so it can be run without
// Meteor - the model file is not requireable here.
function getInitials(user) {
  const profile = user.profile || {};
  if (profile.initials) return profile.initials;
  if (profile.fullname) {
    const initials = profile.fullname
      .split(/\s+/)
      .filter(word => word.length > 0)
      .map(word => word[0])
      .join('')
      .toUpperCase();
    if (initials) return initials;
  }
  return (user.username || '').slice(0, 1).toUpperCase();
}

console.log('userInitials:');

test('the model matches the behaviour pinned here', () => {
  assert.ok(/\(this\.username \|\| ''\)\.slice\(0, 1\)/.test(body),
    'a missing username is an empty string, not a crash');
  assert.ok(/filter\(word => word\.length > 0\)/.test(body),
    'and an empty word of a fullname is skipped');
  assert.ok(!/this\.username\[0\]/.test(body), 'nothing indexes a name that may not be there');
});

test('the three sources, in order', () => {
  assert.strictEqual(getInitials({ profile: { initials: 'XY' }, username: 'zed' }), 'XY');
  assert.strictEqual(getInitials({ profile: { fullname: 'Ada Lovelace' }, username: 'ada' }), 'AL');
  assert.strictEqual(getInitials({ username: 'ada' }), 'A');
});

test('a user document with nothing in it (negative)', () => {
  // This is the one that threw.
  assert.strictEqual(getInitials({}), '');
  assert.strictEqual(getInitials({ profile: {} }), '');
  assert.strictEqual(getInitials({ profile: { fullname: '' }, username: '' }), '');
});

test('a fullname of only spaces does not spell "undefined" (negative)', () => {
  assert.strictEqual(getInitials({ profile: { fullname: '   ' }, username: 'ada' }), 'A');
  assert.strictEqual(getInitials({ profile: { fullname: '  Ann  Lee ' } }), 'AL');
});

test('the viewBox is always a number', () => {
  // The second helper multiplied the length of what the first one returned. A
  // throw there left the attribute half-written and the avatar unrendered.
  const helpers = avatar.slice(avatar.indexOf('Template.userAvatarInitials.helpers'));
  assert.ok(/const initials = \(typeof this\.initials === 'string' && this\.initials\)[\s\S]*?\|\| \(user && user\.getInitials\(\)\) \|\| '';/.test(helpers),
    'prefer supplied initials, then read the user once, and default');
  assert.ok(/return \(initials\.length \|\| 1\) \* 12;/.test(helpers),
    'and an empty one still has a width');
  assert.ok(/if \(typeof this\.initials === 'string' && this\.initials\) return this\.initials;[\s\S]*?return \(user && user\.getInitials\(\)\) \|\| '';/.test(helpers),
    'the text helper uses supplied initials and defaults, so nothing renders `undefined`');
});

console.log(`\nuserInitials: ${passed} tests passed`);
