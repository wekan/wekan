'use strict';
// A saved List Sync operation that can no longer be replayed blocks its list's
// Sync. Admin Panel -> Problems -> Recovery lists it, and an administrator
// discards it (server/lib/listSyncStuck.js). Non-administrators are refused,
// an operation that can still be replayed is not discardable, and a second
// discard is a no-op.
const { randomUUID } = require('node:crypto');
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');
const { syncSourceKey } = require('../../../models/lib/listSyncSourceIdentity');

const source = { type: 'jira', url: 'https://jira.example.org', projectKey: 'P' };
function seedOperation({ listId, boardId, actorId, scope, stuck = true }) {
  const intentId = randomUUID(), operationId = randomUUID();
  db.insertOne('listSyncOperationIntents', { _id: intentId, version: 2, actorId, trigger: 'manual', scope,
    createdAt: new Date() });
  db.insertOne('listSyncOperations', { _id: listId, operationId, intentId, scope, state: 'applying',
    checkpoint: 1, total: 3, attempts: 1, startedAt: new Date(), touchedAt: new Date(),
    ...(stuck ? { stuck: { reason: 'scope-changed', at: new Date() } } : {}) });
  for (let index = 0; index < 3; index++) {
    db.insertOne('listSyncOperationSteps', { _id: `${operationId}:${index}`, operationId, index, checksum: 'c'.repeat(64),
      step: { kind: 'update', cardId: `card-${index}`, before: {}, after: {} } });
  }
  return { intentId, operationId };
}
function cleanup(listIds, operationIds, intentIds) {
  db.deleteMany('listSyncOperations', { _id: { $in: listIds } });
  db.deleteMany('listSyncOperationSteps', { operationId: { $in: operationIds } });
  db.deleteMany('listSyncOperationIntents', { _id: { $in: intentIds } });
  db.deleteMany('listSyncOperationDiscards', { _id: { $in: operationIds } });
  db.deleteMany('recoveryEvents', { type: 'list-sync-operation-discarded', detail: { $regex: operationIds.join('|') } });
}

test('only administrators can list or discard stuck List Sync operations', async ({ page, user }) => {
  const listId = `stale-${randomUUID()}`;
  const scope = { listId, boardId: `gone-${randomUUID()}`, incarnation: 'i', revision: 'r', sourceKey: syncSourceKey(source) };
  const seeded = seedOperation({ listId, boardId: scope.boardId, actorId: user.id, scope });
  try {
    await loginWithToken(page, user.id, user.token);
    const denied = await page.evaluate(async args => Promise.all([
      Meteor.callAsync('listSyncStuckOperations').then(() => 'accepted', error => error.error),
      Meteor.callAsync('listSyncStuckDiscard', args).then(() => 'accepted', error => error.error),
    ]), { listId, operationId: seeded.operationId });
    expect(denied).toEqual(['not-authorized', 'not-authorized']);
    expect(db.findOne('listSyncOperations', { _id: listId }).operationId).toBe(seeded.operationId);
    expect(db.countDocuments('listSyncOperationSteps', { operationId: seeded.operationId })).toBe(3);
  } finally { cleanup([listId], [seeded.operationId], [seeded.intentId]); }
});

test('administrator discards a stuck List Sync operation in Recovery, once', async ({ page, adminUser }) => {
  // Its list no longer exists, so the scope can never match again.
  const listId = `stale-${randomUUID()}`;
  const scope = { listId, boardId: `gone-${randomUUID()}`, incarnation: 'i', revision: 'r', sourceKey: syncSourceKey(source) };
  const seeded = seedOperation({ listId, boardId: scope.boardId, actorId: adminUser.id, scope });
  try {
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/problems/recovery');
    const panel = page.locator('.list-sync-stuck-operations');
    await expect(panel.getByRole('heading', { name: 'List Sync operations that cannot be replayed' })).toBeVisible();
    const row = panel.locator(`tr[data-list="${listId}"]`);
    await expect(row).toContainText('1 of 3 changes applied');
    await expect(row).toContainText('The list was removed, recreated or its Sync settings changed');
    await expect(row.locator('.js-list-sync-stuck-discard')).toBeEnabled();
    page.once('dialog', dialog => dialog.accept());
    await row.locator('.js-list-sync-stuck-discard').click();
    await expect(row).toHaveCount(0);
    expect(db.findOne('listSyncOperations', { _id: listId })).toBeNull();
    expect(db.countDocuments('listSyncOperationSteps', { operationId: seeded.operationId })).toBe(0);
    const decision = db.findOne('listSyncOperationDiscards', { _id: seeded.operationId });
    expect(decision).toMatchObject({ listId, decision: 'discard', applied: 1, total: 3, reason: 'scope-changed' });
    // The intent stays as evidence of who started it.
    expect(db.findOne('listSyncOperationIntents', { _id: seeded.intentId })).not.toBeNull();
    // Discarding again changes nothing and records nothing more.
    const again = await page.evaluate(args => Meteor.callAsync('listSyncStuckDiscard', args),
      { listId, operationId: seeded.operationId });
    expect(again.status).toBe('already-discarded');
    expect(db.countDocuments('listSyncOperationDiscards', { _id: seeded.operationId })).toBe(1);
    expect(db.countDocuments('recoveryEvents', { type: 'list-sync-operation-discarded',
      detail: { $regex: seeded.operationId } })).toBe(1);
  } finally { cleanup([listId], [seeded.operationId], [seeded.intentId]); }
});

test('an operation that can still be replayed cannot be discarded', async ({ page, adminUser, user, board }) => {
  // The list exists with exactly the saved scope and the actor still writes to
  // it, so a replay would finish it: the discard is refused, even though the
  // operation carries a stuck mark from earlier.
  const listId = board.listIds[0];
  const scope = { listId, boardId: board.boardId, incarnation: randomUUID(), revision: randomUUID(), sourceKey: syncSourceKey(source) };
  db.updateOne('lists', { _id: listId }, { $set: { syncCredentialIncarnation: scope.incarnation, syncRevision: scope.revision,
    syncSource: { ...source } } });
  const seeded = seedOperation({ listId, boardId: board.boardId, actorId: user.id, scope });
  try {
    await loginWithToken(page, adminUser.id, adminUser.token);
    const refused = await page.evaluate(args => Meteor.callAsync('listSyncStuckDiscard', args)
      .then(() => 'accepted', error => error.error), { listId, operationId: seeded.operationId });
    expect(refused).toBe('list-sync-stuck-replayable');
    expect(db.findOne('listSyncOperations', { _id: listId }).operationId).toBe(seeded.operationId);
    expect(db.countDocuments('listSyncOperationDiscards', { _id: seeded.operationId })).toBe(0);
    await navigateInApp(page, '/admin/problems/recovery');
    const row = page.locator(`.list-sync-stuck-operations tr[data-list="${listId}"]`);
    await expect(row).toContainText('It can be replayed again now');
    await expect(row.locator('.js-list-sync-stuck-discard')).toBeDisabled();
  } finally {
    // Remove the operation before the replay cron finishes it against the board.
    cleanup([listId], [seeded.operationId], [seeded.intentId]);
  }
});
