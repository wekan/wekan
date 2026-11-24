'use strict';

// The administrators' audit log, hash-chained (docs/Compliance/README.md P3;
// [HIPAA] § 164.312(c)(1) integrity, [ISO27001] A.8.15 protection of log
// information). Each row carries its place in the chain (seq), the hash of
// the row before it (prevHash) and its own hash over what it records, so a
// row that is edited, or removed from the middle, breaks the chain where it
// was - and Admin Panel / Problems / Integrity says so.
//
// The row's _id is made from seq ('audit-000000000042'), so two servers that
// write at the same moment cannot both take the same place: the database's
// own unique _id refuses the second, which takes the next one
// (server/lib/auditChainAppend.js). The retention (ADMIN_AUDIT_RETENTION_DAYS)
// removes rows from the OLD end only, so the chain is verified from the
// oldest row still kept; rows written before the chain existed have no seq
// and are counted, not verified.
//
// Server only (it uses node's crypto); pure otherwise:
// tests/auditChain.test.cjs.

const crypto = require('crypto');

const GENESIS = '0'.repeat(64);
const FIELDS = ['seq', 'at', 'actorId', 'actorUsername', 'method', 'args', 'ok', 'error', 'ip', 'prevHash'];

function rowId(seq) {
  return `audit-${String(seq).padStart(12, '0')}`;
}

// What the hash covers: the recorded fields, in a fixed order, the date as
// ISO text - nothing a database might reorder or retype.
function canonicalRow(row) {
  return JSON.stringify(FIELDS.map(f => {
    const v = row[f];
    if (v instanceof Date) return v.toISOString();
    return v === undefined ? null : v;
  }));
}

function hashRow(row) {
  return crypto.createHash('sha256').update(canonicalRow(row)).digest('hex');
}

// The next row, after `last` (the newest chained row, or none).
function chainedRow(doc, last) {
  const seq = last && Number.isSafeInteger(last.seq) ? last.seq + 1 : 1;
  const row = { ...doc, seq, prevHash: last && last.hash ? last.hash : GENESIS };
  row._id = rowId(seq);
  row.hash = hashRow(row);
  return row;
}

// rows: every row that has a seq, ascending. The first kept row's prevHash is
// trusted (older ones were removed by retention); from there on each row
// must hash to its own hash, link to the row before it, and follow it in seq.
function verifyChain(rows) {
  const broken = [];
  let prev = null;
  for (const row of rows || []) {
    if (hashRow(row) !== row.hash) broken.push({ seq: row.seq, reason: 'changed' });
    if (prev) {
      if (row.seq !== prev.seq + 1) broken.push({ seq: prev.seq + 1, reason: 'missing' });
      else if (row.prevHash !== prev.hash) broken.push({ seq: row.seq, reason: 'link' });
    }
    prev = row;
  }
  return { checked: (rows || []).length, ok: broken.length === 0, broken: broken.slice(0, 20) };
}

module.exports = { GENESIS, FIELDS, rowId, canonicalRow, hashRow, chainedRow, verifyChain };
