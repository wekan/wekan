'use strict';
const { calculateObjectSize } = require('bson');
const { canonical, rowHashIsValid } = require('../../models/lib/changeHistoryIntegrity');
const { historyChainId, validateHistoryChainHead } = require('./historyChainAppend');
const fail = code => { throw new Error(`history-chain-${code}`); };
// This scan must run while ALL legacy and coordinated writers are excluded.
// It validates ancestry, not timestamp ordering, and never rewrites old rows.
async function inspectHistoryChain({ history, boardId, assertExclusive, maxRows = 100000, maxBytes = 128 * 1024 * 1024 }) {
  if ((boardId !== null && (typeof boardId !== 'string' || !boardId)) ||
      typeof assertExclusive !== 'function' || typeof history?.find !== 'function' ||
      !Number.isSafeInteger(maxRows) || maxRows < 1 || !Number.isSafeInteger(maxBytes) || maxBytes < 1) fail('bootstrap-invalid');
  await assertExclusive();
  const selector = { boardId: boardId === null ? { $eq: null, $exists: true } : boardId };
  const cursor = history.find(selector).batchSize(250);
  const rows = new Map(), ids = new Set(), successors = new Map();
  let total = 0, bytes = 0, legacyCount = 0;
  try {
    for await (const row of cursor) {
      await assertExclusive();
      if (++total > maxRows || (bytes += calculateObjectSize(row)) > maxBytes) fail('bootstrap-limit');
      if (row.boardId !== boardId || typeof row._id !== 'string' || !row._id || ids.has(row._id)) fail('bootstrap-row-invalid');
      ids.add(row._id);
      if (row.integrityHash == null || row.integrityHash === '') {
        // Truly pre-integrity rows are retained, but cannot claim ancestry.
        if (row.previousHash != null && row.previousHash !== '') fail('bootstrap-row-invalid');
        legacyCount++; continue;
      }
      if (!rowHashIsValid(row) || (row.previousHash !== null &&
          (typeof row.previousHash !== 'string' || !/^[a-f0-9]{64}$/.test(row.previousHash)))) fail('bootstrap-row-invalid');
      if (rows.has(row.integrityHash) || successors.has(row.previousHash)) fail('bootstrap-fork');
      rows.set(row.integrityHash, row.previousHash); successors.set(row.previousHash, row.integrityHash);
    }
  } finally { await cursor.close(); }
  await assertExclusive();
  for (const previous of rows.values()) if (previous !== null && !rows.has(previous)) fail('bootstrap-predecessor-missing');
  let hash = null, count = 0;
  while (successors.has(hash)) {
    hash = successors.get(hash);
    if (++count > rows.size) fail('bootstrap-cycle');
  }
  if (count !== rows.size) fail('bootstrap-disconnected');
  return { hash, rowCount: rows.size, legacyCount };
}
async function initializeHistoryChain({ heads, history, boardId, assertExclusive, ...limits }) {
  if ((boardId !== null && (typeof boardId !== 'string' || !boardId)) ||
      !['findOne', 'insertOne'].every(key => typeof heads?.[key] === 'function') ||
      typeof assertExclusive !== 'function') fail('bootstrap-invalid');
  const id = historyChainId(boardId);
  await assertExclusive(); const existing = await heads.findOne({ _id: id }); await assertExclusive();
  if (existing) return validateHistoryChainHead(existing, boardId);
  const { hash } = await inspectHistoryChain({ history, boardId, assertExclusive, ...limits });
  const candidate = { _id: id, version: 1, boardId, hash, pending: null, pendingHash: null };
  await assertExclusive(); let error;
  try { await heads.insertOne(candidate); } catch (failure) { error = failure; }
  await assertExclusive(); const saved = await heads.findOne({ _id: id }); await assertExclusive();
  if (!saved) throw error || new Error('history-chain-bootstrap-unconfirmed');
  validateHistoryChainHead(saved, boardId);
  if (canonical(saved) !== canonical(candidate)) fail('bootstrap-conflict');
  return saved;
}
module.exports = { inspectHistoryChain, initializeHistoryChain };
