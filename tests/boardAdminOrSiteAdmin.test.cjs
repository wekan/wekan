'use strict';

// Issue #3249: a board whose own admin/member left the organization ends up
// with nobody able to edit its settings or add members to it - not even a
// global Admin Panel admin, because Boards.allow's update/remove rule
// (server/permissions/boards.js) only checked board.hasAdmin(userId). This
// pins the new isBoardAdminOrSiteAdmin/allowIsBoardAdminOrSiteAdmin helpers
// (server/lib/utils.js) that also accept the global `isAdmin` flag, and that
// the Boards.allow rule is actually wired to the new helper rather than the
// old board-only one.
//
// Issue #2413 ("Site admins to see all boards and change any board
// permissions") describes the same gap from the other direction: a global
// site admin should be able to view/change permissions on ANY board, not
// only ones they already belong to. That is exactly what
// isBoardAdminOrSiteAdmin/allowIsBoardAdminOrSiteAdmin grant, so the same
// suite - in particular the "global site admin who is NOT a board
// member/admin is allowed" and Boards.allow wiring cases below - covers
// #2413 as well as #3249.
// Run: node tests/boardAdminOrSiteAdmin.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const utilsSource = read('server/lib/utils.js');
const permissionsSource = read('server/permissions/boards.js');

// Extract the two pure/no-Meteor-dependency functions by name and eval them
// in isolation, the same technique tests/boardVisibility.test.cjs uses for a
// sibling ESM module.
function extractFunction(source, name) {
  const start = source.indexOf(`export function ${name}(`);
  if (start === -1) throw new Error(`function ${name} not found`);
  // Find the matching closing brace by brace-counting from the first '{'.
  const braceStart = source.indexOf('{', start);
  let depth = 0;
  let end = -1;
  for (let i = braceStart; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end === -1) throw new Error(`could not find end of function ${name}`);
  return source.slice(start, end).replace('export function', 'function');
}

const sandbox = {};
new Function(
  'exports',
  `${extractFunction(utilsSource, 'allowIsBoardAdmin')}
${extractFunction(utilsSource, 'isBoardAdminOrSiteAdmin')}
exports.allowIsBoardAdmin = allowIsBoardAdmin;
exports.isBoardAdminOrSiteAdmin = isBoardAdminOrSiteAdmin;`,
)(sandbox);

const { isBoardAdminOrSiteAdmin } = sandbox;

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

function board(adminIds) {
  return { hasAdmin: id => adminIds.includes(id) };
}

console.log('boardAdminOrSiteAdmin:');

test('the board\'s own admin is allowed, site-admin flag false', () => {
  assert.strictEqual(
    isBoardAdminOrSiteAdmin('ownerId', board(['ownerId']), false),
    true,
  );
});

test('a global site admin who is NOT a board member/admin is allowed (#3249 / #2413 core case)', () => {
  assert.strictEqual(
    isBoardAdminOrSiteAdmin('siteAdminId', board(['someoneElse']), true),
    true,
  );
});

test('a non-admin, non-member, non-site-admin is denied', () => {
  assert.strictEqual(
    isBoardAdminOrSiteAdmin('outsiderId', board(['someoneElse']), false),
    false,
  );
});

test('an anonymous caller (no userId) is denied even if isSiteAdmin were somehow true', () => {
  assert.strictEqual(isBoardAdminOrSiteAdmin('', board([]), true), false);
  assert.strictEqual(isBoardAdminOrSiteAdmin(null, board([]), true), false);
});

test('a board member who is not board-admin and not site-admin is denied (unchanged behavior)', () => {
  const memberOnlyBoard = { hasAdmin: id => id === 'realAdmin' };
  assert.strictEqual(
    isBoardAdminOrSiteAdmin('plainMemberId', memberOnlyBoard, false),
    false,
  );
});

test('server/lib/utils.js exports an async allowIsBoardAdminOrSiteAdmin wrapper using Meteor.users', () => {
  assert.ok(
    /export async function allowIsBoardAdminOrSiteAdmin\(userId, board\)/.test(utilsSource),
    'the async Meteor-aware wrapper must exist',
  );
  assert.ok(
    /Meteor\.users\.findOneAsync\(userId,\s*\{\s*fields:\s*\{\s*isAdmin:\s*1\s*\}/.test(utilsSource),
    'it must look up the global isAdmin flag by userId',
  );
});

test('Boards.allow update/remove is wired to the new site-admin-aware helper, not the old board-only one', () => {
  assert.ok(
    /update:\s*allowIsBoardAdminOrSiteAdmin/.test(permissionsSource),
    'update rule must use allowIsBoardAdminOrSiteAdmin',
  );
  assert.ok(
    /remove:\s*allowIsBoardAdminOrSiteAdmin/.test(permissionsSource),
    'remove rule must use allowIsBoardAdminOrSiteAdmin',
  );
  assert.ok(
    !/update:\s*allowIsBoardAdmin,/.test(permissionsSource) &&
      !/remove:\s*allowIsBoardAdmin,/.test(permissionsSource),
    'the plain board-only allowIsBoardAdmin must no longer gate the whole-board update/remove rule',
  );
});

test('negative: allowIsBoardAdminOrSiteAdmin is NOT wired into the narrower rules/actions/triggers/comments allow rules', () => {
  // Those collections intentionally keep the plain allowIsBoardAdmin (per-board
  // admin only) - the site-admin bypass is scoped to the whole-board
  // update/remove rule, not broadened to every board-scoped collection.
  const narrower = [
    'server/permissions/rules.js',
    'server/permissions/actions.js',
    'server/permissions/triggers.js',
    'server/permissions/cardComments.js',
  ];
  narrower.forEach(rel => {
    const src = read(rel);
    assert.ok(
      !/allowIsBoardAdminOrSiteAdmin/.test(src),
      `${rel} must not import the site-admin-aware helper (scope stays boards.js only)`,
    );
  });
});

console.log(`boardAdminOrSiteAdmin: ${passed} passed`);
if (process.exitCode) process.exit(process.exitCode);
