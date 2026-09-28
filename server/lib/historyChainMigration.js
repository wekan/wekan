'use strict';
const { beginHistoryMigration, finishHistoryMigration } = require('./historyWriterGate');
const { initializeHistoryChain, inspectHistoryChain } = require('./historyChainBootstrap');
const { historyChainId, validateHistoryChainHead } = require('./historyChainAppend');

// Shared by the server binding and the offline maintenance command. Admission
// excludes participating writers; the deployment guard must exclude all others.
async function migrateHistoryChain({ gates, heads, history, boardId, migrationId, assertDeploymentExclusive }) {
  if (typeof assertDeploymentExclusive !== 'function') throw new Error('history-writer-deployment-guard-required');
  await assertDeploymentExclusive();
  const options = { gates, boardId, migrationId };
  const migration = await beginHistoryMigration(options);
  const readHead = async () => validateHistoryChainHead(await heads.findOne({ _id: historyChainId(boardId) }), boardId);
  if (migration.complete) {
    await readHead(); await assertDeploymentExclusive(); return migrationId;
  }
  const assertExclusive = async () => { await assertDeploymentExclusive(); await migration.assertExclusive(); };
  await initializeHistoryChain({ heads, history, boardId, assertExclusive });
  await finishHistoryMigration({ ...options, assertHeadReady: async () => {
    await assertExclusive();
    const head = await readHead();
    // A pre-existing head can be stale after legacy writes or an interrupted
    // rollout. Structural validity alone cannot authorize the permanent switch.
    if (head.pending !== null) throw new Error('history-chain-migration-pending');
    const actual = await inspectHistoryChain({ history, boardId, assertExclusive });
    if (actual.hash !== head.hash) throw new Error('history-chain-migration-head-mismatch');
    await assertExclusive();
  } });
  await assertDeploymentExclusive(); return migrationId;
}
module.exports = { migrateHistoryChain };
