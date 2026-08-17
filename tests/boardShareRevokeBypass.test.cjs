'use strict';

// RevokeBleed — GHSA-gwc4-fw7p-gw58, "Board publication ignores isActive on
// org/team/domain shares, so revoked access still exposes private boards"
// (Moderate, CWE-639 / CWE-863), reported by Alpastx.
// https://wekan.fi/hall-of-fame/revokebleed/
//
// `isActive: false` is how a board admin REVOKES an org, team or domain share.
// The All Boards list honoured it (`$elemMatch` with `isActive: true`), so a
// revoked user watched the board disappear — but the `board` publication, the
// one that sends the board document and its lists, cards and attachments,
// matched shares with a dotted `'orgs.orgId': { $in: [...] }` that says nothing
// about isActive. Anyone who still knew the boardId could subscribe and receive
// the whole private board. A revoke the primary data publication does not
// honour is not a revoke.
//
// The selectors are built in one place now, and this pins both what they contain
// and that both call sites use that builder.
//
// Run: node tests/boardShareRevokeBypass.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const { boardVisibilitySelectors } = require('../models/lib/boardVisibilitySelectors');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const USER = 'user-v';
const ARGS = {
  userId: USER,
  orgIds: ['org-o'],
  teamIds: ['team-t'],
  emailDomains: ['example.com'],
};

const findClause = (selectors, key) => selectors.find(s => Object.prototype.hasOwnProperty.call(s, key));

test('every share kind is matched with $elemMatch and isActive: true', () => {
  const selectors = boardVisibilitySelectors(ARGS);

  assert.deepStrictEqual(findClause(selectors, 'orgs'), {
    orgs: { $elemMatch: { orgId: { $in: ['org-o'] }, isActive: true } },
  });
  assert.deepStrictEqual(findClause(selectors, 'teams'), {
    teams: { $elemMatch: { teamId: { $in: ['team-t'] }, isActive: true } },
  });
  assert.deepStrictEqual(findClause(selectors, 'domains'), {
    domains: { $elemMatch: { domain: { $in: ['example.com'] }, isActive: true } },
  });
  assert.deepStrictEqual(findClause(selectors, 'members'), {
    members: { $elemMatch: { userId: USER, isActive: true } },
  });
});

test('negative: the dotted form that ignored isActive is not produced', () => {
  const json = JSON.stringify(boardVisibilitySelectors(ARGS));
  // These are the exact three selectors the advisory exploited.
  assert.ok(!json.includes('orgs.orgId'), 'no dotted orgs.orgId clause');
  assert.ok(!json.includes('teams.teamId'), 'no dotted teams.teamId clause');
  assert.ok(!json.includes('domains.domain'), 'no dotted domains.domain clause');
});

test('negative: no clause anywhere matches a share without requiring isActive', () => {
  const selectors = boardVisibilitySelectors(ARGS);
  selectors
    .filter(s => !Object.prototype.hasOwnProperty.call(s, 'permission'))
    .forEach(clause => {
      const [field] = Object.keys(clause);
      const elemMatch = clause[field].$elemMatch;
      assert.ok(elemMatch, `${field} must use $elemMatch, not a dotted path`);
      assert.strictEqual(elemMatch.isActive, true, `${field} must require isActive`);
    });
});

test('a public board is reachable by anyone, and is the only anonymous clause', () => {
  const anon = boardVisibilitySelectors({ userId: null });
  assert.deepStrictEqual(anon, [{ permission: 'public' }]);
});

test('includePublic: false drops it, for searches over all boards', () => {
  const selectors = boardVisibilitySelectors({ ...ARGS, includePublic: false });
  assert.strictEqual(findClause(selectors, 'permission'), undefined);
  assert.strictEqual(selectors.length, 4);
});

test('negative: an anonymous caller with no public clause reaches nothing', () => {
  assert.deepStrictEqual(
    boardVisibilitySelectors({ userId: null, includePublic: false }),
    [],
  );
  assert.deepStrictEqual(boardVisibilitySelectors(), [{ permission: 'public' }]);
});

test('negative: junk in the id lists is dropped, not passed to Mongo', () => {
  const selectors = boardVisibilitySelectors({
    userId: USER,
    orgIds: ['ok', '', null, undefined, 42, {}],
    teamIds: 'not-an-array',
    emailDomains: null,
  });
  assert.deepStrictEqual(findClause(selectors, 'orgs').orgs.$elemMatch.orgId, { $in: ['ok'] });
  assert.strictEqual(findClause(selectors, 'teams'), undefined);
  assert.strictEqual(findClause(selectors, 'domains'), undefined);
});

test('empty share lists produce only the active direct-member clause', () => {
  assert.deepStrictEqual(boardVisibilitySelectors({
    userId: USER,
    orgIds: [],
    teamIds: [],
    emailDomains: [],
    includePublic: false,
  }), [{ members: { $elemMatch: { userId: USER, isActive: true } } }]);
});

// -------------------------------------------------------------- the sources

test('the board publication builds its $or with the shared builder', () => {
  const pub = read('server/publications/boards.js');
  assert.ok(/boardVisibilitySelectors\(\{/.test(pub), 'publication uses the builder');
  assert.ok(
    !/\$or\.push\(\{ 'orgs\.orgId'/.test(pub),
    'the dotted org clause the advisory exploited must be gone',
  );
  assert.ok(!/\$or\.push\(\{ 'teams\.teamId'/.test(pub));
  assert.ok(!/\$or\.push\(\{ 'domains\.domain'/.test(pub));
});

test('Boards.userBoards uses the same builder, so the two cannot drift again', () => {
  const boards = read('models/boards.js');
  assert.ok(/selector\.\$or = boardVisibilitySelectors\(\{/.test(boards));
  assert.ok(
    !/\{ orgs: \{ \$elemMatch: \{ orgId: \{ \$in: user\.orgIds\(\) \}/.test(boards),
    'the hand-written copy is gone',
  );
});

console.log(`\n${passed} tests passed`);
