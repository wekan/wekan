'use strict';

// #6821: keep the newest KEEP non-checkpoint position-history entries per user
// and board. The daily cleanup used to ask every user's every board - one query
// per board membership, each fetching up to 1000 whole documents - which on a
// 24-pod installation was 148,660 queries per run to trim nothing.
//
// The plan here asks the database which user/board pairs are over the limit,
// and visits only those: the KEEPth newest entry's date with one indexed query,
// everything older in one remove. The result is the same as before, also for a
// pair whose user has since left the board (which the old loop skipped).
//
// The database calls are passed in, so this runs in plain Node
// (tests/positionHistoryCleanup.test.cjs).

const KEEP_PER_USER_BOARD = 1000;

function overLimitPipeline(keep = KEEP_PER_USER_BOARD) {
  return [
    { $match: { isCheckpoint: { $ne: true } } },
    { $group: { _id: { userId: '$userId', boardId: '$boardId' }, n: { $sum: 1 } } },
    { $match: { n: { $gt: keep } } },
  ];
}

// db: { overLimit(pipeline) -> [{ _id: { userId, boardId } }],
//       oldestKept({ userId, boardId }, keep) -> Date | null,
//       remove({ userId, boardId, before }) -> number }
async function trimPositionHistory(db, { keep = KEEP_PER_USER_BOARD, pause = async () => {} } = {}) {
  const over = await db.overLimit(overLimitPipeline(keep));
  let removed = 0;
  for (const { _id: { userId, boardId } } of over) {
    const before = await db.oldestKept({ userId, boardId }, keep);
    if (before) removed += (await db.remove({ userId, boardId, before })) || 0;
    await pause();
  }
  return { pairs: over.length, removed };
}

module.exports = { KEEP_PER_USER_BOARD, overLimitPipeline, trimPositionHistory };
