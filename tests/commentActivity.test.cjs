'use strict';

// Plain-Node unit test (no Meteor) for comment-activity display text.
// Run: node tests/commentActivity.test.cjs
//
// Regression guard for #3606 ("activity feed shows 'edited/deleted comment
// undefined'"). The template fed the comment ID (undefined on older activities,
// and gone for a deleted comment) into the activity string. edit/delete
// activities now store commentText; commentActivityDisplayText() returns the
// stored text, else the live comment's text, else '' — never "undefined".

const assert = require('assert');
const { commentActivityDisplayText } = require('../models/lib/commentActivity');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- POSITIVE ---------------------------------------------------------------
test('stored commentText is used (delete case — comment doc already gone)', () => {
  assert.strictEqual(
    commentActivityDisplayText({ commentText: 'please review this' }),
    'please review this',
  );
});

test('falls back to the live comment text (edit case)', () => {
  assert.strictEqual(
    commentActivityDisplayText({ comment: { text: 'edited body' } }),
    'edited body',
  );
});

test('stored text wins over live comment text', () => {
  assert.strictEqual(
    commentActivityDisplayText({ commentText: 'snapshot', comment: { text: 'live' } }),
    'snapshot',
  );
});

test('empty string commentText is respected (not replaced by fallback)', () => {
  assert.strictEqual(commentActivityDisplayText({ commentText: '' }), '');
});

// --- NEGATIVE: the literal string "undefined" must never appear (#3606) ------
test('NEGATIVE: no text available yields "" not the word "undefined"', () => {
  const out = commentActivityDisplayText({ commentId: 'abc123' });
  assert.strictEqual(out, '');
  assert.notStrictEqual(out, 'undefined');
  assert.strictEqual(String(out).includes('undefined'), false);
});

test('NEGATIVE: an activity that only has an id (old data) does not render the id', () => {
  const out = commentActivityDisplayText({ commentId: 'someCommentId' });
  assert.notStrictEqual(out, 'someCommentId');
});

test('NEGATIVE: null / undefined activity does not throw', () => {
  assert.doesNotThrow(() => commentActivityDisplayText(null));
  assert.strictEqual(commentActivityDisplayText(null), '');
  assert.strictEqual(commentActivityDisplayText(undefined), '');
});

test('NEGATIVE: non-string commentText / malformed comment do not leak "undefined"', () => {
  assert.strictEqual(commentActivityDisplayText({ commentText: 42 }), '');
  assert.strictEqual(commentActivityDisplayText({ comment: {} }), '');
  assert.strictEqual(commentActivityDisplayText({ comment: null }), '');
});

console.log(`\n${passed} tests passed`);
