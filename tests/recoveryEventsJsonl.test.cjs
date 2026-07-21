'use strict';

// Unit tests for the #6492 recovery-events JSONL parser (models/lib/recoveryEventsJsonl.js).
//
// The parser bridges the startup scripts (which append JSON lines) to the WeKan server
// (which imports them into the recoveryEvents collection). It must be forgiving: never
// throw on junk, skip malformed/oversized lines, and normalize severity.
//
// Run: node tests/recoveryEventsJsonl.test.cjs

const assert = require('assert');
const { parseRecoveryEventsJsonl } = require('../models/lib/recoveryEventsJsonl');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('recoveryEventsJsonl:');

test('parses valid lines and skips blanks/junk (negative inputs never throw)', () => {
  const text = [
    '{"type":"backup-created","db":"wekan","severity":"info"}',
    '',
    '   ',
    'not json at all',
    '{"nope":1}', // no type
    '{"type":""}', // empty type
    '[1,2,3]', // not an object
    '{"type":"restore-backup","severity":"error","detail":"restored"}',
  ].join('\n');

  const out = parseRecoveryEventsJsonl(text);
  assert.strictEqual(out.length, 2, 'only the two valid events survive');
  assert.deepStrictEqual(out.map(e => e.type), ['backup-created', 'restore-backup']);
  assert.strictEqual(out[1].detail, 'restored');
});

test('normalizes severity (unknown -> info; warning/error kept)', () => {
  const out = parseRecoveryEventsJsonl([
    '{"type":"a","severity":"bogus"}',
    '{"type":"b","severity":"warning"}',
    '{"type":"c","severity":"error"}',
    '{"type":"d"}',
  ].join('\n'));
  assert.deepStrictEqual(out.map(e => e.severity), ['info', 'warning', 'error', 'info']);
});

test('NEGATIVE — non-string / empty input yields an empty array (no throw)', () => {
  assert.deepStrictEqual(parseRecoveryEventsJsonl(''), []);
  assert.deepStrictEqual(parseRecoveryEventsJsonl(null), []);
  assert.deepStrictEqual(parseRecoveryEventsJsonl(undefined), []);
  assert.deepStrictEqual(parseRecoveryEventsJsonl(42), []);
});

test('NEGATIVE — an oversized line is skipped (no unbounded memory)', () => {
  const huge = '{"type":"x","detail":"' + 'a'.repeat(9000) + '"}';
  assert.deepStrictEqual(parseRecoveryEventsJsonl(huge), []);
});

test('defaults source to "startup" when absent', () => {
  const [e] = parseRecoveryEventsJsonl('{"type":"backup-created"}');
  assert.strictEqual(e.source, 'startup');
});

console.log(`\n${passed} tests passed`);
