const { scrumHistorySelector, assertScrumHistoryOperation } = require('./scrumHistoryOwnership');
const { rowHashIsValid } = require('../../models/lib/changeHistoryIntegrity');

// A pending checkpoint must not make an invalidated redo eligible again when
// its source row is reloaded on retry. Compare identity and immutable evidence,
// but reject superseded redo independently of the caller's captured value.
function verifyScrumHistorySource(current, row, direction) {
  if (!rowHashIsValid(current) || current._id !== row._id ||
      current.integrityHash !== row.integrityHash || current.boardId !== row.boardId ||
      current.userId !== row.userId || !!current.superseded !== !!row.superseded ||
      (direction === 'redo' && current.superseded)) {
    throw new Error('Scrum History finalization conflict');
  }
}

// The timeline events have already been acknowledged. Keep the board journal
// until the original row's undo/redo state is verified, then delete only this
// operation's checkpoint. Retry must not move an existing undoneAt timestamp.
async function finishScrumHistory({ history, pending, row, journal, now = () => new Date() }) {
  const identity = scrumHistorySelector(journal);
  const fail = () => { throw new Error('Scrum History finalization conflict'); };
  if (!['undo', 'redo', 'restore'].includes(journal.direction) ||
      typeof journal.operationId !== 'string' || !journal.operationId ||
      journal.rowId !== row._id || journal._id !== row.boardId) fail();
  const owned = () => assertScrumHistoryOperation(pending, journal);
  const verify = current => verifyScrumHistorySource(current, row, journal.direction);
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
  let cleanupError;
  try { await pending.removeAsync(identity); }
  catch (error) { cleanupError = error; }
  // A positive reply can hide a no-op, while a lost reply can follow a real
  // deletion. Inspect the board slot, not only the old operation's selector:
  // a replacement checkpoint must remain untouched and cannot confirm this
  // worker's cleanup. Never retry the deletion against a newly observed row.
  const remaining = await pending.findOneAsync({ _id: journal._id });
  if (remaining) throw cleanupError || new Error('Scrum History cleanup unconfirmed');
}
module.exports = { finishScrumHistory, verifyScrumHistorySource };
