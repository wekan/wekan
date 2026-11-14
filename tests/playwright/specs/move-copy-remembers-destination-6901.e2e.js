'use strict';
// #6901: the Move / Copy card popup remembered only the board chosen last
// time, not its swimlane and list - for another board than the open one, they
// were checked before that board's swimlanes and lists had arrived, and so
// reset to the first. tests/moveCopyRemembersDestination6901.test.cjs drives
// the dialog class; this opens the real popups.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

function seedTarget(user) {
  const target = db.seedBoard({ ownerId: user.id, title: 'Remembered destination' });
  const lane2 = db.uid('swim');
  const now = new Date();
  db.insertOne('swimlanes', { _id: lane2, title: 'Second lane', boardId: target.boardId, sort: 2, type: 'swimlane',
    archived: false, createdAt: now, updatedAt: now, modifiedAt: now });
  // Board-wide lists, offered in every swimlane.
  db.updateMany('lists', { boardId: target.boardId }, { $set: { swimlaneId: '' } });
  return { target, lane2 };
}

async function openPopup(page, board, action) {
  const source = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  await new BoardPage(page).clickCard(source.listId, source.title);
  const card = new CardPage(page);
  await card.waitForOpen();
  await card.openActionsMenu();
  await card.clickAction(action);
  return { source, popup: page.locator('.js-pop-over') };
}

for (const action of ['.js-move-card', '.js-copy-card']) {
  test(`${action} opens on the board, swimlane and list chosen last time`, async ({ boardPage: page, user, board }) => {
    const { target, lane2 } = seedTarget(user);
    try {
      db.updateOne('users', { _id: user.id }, { $set: { [`profile.moveAndCopyDialog.${board.boardId}`]: {
        boardId: target.boardId, swimlaneId: lane2, listId: target.listIds[2], cardId: '' } } });
      await page.reload();
      await expect(page.locator('.js-minicard').first()).toBeVisible({ timeout: 30_000 });
      const { popup } = await openPopup(page, board, action);
      await expect(popup.locator('select.js-select-boards')).toHaveValue(target.boardId);
      await expect(popup.locator('select.js-select-swimlanes')).toHaveValue(lane2);
      await expect(popup.locator('select.js-select-lists')).toHaveValue(target.listIds[2]);
    } finally { db.cleanup({ boardIds: [target.boardId] }); }
  });
}

test('a move to another board is remembered with its swimlane and list, and a deleted list falls back to the first', async ({ boardPage: page, user, board }) => {
  const { target, lane2 } = seedTarget(user);
  try {
    let { source, popup } = await openPopup(page, board, '.js-move-card');
    await popup.locator('select.js-select-boards').selectOption(target.boardId);
    await expect(popup.locator('select.js-select-swimlanes option')).not.toHaveCount(0);
    await popup.locator('select.js-select-swimlanes').selectOption(lane2);
    await popup.locator('select.js-select-lists').selectOption(target.listIds[1]);
    await popup.locator('.js-done').click();
    await expect.poll(() => db.getCard(source._id)).toMatchObject({ boardId: target.boardId, swimlaneId: lane2, listId: target.listIds[1] });
    expect(db.findOne('users', { _id: user.id }).profile.moveAndCopyDialog[board.boardId])
      .toMatchObject({ boardId: target.boardId, swimlaneId: lane2, listId: target.listIds[1] });

    // Negative: the remembered list is gone - the popup offers the first list
    // of the remembered swimlane rather than an empty or stale choice.
    db.insertOne('cards', { ...db.findOne('cards', { _id: source._id }), _id: db.uid('card'), boardId: board.boardId,
      swimlaneId: board.swimlaneId, listId: board.listIds[0], title: 'Alpha Card' });
    db.updateOne('lists', { _id: target.listIds[1] }, { $set: { archived: true } });
    await page.reload();
    await expect(page.locator('.js-minicard').first()).toBeVisible({ timeout: 30_000 });
    ({ popup } = await openPopup(page, board, '.js-move-card'));
    await expect(popup.locator('select.js-select-boards')).toHaveValue(target.boardId);
    await expect(popup.locator('select.js-select-swimlanes')).toHaveValue(lane2);
    await expect(popup.locator('select.js-select-lists')).toHaveValue(target.listIds[0]);
  } finally { db.cleanup({ boardIds: [target.boardId] }); }
});
