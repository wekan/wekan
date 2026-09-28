'use strict';
const { randomUUID } = require('node:crypto');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const fail = code => { throw new Error(`history-writer-${code}`); };
function gateAccess({ gates, boardId }) {
  if ((boardId !== null && (typeof boardId !== 'string' || !boardId)) ||
      !['findOne', 'insertOne', 'replaceOne'].every(key => typeof gates?.[key] === 'function')) fail('invalid');
  const id = sha256(canonical(['history-writer-gate', boardId]));
  const read = async () => {
    const row = await gates.findOne({ _id: id });
    if (!row) return null;
    if (Object.keys(row).sort().join(',') !== '_id,boardId,migrationId,mode,version,writers' ||
        row._id !== id || row.boardId !== boardId || row.version !== 1 ||
        !['legacy', 'draining', 'migrating', 'coordinated'].includes(row.mode) ||
        (row.mode === 'legacy' ? row.migrationId !== null : !UUID.test(row.migrationId || '')) ||
        !Array.isArray(row.writers) || row.writers.length > 1000 ||
        row.writers.some(writer => typeof writer !== 'string' || !UUID.test(writer)) ||
        new Set(row.writers).size !== row.writers.length ||
        (['migrating', 'coordinated'].includes(row.mode) && row.writers.length)) fail('gate-invalid');
    return row;
  };
  const get = async () => {
    let row = await read();
    if (!row) {
      let error;
      try { await gates.insertOne({ _id: id, boardId, version: 1, mode: 'legacy', migrationId: null, writers: [] }); }
      catch (failure) { error = failure; }
      row = await read(); if (!row) throw error || new Error('history-writer-gate-unconfirmed');
    }
    return row;
  };
  const change = async (before, after) => {
    let error;
    try { await gates.replaceOne({ _id: id, boardId, version: 1, mode: before.mode,
      migrationId: before.migrationId, writers: { $eq: before.writers } }, after); }
    catch (failure) { error = failure; }
    const row = await read();
    if (!row) throw error || new Error('history-writer-gate-unconfirmed');
    if (canonical(row) === canonical(before)) throw error || new Error('history-writer-gate-unconfirmed');
    return row;
  };
  return { get, read, change };
}
// No expiry: an uncertain legacy write must not become invisible to migration.
// On callback failure its writer token stays for explicit recovery. All old
// writers must participate before the bootstrap barrier can be relied upon.
async function withHistoryWriter({ gates, boardId, writeLegacy, writeCoordinated }) {
  if (typeof writeLegacy !== 'function' || typeof writeCoordinated !== 'function') fail('invalid');
  const access = gateAccess({ gates, boardId }), writer = randomUUID();
  let row = await access.get(), owned = false;
  for (let i = 0; i < 100; i++) {
    if (row.mode === 'coordinated') return writeCoordinated();
    if (row.mode !== 'legacy') fail('migration-busy');
    if (row.writers.length >= 1000) fail('capacity');
    row = await access.change(row, { ...row, writers: [...row.writers, writer] });
    if (row.writers.includes(writer)) { owned = true; break; }
  }
  if (!owned) fail('contention');
  const assertCurrent = async () => {
    const current = await access.read();
    if (!current || !['legacy', 'draining'].includes(current.mode) || !current.writers.includes(writer)) fail('ownership-lost');
  };
  await assertCurrent();
  const result = await writeLegacy({ writerId: writer, assertCurrent });
  await assertCurrent();
  // Release only after a confirmed successful write. Lost release replies are
  // reconciled by absence of this exact token, without removing other writers.
  for (let i = 0; i < 100; i++) {
    row = await access.read();
    if (!row) fail('ownership-lost');
    if (!row.writers.includes(writer)) return result;
    row = await access.change(row, { ...row, writers: row.writers.filter(id => id !== writer) });
    if (!row.writers.includes(writer)) return result;
  }
  fail('contention');
}
async function beginHistoryMigration({ gates, boardId, migrationId }) {
  if (typeof migrationId !== 'string' || !UUID.test(migrationId)) fail('invalid');
  const access = gateAccess({ gates, boardId }); let row = await access.get();
  for (let i = 0; i < 100; i++) {
    if (row.mode === 'legacy') {
      row = await access.change(row, { ...row, mode: 'draining', migrationId }); continue;
    }
    if (row.migrationId !== migrationId) fail('migration-owned');
    if (row.mode === 'coordinated') return { complete: true, migrationId };
    if (row.mode === 'draining') {
      if (row.writers.length) fail('writers-pending');
      row = await access.change(row, { ...row, mode: 'migrating' }); continue;
    }
    const assertExclusive = async () => {
      const current = await access.read();
      if (!current || current.mode !== 'migrating' || current.migrationId !== migrationId) fail('ownership-lost');
    };
    return { complete: false, migrationId, assertExclusive };
  }
  fail('contention');
}
async function finishHistoryMigration({ gates, boardId, migrationId, assertHeadReady }) {
  if (typeof migrationId !== 'string' || !UUID.test(migrationId) || typeof assertHeadReady !== 'function') fail('invalid');
  const access = gateAccess({ gates, boardId }); const row = await access.read();
  if (!row || row.migrationId !== migrationId) fail('ownership-lost');
  if (row.mode === 'coordinated') return migrationId;
  if (row.mode !== 'migrating') fail('writers-pending');
  await assertHeadReady();
  const saved = await access.change(row, { ...row, mode: 'coordinated' });
  if (saved.mode !== 'coordinated' || saved.migrationId !== migrationId) fail('ownership-lost');
  return migrationId;
}
async function inspectHistoryWriters(options) {
  return gateAccess(options).read();
}
// Offline recovery only. Token removal cannot fence an in-flight legacy insert;
// the caller must stop every writer and keep them stopped through readback.
async function retireHistoryWriter({ gates, boardId, writerId, migrationId = null, assertOffline }) {
  if (typeof writerId !== 'string' || !UUID.test(writerId) ||
      (migrationId !== null && (typeof migrationId !== 'string' || !UUID.test(migrationId))) ||
      typeof assertOffline !== 'function') fail('invalid');
  const access = gateAccess({ gates, boardId });
  await assertOffline();
  const row = await access.read();
  if (!row || row.migrationId !== migrationId || !['legacy', 'draining'].includes(row.mode)) fail('recovery-state');
  if (!row.writers.includes(writerId)) { await assertOffline(); return row; }
  const expected = { ...row, writers: row.writers.filter(id => id !== writerId) };
  await assertOffline();
  const saved = await access.change(row, expected);
  await assertOffline();
  if (canonical(saved) !== canonical(expected)) fail('recovery-conflict');
  return saved;
}
module.exports = { withHistoryWriter, beginHistoryMigration, finishHistoryMigration,
  inspectHistoryWriters, retireHistoryWriter };
