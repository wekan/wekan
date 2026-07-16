'use strict';

// Plain-Node regression guard (no Meteor) for issue #5282: deleting an
// attachment could log a client-side "Removed nonexistent document" exception
// even though the delete itself succeeded — the same publication-churn class
// as the fixed #3252 for comments and checklists, whose guards attachments
// never got.
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

test('attachment delete only removes when the doc is still in the local cache', () => {
  assert.ok(
    /if \(this\._id && ReactiveCache\.getAttachment\(this\._id\)\) \{\s*\n\s*await Attachments\.removeAsync\(this\._id\);/.test(attachments),
    'removeAsync must be guarded by a Minimongo presence check',
  );
});

test('negative: no unguarded removeAsync remains in the delete handler', () => {
  const handler = attachments.match(/'click \.js-confirm-delete'[\s\S]*?\n  \}\),/);
  assert.ok(handler, 'delete handler found');
  const body = handler[0];
  const removes = body.match(/Attachments\.removeAsync/g) || [];
  assert.strictEqual(removes.length, 1, 'exactly one remove call, inside the guard');
});

test('the sibling #3252 guard for comments is still in place (same bug class)', () => {
  assert.ok(/CardComments\.findOne\(commentId\)/.test(comments));
});

console.log(`\n${passed} tests passed`);
