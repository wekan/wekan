'use strict';
const { createHash } = require('node:crypto');
const { EJSON } = require('bson');
const { scrumHistorySelector } = require('./scrumHistoryOwnership');
const { rowHashIsValid, canonical } = require('../../models/lib/changeHistoryIntegrity');

const fail = () => { throw new Error('Scrum History completion conflict'); };
const digest = value => createHash('sha256')
  .update(canonical(EJSON.serialize(value, { relaxed: false }))).digest('hex');

function completionIdentity(journal, row) {
  const selector = scrumHistorySelector(journal);
  if (!journal.operationId || !rowHashIsValid(row) ||
      journal.rowId !== row._id || journal._id !== row.boardId) fail();
  return { _id: journal.operationId, version: 1, boardId: journal._id,
    rowId: journal.rowId, userId: journal.userId, direction: journal.direction,
    sourceHash: row.integrityHash, planHash: digest(selector) };
}

// Evidence is immutable and keyed by the operation, never by the board's latest
// undo state. A later undo/redo cycle cannot rewrite an earlier completion.
async function readCompletion(completions, expected) {
  const saved = await completions.findOneAsync(expected._id);
  if (!saved) return null;
  const { completedAt, checksum, ...identity } = saved;
  if (!(completedAt instanceof Date) || !Number.isFinite(completedAt.getTime()) ||
      digest(identity) !== digest(expected) ||
      checksum !== digest({ ...identity, completedAt })) fail();
  return saved;
}

async function readScrumHistoryCompletion(completions, journal, row) {
  return readCompletion(completions, completionIdentity(journal, row));
}

// A persisted request pins the operation and immutable source before the
// checkpoint exists. Its receipt remains usable after checkpoint cleanup;
// completion proves historical execution, not the board's current contents.
async function readScrumHistoryRequestCompletion(completions, request) {
  const { _id, boardId, userId, direction, selection } = request;
  if (selection.kind !== 'scrum') fail();
  const saved = await completions.findOneAsync(_id);
  if (!saved) return null;
  if (typeof saved.planHash !== 'string' || !/^[a-f0-9]{64}$/.test(saved.planHash)) fail();
  return readCompletion({ findOneAsync: async () => saved }, { _id, version: 1,
    boardId, userId, direction, rowId: selection.rowId,
    sourceHash: selection.sourceHash, planHash: saved.planHash });
}

async function saveScrumHistoryCompletion(completions, journal, row, now) {
  const identity = completionIdentity(journal, row);
  const completedAt = now();
  if (!(completedAt instanceof Date) || !Number.isFinite(completedAt.getTime())) fail();
  const receipt = { ...identity, completedAt };
  receipt.checksum = digest(receipt);
  let failure;
  try { await completions.insertAsync(receipt); }
  catch (error) { failure = error; }
  // Includes duplicate insert and lost acknowledgement: the first exact stored
  // receipt wins, including its original timestamp. Never replace or upsert it.
  const saved = await readScrumHistoryCompletion(completions, journal, row);
  if (!saved) throw failure || new Error('Scrum History completion unconfirmed');
  return saved;
}

module.exports = { readScrumHistoryCompletion, saveScrumHistoryCompletion, readScrumHistoryRequestCompletion };
