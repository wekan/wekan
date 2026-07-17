'use strict';

// Tests for #2220: mark a board that opens automatically after login.
// Behavioural coverage of the toggle/decision logic (incl. negative cases) plus
// source guards that the feature is wired end-to-end. The model/router code is
// Meteor-coupled, so the behavioural part reimplements the tiny decision the real
// `toggleDefaultBoard`/`isDefaultBoard` make.
//
// Run: node tests/defaultBoard.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// Mirrors models/users.js: getDefaultBoardId / isDefaultBoard / toggleDefaultBoard.
function makeUser(defaultBoardId) {
  return {
    profile: defaultBoardId ? { defaultBoardId } : {},
    getDefaultBoardId() {
      return (this.profile && this.profile.defaultBoardId) || null;
    },
    isDefaultBoard(boardId) {
      return this.getDefaultBoardId() === boardId;
    },
    // the Mongo update toggleDefaultBoard would apply
    toggleUpdate(boardId) {
      return this.isDefaultBoard(boardId)
        ? { $unset: { 'profile.defaultBoardId': '' } }
        : { $set: { 'profile.defaultBoardId': boardId } };
    },
  };
}

test('no default set: nothing is the default, toggling SETS it', () => {
  const u = makeUser(null);
  assert.strictEqual(u.getDefaultBoardId(), null);
  assert.strictEqual(u.isDefaultBoard('a'), false); // negative
  assert.deepStrictEqual(u.toggleUpdate('a'), { $set: { 'profile.defaultBoardId': 'a' } });
});

test('default set to A: A is the default, B is NOT', () => {
  const u = makeUser('a');
  assert.strictEqual(u.getDefaultBoardId(), 'a');
  assert.strictEqual(u.isDefaultBoard('a'), true);
  assert.strictEqual(u.isDefaultBoard('b'), false); // negative
});

test('toggling the CURRENT default clears it (unset)', () => {
  const u = makeUser('a');
  assert.deepStrictEqual(u.toggleUpdate('a'), { $unset: { 'profile.defaultBoardId': '' } });
});

test('toggling a DIFFERENT board switches the default to it', () => {
  const u = makeUser('a');
  assert.deepStrictEqual(u.toggleUpdate('b'), { $set: { 'profile.defaultBoardId': 'b' } });
});

// --- source guards: the feature is wired end-to-end ---
const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

test('user model: schema + helpers + toggle exist', () => {
  const m = read('models/users.js');
  assert.ok(/'profile\.defaultBoardId'/.test(m), 'schema field');
  assert.ok(/getDefaultBoardId\(\)/.test(m) && /isDefaultBoard\(boardId\)/.test(m), 'helpers');
  assert.ok(/toggleDefaultBoard\(boardId\)/.test(m), 'toggle method');
  assert.ok(/\$unset:\s*{\s*'profile\.defaultBoardId'/.test(m), 'toggle clears the current default');
});

test('server method toggleDefaultBoard exists and is auth-guarded', () => {
  const s = read('server/models/users.js');
  const i = s.indexOf('toggleDefaultBoard(boardId)');
  assert.ok(i !== -1, 'server method');
  const body = s.slice(i, i + 500);
  assert.ok(/not-logged-in/.test(body), 'requires login');
  assert.ok(/\$unset|\$set/.test(body), 'sets/unsets the field');
});

test('router redirects to the default board ONCE per session (login), not every visit', () => {
  const r = read('config/router.js');
  assert.ok(/maybeRedirectToDefaultBoard/.test(r), 'redirect helper');
  // NEGATIVE guard: it must be gated by a once-per-session flag, otherwise the
  // "All Boards" link could never be reached.
  assert.ok(/Session\.get\('defaultBoardRedirectDone'\)/.test(r), 'once-per-session guard');
  assert.ok(/getDefaultBoardId\(\)/.test(r) && /FlowRouter\.go\('board'/.test(r), 'redirects to the board');
});

test('the Home-board tile toggle is DISABLED (icon hidden, no set handler)', () => {
  // Setting a Home board from the All Boards tiles is intentionally disabled: the
  // fa-home toggle element and its click handler must not be rendered/wired.
  const jade = read('client/components/boards/boardsList.jade');
  assert.ok(!/a\.js-set-default-board\(/.test(jade), 'no rendered home-board toggle element');
  const js = read('client/components/boards/boardsList.js');
  assert.ok(!/'click \.js-set-default-board'/.test(js), 'no set-default-board click handler');
  assert.ok(!/Meteor\.call\('toggleDefaultBoard'/.test(js), 'the tile no longer calls toggleDefaultBoard');
});

console.log(`\nAll ${passed} default-board (#2220) tests passed`);
