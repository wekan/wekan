import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import ChangeHistory from '/models/changeHistory';
import { ensureIndex } from '/server/lib/mongoStartup';
const { EJSON } = require('bson');
const { appendHistoryChain, historyChainId, validateHistoryChainHead } = require('./historyChainAppend');
const { initializeHistoryChain } = require('./historyChainBootstrap');
const { withHistoryWriter, recoverExpiredHistoryWriters, historyWriterLeasePolicy } = require('./historyWriterGate');
const { hashHistoryRow } = require('../../models/lib/changeHistoryIntegrity');
const { migrateHistoryChain } = require('./historyChainMigration');

export const HistoryWriterGates = new Mongo.Collection('historyWriterGates');
HistoryWriterGates.deny({ insert: () => true, update: () => true, remove: () => true });
export const HistoryChainHeads = new Mongo.Collection('historyChainHeads');
HistoryChainHeads.deny({ insert: () => true, update: () => true, remove: () => true });
// One lease per legacy writer token (server/lib/historyWriterGate.js), so a
// writer that died can be taken over online.
export const HistoryWriterLeases = new Mongo.Collection('historyWriterLeases');
HistoryWriterLeases.deny({ insert: () => true, update: () => true, remove: () => true });
Meteor.startup(async () => {
  await ensureIndex(HistoryChainHeads, { boardId: 1 }, { unique: true });
  await ensureIndex(HistoryWriterGates, { boardId: 1 }, { unique: true });
  await ensureIndex(HistoryWriterLeases, { boardId: 1 });
});
const { leaseMs, graceMs } = historyWriterLeasePolicy();
const writerStorage = () => ({ gates: HistoryWriterGates.rawCollection(), leases: HistoryWriterLeases.rawCollection(),
  history: ChangeHistory.rawCollection(), leaseMs });

// Internal initialization only: the caller must exclude all legacy writers.
export function initializeStoredHistoryChain({ boardId, assertExclusive }) {
  return initializeHistoryChain({ heads: HistoryChainHeads.rawCollection(),
    history: ChangeHistory.rawCollection(), boardId, assertExclusive });
}

// Prepare the COMPLETE schema-normalized snapshot before reserving it. A row
// that fails ordinary validation must not poison the durable pending slot.
export function prepareStoredHistoryRow(input) {
  if (!input || typeof input._id !== 'string' || !input._id ||
      !(input.createdAt instanceof Date) || !Number.isFinite(input.createdAt.getTime()) ||
      Object.hasOwn(input, 'previousHash') || Object.hasOwn(input, 'integrityHash')) {
    throw new Error('history-chain-input-invalid');
  }
  const row = EJSON.parse(EJSON.stringify({ boardId: null, swimlaneId: null, listId: null,
    cardId: null, group: null, previousContent: null, newContent: null, undone: false,
    undoneAt: null, isCheckpoint: false, batchId: null, restoredFromId: null,
    restoredByUserId: null, superseded: false, ...input }), { relaxed: true });
  const { _id, ...document } = row;
  const validation = ChangeHistory.simpleSchema().newContext();
  if (!validation.validate(document)) throw new Error('history-chain-schema-invalid');
  return row;
}

export async function appendStoredHistoryChain({ row, assertCurrent }) {
  row = prepareStoredHistoryRow(row);
  if (typeof assertCurrent !== 'function') throw new Error('history-chain-ownership-required');
  await assertCurrent();
  const heads = HistoryChainHeads.rawCollection();
  const head = await heads.findOne({ _id: historyChainId(row.boardId) });
  await assertCurrent();
  if (!head) throw new Error('history-chain-not-initialized');
  validateHistoryChainHead(head, row.boardId);
  return appendHistoryChain({ row, initialHash: head.hash, assertCurrent,
    heads: { findOne: (...args) => heads.findOne(...args), replaceOne: (...args) => heads.replaceOne(...args),
      // Never silently recreate a deleted head from a stale initialHash.
      insertOne: async () => { throw new Error('history-chain-not-initialized'); } },
    history: { findOne: selector => ChangeHistory.findOneAsync(selector, { transform: null }),
      insertOne: async document => ({ insertedId: await ChangeHistory.insertAsync(document,
        { removeEmptyStrings: false, trimStrings: false }) }) } });
}


// Ordinary recording participates immediately, but boards remain on their old
// append path until explicitly migrated. Schema errors precede admission.
ChangeHistory.withHistoryWriter = async ({ boardId, row, write, legacy }) => {
  const prepared = prepareStoredHistoryRow({ ...row, _id: row._id ?? Random.id() });
  return withHistoryWriter({ ...writerStorage(), boardId,
    // Each legacy insert is claimed under the writer's lease, so a writer that
    // dies mid-insert can be fenced and taken over online.
    writeLegacy: ({ assertCurrent, fencedInsert }) => write(async document => {
      const doc = { ...document, _id: document._id ?? prepared._id };
      const id = await fencedInsert(doc._id, () => legacy(doc)); await assertCurrent(); return id;
    }),
    writeCoordinated: () => write(() => appendStoredHistoryChain({ row: prepared, assertCurrent: async () => {} })) });
};

// Sync History (server/lib/syncHistoryBatch.js) plans rows as content and links
// each one when it is appended (maintainer decision of 2026-09-30). On a
// legacy board the whole batch holds one writer token, so a migration drains
// it; on a coordinated board each row goes through the chain head, like an
// ordinary edit, so nothing is refused and nothing forks.
ChangeHistory.admitHistoryWriter = ({ boardId, work }) => withHistoryWriter({
  ...writerStorage(), boardId,
  writeLegacy: ({ assertCurrent, fencedInsert }) => work({ mode: 'legacy', assertCurrent, fencedInsert }),
  writeCoordinated: () => work({ mode: 'coordinated', assertCurrent: async () => {} }) });

// Append one planned Sync row, idempotently by its _id: a retry that finds
// the row returns it, and the caller checks it is the planned content.
ChangeHistory.appendSyncHistoryRow = async ({ row, mode, assertCurrent, fencedInsert }) => {
  if (mode === 'coordinated') return appendStoredHistoryChain({ row, assertCurrent });
  if (mode !== 'legacy') throw new Error('history-chain-mode-invalid');
  if (typeof fencedInsert !== 'function') throw new Error('history-writer-fence-required');
  const prepared = prepareStoredHistoryRow(row);
  await assertCurrent();
  const existing = await ChangeHistory.findOneAsync(prepared._id, { transform: null });
  // A fence tombstone holds this id: an earlier attempt was taken over.
  if (existing) {
    if (existing.boardId !== prepared.boardId) throw new Error('history-writer-fenced');
    return prepared._id;
  }
  // After the chain's TIP: from the newest hashed row, follow its successors.
  // A Sync batch's rows share one planned createdAt, so "newest" alone is a
  // tie and would give an earlier batch row a second successor - a fork.
  let previous = await ChangeHistory.findOneAsync(
    { boardId: prepared.boardId, integrityHash: { $nin: [null, ''] } }, { sort: { createdAt: -1 }, transform: null });
  for (let steps = 0; previous && steps < 10000; steps++) {
    const next = await ChangeHistory.findOneAsync({ boardId: prepared.boardId, previousHash: previous.integrityHash },
      { transform: null });
    if (!next) break;
    previous = next;
  }
  const saved = { ...prepared, previousHash: previous ? previous.integrityHash : null };
  saved.integrityHash = hashHistoryRow(saved);
  await assertCurrent();
  try { await fencedInsert(prepared._id, () => ChangeHistory.insertAsync(saved, { removeEmptyStrings: false, trimStrings: false })); }
  catch (error) {
    const found = await ChangeHistory.findOneAsync(prepared._id, { transform: null });
    if (!found || found.boardId !== prepared.boardId) throw error;
  }
  return prepared._id;
};

// No automatic rollout: callers must prove older server versions cannot write.
// Drain/resume uses the same durable migration UUID, never a timed takeover.
export function migrateStoredHistoryChain({ boardId, migrationId, assertDeploymentExclusive }) {
  return migrateHistoryChain({ ...writerStorage(), heads: HistoryChainHeads.rawCollection(),
    boardId, migrationId, assertDeploymentExclusive, graceMs });
}

// Take every abandoned writer of a board online (Admin/CLI use).
export function recoverStoredHistoryWriters({ boardId }) {
  return recoverExpiredHistoryWriters({ ...writerStorage(), boardId, graceMs });
}
