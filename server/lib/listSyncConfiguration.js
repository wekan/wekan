const { randomUUID } = require('node:crypto');

function credentialGeneration(list) {
  const generation = list.syncCredentialGeneration ?? 0;
  if (!Number.isSafeInteger(generation) || generation < 0 || generation === Number.MAX_SAFE_INTEGER ||
      list.syncCredentialGeneration === null) throw new Error('Invalid Sync credential generation.');
  return generation;
}

function configurationSelector(list) {
  const present = key => Object.hasOwn(list, key) ? { $eq: list[key], $exists: true } : { $exists: false };
  return { _id: list._id, boardId: list.boardId, syncRevision: present('syncRevision'),
    syncSource: present('syncSource'), syncCredentialGeneration: present('syncCredentialGeneration') };
}

function syncCredentialSelector(list) {
  if (!list.syncSource) return null;
  if (list.syncRevision !== undefined) {
    if (typeof list.syncRevision !== 'string' || !list.syncRevision) return null;
    return { _id: list.syncRevision, configurationId: list.syncRevision, listId: list._id };
  }
  // Never let an uncommitted version masquerade as a legacy credential.
  return { listId: list._id, configurationId: { $exists: false } };
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
  const revision = randomUUID();
  if (source && credential) {
    await assertCurrent();
    await credentials.insertAsync({ _id: revision, configurationId: revision,
      listId: list._id, sourceKey: credential.sourceKey, generation,
      token: credential.token, username: credential.username || '' });
  }
  await assertCurrent();
  const changed = await lists.updateAsync(configurationSelector(list), source ? { $set: { syncSource: source, syncRevision: revision } }
    : { $set: { syncRevision: revision }, $unset: { syncSource: '' } });
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

// Fence older saves with one list update BEFORE deleting any staged versions.
// This does not rely on a lease timeout or an age heuristic. A late insert can
// remain until the next sweep, but its old-generation activation cannot match.
async function cleanupSyncCredentials({ lists, credentials, list }) {
  const generation = credentialGeneration(list);
  const selected = syncCredentialSelector(list);
  if (list.syncSource && !selected) return { skipped: true };
  if (!await lists.updateAsync(configurationSelector(list),
    { $set: { syncCredentialGeneration: generation + 1 } })) return { skipped: true };
  const selector = { listId: list._id, $or: [
    { generation: { $exists: false } }, { generation: { $type: 'number', $lt: generation + 1 } },
  ] };
  // Legacy readers may select any unversioned row: retain them all until a
  // settings save binds one immutable version. Never fetch tokens to sweep.
  if (selected) selector.$nor = [selected];
  const removed = await credentials.removeAsync(selector);
  return { removed };
}

async function sweepSyncCredentials({ lists, credentials, cursor }) {
  const result = { cleaned: 0, skipped: 0, failed: 0 };
  let previous;
  try {
    // Caller supplies a listId-sorted cursor projecting only listId. No secret
    // enters this scan, its result or its error reporting.
    for await (const row of cursor) {
      if (typeof row.listId !== 'string' || row.listId === previous) continue;
      previous = row.listId;
      try {
        const list = await lists.findOneAsync({ _id: row.listId });
        if (!list) { result.skipped++; continue; }
        const status = await cleanupSyncCredentials({ lists, credentials, list });
        result[status.skipped ? 'skipped' : 'cleaned']++;
      } catch (_) { result.failed++; }
    }
  } finally { await cursor.close(); }
  return result;
}

module.exports = { syncCredentialSelector, readSyncCredential, commitSyncConfiguration,
  cleanupSyncCredentials, sweepSyncCredentials };
