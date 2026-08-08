'use strict';

// CommentBleed — GHSA-pqr4-rxgp-hv2m, "REST comment DELETE allows any board
// member to delete other users' comments (BOLA)" (Moderate, CWE-639 / CWE-863),
// reported by Alpastx. https://wekan.fi/hall-of-fame/commentbleed/
//
// Over DDP, deleting a comment is author-or-board-admin, and a board that sets
// restrictCommentEditing takes even the admin's ability away (#5906). That rule
// was enforced in a CardComments collection hook keyed off the Meteor userId,
// with an early `if (!userId) return` for genuine server-internal work (board
// copy, cleanup, migrations).
//
// An HTTP request carries no Meteor userId into the invocation context. So
// `DELETE /api/boards/:b/cards/:c/comments/:id` — which checked only board
// membership — reached the collection, the hook took its "server-internal"
// path, and any normal member could delete anybody's comment, restricted board
// or not.
//
// The fix is not to trust the hook: the handler loads the comment and applies
// the same rule itself, with req.userId, before removing anything.
//
// Run: node tests/restCommentDeleteAcl.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const restComments = read('server/models/cardComments.js');
const modelComments = read('models/cardComments.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const deleteHandler = restComments.match(
  /WebApp\.handlers\.delete\([\s\S]*?\n\);/,
);

// ------------------------------------------------- the rule itself (pure)

// canEditComment is the pure decision the whole thing rests on. It has its own
// mocha suite (server/lib/tests/comments.permissions.tests.js); re-pinned here
// because this advisory is about it being SKIPPED, not about it being wrong.
test('the pure rule still says author-or-admin, and restricted means author only', () => {
  const source = modelComments.match(/export function canEditComment\([\s\S]*?\n\}/)[0];
  assert.ok(/if \(isAuthor\) \{\s*\n\s*return true;/.test(source));
  assert.ok(/if \(restrictCommentEditing\) \{\s*\n\s*return false;/.test(source));
  assert.ok(/return !!isBoardAdmin;/.test(source));
});

// ------------------------------------------------------ the REST handler

test('the DELETE handler loads the comment before removing it', () => {
  assert.ok(deleteHandler, 'the DELETE handler is found');
  const body = deleteHandler[0];
  assert.ok(/const comment = await ReactiveCache\.getCardComment\(/.test(body));
});

test('a comment that does not exist is a 404, not a silent success', () => {
  const body = deleteHandler[0];
  assert.ok(/if \(!comment\) \{[\s\S]*?code: 404[\s\S]*?return;/.test(body));
});

test('the object ACL is applied, with the REST caller identity', () => {
  const body = deleteHandler[0];
  assert.ok(/await assertCanMutateComment\(req\.userId, comment\);/.test(body),
    'the same rule DDP applies, called with req.userId');
});

test('the ACL runs BEFORE the removal, not after it', () => {
  const body = deleteHandler[0];
  const aclAt = body.indexOf('assertCanMutateComment');
  const removeAt = body.indexOf('CardComments.removeAsync');
  assert.ok(aclAt > -1 && removeAt > -1, 'both are present');
  assert.ok(aclAt < removeAt, 'the check must precede the delete');
});

test('negative: board membership alone is no longer the only check', () => {
  const body = deleteHandler[0];
  assert.ok(/checkBoardAccess\(req\.userId, paramBoardId\)/.test(body),
    'membership is still required...');
  assert.ok(/assertCanMutateComment/.test(body),
    '...but it is no longer sufficient, which is the whole advisory');
});

// --------------------------------------------------- the shared rule module

test('the rule is exported, so REST and DDP cannot enforce different things', () => {
  assert.ok(/export async function assertCanMutateComment\(userId, doc\)/.test(modelComments));
  assert.ok(
    /import CardComments, \{ assertCanMutateComment \} from '\/models\/cardComments'/.test(restComments),
    'the REST file imports that exact function',
  );
});

test('the hooks still call the same function, so DDP is unchanged', () => {
  assert.ok(/CardComments\.before\.update\(async \(userId, doc\) => \{\s*\n\s*await assertCanMutateComment\(userId, doc\);/.test(modelComments));
  assert.ok(/CardComments\.before\.remove\(async \(userId, doc\) => \{\s*\n\s*await assertCanMutateComment\(userId, doc\);/.test(modelComments));
});

test('the no-userId trusted path is documented as internal-only, and kept', () => {
  const fn = modelComments.match(/export async function assertCanMutateComment[\s\S]*?\n\}/)[0];
  // Board copy, cleanup and migrations legitimately run with no user; removing
  // this would break them. What changed is that REST no longer arrives here
  // anonymously.
  assert.ok(/if \(!userId\) \{\s*\n\s*return;/.test(fn));
  assert.ok(/GHSA-pqr4-rxgp-hv2m/.test(fn), 'and why, so it is not "simplified" back');
});

test('the refusal is a 403 for REST callers, not a 500', () => {
  const fn = modelComments.match(/export async function assertCanMutateComment[\s\S]*?\n\}/)[0];
  assert.ok(/error\.statusCode = 403;/.test(fn));
  assert.ok(/error-comment-edit-not-allowed/.test(fn), 'and keeps the DDP error id');
});

test('negative: there is still no REST edit route that could bypass the same rule', () => {
  // If a PUT is ever added it must get the same check; this fails when one
  // appears without it.
  const routes = restComments.match(/WebApp\.handlers\.(get|post|put|delete)\(/g) || [];
  const puts = routes.filter(r => r.includes('.put('));
  assert.strictEqual(puts.length, 0,
    'a comment edit route was added — give it assertCanMutateComment too');
});

console.log(`\n${passed} tests passed`);
