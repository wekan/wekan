'use strict';
const { randomUUID } = require('node:crypto');
const fail = () => { throw new Error('Scrum History checkpoint conflict'); };
function scrumHistorySelector(journal) {
  if (!journal || !['_id', 'rowId', 'userId'].every(key => typeof journal[key] === 'string' && journal[key]) ||
      !['undo', 'redo', 'restore'].includes(journal.direction) ||
      !Array.isArray(journal.content?.records) || !Array.isArray(journal.before?.records) ||
      !Array.isArray(journal.revisions) || journal.content.records.length !== journal.before.records.length ||
      journal.content.records.length !== journal.revisions.length ||
      (Object.hasOwn(journal, 'operationId') && (typeof journal.operationId !== 'string' || !journal.operationId))) fail();
  return { _id: journal._id, rowId: journal.rowId, userId: journal.userId, direction: journal.direction,
    operationId: Object.hasOwn(journal, 'operationId') ? journal.operationId : { $exists: false },
    content: { $eq: journal.content }, before: { $eq: journal.before }, revisions: { $eq: journal.revisions } };
}
async function assertScrumHistoryOperation(pending, journal) {
  if (!journal.operationId || !await pending.findOneAsync(scrumHistorySelector(journal))) fail();
}
// Upgrade old checkpoints with compare-and-set, then adopt only the winning ID
// for the unchanged plan. Concurrent workers never overwrite each other's ID.
async function ensureScrumHistoryOperation(pending, journal, newId = randomUUID) {
  const selector = scrumHistorySelector(journal);
  if (journal.operationId) { await assertScrumHistoryOperation(pending, journal); return journal; }
  const operationId = newId();
  if (typeof operationId !== 'string' || !operationId) fail();
  let error;
  try { await pending.updateAsync(selector, { $set: { operationId } }); }
  catch (failure) { error = failure; }
  const { operationId: absent, ...plan } = selector;
  let saved;
  try { saved = await pending.findOneAsync(plan); } catch (failure) { throw error || failure; }
  if (!saved || typeof saved.operationId !== 'string' || !saved.operationId) throw error || new Error('Scrum History checkpoint unconfirmed');
  await assertScrumHistoryOperation(pending, saved);
  return saved;
}
module.exports = { scrumHistorySelector, assertScrumHistoryOperation, ensureScrumHistoryOperation };
