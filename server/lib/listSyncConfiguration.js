const { randomUUID } = require('node:crypto');

function validCredentialGeneration(list) {
  const generation = list.syncCredentialGeneration === undefined ? 0 : list.syncCredentialGeneration;
  return Number.isSafeInteger(generation) && generation >= 0 && generation < Number.MAX_SAFE_INTEGER;
}

function credentialGeneration(list) {
  return validCredentialGeneration(list) ? (list.syncCredentialGeneration ?? 0) : 0;
}

function configurationSelector(list) {
  const present = key => Object.hasOwn(list, key) ? { $eq: list[key], $exists: true } : { $exists: false };
  return { _id: list._id, boardId: list.boardId, syncRevision: present('syncRevision'),
    syncSource: present('syncSource'), syncCredentialGeneration: present('syncCredentialGeneration'),
    syncCredentialIncarnation: present('syncCredentialIncarnation'),
    syncCredentialFence: present('syncCredentialFence') };
}

function syncCredentialSelector(list) {
  if (!list.syncSource) return null;
  const incarnation = list.syncCredentialIncarnation;
  if (incarnation !== undefined && (typeof incarnation !== 'string' || !incarnation)) return null;
  const lifetime = { incarnation: incarnation === undefined ? { $exists: false } : incarnation };
  if (list.syncRevision !== undefined) {
    if (typeof list.syncRevision !== 'string' || !list.syncRevision) return null;
    return { _id: list.syncRevision, configurationId: list.syncRevision, listId: list._id, ...lifetime };
  }
  // Never let an uncommitted version masquerade as a legacy credential.
  return { listId: list._id, configurationId: { $exists: false }, ...lifetime };
}

async function readSyncCredential(credentials, list) {
  const selector = syncCredentialSelector(list);
  return selector ? credentials.findOneAsync(selector) : null;
}

// Stage an immutable credential, then select both settings and credential in
// ONE list-document update. A crash before that update retains the previous
// pair; a crash afterward leaves the new pair usable without cleanup.
async function commitSyncConfiguration({ lists, credentials, list, source,
  credential, previousCredential, assertCurrent }) {
  const generation = credentialGeneration(list);
  // Reset damaged/exhausted counters with a new opaque fence in the SAME
  // activation write. A numeric reset alone could revive an old generation.
  const repair = !validCredentialGeneration(list) ||
    (list.syncCredentialFence !== undefined &&
      (typeof list.syncCredentialFence !== 'string' || !list.syncCredentialFence))
    ? { syncCredentialGeneration: generation, syncCredentialFence: randomUUID() } : {};
  const revision = randomUUID();
  // A list created before list lifetimes has no incarnation and keeps direct
  // Sync. Saving its settings gives it one (maintainer decision 2026-10-02),
  // in the SAME write that selects the new credential, so the credential and
  // the lifetime it is bound to always change together. No migration does it:
  // that would leave the stored credential unmatched until the next save.
  const incarnation = list.syncCredentialIncarnation !== undefined ? list.syncCredentialIncarnation : randomUUID();
  const lifetime = list.syncCredentialIncarnation === undefined ? { syncCredentialIncarnation: incarnation } : {};
  if (source && credential) {
    await assertCurrent();
    await credentials.insertAsync({ _id: revision, configurationId: revision,
      listId: list._id, sourceKey: credential.sourceKey, generation,
      incarnation,
      token: credential.token, username: credential.username || '',
      ...(credential.runAsUserId ? { runAsUserId: credential.runAsUserId } : {}) });
  }
  await assertCurrent();
  const changed = await lists.updateAsync(configurationSelector(list), source
    ? { $set: { syncSource: source, syncRevision: revision, ...repair, ...lifetime } }
    : { $set: { syncRevision: revision, ...repair, ...lifetime }, $unset: { syncSource: '' } });
  if (!changed) {
    if (source && credential) {
      // An acknowledged failed comparison proves this attempt did not commit.
      await credentials.removeAsync({ _id: revision, configurationId: revision, listId: list._id });
    }
    throw Object.assign(new Error('Sync settings changed while saving. Reopen the popup and retry.'),
      { code: 'sync-config-changed' });
  }
  // Delete only the version read before this save, never all rows for a list.
  // Even a delayed cleanup cannot delete a later save's credential. Keep an
  // uncommitted version on ambiguous failure: deleting it could break a write
  // that succeeded in the database but whose acknowledgement was lost.
  if (previousCredential) {
    await credentials.removeAsync({ _id: previousCredential._id, listId: list._id });
  }
  return source ? { ok: true } : { cleared: true };
}

// Snapshot a bounded set BEFORE fencing saves. A delayed deletion then only
// touches those immutable IDs, never newer staging (even after another sweep
// or a repaired counter). No ordering or type of generation is trusted here.
async function cleanupSyncCredentials({ lists, credentials, list }) {
  const selected = syncCredentialSelector(list);
  if (list.syncSource && !selected) return { skipped: true };
  const selector = { listId: list._id, ...(selected ? { $nor: [selected] } : {}) };
  const candidates = await credentials.find(selector,
    { fields: { _id: 1 }, sort: { _id: 1 }, limit: 500 }).fetchAsync();
  if (!await lists.updateAsync(configurationSelector(list), { $set: {
    syncCredentialGeneration: validCredentialGeneration(list) ? credentialGeneration(list) + 1 : 0,
    syncCredentialFence: randomUUID(),
  } })) return { skipped: true };
  const removed = await credentials.removeAsync({ listId: list._id,
    _id: { $in: candidates.map(row => row._id) } });
  return { removed };
}

async function sweepSyncCredentials({ lists, credentials, cursor }) {
  const result = { cleaned: 0, skipped: 0, failed: 0, orphaned: 0 };
  let previous;
  try {
    // Read each immutable credential identity BEFORE checking list existence.
    // Never project tokens or delete by listId alone: a recreated list may
    // already be staging a credential for its new incarnation.
    for await (const row of cursor) {
      if (typeof row.listId !== 'string' || row.listId === previous) continue;
      try {
        const list = await lists.findOneAsync({ _id: row.listId });
        if (!list) {
          if (typeof row._id !== 'string') { result.skipped++; continue; }
          const exact = key => Object.hasOwn(row, key) ? { $eq: row[key], $exists: true } : { $exists: false };
          const removed = await credentials.removeAsync({ _id: row._id, listId: row.listId,
            incarnation: exact('incarnation'), configurationId: exact('configurationId') });
          result.orphaned += typeof removed === 'number' ? removed : removed.deletedCount;
          continue;
        }
        previous = row.listId;
        const status = await cleanupSyncCredentials({ lists, credentials, list });
        result[status.skipped ? 'skipped' : 'cleaned']++;
      } catch (_) { result.failed++; }
    }
  } finally { await cursor.close(); }
  return result;
}

module.exports = { syncCredentialSelector, readSyncCredential, commitSyncConfiguration,
  cleanupSyncCredentials, sweepSyncCredentials };
