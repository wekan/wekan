const { rowHashIsValid } = require('../../models/lib/changeHistoryIntegrity');

// The timeline events have already been acknowledged. Keep the board journal
// until the original row's undo/redo state is verified, then delete only this
// operation's checkpoint. Retry must not move an existing undoneAt timestamp.
async function finishScrumHistory({ history, pending, row, journal, now = () => new Date() }) {
  const identity = { _id: row.boardId, operationId: journal.operationId,
    rowId: row._id, direction: journal.direction, userId: journal.userId };
  const fail = () => { throw new Error('Scrum History finalization conflict'); };
  if (!['undo', 'redo', 'restore'].includes(journal.direction) ||
      typeof journal.operationId !== 'string' || !journal.operationId ||
      journal.rowId !== row._id || journal._id !== row.boardId) fail();
  const owned = async () => { if (!await pending.findOneAsync(identity)) fail(); };
  const verify = current => {
    if (!rowHashIsValid(current) || current.integrityHash !== row.integrityHash ||
        current.boardId !== row.boardId || current.userId !== row.userId ||
        !!current.superseded !== !!row.superseded) fail();
  };
  await owned();
  let current = await history.findOneAsync(row._id);
  verify(current);
  if (journal.direction !== 'restore') {
    const undone = journal.direction === 'undo';
    if (current.undone !== undone) {
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
  if (await pending.removeAsync(identity) !== 1) fail();
}
module.exports = { finishScrumHistory };
