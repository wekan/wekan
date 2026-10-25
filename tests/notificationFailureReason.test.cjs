'use strict';

// "Activity notification delivery incomplete; pending intent retained" was
// logged for nearly every activity - 1,080 times in one test-server run - and
// never said which check failed, because the .catch() dropped the error. The
// line now carries the failure's code, and only something safe to log.
// Run: node tests/notificationFailureReason.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { notificationFailureReason } = require('../server/lib/notificationFailureReason');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('notificationFailureReason:');

test('a pipeline code is the reason, as it is', () => {
  for (const code of ['activity-notification-intent-invalid', 'activity-notification-activity-unconfirmed',
    'sync-busy', 'activity-notifications-disabled']) {
    assert.strictEqual(notificationFailureReason(new Error(code)), code);
  }
});

test('negative: any other message is never logged - only its name and code', () => {
  const leaky = new Error('E11000 duplicate key error collection: wekan.users index: email "alice@example.com"');
  leaky.name = 'MongoServerError';
  leaky.code = 11000;
  assert.strictEqual(notificationFailureReason(leaky), 'MongoServerError 11000');
  assert.strictEqual(notificationFailureReason(new TypeError("Cannot read properties of undefined (reading 'title')")), 'TypeError');
  assert.strictEqual(notificationFailureReason(new Error('card "Salary review" not found')), 'Error');
  const odd = new Error('x'); odd.name = '<script>'; odd.code = { secret: 1 };
  assert.strictEqual(notificationFailureReason(odd), 'Error');
  assert.strictEqual(notificationFailureReason(new Error('a'.repeat(101))), 'Error');
  assert.strictEqual(notificationFailureReason(undefined), 'unknown');
  assert.strictEqual(notificationFailureReason('string thrown'), 'Error');
});

// And nowhere else: every notification log line that says something was
// "retained" says why.
function walk(dir, out) {
  for (const entry of fs.readdirSync(path.join(__dirname, '..', dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'tests') walk(rel, out); }
    else if (/\.js$/.test(entry.name)) out.push(rel);
  }
  return out;
}

test('negative: no notification failure line in the server drops its reason', () => {
  const lines = [];
  for (const file of walk('server', [])) {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    for (const line of source.split('\n')) {
      if (/console\.error\(/.test(line) && /notification/i.test(line) && /retained/.test(line)) lines.push([file, line.trim()]);
    }
  }
  assert.ok(lines.length >= 4, 'the delivery, recovery and the two cleanup lines');
  for (const [file, line] of lines) {
    assert.match(line, /notificationFailureReason\(error\)/, `${file}: ${line}`);
  }
});

console.log(`notificationFailureReason: ${passed} passed`);
