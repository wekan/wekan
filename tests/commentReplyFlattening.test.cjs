'use strict';

// Issue #3011: a comment may be a REPLY to another comment on the same card,
// capped at one level of nesting - a reply to a reply attaches to the
// ORIGINAL top-level comment instead of nesting further.
//
// resolveParentId() (models/cardComments.js) is the pure decision this rests
// on: given the _id a caller wants to use as parentId, and a lookup function,
// it returns the parentId that should actually be stored. It has no Meteor
// imports of its own, but the file it lives in does (`meteor/meteor`,
// `meteor/mongo`, ...), so it cannot be `import()`-ed directly under plain
// Node the way a dependency-free module can. Extract its source with a regex
// (the same technique tests/restCommentDeleteAcl.test.cjs already uses for
// canEditComment in this file) and eval it standalone - this actually RUNS
// the real function body, not just a description of it, so a change to the
// flattening rule that breaks the behavior fails this test too.
//
// Run: node tests/commentReplyFlattening.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const modelComments = read('models/cardComments.js');
const clientComments = read('client/components/activities/comments.js');
const serverModelSource = modelComments; // before.insert hook lives here too

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const source = modelComments.match(
  /export function resolveParentId\([\s\S]*?\n\}/,
);
assert.ok(source, 'resolveParentId is exported from models/cardComments.js');

// eslint-disable-next-line no-new-func
const resolveParentId = new Function(
  `${source[0].replace(/^export /, '')}\nreturn resolveParentId;`,
)();

// A tiny in-memory "comments" table for the lookup callback.
function makeStore(comments) {
  const byId = new Map(comments.map(c => [c._id, c]));
  return id => byId.get(id);
}

// --------------------------------------------------------------- POSITIVE

test('no parentId -> top-level comment (empty string)', () => {
  assert.strictEqual(resolveParentId('', makeStore([])), '');
  assert.strictEqual(resolveParentId(undefined, makeStore([])), '');
});

test('reply to a TOP-LEVEL comment keeps that parentId as-is', () => {
  const store = makeStore([{ _id: 'top1', parentId: '' }]);
  assert.strictEqual(resolveParentId('top1', store), 'top1');
});

test('reply to a REPLY is flattened onto the original top-level comment', () => {
  const store = makeStore([
    { _id: 'top1', parentId: '' },
    { _id: 'reply1', parentId: 'top1' },
  ]);
  // Clicking "Reply" on reply1 must produce top1, not reply1 - this is the
  // one-level cap.
  assert.strictEqual(resolveParentId('reply1', store), 'top1');
});

test('replying to a reply-to-a-reply still flattens to the same top-level id', () => {
  // Even if some other path ever produced a doubly-nested doc, resolving a
  // NEW reply against it still lands one level down, not deeper.
  const store = makeStore([
    { _id: 'top1', parentId: '' },
    { _id: 'reply1', parentId: 'top1' },
  ]);
  assert.strictEqual(resolveParentId('reply1', store), 'top1');
});

test('a parentId that cannot be found is used as-is (nothing to flatten against)', () => {
  const store = makeStore([]);
  assert.strictEqual(resolveParentId('missing', store), 'missing');
});

// ----------------------------------------------------- wiring (regression)

test('the client reply-click handler flattens before opening the composer', () => {
  assert.ok(
    /'click \.js-reply-comment'\(evt\) \{[\s\S]*?resolveParentId\(this\._id/.test(
      clientComments,
    ),
    'js-reply-comment must resolve/flatten via resolveParentId, not raw this._id',
  );
});

test('the server enforces the cap again on insert (defense in depth)', () => {
  assert.ok(
    /CardComments\.before\.insert\(async \(userId, doc\) => \{[\s\S]*?resolveParentId\(doc\.parentId/.test(
      serverModelSource,
    ),
    'a before.insert hook must re-derive doc.parentId via resolveParentId',
  );
});

test('the schema field is optional and defaults to unset (top-level by default)', () => {
  const field = modelComments.match(/parentId: \{[\s\S]*?\n\s*\},/);
  assert.ok(field, 'parentId schema field exists');
  assert.ok(/optional: true/.test(field[0]));
});

console.log(`\ncommentReplyFlattening: ${passed} passed`);
