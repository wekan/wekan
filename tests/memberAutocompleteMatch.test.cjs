'use strict';
(async () => {

// Unit + negative tests for the "@" member autocomplete matcher (#5116
// follow-up): typing "@ann" must suggest the member "Anna" and username
// "anna.smith", case-insensitively, as a substring of username OR full name.
// Run: node tests/memberAutocompleteMatch.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  memberMatchesTerm,
  filterMembersByTerm,
} = await import('../models/lib/memberAutocomplete.js');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const U = (username, fullname) => ({
  _id: username + '-id',
  username,
  profile: fullname === undefined ? undefined : { fullname },
});
const BOARD = [
  U('anna.smith', 'Anna Smith'),
  U('bob', 'Bob Jones'),
  U('carol', undefined), // no profile
  U('dave', 'David Brown'),
];

// ── the reported regression: case-insensitive, not prefix-only, full name too ─
check('lowercase "ann" matches username "anna.smith" (was prefix+case-sensitive)', () => {
  assert.strictEqual(memberMatchesTerm(U('anna.smith', 'Anna Smith'), 'ann'), true);
});
check('"Anna" (capital) matches lowercase username via full name', () => {
  assert.strictEqual(memberMatchesTerm(U('anna.smith', 'Anna Smith'), 'Anna'), true);
});
check('a substring NOT at the start still matches (was indexOf === 0)', () => {
  assert.strictEqual(memberMatchesTerm(U('anna.smith', 'Anna Smith'), 'smith'), true);
});
check('matches on full name when the username does not contain the term', () => {
  assert.strictEqual(memberMatchesTerm(U('dave', 'David Brown'), 'brown'), true);
  assert.strictEqual(memberMatchesTerm(U('dave', 'David Brown'), 'david'), true);
});

// ── empty term shows everyone ───────────────────────────────────────────────
check('empty term matches every member', () => {
  assert.strictEqual(memberMatchesTerm(U('bob', 'Bob'), ''), true);
  assert.strictEqual(filterMembersByTerm(BOARD, '').length, BOARD.length);
});

// ── negatives / null-safety (the old code threw on a null user) ─────────────
check('a non-substring term matches nothing (negative)', () => {
  assert.strictEqual(memberMatchesTerm(U('anna.smith', 'Anna Smith'), 'zzz'), false);
});
check('a null / undefined user is safe and does not match (was a crash)', () => {
  assert.strictEqual(memberMatchesTerm(null, 'a'), false);
  assert.strictEqual(memberMatchesTerm(undefined, 'a'), false);
});
check('a user with no profile / no fullname does not throw', () => {
  assert.strictEqual(memberMatchesTerm(U('carol', undefined), 'car'), true);
  assert.strictEqual(memberMatchesTerm({ username: 'x' }, 'x'), true);
  assert.strictEqual(memberMatchesTerm({}, 'x'), false);
});

// ── filterMembersByTerm: order preserved, input untouched, null-tolerant ─────
check('filterMembersByTerm keeps order, ignores nulls, does not mutate', () => {
  const withHole = [BOARD[0], null, BOARD[3]];
  const out = filterMembersByTerm(withHole, 'a'); // anna.smith, dave(David)
  assert.deepStrictEqual(out.map(u => u.username), ['anna.smith', 'dave']);
  assert.deepStrictEqual(filterMembersByTerm(null, 'x'), []);
});

// ── source guards: both '@' call sites route through the shared matcher ──────
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
check('listBody.js add-card @mention uses memberMatchesTerm (no case-sensitive prefix)', () => {
  const src = strip(read('client/components/lists/listBody.js'));
  assert.ok(/memberMatchesTerm\(user, term\)/.test(src), 'must call memberMatchesTerm(user, term)');
  assert.ok(!/user\.username\.indexOf\(term\) === 0/.test(src),
    'the case-sensitive prefix-only match must be gone');
});
check('editor.js comment/description @mention uses the same shared matcher', () => {
  const src = strip(read('client/components/main/editor.js'));
  assert.ok(/memberMatchesTerm\(user, term\)/.test(src), 'must call memberMatchesTerm(user, term)');
  assert.ok(!/user\.username\.toLowerCase\(\)/.test(src),
    'the inline duplicate matcher must be gone (shared helper now)');
});

function read(rel) {
  return fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
}

console.log(`\nmemberAutocompleteMatch: ${passed} checks passed`);

})().catch(e => { console.error(e); process.exit(1); });