'use strict';
(async () => {

// Issue #3011: replies render directly under their parent within the same
// flat comments list, instead of interleaved by date with unrelated
// top-level comments. groupCommentsByThread() (imports/lib/commentThreading.js)
// is the pure reordering step the `comments` Blaze template's getComments()
// helper applies (client/components/activities/comments.js); it has no
// Meteor imports, so it is imported and run directly here.
//
// Run: node tests/commentThreadGrouping.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { groupCommentsByThread } = await import(
  '../imports/lib/commentThreading.js'
);

const repoRoot = path.resolve(__dirname, '..');
const clientComments = fs.readFileSync(
  path.join(repoRoot, 'client/components/activities/comments.js'),
  'utf8',
);

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --------------------------------------------------------------- POSITIVE

test('a reply is moved to sit directly after its top-level parent', () => {
  // Newest-first order, as the real query sorts (createdAt: -1) - the reply
  // to "top-older" ends up newest here, so without grouping it would sit
  // ahead of "top-older" rather than under it.
  const input = [
    { _id: 'reply-to-older', parentId: 'top-older' },
    { _id: 'top-newer', parentId: '' },
    { _id: 'top-older', parentId: '' },
  ];
  const grouped = groupCommentsByThread(input);
  assert.deepStrictEqual(
    grouped.map(c => c._id),
    ['top-newer', 'top-older', 'reply-to-older'],
  );
});

test('multiple replies to the same parent all group under it, in list order', () => {
  const input = [
    { _id: 'r2', parentId: 'top' },
    { _id: 'r1', parentId: 'top' },
    { _id: 'top', parentId: '' },
  ];
  const grouped = groupCommentsByThread(input);
  assert.deepStrictEqual(
    grouped.map(c => c._id),
    ['top', 'r2', 'r1'],
  );
});

test('a reply whose parent is no longer in the list falls back to top-level', () => {
  const input = [{ _id: 'orphan', parentId: 'deleted-parent' }];
  const grouped = groupCommentsByThread(input);
  assert.deepStrictEqual(grouped.map(c => c._id), ['orphan']);
});

test('a non-array input returns an empty list rather than throwing', () => {
  assert.deepStrictEqual(groupCommentsByThread(undefined), []);
  assert.deepStrictEqual(groupCommentsByThread(null), []);
});

// -------------------------------------------------------- NEGATIVE/REGRESSION

test('a plain flat list of only top-level comments is left in the same order', () => {
  const input = [
    { _id: 'c3', parentId: '' },
    { _id: 'c2', parentId: '' },
    { _id: 'c1', parentId: '' },
  ];
  const grouped = groupCommentsByThread(input);
  assert.deepStrictEqual(grouped.map(c => c._id), ['c3', 'c2', 'c1']);
  assert.strictEqual(grouped.length, input.length);
});

test('comments missing parentId altogether (legacy docs) are unaffected', () => {
  const input = [{ _id: 'legacy1' }, { _id: 'legacy2' }];
  const grouped = groupCommentsByThread(input);
  assert.deepStrictEqual(grouped.map(c => c._id), ['legacy1', 'legacy2']);
});

// ----------------------------------------------------- wiring (regression)

test('the comments template groups through groupCommentsByThread', () => {
  assert.ok(
    /getComments\(\) \{[\s\S]*?groupCommentsByThread\(data\.comments\(\)\)/.test(
      clientComments,
    ),
  );
});

console.log(`\ncommentThreadGrouping: ${passed} passed`);

})();
