'use strict';
// #6919: a checklist folded on a minicard unfolded half a second later. The
// fold was stored; the client never saw it, because its copy of the current
// user's profile had shrunk to a few fields. DDP merges only top-level fields,
// and Meteor re-runs named subscriptions before the accounts publication of the
// whole profile on every login, a reconnect included - so a publication that
// sent the current user `profile.fullname` / `.avatarUrl` / ... or
// `profile.showDesktopDragHandles` won, and every preference in the profile
// went back to its default until a reload (#6691 found the same for the board
// view). This test finds every users query with profile subfields in a server
// file that publishes, anywhere, and requires it to leave the current user out.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const { notCurrentUser } = require('../server/lib/notCurrentUser');

test('notCurrentUser keeps the selector and leaves out only the current user', () => {
  assert.deepEqual(notCurrentUser({ _id: { $in: ['a', 'b'] } }, 'me'),
    { $and: [{ _id: { $in: ['a', 'b'] } }, { _id: { $ne: 'me' } }] });
  assert.deepEqual(notCurrentUser({ username: 'x' }, null), { username: 'x' }, 'no user, nothing to leave out');
  assert.deepEqual(notCurrentUser(undefined, 'me'), { $and: [{}, { _id: { $ne: 'me' } }] });
});

function serverFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['tests', 'node_modules'].includes(entry.name) && !entry.name.startsWith('_build')) out.push(...serverFiles(rel));
    } else if (entry.name.endsWith('.js')) out.push(rel);
  }
  return out;
}

// The text of a call from its opening parenthesis to the matching one.
function callText(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '(') depth++;
    else if (src[i] === ')' && --depth === 0) return src.slice(open, i + 1);
  }
  return src.slice(open);
}

// Publications that send the current user's preference under a top-level
// field of their own, never as `profile` (see their comments).
const REMAPPED = new Set(['server/publications/userBoardView.js', 'server/publications/userDesktopDragHandles.js']);

test('negative: no publication sends the current user a narrow profile', () => {
  const offenders = [];
  let checked = 0;
  for (const file of serverFiles('server')) {
    const src = read(file);
    if (!/Meteor\.publish\(|publishComposite\(/.test(src) || REMAPPED.has(file)) continue;
    for (const m of src.matchAll(/(?:ReactiveCache\.getUsers|Meteor\.users\.find|Users\.find)\(/g)) {
      const call = callText(src, m.index + m[0].length - 1);
      if (!/'profile\.[A-Za-z]+'\s*:|Users\.safeFields/.test(call)) continue;
      checked++;
      // Either form: notCurrentUser() in the selector, or the id list built
      // just above it without the current user (boards.js, before this test).
      const before = src.slice(Math.max(0, m.index - 400), m.index);
      if (/notCurrentUser\(/.test(call) || /!==\s*thisUserId/.test(call) || /=>\s*[^;]*!==\s*thisUserId\)\)?\]?;?\s*\n[\s\S]*$/.test(before)) continue;
      offenders.push(`${file}:${src.slice(0, m.index).split('\n').length}`);
    }
  }
  assert.ok(checked >= 9, `the scan found the narrow-profile user queries (${checked})`);
  assert.deepEqual(offenders, [], 'each must leave the current user out: server/lib/notCurrentUser.js');
});

test('userDesktopDragHandles publishes a top-level field, never profile', () => {
  const src = read('server/publications/userDesktopDragHandles.js');
  assert.match(src, /return \{ desktopDragHandlesPreference: typeof value === 'boolean' \? value : null \};/);
  assert.match(src, /this\.added\('users', id, preference\(fields\)\)/);
  assert.match(src, /this\.changed\('users', id, preference\(fields\)\)/);
  assert.doesNotMatch(src.replace(/\/\/.*$/gm, ''), /return Meteor\.users\.find/, 'negative: no plain cursor of profile fields');
  const utils = read('client/lib/utils.js');
  const fn = utils.slice(utils.indexOf('dragHandlesPreference() {'), utils.indexOf('return readDragHandlesPreference(stored);'));
  assert.match(fn, /currentUserWith\(\['profile\.showDesktopDragHandles', 'desktopDragHandlesPreference'\]\)/);
  assert.match(fn, /fromProfile !== undefined \? fromProfile : currentUser\.desktopDragHandlesPreference/);
});

test('the current user\'s own row keeps its columns: user-admin publishes them', () => {
  const src = read('server/publications/users.js');
  const admin = src.slice(src.indexOf("Meteor.publish('user-admin'"), src.indexOf("Meteor.publish('user-authenticationMethod'"));
  for (const field of ['isAdmin', 'teams', 'orgs', 'authenticationMethod', 'createdAt', 'loginDisabled', 'lastConnectionDate', 'importUsernames']) {
    assert.match(admin, new RegExp(`${field}: 1`), field);
  }
  assert.match(admin, /Meteor\.users\.find\(this\.userId,/, 'own document only');
});
