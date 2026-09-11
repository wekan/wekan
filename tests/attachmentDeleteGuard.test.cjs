'use strict';

// Plain-Node regression guard (no Meteor), originally for issue #5282: deleting
// an attachment could log a client-side "Removed nonexistent document"
// exception even though the delete itself succeeded - the same publication-
// churn class as the fixed #3252 for comments and checklists.
//
// The fix for that used to be a Minimongo presence check around the client's
// Attachments.removeAsync(). History.md §12.1 removed the remove itself: Delete
// is the 'attachments.softDelete' method, the server marks the document and
// nothing on the client removes anything - so the exception cannot happen, and
// this guard now pins THAT. The sibling #3252 guard for comments is unchanged.
// Run: node tests/attachmentDeleteGuard.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const attachments = read('client/components/cards/attachments.js');
const comments = read('client/components/activities/comments.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const handler = attachments.match(/'click \.js-confirm-delete'[\s\S]*?\n  \}\),/);

test('the delete handler exists and calls the soft-delete method', () => {
  assert.ok(handler, 'delete handler found');
  assert.ok(/Meteor\.call\('attachments\.softDelete', this\._id\)/.test(handler[0]),
    'Delete on a card is the attachments.softDelete method');
});

test('negative: the client never removes an attachment document (#5282 cannot recur)', () => {
  assert.ok(!/Attachments\.removeAsync/.test(attachments),
    'no Attachments.removeAsync anywhere in the client attachments code');
  assert.ok(!/Attachments\.remove\(/.test(attachments),
    'no Attachments.remove( either');
});

test('negative: the client does not unset the cover itself - the server does, atomically', () => {
  assert.ok(!/unsetCover/.test(handler[0]),
    'the cover is unset by the softDelete method (History.md §12.1), not by the client before it');
});

test('the sibling #3252 guard for comments is still in place (same bug class)', () => {
  assert.ok(/CardComments\.findOne\(commentId\)/.test(comments));
});

console.log(`\n${passed} tests passed`);
