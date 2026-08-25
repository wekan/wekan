'use strict';

// "Search All Boards" searches all of YOUR boards, not every board on the server.
// Run: node tests/searchBoardScope.test.cjs
//
// The board scope came from `Boards.userBoards`, whose `$or` lists the ways a user
// reaches a board: member, organization, team, e-mail domain — and
// `{ permission: 'public' }`. That last one is the odd one out. It is not a
// relationship to the user at all, it is "anybody may open this", and it belongs
// in the boards LIST, where a public board is meant to be discoverable.
//
// In a search it meant every public board on the instance was searched: on a
// public server a common word answered with strangers' cards, and following a hit
// dropped the user into a board they have no part in. Someone who wants to look
// inside a public board can still open it and search there.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const boards = read('models/boards.js');
const cards = read('server/publications/cards.js');

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

console.log('searchBoardScope:');

test('the public clause is optional, and only that clause', () => {
  const at = boards.indexOf('Boards.userBoards = (');
  const body = boards.slice(at, boards.indexOf('Boards.userBoardIds', at));
  assert.ok(/includePublic = options\.includePublic !== false/.test(body),
    'it must default to INCLUDING public boards, so every existing caller is unchanged');

  // The `$or` used to be written out here as an array literal, and this test
  // matched that literal. GHSA-gwc4-fw7p-gw58 moved it into ONE builder shared
  // with the `board` publication - the publication had its own copy that
  // ignored isActive, so a revoked org/team/domain share still published the
  // whole private board. The BEHAVIOUR this test protects is unchanged, so it
  // now asks the builder instead of the literal.
  assert.ok(/selector\.\$or = boardVisibilitySelectors\(\{/.test(body),
    'the scope comes from the shared builder');
  assert.ok(/includePublic,/.test(body), 'and the option is passed to it');

  const { boardVisibilitySelectors } = require('../models/lib/boardVisibilitySelectors');
  const args = {
    userId: 'u', orgIds: ['o'], teamIds: ['t'], emailDomains: ['example.com'],
  };
  const withPublic = boardVisibilitySelectors(args);
  const withoutPublic = boardVisibilitySelectors({ ...args, includePublic: false });

  assert.ok(withPublic.some(c => c.permission === 'public'),
    'included by default');
  assert.ok(!withoutPublic.some(c => c.permission === 'public'),
    'the public clause is the one that drops out');

  // The four ways a user actually reaches a board must never be optional.
  for (const clause of ['members', 'orgs', 'teams', 'domains']) {
    assert.ok(withoutPublic.some(c => Object.prototype.hasOwnProperty.call(c, clause)),
      `${clause} is a real relationship and must always be in the scope`);
  }
  assert.strictEqual(withPublic.length - withoutPublic.length, 1,
    'dropping the public clause drops nothing else');
});

test('the option reaches userBoardIds, which is what the search calls', () => {
  const at = boards.indexOf('Boards.userBoardIds = async (');
  const body = boards.slice(at, boards.indexOf('};', at));
  assert.ok(/options = \{\}/.test(body), 'it takes the options');
  assert.ok(/\}, options\)/.test(body), 'and passes them through');
});

test('every board lookup in the search excludes public boards', () => {
  assert.ok(/const SEARCH_BOARD_SCOPE = \{ includePublic: false \};/.test(cards),
    'the search names its scope once');

  // One scope, used by every lookup - if one is missed, that branch of the search
  // still reaches the whole instance and nothing looks wrong.
  const code = cards.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const lookups = [...code.matchAll(/Boards\.user(?:BoardIds|Search)\([^)]*\)[^;]*/g)]
    .map(m => m[0]);
  assert.ok(lookups.length >= 5, `expected the search's board lookups, found ${lookups.length}`);
  for (const lookup of lookups) {
    assert.ok(lookup.includes('SEARCH_BOARD_SCOPE'),
      `this lookup still reaches every public board: ${lookup.slice(0, 90)}`);
  }
});

test('the board: filter scopes the same way as the search around it', () => {
  // It resolves a board NAME to ids. Left unscoped it would happily name a public
  // board the search itself can return nothing from - a filter that silently
  // empties the results.
  const at = cards.indexOf('OPERATOR_BOARD)) {');
  const body = cards.slice(at, at + 600);
  assert.ok(/Boards\.userSearch\([\s\S]{0,160}SEARCH_BOARD_SCOPE\)/.test(body),
    'the board: operator must use the search scope');
});

test('userSearch keeps its old behaviour for anyone who does not ask', () => {
  const at = boards.indexOf('Boards.userSearch = (');
  const body = boards.slice(at, boards.indexOf('};', at));
  assert.ok(/options\.includePublic === false \? \[\] : \[\{ permission: 'public' \}\]/.test(body),
    'public boards are still included unless excluded explicitly');
  // An anonymous caller with public boards excluded can reach NOTHING. An empty
  // `$or` means "match nothing" in Mongo but is an error in some backends, so it
  // must be answered directly rather than sent to the database.
  assert.ok(/selector\.\$or\.length === 0/.test(body),
    'the empty-scope case must be answered without querying');
});

test('generic board helpers retain public access for callers that need it', () => {
  // Direct/public discovery still defaults to including public boards. The
  // relationship-only All Boards publication opts out at its own call site.
  for (const helper of ['Boards.userBoards = (', 'Boards.userBoardIds = async (']) {
    assert.ok(boards.includes(helper), `${helper} must exist`);
  }
  // On the CODE: the comments there explain the option by name, and a guard that
  // reads its own explanation fails on it.
  const boardsCode = boards.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.ok(!/includePublic: false/.test(boardsCode),
    'models/boards.js must not switch public boards off for everybody');

  for (const rel of ['models/lists.js', 'models/cardComments.js', 'server/models/lists.js']) {
    const src = read(rel);
    for (const m of src.matchAll(/Boards\.userBoardIds\([^)]*\)/g)) {
      assert.ok(!/includePublic/.test(m[0]),
        `${rel}: ${m[0]} - these are not the search and are deliberately unchanged`);
    }
  }
});

console.log(`\nsearchBoardScope: ${passed} tests passed`);
