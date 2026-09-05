'use strict';

const crypto = require('crypto');

const PROTECTED = [
  'boardId', 'swimlaneId', 'listId', 'cardId', 'entityType', 'entityId',
  'group', 'changeType', 'previousContent', 'newContent', 'userId', 'createdAt',
  'batchId', 'restoredFromId', 'restoredByUserId', 'previousHash',
];

function canonical(value) {
  if (value === null) return 'null';
  if (value === undefined) return '{"$undefined":true}';
  if (value instanceof Date) return JSON.stringify({ $date: value.toISOString() });
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('history contains a non-finite number');
    return JSON.stringify(value);
  }
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  throw new TypeError(`unsupported history value: ${typeof value}`);
}

function protectedHistory(row) {
  return Object.fromEntries(PROTECTED.map(key => [key, row && row[key]]));
}

function hashHistoryRow(row) {
  return crypto.createHash('sha256').update(canonical(protectedHistory(row))).digest('hex');
}

function rowHashIsValid(row) {
  return Boolean(row && /^[a-f0-9]{64}$/.test(row.integrityHash || '') &&
    hashHistoryRow(row) === row.integrityHash);
}

function verifyHistoryRows(rows) {
  const list = Array.isArray(rows) ? rows.filter(row => row && row.integrityHash) : [];
  const hashes = new Map(list.map(row => [`${row.boardId}:${row.integrityHash}`, row]));
  const children = new Map();
  const roots = new Map();
  const failures = [];
  for (const row of list) {
    if (!rowHashIsValid(row)) failures.push({ row, reason: 'checksum-mismatch' });
    if (row.previousHash && !hashes.has(`${row.boardId}:${row.previousHash}`)) {
      failures.push({ row, reason: 'predecessor-missing' });
    }
    if (row.previousHash) {
      const key = `${row.boardId}:${row.previousHash}`;
      const count = (children.get(key) || 0) + 1;
      children.set(key, count);
      if (count > 1) failures.push({ row, reason: 'history-fork' });
    } else {
      const count = (roots.get(row.boardId) || 0) + 1;
      roots.set(row.boardId, count);
      if (count > 1) failures.push({ row, reason: 'multiple-history-roots' });
    }
  }
  return failures;
}

module.exports = { canonical, hashHistoryRow, rowHashIsValid, verifyHistoryRows, PROTECTED };
