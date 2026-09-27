'use strict';
const fail = (code, message) => { throw Object.assign(new Error(message), { code }); };

async function withScheduledSyncActor({ credential, list, findUser, findBoard,
  canWrite, assignedScope, withActor, run, assertCurrent }) {
  const userId = credential?.runAsUserId;
  if (typeof userId !== 'string' || !userId) fail('sync-actor-required',
    'Save Sync settings again to authorize scheduled runs with your account.');
  const guard = async () => {
    await assertCurrent();
    const user = await findUser(userId);
    const board = await findBoard(list.boardId);
    if (!user || user.loginDisabled || !board || !canWrite(userId, board) || assignedScope(board, userId)) {
      fail('sync-actor-denied', 'The account authorizing scheduled Sync no longer has full-list write access. Save Sync settings with an authorized account.');
    }
  };
  await guard();
  return withActor(userId, () => run(guard));
}
module.exports = { withScheduledSyncActor };
