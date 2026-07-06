'use strict';

// Plain-Node unit test (no Meteor) for the IFTTT-Rules board selector logic.
// Run: node tests/rulesBoardSelector.test.cjs
//
// Regression guard for #5698 ("Impossible to select other board in rules"): the
// rules "move card to the board" / "link card to the board" dropdown filtered
// the client cache with `'members.userId': me`, so boards reached through an
// Organization / Team / email-domain share (where the user is not an individual
// member) never appeared — the reporter's dropdown was empty, current board
// included, while direct-member colleagues saw boards. canSelectBoardInRules()
// must include org/team/domain/public boards, while still excluding archived,
// helper, template-container and templates boards, and boards with no access.

const assert = require('assert');
const {
  canSelectBoardInRules,
  boardVisibleToUserContext,
} = require('../models/lib/rulesBoardSelector');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// The user: member of org O1 and team T1, email domain example.com.
const CTX = {
  userId: 'u1',
  orgIds: ['O1'],
  teamIds: ['T1'],
  emailDomains: ['example.com'],
};

const board = props => ({ _id: 'b', type: 'board', title: 'Board', ...props });

// --- POSITIVE: every access path lets the board be selected -----------------
test('direct active member board is selectable', () => {
  const b = board({ members: [{ userId: 'u1', isActive: true }] });
  assert.strictEqual(canSelectBoardInRules(b, CTX), true);
});

test('public board is selectable even without membership', () => {
  const b = board({ permission: 'public', members: [] });
  assert.strictEqual(canSelectBoardInRules(b, CTX), true);
});

test('#5698: org-shared board (not a direct member) is selectable', () => {
  const b = board({
    members: [{ userId: 'someone-else', isActive: true }],
    orgs: [{ orgId: 'O1', isActive: true }],
  });
  assert.strictEqual(canSelectBoardInRules(b, CTX), true);
});

test('#5698: team-shared board (not a direct member) is selectable', () => {
  const b = board({ members: [], teams: [{ teamId: 'T1', isActive: true }] });
  assert.strictEqual(canSelectBoardInRules(b, CTX), true);
});

test('#5698: domain-shared board (not a direct member) is selectable', () => {
  const b = board({
    members: [],
    domains: [{ domain: 'example.com', isActive: true }],
  });
  assert.strictEqual(canSelectBoardInRules(b, CTX), true);
});

// --- NEGATIVE: no access / excluded categories are NOT selectable -----------
test('board the user cannot access at all is NOT selectable', () => {
  const b = board({
    permission: 'private',
    members: [{ userId: 'other', isActive: true }],
    orgs: [{ orgId: 'O2', isActive: true }],
    teams: [{ teamId: 'T2', isActive: true }],
    domains: [{ domain: 'other.com', isActive: true }],
  });
  assert.strictEqual(canSelectBoardInRules(b, CTX), false);
});

test('inactive member entry does NOT grant selection', () => {
  const b = board({ members: [{ userId: 'u1', isActive: false }] });
  assert.strictEqual(canSelectBoardInRules(b, CTX), false);
});

test('inactive org / team / domain shares do NOT grant selection', () => {
  const b = board({
    members: [],
    orgs: [{ orgId: 'O1', isActive: false }],
    teams: [{ teamId: 'T1', isActive: false }],
    domains: [{ domain: 'example.com', isActive: false }],
  });
  assert.strictEqual(canSelectBoardInRules(b, CTX), false);
});

test('archived board is excluded even if visible', () => {
  const b = board({ archived: true, members: [{ userId: 'u1', isActive: true }] });
  assert.strictEqual(canSelectBoardInRules(b, CTX), false);
});

test('the user templates board is excluded by id', () => {
  const b = board({ _id: 'tpl', members: [{ userId: 'u1', isActive: true }] });
  assert.strictEqual(canSelectBoardInRules(b, CTX, 'tpl'), false);
});

test('template-container type is excluded', () => {
  const b = board({
    type: 'template-container',
    members: [{ userId: 'u1', isActive: true }],
  });
  assert.strictEqual(canSelectBoardInRules(b, CTX), false);
});

test('internal caret-wrapped helper board is excluded', () => {
  const b = board({
    title: '^Subtasks^',
    members: [{ userId: 'u1', isActive: true }],
  });
  assert.strictEqual(canSelectBoardInRules(b, CTX), false);
});

test('null board / null ctx are handled without throwing', () => {
  assert.strictEqual(canSelectBoardInRules(null, CTX), false);
  assert.strictEqual(canSelectBoardInRules(board({}), null), false);
  assert.strictEqual(boardVisibleToUserContext(null, CTX), false);
});

test('missing org/team/domain arrays on ctx do not throw', () => {
  const b = board({ members: [], orgs: [{ orgId: 'O1', isActive: true }] });
  assert.strictEqual(boardVisibleToUserContext(b, { userId: 'u1' }), false);
});

console.log(`\n${passed} tests passed`);
