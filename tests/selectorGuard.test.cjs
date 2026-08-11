'use strict';

// GHSA-phm4-4v26-j2vq (WhereBleed) — NoSQL injection (CWE-943) through the
// client-supplied query selector of eight Admin Panel handlers.
// Run: node tests/selectorGuard.test.cjs
//
// The Admin Panel's people, org, team and translation publications and their
// companion count/page methods took a selector from the client and validated only
// its TYPE:
//
//     check(query, Match.OneOf(Object, null));
//
// which is not validation at all, because a MongoDB selector is executable data.
// `$where` makes the database run the caller's JavaScript once per document
// scanned, so `{ $where: 'while(true){}' }` pins a database worker for as long as
// the caller likes and is repeatable - denial of service for every tenant on the
// instance, from one narrowly-scoped account. The reporter demonstrated it on
// v10.81 against mongo:7: `{ $where: 'sleep(2000) || true' }` made the `people`
// subscription take 2.03s and return the document, `{ $where: 'false' }` returned
// nothing in 0.00s - the caller controlling, in JavaScript, which documents come
// back.
//
// The defence was NOT missing from the codebase - only from these handlers.
// classifySelector and hasWhere were written for exactly this and were already
// wired into the card-window publication. So the fix is not new logic: it is the
// same helper, moved to /server/lib/selectorGuard so there is ONE copy, and
// called by all nine sites.
//
// This suite pins three things: what the guard classifies as injection, that
// every handler routes its selector through it, and that only ONE copy of the
// check exists - the bug was eight places not doing what one place did.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const { classifySelector } = require(path.join(repoRoot, 'models/lib/injectionDetect.js'));
const { hasWhere } = require(path.join(repoRoot, 'models/lib/mongoSelectorSafety.js'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// What the guard does, in the guard's own terms: it refuses when classifySelector
// says injection OR hasWhere says $where. Both halves matter - the second is what
// catches a bare `$where`, which is the payload in the report.
const wouldRefuse = selector =>
  classifySelector(selector).injection === true || hasWhere(selector) === true;

// ── the payloads from the advisory ──────────────────────────────────────────

test('the reported payloads are refused', () => {
  for (const payload of [
    { $where: 'while(true){}' },              // the denial of service
    { $where: 'sleep(2000) || true' },        // the timing proof
    { $where: 'false' },                      // the inclusion oracle's other half
    { $where: 'this.isAdmin === true' },
  ]) {
    assert.strictEqual(wouldRefuse(payload), true,
      `${JSON.stringify(payload)} must be refused - it is code for the database to run`);
  }
});

test('$where nested inside an ordinary-looking query is refused too', () => {
  // The people/org handlers merge the caller's selector into `{ $and: [query,
  // restriction] }` rather than stripping operators out of it, so a payload one
  // level down is exactly as dangerous as one at the top.
  assert.strictEqual(wouldRefuse({ $and: [{ username: 'x' }, { $where: 'true' }] }), true);
  assert.strictEqual(wouldRefuse({ $or: [{ $where: 'true' }] }), true);
  assert.strictEqual(wouldRefuse({ profile: { $where: 'true' } }), true);
});

test('the other execution operators are refused', () => {
  // The advisory notes MongoDB 7 happens to reject $where inside the count
  // methods' aggregation pipeline, but $function/$accumulator are legitimate
  // aggregation operators there and were never separately tested. The guard must
  // not depend on an engine-level accident.
  assert.strictEqual(wouldRefuse({ $expr: { $function: { body: 'function(){}', args: [], lang: 'js' } } }), true);
  assert.strictEqual(wouldRefuse({ $expr: { $accumulator: { init: 'function(){}', lang: 'js' } } }), true);
});

// ── and what must keep working ──────────────────────────────────────────────

test('everything the Admin Panel really sends is untouched', () => {
  // If any of these were refused, an admin would see an empty People, Org, Team
  // or Translation table - the fix would be worse than the bug.
  for (const ordinary of [
    {},
    null,
    undefined,
    { username: 'joe' },
    { username: { $regex: 'jo', $options: 'i' } },
    { 'profile.fullname': { $regex: 'Smith' } },
    { emails: { $elemMatch: { address: 'a@b.c' } } },
    { $or: [{ username: { $regex: 'x' } }, { 'emails.address': { $regex: 'x' } }] },
    { orgs: { $in: ['id1', 'id2'] } },
    { teamIsActive: true },
    { language: 'fi', text: { $regex: 'board' } },
    { createdAt: { $gte: new Date('2026-01-01') } },
    { $and: [{ a: 1 }, { b: { $ne: 2 } }] },
  ]) {
    assert.strictEqual(wouldRefuse(ordinary), false,
      `${JSON.stringify(ordinary)} is an ordinary Admin Panel query and must go through`);
  }
});

// ── the guard module ────────────────────────────────────────────────────────

const guard = read('server/lib/selectorGuard.js');

test('the refusal is a selector that matches nothing, not an exception', () => {
  assert.ok(/_id: Object\.freeze\(\{ \$in: Object\.freeze\(\[\]\) \}\)/.test(guard),
    'MATCH_NOTHING must be { _id: { $in: [] } } - the same refusal cardsWindow.js ' +
    'already uses in production, so a refused request returns nothing instead of ' +
    'throwing at an admin mid-page');
  assert.ok(/Object\.freeze/.test(guard),
    'and frozen, so a caller cannot mutate the shared object into one that matches');
});

test('a refusal is recorded, not silently swallowed', () => {
  assert.ok(/tripCanary\('injection\.nosql-selector'/.test(guard),
    'an execution operator in a selector is an attempt, and the canary is what ' +
    'names who sent it and from where');
});

// ── every handler the advisory names ────────────────────────────────────────

const HANDLERS = [
  ['server/publications/people.js', "safeSelector(query, 'people')", 'peopleScopeSelector(user, safeQuery)'],
  ['server/publications/org.js', "safeSelector(query, 'org')", 'orgScopeSelector(user, safeQuery)'],
  ['server/publications/team.js', "safeSelector(query, 'team')", 'getTeams(safeQuery'],
  ['server/publications/translation.js', "safeSelector(query, 'translation')", 'getTranslations(safeQuery'],
  ['server/models/users.js', "safeSelector(query || {}, 'getUsersCollectionCount')", null],
  ['server/models/users.js', "safeSelector(query || {}, 'getPeoplePageIds')", null],
  ['server/models/org.js', "safeSelector(query || {}, 'getOrgsCollectionCount')", null],
  ['server/models/team.js', "safeSelector(query || {}, 'getTeamsCollectionCount')", null],
  ['server/models/translation.js', "safeSelector(query || {}, 'getTranslationsCollectionCount')", null],
];

test('all nine call sites route their selector through the guard', () => {
  for (const [file, call, usage] of HANDLERS) {
    const src = read(file);
    assert.ok(src.includes(call),
      `${file}: the advisory names this handler; it must call ${call}`);
    assert.ok(/import \{ safeSelector \} from '\/server\/lib\/selectorGuard'/.test(src),
      `${file}: must import the shared guard`);
    if (usage) {
      assert.ok(src.includes(usage),
        `${file}: the GUARDED selector has to be the one that reaches the query - ` +
        `computing safeQuery and then passing the raw one would fix nothing`);
    }
  }
});

test('no handler still passes the raw selector to the database', () => {
  // The specific mistake to guard against: calling safeSelector and then using
  // `query` anyway. Checked on the exact expressions the advisory quotes.
  const leftovers = [
    ['server/publications/people.js', 'peopleScopeSelector(user, query)'],
    ['server/publications/org.js', 'orgScopeSelector(user, query)'],
    ['server/publications/team.js', 'getTeams(query,'],
    ['server/publications/translation.js', 'getTranslations(query,'],
    ['server/models/team.js', 'getTeams(query || {}'],
    ['server/models/translation.js', 'getTranslations(query || {}'],
    ['server/models/org.js', 'orgScopeSelector(user, query || {})'],
    ['server/models/users.js', 'peopleScopeSelector(currentUser, query || {})'],
  ];
  for (const [file, raw] of leftovers) {
    assert.ok(!read(file).includes(raw),
      `${file}: still passes the unguarded selector (${raw})`);
  }
});

test('there is exactly ONE copy of the check', () => {
  // The bug was eight places not doing what one place did. A second copy is that
  // set up to happen again, so cardsWindow.js imports the shared one rather than
  // keeping its own.
  const cards = read('server/publications/cardsWindow.js');
  assert.ok(/import \{ selectorIsInjection \} from '\/server\/lib\/selectorGuard'/.test(cards),
    'cardsWindow.js must import the guard it used to define');
  assert.ok(!/function selectorIsInjection/.test(cards),
    'and must not define its own any more');
  assert.ok(/function selectorIsInjection/.test(guard),
    'the one definition lives in the shared module');
  assert.ok(cards.includes("selectorIsInjection(cardSelector, 'boardCardsWindow')") &&
            cards.includes("selectorIsInjection(cardSelector, 'boardCardsCount')"),
    'and its two existing refusal sites are unchanged');
});

console.log(`\n${passed} passed`);
