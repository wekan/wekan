// Appending to the hash-chained audit log (models/lib/auditChain.js): read the
// newest chained row, write the next one with the _id its seq gives it, and
// if another server took that place first - the unique _id refuses it - read
// again and take the next. Never throws into the action being audited: after
// a few attempts the row is written unchained rather than lost.
import { AdminAuditLog } from '/server/adminAudit';

const { chainedRow } = require('/models/lib/auditChain');

const ATTEMPTS = 8;
const isDuplicate = e => e && (e.code === 11000 || /E11000|duplicate key/i.test(String(e.message || e.errmsg || '')));

export async function appendAuditRow(doc) {
  for (let i = 0; i < ATTEMPTS; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const last = await AdminAuditLog.findOneAsync({ seq: { $exists: true } }, { sort: { seq: -1 }, fields: { seq: 1, hash: 1 } });
    const row = chainedRow(doc, last);
    try {
      // eslint-disable-next-line no-await-in-loop
      await AdminAuditLog.insertAsync(row);
      return row;
    } catch (e) {
      if (!isDuplicate(e)) throw e;
    }
  }
  console.error('[admin-audit] could not take a place in the chain; writing the row unchained');
  return AdminAuditLog.insertAsync(doc);
}

// Admin Panel / Problems / Integrity: the chain, verified from the oldest row
// still kept. A break is one summarised problem in the integrity stream.
export async function verifyAuditChain() {
  const { verifyChain } = require('/models/lib/auditChain');
  const rows = await AdminAuditLog.find({ seq: { $exists: true } }, { sort: { seq: 1 } }).fetchAsync();
  const unchained = await AdminAuditLog.find({ seq: { $exists: false } }).countAsync();
  const result = { ...verifyChain(rows), unchained };
  if (!result.ok) {
    try {
      require('/server/lib/eventLogFold').foldEventFireAndForget({
        stream: 'integrity', severity: 'high', category: 'audit-log', action: 'detected', source: 'admin-audit-chain',
        detail: `The administrators' audit log chain is broken: ${result.broken.map(b => `row ${b.seq} ${b.reason}`).join(', ')}.`,
      }, 'adminAuditChain');
    } catch (e) { /* the verification result matters more than its record */ }
  }
  return result;
}
