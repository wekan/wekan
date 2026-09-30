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
// Online recovery (maintainer decision of 2026-09-30). A writer token has no
// expiry of its own: an uncertain legacy write must not become invisible to
// migration. What makes it recoverable without stopping servers is a LEASE
// beside it, and a fence on every legacy insert:
//
//   - a writer writes its lease { _id: token, state: 'active', expiresAt,
//     pending } before it joins the gate, and renews expiresAt while it works;
//   - before each legacy insert it CLAIMS the row id in `pending`, and only an
//     active lease can claim; the claim is cleared after the insert returns;
//   - recovery takes a lease only once it has been expired for a grace period,
//     and atomically sets it to 'fenced', so the writer can neither renew nor
//     claim again. A row it had claimed is then fenced by inserting a
//     tombstone under that row id: the unique _id makes a late insert fail, and
//     if the row had already landed the tombstone is refused instead. Only then
//     is the token removed from the gate.
//
// Safety therefore rests on the fence, not on clocks: a slow writer that is
// fenced loses its write and reports a failure. Clocks decide only when an
// abandoned lease may be taken. A token without a lease - written by an older
// server - still needs the offline tool (retireHistoryWriter).
const HISTORY_FENCE_BOARD = '#history-writer-fence';
const LEASE_KEYS = '_id,boardId,expiresAt,pending,state,version';
function historyWriterLeasePolicy(env = process.env) {
  const leaseMs = Number(env.HISTORY_WRITER_LEASE_MS || 30000);
  if (!Number.isSafeInteger(leaseMs) || leaseMs < 1000 || leaseMs > 600000) {
    throw new Error('HISTORY_WRITER_LEASE_MS must be from 1000 to 600000');
  }
  return { leaseMs, graceMs: leaseMs };
}
function leaseAccess(leases, history) {
  if (!leases && !history) return null;
  if (!['findOne', 'insertOne', 'updateOne', 'deleteOne', 'find'].every(key => typeof leases?.[key] === 'function') ||
      !['findOne', 'insertOne'].every(key => typeof history?.[key] === 'function')) fail('invalid');
  return {
    async read(id) {
      const row = await leases.findOne({ _id: id });
      if (!row) return null;
      if (Object.keys(row).sort().join(',') !== LEASE_KEYS || row.version !== 1 || !['active', 'fenced'].includes(row.state) ||
          !(row.expiresAt instanceof Date) || !Number.isFinite(row.expiresAt.getTime()) ||
          (row.pending !== null && (typeof row.pending !== 'string' || !row.pending || row.pending.length > 128))) fail('lease-invalid');
      return row;
    },
    // The row can never be inserted after this returns: either it exists (it
    // landed, or was fenced before), or the tombstone now holds its id.
    async fence(rowId, writerId) {
      let error;
      try { await history.insertOne({ _id: rowId, boardId: HISTORY_FENCE_BOARD, fencedWriter: writerId }); }
      catch (failure) { error = failure; }
      if (error && !await history.findOne({ _id: rowId }, { projection: { _id: 1 } })) throw error;
    },
    leases,
  };
}
// Take one abandoned writer: fence its lease and any claimed row, then remove
// its token. Idempotent; refuses a lease that is still alive.
async function recoverHistoryWriter({ gates, leases, history, boardId, writerId, graceMs, now = () => new Date() }) {
  if (typeof writerId !== 'string' || !UUID.test(writerId) || !Number.isSafeInteger(graceMs) || graceMs < 0) fail('invalid');
  const access = gateAccess({ gates, boardId }), fenced = leaseAccess(leases, history);
  if (!fenced) fail('invalid');
  let row = await access.read();
  if (!row || !['legacy', 'draining'].includes(row.mode)) fail('recovery-state');
  let lease = await fenced.read(writerId);
  if (lease && lease.boardId !== boardId) fail('lease-invalid');
  if (!row.writers.includes(writerId)) {
    // An orphaned lease: its token never joined, or has already left.
    if (lease) {
      if (lease.state === 'active' && lease.expiresAt.getTime() + graceMs > now().getTime()) fail('writer-alive');
      if (lease.pending) await fenced.fence(lease.pending, writerId);
      await leases.deleteOne({ _id: writerId, boardId });
    }
    return { writerId, retired: false };
  }
  if (!lease) fail('lease-missing');
  if (lease.state === 'active') {
    if (lease.expiresAt.getTime() + graceMs > now().getTime()) fail('writer-alive');
    try { await leases.updateOne({ _id: writerId, boardId, state: 'active', expiresAt: lease.expiresAt, pending: lease.pending },
      { $set: { state: 'fenced' } }); } catch (_) { /* read back below */ }
    lease = await fenced.read(writerId);
    if (!lease || lease.state !== 'fenced') fail('writer-alive');
  }
  if (lease.pending) await fenced.fence(lease.pending, writerId);
  for (let i = 0; i < 100; i++) {
    row = await access.read();
    if (!row || !['legacy', 'draining'].includes(row.mode)) fail('recovery-state');
    if (!row.writers.includes(writerId)) {
      await leases.deleteOne({ _id: writerId, boardId, state: 'fenced' });
      return { writerId, retired: true };
    }
    await access.change(row, { ...row, writers: row.writers.filter(id => id !== writerId) }).catch(() => {});
  }
  fail('contention');
}
// Every token of a board that can be taken online, and every orphaned lease.
// A live writer and a token with no lease are reported, never touched.
async function recoverExpiredHistoryWriters({ gates, leases, history, boardId, graceMs, now = () => new Date() }) {
  const access = gateAccess({ gates, boardId });
  const row = await access.read();
  const result = { recovered: [], alive: [], unleased: [] };
  if (!row || !['legacy', 'draining'].includes(row.mode)) return result;
  const options = { gates, leases, history, boardId, graceMs, now };
  const orphans = await leases.find({ boardId, _id: { $nin: row.writers } }, { projection: { _id: 1 } }).limit(1000).toArray();
  for (const writerId of [...row.writers, ...orphans.map(lease => lease._id).filter(id => UUID.test(id))]) {
    try {
      const outcome = await recoverHistoryWriter({ ...options, writerId });
      if (outcome.retired) result.recovered.push(writerId);
    } catch (error) {
      if (/history-writer-writer-alive/.test(error.message)) result.alive.push(writerId);
      else if (/history-writer-lease-missing/.test(error.message)) result.unleased.push(writerId);
      else throw error;
    }
  }
  return result;
}
async function withHistoryWriter({ gates, leases, history, boardId, writeLegacy, writeCoordinated,
  leaseMs = 30000, now = () => new Date() }) {
  if (typeof writeLegacy !== 'function' || typeof writeCoordinated !== 'function' ||
      !Number.isSafeInteger(leaseMs) || leaseMs < 1000) fail('invalid');
  const access = gateAccess({ gates, boardId }), fenced = leaseAccess(leases, history), writer = randomUUID();
  let row = await access.get(), owned = false, leased = false, recovered = false;
  if (row.mode === 'coordinated') return writeCoordinated();
  const expiry = () => new Date(now().getTime() + leaseMs);
  if (fenced) {
    await leases.insertOne({ _id: writer, boardId, version: 1, state: 'active', expiresAt: expiry(), pending: null });
    leased = true;
  }
  let heartbeat = null, lost = false;
  try {
    for (let i = 0; i < 100; i++) {
      if (row.mode === 'coordinated') {
        if (leased) await leases.deleteOne({ _id: writer, boardId, state: 'active' });
        leased = false;
        return await writeCoordinated();
      }
      if (row.mode !== 'legacy') fail('migration-busy');
      if (row.writers.length >= 1000) {
        // Abandoned tokens are what fills a gate; take the expired ones once.
        if (!fenced || recovered) fail('capacity');
        recovered = true;
        await recoverExpiredHistoryWriters({ gates, leases, history, boardId, graceMs: leaseMs, now });
        row = await access.read();
        continue;
      }
      row = await access.change(row, { ...row, writers: [...row.writers, writer] });
      if (row.writers.includes(writer)) { owned = true; break; }
    }
    if (!owned) fail('contention');
  } catch (error) {
    if (leased && !owned) await leases.deleteOne({ _id: writer, boardId, state: 'active', pending: null }).catch(() => {});
    throw error;
  }
  if (fenced) {
    heartbeat = setInterval(() => {
      leases.updateOne({ _id: writer, boardId, state: 'active' }, { $set: { expiresAt: expiry() } })
        .then(result => { if (result && result.matchedCount === 0) lost = true; }, () => {});
    }, Math.max(250, Math.floor(leaseMs / 3)));
    heartbeat.unref?.();
  }
  const assertCurrent = async () => {
    if (lost) fail('ownership-lost');
    const current = await access.read();
    if (!current || !['legacy', 'draining'].includes(current.mode) || !current.writers.includes(writer)) fail('ownership-lost');
  };
  // Every legacy History insert goes through this: the row id is claimed under
  // the active lease first, so recovery can fence a claimed row it takes over.
  const fencedInsert = async (rowId, insert) => {
    if (typeof rowId !== 'string' || !rowId || rowId.length > 128 || typeof insert !== 'function') fail('invalid');
    if (!fenced) { await assertCurrent(); return insert(); }
    if (lost) fail('ownership-lost');
    try { await leases.updateOne({ _id: writer, boardId, state: 'active', pending: null }, { $set: { pending: rowId } }); }
    catch (_) { /* read back below */ }
    const claimed = await fenced.read(writer);
    if (!claimed || claimed.state !== 'active' || claimed.pending !== rowId) fail('ownership-lost');
    await assertCurrent();
    // A failed insert keeps its claim: recovery fences that row id.
    const result = await insert();
    try { await leases.updateOne({ _id: writer, boardId, state: 'active', pending: rowId }, { $set: { pending: null } }); }
    catch (_) { /* read back below */ }
    const cleared = await fenced.read(writer);
    if (!cleared || cleared.state !== 'active' || cleared.pending !== null) fail('ownership-lost');
    return result;
  };
  let result;
  try {
    await assertCurrent();
    result = await writeLegacy({ writerId: writer, assertCurrent, fencedInsert });
    await assertCurrent();
  } finally {
    // On failure the token and the lease stay; the lease stops being renewed
    // and expires, and recovery takes it online.
    if (heartbeat) clearInterval(heartbeat);
  }
  // Release only after a confirmed successful write. Lost release replies are
  // reconciled by absence of this exact token, without removing other writers.
  for (let i = 0; i < 100; i++) {
    row = await access.read();
    if (!row) fail('ownership-lost');
    if (!row.writers.includes(writer)) break;
    row = await access.change(row, { ...row, writers: row.writers.filter(id => id !== writer) });
    if (!row.writers.includes(writer)) break;
    if (i === 99) fail('contention');
  }
  if (fenced) {
    // A claim still open here belongs to a row the caller confirmed; fencing
    // it is a no-op then, and closes it for good otherwise.
    const lease = await fenced.read(writer);
    if (lease?.pending) await fenced.fence(lease.pending, writer);
    await leases.deleteOne({ _id: writer, boardId });
  }
  return result;
}
// `recoverWriters`, when given, is called once while draining, so tokens of
// writers that died can be taken online instead of blocking the migration.
async function beginHistoryMigration({ gates, boardId, migrationId, recoverWriters = null }) {
  if (typeof migrationId !== 'string' || !UUID.test(migrationId) ||
      (recoverWriters !== null && typeof recoverWriters !== 'function')) fail('invalid');
  const access = gateAccess({ gates, boardId }); let row = await access.get(), recovered = false;
  for (let i = 0; i < 100; i++) {
    if (row.mode === 'legacy') {
      row = await access.change(row, { ...row, mode: 'draining', migrationId }); continue;
    }
    if (row.migrationId !== migrationId) fail('migration-owned');
    if (row.mode === 'coordinated') return { complete: true, migrationId };
    if (row.mode === 'draining') {
      if (row.writers.length && recoverWriters && !recovered) {
        recovered = true; await recoverWriters(); row = await access.read(); continue;
      }
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
// Offline recovery, the fallback for a token with no lease (an older server's)
// or a lease that cannot be read. Token removal alone cannot fence an
// in-flight legacy insert; the caller must stop every writer and keep them
// stopped through readback.
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
  inspectHistoryWriters, retireHistoryWriter, recoverHistoryWriter, recoverExpiredHistoryWriters,
  historyWriterLeasePolicy, HISTORY_FENCE_BOARD };
