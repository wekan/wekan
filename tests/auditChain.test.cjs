'use strict';

// P3 (docs/Compliance/README.md): the administrators' audit log is
// hash-chained, and Admin Panel / Problems / Integrity says where it breaks.
// Run: node --test tests/auditChain.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const C = require('../models/lib/auditChain');

function chain(n) {
  const rows = [];
  for (let i = 0; i < n; i += 1) {
    rows.push(C.chainedRow({ at: new Date(Date.UTC(2026, 10, 24, 0, i)), actorId: 'a1', actorUsername: 'root',
      method: 'setPassword', args: '["[redacted]","u1"]', ok: true, ip: '::1' }, rows[rows.length - 1]));
  }
  return rows;
}

test('each row follows the one before it, with the _id its place gives it', () => {
  const rows = chain(3);
  assert.deepEqual(rows.map(r => r.seq), [1, 2, 3]);
  assert.equal(rows[0].prevHash, C.GENESIS);
  assert.equal(rows[1].prevHash, rows[0].hash);
  assert.equal(rows[2]._id, 'audit-000000000003');
  assert.match(rows[0].hash, /^[0-9a-f]{64}$/);
  assert.deepEqual(C.verifyChain(rows), { checked: 3, ok: true, broken: [] });
});

test('negative: an edited row, a row removed from the middle and a broken link are each found', () => {
  const edited = chain(4);
  edited[1] = { ...edited[1], actorUsername: 'someone-else' };
  assert.deepEqual(C.verifyChain(edited).broken, [{ seq: 2, reason: 'changed' }]);
  const removed = chain(4);
  removed.splice(2, 1);
  assert.deepEqual(C.verifyChain(removed).broken, [{ seq: 3, reason: 'missing' }]);
  const relinked = chain(3);
  const forged = C.chainedRow({ at: new Date(), actorId: 'x', method: 'm', ok: true }, { seq: 1, hash: 'f'.repeat(64) });
  assert.deepEqual(C.verifyChain([relinked[0], forged]).broken, [{ seq: 2, reason: 'link' }]);
});

test('the retention removing the oldest rows does not break it', () => {
  const rows = chain(5).slice(2);
  assert.equal(C.verifyChain(rows).ok, true);
});

test('every audit row is appended to the chain; a race takes the next place; the check reports to Integrity', () => {
  assert.match(read('server/adminAudit.js'), /await require\('\/server\/lib\/auditChainAppend'\)\.appendAuditRow\(doc\)/);
  assert.match(read('server/lib/adminRouteAudit.js'), /appendAuditRow\(doc\)/);
  const append = read('server/lib/auditChainAppend.js');
  assert.match(append, /if \(!isDuplicate\(e\)\) throw e;/, 'only a taken place is retried');
  assert.match(append, /stream: 'integrity', severity: 'high', category: 'audit-log'/);
  assert.match(append, /foldEventFireAndForget\(/, 'a summarised problem, not a row per check');
  // No other writer of the audit log goes around the chain.
  for (const f of ['server/adminAudit.js', 'server/lib/adminRouteAudit.js']) {
    assert.doesNotMatch(read(f), /AdminAuditLog\.insertAsync\(/, f);
  }
});
