'use strict';

// Five REST API findings reported by ybsun0215 against v10.91, all of the same
// family: an endpoint authorises ONE id and then acts on, or answers with,
// something the caller was never authorised for.
// Run: node tests/restApiIdorBatch.test.cjs
//
//   GHSA-8cqr-x6m5-v4w6  PurgeBleed - the single-card DELETE authorised the URL's board and
//                        then fetched the card by id ALONE, so cardRemover
//                        destroyed the checklists, comments, activities and
//                        subcards of any card in the instance - irreversibly,
//                        on boards the caller could not read - while the
//                        triple-key removal after it matched nothing and the
//                        endpoint still answered 200.
//   GHSA-6qpx-x7vr-p9w6  HashBleed - GET/PUT /api/users/{userId} serialised the whole user
//                        document: services.password.bcrypt and every live
//                        session's hashedToken, for any user, to any admin.
//   GHSA-whxm-pxgj-7wqv  GuestBleed - members/assignees arrays were stored unchecked, so a
//                        private board's member could put an outsider on a card
//                        and /api/user/cards then fed that outsider the board's
//                        card titles, ids and dates.
//   GHSA-r8r3-23vr-8jh6  StaleBleed - the board listing matched 'members.userId' with a
//                        dotted path, which ignores isActive - so a removed
//                        member kept seeing the board's id and title.
//   GHSA-6jr3-42jf-vhm5  AuthorBleed - six paths recorded req.body.authorId as the actor, so
//                        a board member could write somebody else's name into
//                        the board's history.
//
// These are source guards: they pin the shape of the fix, which is what a
// regression would change. The behaviour itself needs a running server and is
// covered by the reporters' own curl reproductions in the advisories.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const cards = read('server/models/cards.js');
const boards = read('server/models/boards.js');
const users = read('server/models/users.js');
const customFields = read('server/models/customFields.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('restApiIdorBatch:');

// Body of the handler registered for `method` at `route`, up to the next
// WebApp.handlers registration.
function handler(source, method, route) {
  const at = source.indexOf(`WebApp.handlers.${method}(\n  '${route}'`);
  const flat = at === -1 ? source.indexOf(`WebApp.handlers.${method}('${route}'`) : at;
  assert.ok(flat !== -1, `handler not found: ${method} ${route}`);
  const next = source.indexOf('WebApp.handlers.', flat + 20);
  return source.slice(flat, next === -1 ? source.length : next);
}

// ── GHSA-8cqr-x6m5-v4w6 ─────────────────────────────────────────────────────
test('the single-card DELETE fetches the card WITH the board it authorised', () => {
  const body = handler(cards, 'delete', '/api/boards/:boardId/lists/:listId/cards/:cardId');
  assert.ok(/getCard\(\{\s*_id: paramCardId,\s*boardId: paramBoardId,\s*\}\)/.test(body),
    'the lookup is constrained to the authorised board');
  // A bare lookup does appear once more, but only AFTER the constrained one
  // found nothing, and only to tell an attempt apart from an ordinary 404 for
  // the Problems log. What matters is that its result never reaches the
  // destruction: `card` is what cardRemover is given, never `elsewhere`.
  const bare = body.match(/getCard\(paramCardId\)/g) || [];
  assert.ok(bare.length <= 1, `the bare lookup appears ${bare.length} times`);
  if (bare.length) {
    assert.ok(/const elsewhere = await ReactiveCache\.getCard\(paramCardId\)/.test(body),
      'and it is the classification lookup, named for what it is');
    assert.ok(body.indexOf('if (!card) {') < body.indexOf('const elsewhere'),
      'reached only when the constrained lookup found nothing');
    assert.ok(!/cardRemover\(req\.userId, elsewhere\)/.test(body),
      'and never handed to cardRemover (negative)');
  }
});

test('cardRemover only ever runs on a card that lookup returned', () => {
  // The destruction happens BEFORE the removal, so an unconstrained fetch is
  // the whole vulnerability: whatever it returns, cardRemover erases.
  const body = handler(cards, 'delete', '/api/boards/:boardId/lists/:listId/cards/:cardId');
  const at = body.indexOf('cardRemover(');
  assert.ok(at !== -1, 'it is still called');
  // Guarded by the constrained lookup having found something: everything between
  // `if (card) {` and the call is comment or the attempt note, never another
  // lookup that could reintroduce a foreign card.
  const guard = body.slice(body.indexOf('if (card) {'), body.indexOf('await cardRemover('));
  assert.ok(guard.length > 0 && guard.length < 400, 'cardRemover sits inside the if (card) guard');
  assert.ok(!/getCard\(/.test(guard), 'with no lookup between the guard and the call (negative)');
});

test('the bulk delete, which was always right, still constrains its lookup', () => {
  const body = handler(cards, 'delete', '/api/boards/:boardId/cards/bulk');
  assert.ok(/getCard\(\{ _id: cardId, boardId: paramBoardId \}\)/.test(body),
    'the endpoint the single-card path should have copied');
});

// ── GHSA-6qpx-x7vr-p9w6 ─────────────────────────────────────────────────────
test('an admin API answer about a user carries no password or session hashes', () => {
  assert.ok(/function withoutSecrets\(user\)/.test(users), 'there is one place that strips them');
  const fn = users.slice(users.indexOf('function withoutSecrets(user)'));
  const body = fn.slice(0, fn.indexOf('\n}'));
  assert.ok(/delete user\.services;/.test(body),
    'services - which holds password.bcrypt and resume.loginTokens - is removed');
  assert.ok(/delete user\.sessionData;/.test(body), 'and server-side session state with it');

  const get = handler(users, 'get', '/api/users/:userId');
  assert.ok(/sendJsonResult\(res, \{ code: 200, data: withoutSecrets\(user\) \}\)/.test(get),
    'GET answers through it');
  const put = handler(users, 'put', '/api/users/:userId');
  assert.ok(/withoutSecrets\(await ReactiveCache\.getUser\(id\)\)/.test(put),
    'and so does PUT, which returned the same document after every action');
});

test('the self view and the list endpoint are unchanged (negative)', () => {
  // They were always right; the two {userId} endpoints were the inconsistency.
  const self = handler(users, 'get', '/api/user');
  assert.ok(/delete data\.services;/.test(self), 'GET /api/user still strips services itself');
  const list = handler(users, 'get', '/api/users');
  assert.ok(/_id: doc\._id, username: doc\.username/.test(list),
    'GET /api/users still answers with two fields');
});

// ── GHSA-whxm-pxgj-7wqv ─────────────────────────────────────────────────────
test('members and assignees are checked against the board, in every shape', () => {
  assert.ok(/async function assignableOnBoard\(board, ids, source\)/.test(cards),
    'one rule, used by all of them');
  const fn = cards.slice(cards.indexOf('async function assignableOnBoard'));
  assert.ok(/canAssignCardMember\(board, id\)/.test(fn.slice(0, 400)),
    'and it is the check the merge endpoint has used since #5998');

  // POST (single), POST (bulk) and PUT all go through it - four arrays in all.
  const uses = cards.match(/assignableOnBoard\(/g) || [];
  assert.ok(uses.length >= 7, `expected the definition plus six call sites, got ${uses.length}`);
  assert.ok(!/members: input\.members !== undefined \? coerceRestArrayParam/.test(cards),
    'the bulk create no longer stores its array as given (negative)');
});

test('my-cards answers only for boards the caller is an active member of', () => {
  const body = handler(cards, 'get', '/api/user/cards');
  assert.ok(/members: \{ \$elemMatch: \{ userId, isActive: true \} \}/.test(body),
    'the boards are re-checked, with isActive');
  assert.ok(/const readable = \(cards \|\| \[\]\)\.filter\(card => allowed\.has\(card\.boardId\)\)/.test(body),
    'and the answer is the filtered set');
  assert.ok(/data: readable\.map/.test(body),
    'which is what is serialised (negative: not the unfiltered cards)');
});

// ── GHSA-r8r3-23vr-8jh6 ─────────────────────────────────────────────────────
test('a revoked member is not listed as a member of the board', () => {
  const body = handler(boards, 'get', '/api/users/:userId/boards');
  assert.ok(/members: \{ \$elemMatch: \{ userId: paramUserId, isActive: true \} \}/.test(body),
    'the membership must be active');
  assert.ok(!/'members\.userId': paramUserId/.test(body),
    'not the dotted match, which ignores isActive (negative)');
});

// ── GHSA-6jr3-42jf-vhm5 ─────────────────────────────────────────────────────
test('who did it comes from the session, not from the request body', () => {
  // `req.body.authorId` is still READ - that is how the spoof is noticed and
  // reported - but it is never USED as an identity. It may appear only where the
  // attempt is detected, never as a value that is stored or attributed.
  const codeOnly = src => src.replace(/\/\/[^\n]*/g, '');
  for (const [name, src] of [['cards', cards], ['customFields', customFields]]) {
    const code = codeOnly(src);
    assert.ok(!/userId: req\.body\.authorId/.test(code), `${name}: not stored as an identity`);
    assert.ok(!/cardCreation\(req\.body\.authorId/.test(code), `${name}: not attributed on create`);
    assert.ok(!/cardRemover\(req\.body\.authorId/.test(code), `${name}: not attributed on delete`);
    assert.ok(!/customFieldCreation\(req\.body\.authorId/.test(code), `${name}: nor on a custom field`);
    assert.ok(!/const authorId = input\.authorId/.test(code), `${name}: nor per entry in bulk`);
  }
  // And every remaining read sits beside the log line that reports it.
  const reads = (codeOnly(cards).match(/req\.body\.authorId/g) || []).length;
  assert.strictEqual(reads, 1, 'cards.js reads it once, in noteAuthorSpoof');

  // The six paths the advisory named, by what each one records.
  assert.ok(/await cardCreation\(req\.userId, linkedCard\)/.test(cards), 'linked-card create');
  assert.ok(/await cardCreation\(req\.userId, card\)/.test(cards), 'single card create');
  assert.ok(/userId: req\.userId,\n\s+swimlaneId: req\.body\.swimlaneId/.test(cards),
    'the card document itself');
  assert.ok(/const authorId = req\.userId;/.test(cards), 'bulk create');
  assert.ok((cards.match(/await cardRemover\(req\.userId, card\)/g) || []).length === 2,
    'both deletes - single and bulk');
  assert.ok(/await customFieldCreation\(req\.userId, customField\)/.test(customFields),
    'custom-field create');
});

// ── every attempt is visible in Admin Panel / Problems ──────────────────────
//
// A guard that refuses in silence tells the operator nothing. Four of the five
// have an ATTEMPT that can be told apart from ordinary use, so each refusal is
// recorded through server/lib/securityLog into the `security` stream, which is
// what Admin Panel / Problems counts and lists.
const categories = require('../models/lib/securityCategories.js');

test('the four attempts have catalog entries, named after their Bleed', () => {
  const want = {
    'authz.card-delete': ['PurgeBleed', 'critical', 'CWE-639'],
    'authz.card-member': ['GuestBleed', 'high', 'CWE-639'],
    'authz.board-list': ['StaleBleed', 'medium', 'CWE-863'],
    'spoofing.author': ['AuthorBleed', 'medium', 'CWE-345'],
  };
  for (const [key, [bleed, severity, cwe]] of Object.entries(want)) {
    const c = categories.categoryFor(key);
    assert.strictEqual(c.bleed, bleed, key);
    assert.strictEqual(c.severity, severity, key);
    assert.strictEqual(c.cwe, cwe, key);
    assert.notStrictEqual(c.category, 'unknown', `${key} must not fall back to the generic entry`);
  }
});

test('each refusal records its attempt', () => {
  const del = handler(cards, 'delete', '/api/boards/:boardId/lists/:listId/cards/:cardId');
  assert.ok(/key: 'authz\.card-delete', action: 'blocked'/.test(del), 'PurgeBleed');

  const fn = cards.slice(cards.indexOf('async function assignableOnBoard'));
  assert.ok(/key: 'authz\.card-member', action: 'blocked'/.test(fn.slice(0, 1200)), 'GuestBleed');

  const list = handler(boards, 'get', '/api/users/:userId/boards');
  assert.ok(/key: 'authz\.board-list', action: 'blocked'/.test(list), 'StaleBleed');

  assert.ok(/key: 'spoofing\.author', action: 'ignored'/.test(cards), 'AuthorBleed, on the card paths');
  assert.ok(/key: 'spoofing\.author', action: 'ignored'/.test(customFields), 'and on custom-field create');
});

test('logging can never break the guard it sits in (negative)', () => {
  // The log is best-effort by design: an insert that throws must not turn a
  // refusal into a 500, or the logging becomes its own denial of service.
  for (const [name, src] of [['cards', cards], ['boards', boards], ['customFields', customFields]]) {
    let at = -1;
    while ((at = src.indexOf("require('/server/lib/securityLog')", at + 1)) !== -1) {
      const around = src.slice(Math.max(0, at - 600), at + 600);
      assert.ok(/try \{/.test(around) && /catch \(e\) \{/.test(around),
        `${name}: a securityLog call outside a try/catch`);
    }
  }
});

test('ordinary use is NOT logged (negative)', () => {
  // The point of a Problems entry is that somebody TRIED something. Three of the
  // four therefore have a condition around the record call, so a normal request
  // writes nothing:
  const del = handler(cards, 'delete', '/api/boards/:boardId/lists/:listId/cards/:cardId');
  assert.ok(/if \(elsewhere\) \{/.test(del),
    'a card id that names nothing at all is an ordinary 404, not an attempt');

  const fn = cards.slice(cards.indexOf('async function assignableOnBoard'));
  assert.ok(/if \(refused\.length\) \{/.test(fn.slice(0, 1200)),
    'a members array whose ids are all fine records nothing');

  const list = handler(boards, 'get', '/api/users/:userId/boards');
  assert.ok(/if \(revoked && revoked\.length\) \{/.test(list),
    'a caller with no revoked membership records nothing');

  // And the fourth: naming YOURSELF in authorId is what an old client does, so
  // only a mismatch is recorded.
  const note = cards.slice(cards.indexOf('function noteAuthorSpoof'));
  assert.ok(/if \(!claimed \|\| String\(claimed\) === String\(req\.userId\)\) return;/.test(note.slice(0, 900)),
    'an authorId equal to the session is not an attempt');
});

test('HashBleed deliberately has no catalog key (negative)', () => {
  // Every call to GET/PUT /api/users/{userId} is a legitimate admin call - the
  // fault was in what the answer CARRIED, not in who asked. A log line there
  // would fire on ordinary use and say nothing about an attacker, so there is
  // none, and the catalog says why.
  const cat = read('models/lib/securityCategories.js');
  assert.ok(/HashBleed/.test(cat), 'the reason is written down');
  assert.ok(!/bleed: 'HashBleed'/.test(cat), 'but it is not a key (negative)');
  // users.js does log elsewhere (the avatar-url guard), so the check is on the
  // two endpoints themselves, not on the file.
  const get = handler(users, 'get', '/api/users/:userId');
  const put = handler(users, 'put', '/api/users/:userId');
  assert.ok(!/securityLog/.test(get) && !/securityLog/.test(put),
    'and neither endpoint logs (negative)');
});

console.log(`\nrestApiIdorBatch: ${passed} tests passed`);
