'use strict';
const { syncSourceKey } = require('../../models/lib/listSyncSourceIdentity');
const fail = code => { throw Object.assign(new Error(code), { code }); };

// Durable jobs require versioned identities. Legacy lists must establish an
// incarnation/revision before enqueueing; null cannot distinguish recreation.
function validateSyncOperationScope(scope) {
  if (!scope || Object.keys(scope).sort().join(',') !== 'boardId,incarnation,listId,revision,sourceKey' ||
      Object.values(scope).some(value => typeof value !== 'string' || !value)) fail('invalid-sync-operation-scope');
  return { ...scope };
}
function createSyncOperationScopeGuard({ lists, boards, scope, assertCurrent, assertAccess }) {
  scope = validateSyncOperationScope(scope);
  if (typeof assertCurrent !== 'function' || typeof assertAccess !== 'function' ||
      typeof lists?.findOneAsync !== 'function' || typeof boards?.findOneAsync !== 'function') fail('sync-operation-access-required');
  scope = { ...scope };
  const read = async () => {
    const list = await lists.findOneAsync({ _id: scope.listId, boardId: scope.boardId,
      syncCredentialIncarnation: scope.incarnation, syncRevision: scope.revision });
    let sourceKey;
    try { sourceKey = list?.syncSource && syncSourceKey(list.syncSource); } catch (_) { /* treat invalid sources as stale */ }
    if (!list || sourceKey !== scope.sourceKey) fail('sync-operation-scope-changed');
    const board = await boards.findOneAsync({ _id: scope.boardId });
    if (!board) fail('sync-operation-scope-changed');
    return { list, board };
  };
  return async () => {
    await assertCurrent();
    const current = await read();
    if (await assertAccess(current) !== true) fail('sync-operation-access-denied');
    // Access checks may await user/mapping reads. Refuse a list removed,
    // recreated or reconfigured while that check was in progress.
    await read();
    await assertCurrent();
  };
}
module.exports = { createSyncOperationScopeGuard, validateSyncOperationScope };
