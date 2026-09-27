const { randomUUID } = require('node:crypto');

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
  const revision = randomUUID();
  if (source && credential) {
    await assertCurrent();
    await credentials.insertAsync({ _id: revision, configurationId: revision,
      listId: list._id, sourceKey: credential.sourceKey,
      token: credential.token, username: credential.username || '' });
  }
  await assertCurrent();
  const changed = await lists.updateAsync({ _id: list._id, boardId: list.boardId,
    syncRevision: list.syncRevision === undefined ? { $exists: false } : list.syncRevision,
    syncSource: list.syncSource === undefined ? { $exists: false } : list.syncSource,
  }, source ? { $set: { syncSource: source, syncRevision: revision } }
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

module.exports = { syncCredentialSelector, readSyncCredential, commitSyncConfiguration };
