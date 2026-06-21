'use strict';

/**
 * Spec 35 — List reorder permissions (#5462)
 *
 * "Sorting lists is not working" with `r {error: 403, reason: 'Access denied'}`
 * in the browser console. Root cause: read-only / comment-only board members
 * could still drag-reorder lists (one of the three jQuery-UI sortables in
 * client/components/swimlanes/swimlanes.js was not gated on
 * `Utils.canModifyBoard()`), which fires a server write that allow/deny then
 * rejects with HTTP 403 "Access denied" — so the list snaps back and the
 * console shows the error.
 *
 * The data-integrity boundary is enforced server-side and is exercised here
 * directly over DDP (so it runs even when the board view is not rendering):
 *   - a read-only member's list-reorder is rejected and the stored order is
 *     unchanged, via BOTH the `updateListSort` method and a direct collection
 *     write (the exact 403 the reporter saw);
 *   - a write-access member CAN reorder and it persists (regression guard for
 *     the related #5997 "order not persisted").
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

// Run a Meteor method/DDP call in the page context and return {err, result}.
async function ddp(page, name, args) {
  return page.evaluate(
    ({ name, args }) =>
      new Promise(resolve => {
        // eslint-disable-next-line no-undef
        Meteor.apply(name, args, (err, result) =>
          resolve({
            err: err
              ? { error: err.error, reason: err.reason, message: err.message }
              : null,
            result,
          }),
        );
      }),
    { name, args },
  );
}

function addMember(boardId, userId, flags) {
  db.updateOne(
    'boards',
    { _id: boardId },
    {
      $push: {
        members: {
          userId,
          isAdmin: false,
          isActive: true,
          isNoComments: false,
          isCommentOnly: false,
          isWorker: false,
          isReadOnly: false,
          isReadAssignedOnly: false,
          ...flags,
        },
      },
    },
  );
}

test.describe('List reorder permissions (#5462)', () => {
  test('read-only member cannot reorder lists; write member can (#5462 / #5997)', async ({
    browser,
    user, // board owner (write access)
    user2, // will be the read-only member
    board,
  }) => {
    addMember(board.boardId, user2.id, { isReadOnly: true });

    const targetList = board.listIds[2];
    const originalSort = db.findOne('lists', { _id: targetList }, { sort: 1 }).sort;

    // --- Read-only member: both write paths must be denied, order unchanged ---
    const roCtx = await browser.newContext();
    const roPage = await roCtx.newPage();
    await loginWithToken(roPage, user2.id, user2.token);

    const roMethod = await ddp(roPage, 'updateListSort', [
      targetList,
      board.boardId,
      { sort: -999 },
    ]);
    expect(roMethod.err, 'read-only updateListSort must be rejected').not.toBeNull();
    expect(roMethod.err.error).toBe('permission-denied');

    const roDirect = await ddp(roPage, '/lists/update', [
      { _id: targetList },
      { $set: { sort: -999 } },
    ]);
    expect(roDirect.err, 'read-only direct list write must be rejected').not.toBeNull();
    // This is the exact error from the #5462 report.
    expect(roDirect.err.error).toBe(403);
    expect(roDirect.err.reason).toBe('Access denied');

    expect(
      db.findOne('lists', { _id: targetList }, { sort: 1 }).sort,
      'stored list order must be unchanged after denied attempts',
    ).toBe(originalSort);

    await roCtx.close();

    // --- Write-access owner: reorder succeeds and persists (#5997) ---
    const okCtx = await browser.newContext();
    const okPage = await okCtx.newPage();
    await loginWithToken(okPage, user.id, user.token);

    const okMethod = await ddp(okPage, 'updateListSort', [
      targetList,
      board.boardId,
      { sort: -3 },
    ]);
    expect(okMethod.err, 'owner updateListSort must succeed').toBeNull();
    expect(
      db.findOne('lists', { _id: targetList }, { sort: 1 }).sort,
      'new list order must persist to the database',
    ).toBe(-3);

    await okCtx.close();
  });
});
