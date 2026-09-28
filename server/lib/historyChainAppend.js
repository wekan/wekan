'use strict';
const { EJSON, calculateObjectSize } = require('bson');
const { canonical, sha256, hashHistoryRow, rowHashIsValid } = require('../../models/lib/changeHistoryIntegrity');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const hash = value => value === null || (typeof value === 'string' && /^[a-f0-9]{64}$/.test(value));
const fail = code => { throw new Error(`history-chain-${code}`); };
const keys = row => Object.keys(row).sort().join(',');
function validateRow(row, boardId) {
  if (!row || typeof row._id !== 'string' || !row._id || row.boardId !== boardId ||
      !rowHashIsValid(row) || !hash(row.previousHash) || calculateObjectSize(row) > 1024 * 1024) fail('row-invalid');
}
function matches(row, expected) {
  return row && row._id === expected._id && row.isCheckpoint === expected.isCheckpoint &&
    rowHashIsValid(row) && row.integrityHash === expected.integrityHash;
}
const historyChainId = boardId => sha256(canonical(['history-chain', boardId]));
function validateHistoryChainHead(head, boardId) {
  const id = historyChainId(boardId);
  if (!head || keys(head) !== '_id,boardId,hash,pending,pendingHash,version' || head._id !== id ||
      head.boardId !== boardId || head.version !== 1 || !hash(head.hash) ||
      head.pendingHash !== (head.pending === null ? null : sha256(canonical(head.pending)))) fail('head-invalid');
  if (head.pending !== null) {
    validateRow(head.pending, boardId);
    if (head.pending.previousHash !== head.hash) fail('head-invalid');
  }
  return head;
}
// Shared multi-process append primitive behind the schema-backed writer.
// Initializing an existing board requires a verified initialHash under migration
// exclusion. All writers must use this protocol once that head is installed.
// One persisted pending row fences the next predecessor; helpers finish it
// before another row is reserved. No lease expiry can permit two successors.
async function appendHistoryChain({ heads, history, row, initialHash, assertCurrent }) {
  row = copy(row);
  if (!row || (row.boardId !== null && (typeof row.boardId !== 'string' || !row.boardId)) ||
      Object.hasOwn(row, 'previousHash') || Object.hasOwn(row, 'integrityHash') ||
      !hash(initialHash) || typeof assertCurrent !== 'function' ||
      !['findOne', 'insertOne', 'replaceOne'].every(key => typeof heads?.[key] === 'function') ||
      !['findOne', 'insertOne'].every(key => typeof history?.[key] === 'function')) fail('adapter-invalid');
  const boardId = row.boardId, id = historyChainId(boardId);
  const candidateFor = previousHash => {
    const candidate = { ...copy(row), previousHash };
    candidate.integrityHash = hashHistoryRow(candidate); validateRow(candidate, boardId);
    return candidate;
  };
  candidateFor(initialHash);
  const read = async () => {
    await assertCurrent(); const head = await heads.findOne({ _id: id }); await assertCurrent();
    if (!head) return null;
    validateHistoryChainHead(head, boardId);
    return copy(head);
  };
  const storedRow = async expected => {
    await assertCurrent(); const saved = await history.findOne({ _id: expected._id }); await assertCurrent();
    if (saved && !matches(saved, expected)) fail('row-conflict');
    return saved;
  };
  let head = await read();
  if (!head) {
    await assertCurrent(); let error;
    try { await heads.insertOne({ _id: id, boardId, version: 1, hash: initialHash, pending: null, pendingHash: null }); }
    catch (failure) { error = failure; }
    head = await read(); if (!head) throw error || new Error('history-chain-head-unconfirmed');
  }
  for (let attempt = 0; attempt < 100; attempt++) {
    if (head.pending) {
      const pending = head.pending;
      if (!await storedRow(pending)) {
        await assertCurrent(); let error;
        try { await history.insertOne(copy(pending)); } catch (failure) { error = failure; }
        if (!await storedRow(pending)) throw error || new Error('history-chain-row-unconfirmed');
      }
      // Exact pending payload is the compare-and-swap token. An older helper
      // cannot clear a later reservation even if it wakes after a long pause.
      await assertCurrent(); let error;
      try { await heads.replaceOne({ _id: id, version: 1, boardId, hash: head.hash,
        pending: { $eq: pending }, pendingHash: head.pendingHash },
        { ...head, hash: pending.integrityHash, pending: null, pendingHash: null }); }
      catch (failure) { error = failure; }
      const next = await read();
      if (!next) throw error || new Error('history-chain-head-unconfirmed');
      if (canonical(next) === canonical(head)) throw error || new Error('history-chain-head-unconfirmed');
      head = next; continue;
    }
    // Retry by row ID never changes the captured payload or its predecessor.
    await assertCurrent(); const existing = await history.findOne({ _id: row._id }); await assertCurrent();
    if (existing) {
      if (!matches(existing, candidateFor(existing.previousHash))) fail('row-conflict');
      return row._id;
    }
    const pending = candidateFor(head.hash);
    await assertCurrent(); let error;
    try { await heads.replaceOne({ _id: id, version: 1, boardId, hash: head.hash,
      pending: { $eq: null }, pendingHash: null },
      { ...head, pending, pendingHash: sha256(canonical(pending)) }); }
    catch (failure) { error = failure; }
    const next = await read();
    if (!next) throw error || new Error('history-chain-head-unconfirmed');
    if (canonical(next) === canonical(head)) throw error || new Error('history-chain-reservation-unconfirmed');
    head = next;
  }
  fail('contention');
}
module.exports = { appendHistoryChain, historyChainId, validateHistoryChainHead };
