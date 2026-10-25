'use strict';

// Board Settings / Board View reorders by drag and drop (2026-10-02); Board
// Settings / Card by order arrows since its rows are in sections (2026-10-25). With drag handles on, the handle where the up/down arrows
// were is what is dragged; with them off, the row's icon and label are. The
// Up and Down keys on the focused handle or label move a row one step.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

async function openPopup(page, name) {
  await page.evaluate(popup => {
    Popup.close();
    Popup.open(popup)({ currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} });
  }, name);
}
const setHandles = (userId, on) => db.updateOne('users', { _id: userId },
  { $set: { 'profile.showDesktopDragHandles': on } });
async function dragOnto(page, source, target) {
  // The Card list is long and scrolls inside the popup: bring both rows in.
  await target.scrollIntoViewIfNeeded();
  await source.scrollIntoViewIfNeeded();
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2 + 8, { steps: 3 });
  await page.mouse.move(to.x + to.width / 2, to.y + 2, { steps: 12 });
  await page.mouse.up();
}

test('Board Settings / Card reorders by its order arrows and the arrow keys', async ({ boardPage: page, board }) => {
  // docs/Features/Cards/Card-Fields.md (2026-10-25): with the rows in sections,
  // each side of a row has up and down arrows instead of a drag.
  try {
    await openPopup(page, 'boardCardSettings');
    await page.locator('.js-card-settings-menu[data-id="date"]').click();
    const cell = key => page.locator(`.js-card-field-order-row[data-key="${key}"][data-side="card"]`);
    await expect(cell('dueDate')).toBeVisible();
    // Negative: the head rows sit at a fixed place, so they have no arrows.
    await page.locator('.js-card-settings-menu[data-id="card"]').click();
    await expect(cell('cardNumber').locator('.js-card-field-order-up')).toHaveCount(0);
    await page.locator('.js-card-settings-menu[data-id="date"]').click();
    await cell('dueDate').locator('.js-card-field-order-up').click();
    await cell('dueDate').locator('.js-card-field-order-up').click();
    await expect.poll(() => {
      const order = db.findOne('boards', { _id: board.boardId }).cardFieldOrder || [];
      return order.indexOf('dueDate') < order.indexOf('receivedDate');
    }).toBe(true);
    // The keyboard: Down on the focused arrow moves the row one step back.
    await cell('dueDate').locator('.js-card-field-order-down').focus();
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => {
      const order = db.findOne('boards', { _id: board.boardId }).cardFieldOrder || [];
      return order.indexOf('dueDate') > order.indexOf('receivedDate');
    }).toBe(true);
  } finally {
    db.updateOne('boards', { _id: board.boardId }, { $unset: { cardFieldOrder: '' } });
  }
});

test('Board Settings / Board View reorders by drag and drop and by the arrow keys', async ({ boardPage: page, board, user }) => {
  setHandles(user.id, false);
  try {
    await page.reload();
    await openPopup(page, 'boardViewSettings');
    const rows = page.locator('.js-board-view-sortable .js-board-view-row');
    await expect(rows.first()).toBeVisible();
    await expect(page.locator('.js-board-view-sortable a.board-view-order-handle')).toHaveCount(0);
    const label = view => page.locator(`.js-board-view-row[data-view="${view}"] .board-view-drag-label`);
    await dragOnto(page, label('board-view-table'), page.locator('.js-board-view-row[data-view="board-view-swimlanes"]'));
    await expect.poll(() => (db.findOne('boards', { _id: board.boardId }).boardViewOrder || [])[0]).toBe('board-view-table');
    await label('board-view-table').focus();
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => (db.findOne('boards', { _id: board.boardId }).boardViewOrder || []).indexOf('board-view-table')).toBe(1);
    // With drag handles on, the handle is where the arrows were.
    setHandles(user.id, true);
    await page.reload();
    await openPopup(page, 'boardViewSettings');
    await expect(page.locator('.js-board-view-sortable a.board-view-order-handle')).toHaveCount(await rows.count());
  } finally {
    db.updateOne('users', { _id: user.id }, { $unset: { 'profile.showDesktopDragHandles': '' } });
  }
});
