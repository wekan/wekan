const { scrumHistorySelector, assertScrumHistoryOperation } = require('./scrumHistoryOwnership');
const { rowHashIsValid } = require('../../models/lib/changeHistoryIntegrity');
const { readScrumHistoryCompletion, saveScrumHistoryCompletion } = require('./scrumHistoryCompletion');

// A pending checkpoint must not make an invalidated redo eligible again when
// its source row is reloaded on retry. Compare identity and immutable evidence,
// but reject superseded redo independently of the caller's captured value.
function verifyScrumHistorySource(current, row, direction) {
  if (!rowHashIsValid(current)) throw new Error('Scrum History finalization conflict');
  verifyScrumHistorySourceState(current, row, direction);
}
// The same, without re-hashing the row's content: for the check before each
// write of an operation whose row was verified whole when it began. A batch
// of a thousand records hashed its row a thousand times.
function verifyScrumHistorySourceState(current, row, direction) {
  if (!current || current._id !== row._id ||
      current.integrityHash !== row.integrityHash || current.boardId !== row.boardId ||
      current.userId !== row.userId || !!current.superseded !== !!row.superseded ||
      (direction === 'redo' && current.superseded)) {
    throw new Error('Scrum History finalization conflict');
  }
}

// The timeline events have already been acknowledged. Keep the board journal
// until the original row's undo/redo state and durable completion are verified,
// then delete only this operation's checkpoint. Retry must not move undoneAt.
async function finishScrumHistory({ history, pending, completions, row, journal, now = () => new Date() }) {
  const identity = scrumHistorySelector(journal);
  const fail = () => { throw new Error('Scrum History finalization conflict'); };
  if (!['undo', 'redo', 'restore'].includes(journal.direction) ||
      typeof journal.operationId !== 'string' || !journal.operationId ||
      journal.rowId !== row._id || journal._id !== row.boardId) fail();
  const owned = () => assertScrumHistoryOperation(pending, journal);
  const verify = current => verifyScrumHistorySource(current, row, journal.direction);
  const cleanup = async () => {
    // A verified receipt can reconcile an absent checkpoint or a successor. It
    // proves this operation finished, not that the board still has its values.
    const checkpoint = await pending.findOneAsync({ _id: journal._id });
    if (!checkpoint || checkpoint.operationId !== journal.operationId) return;
    await owned();
    let cleanupError;
    try { await pending.removeAsync(identity); }
    catch (error) { cleanupError = error; }
    const remaining = await pending.findOneAsync({ _id: journal._id });
    if (remaining?.operationId === journal.operationId) {
      throw cleanupError || new Error('Scrum History cleanup unconfirmed');
    }
  };
  if (await readScrumHistoryCompletion(completions, journal, row)) {
    await cleanup();
    return;
  }
  await owned();
  let current = await history.findOneAsync(row._id);
  verify(current);
  if (journal.direction !== 'restore') {
    const undone = journal.direction === 'undo';
    if (current.undone !== undone) {
      await owned();
      const count = await history.updateAsync({ _id: row._id, boardId: row.boardId,
        userId: row.userId, integrityHash: row.integrityHash,
        superseded: Object.hasOwn(current, 'superseded') ? current.superseded : { $exists: false },
        undone: current.undone }, {
        $set: { undone, undoneAt: undone ? now() : null },
      });
      if (count !== 1) fail();
    }
    // Do not equate a matched update with a persisted final state. This also
    // catches a concurrent change before discarding the recovery evidence.
    current = await history.findOneAsync(row._id);
    verify(current);
    if (current.undone !== undone || (undone
      ? !(current.undoneAt instanceof Date) || !Number.isFinite(current.undoneAt.getTime())
      : current.undoneAt !== null)) fail();
  }
  await owned();
  await saveScrumHistoryCompletion(completions, journal, row, now);
  await cleanup();
}
module.exports = { finishScrumHistory, verifyScrumHistorySource, verifyScrumHistorySourceState };
