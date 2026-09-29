import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import ChangeHistory from '/models/changeHistory';
import { ensureIndex } from '/server/lib/mongoStartup';
const { EJSON } = require('bson');
const { appendHistoryChain, historyChainId, validateHistoryChainHead } = require('./historyChainAppend');
const { initializeHistoryChain } = require('./historyChainBootstrap');
const { withHistoryWriter } = require('./historyWriterGate');
const { migrateHistoryChain } = require('./historyChainMigration');

export const HistoryWriterGates = new Mongo.Collection('historyWriterGates');
HistoryWriterGates.deny({ insert: () => true, update: () => true, remove: () => true });
export const HistoryChainHeads = new Mongo.Collection('historyChainHeads');
HistoryChainHeads.deny({ insert: () => true, update: () => true, remove: () => true });
Meteor.startup(async () => {
  await ensureIndex(HistoryChainHeads, { boardId: 1 }, { unique: true });
  await ensureIndex(HistoryWriterGates, { boardId: 1 }, { unique: true });
});

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
  return withHistoryWriter({ gates: HistoryWriterGates.rawCollection(), boardId,
    writeLegacy: ({ assertCurrent }) => write(async document => {
      await assertCurrent(); const id = await legacy(document); await assertCurrent(); return id;
    }),
    writeCoordinated: () => write(() => appendStoredHistoryChain({ row: prepared, assertCurrent: async () => {} })) });
};

// Sync History (server/lib/syncHistoryBatch.js) writes rows it hashed when it
// planned them. It holds a legacy writer token for the whole batch, so a
// migration drains it; on a coordinated board it is refused rather than
// appended around the head, until a multi-row chain reservation exists.
ChangeHistory.admitHistoryWriter = ({ boardId, work }) => withHistoryWriter({
  gates: HistoryWriterGates.rawCollection(), boardId, writeLegacy: work,
  writeCoordinated: async () => { throw new Error('sync-history-coordination-required'); } });

// No automatic rollout: callers must prove older server versions cannot write.
// Drain/resume uses the same durable migration UUID, never a timed takeover.
export function migrateStoredHistoryChain({ boardId, migrationId, assertDeploymentExclusive }) {
  return migrateHistoryChain({ gates: HistoryWriterGates.rawCollection(),
    heads: HistoryChainHeads.rawCollection(), history: ChangeHistory.rawCollection(),
    boardId, migrationId, assertDeploymentExclusive });
}
