'use strict';

// Board Settings / Card and Board Settings / Board View reorder by drag and
// drop (2026-10-02). With drag handles on, the handle where the up/down arrows
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

for (const handles of [false, true]) {
  test(`Board Settings / Card reorders by dragging the ${handles ? 'handle' : 'label'}`, async ({ boardPage: page, board, user }) => {
    setHandles(user.id, handles);
    try {
      await page.reload();
      await openPopup(page, 'boardCardSettings');
      const column = page.locator('.js-card-field-order-sortable[data-side="card"]');
      await expect(column).toBeVisible();
      const row = key => column.locator(`.js-card-field-order-row[data-key="${key}"]`);
      // The handle exists only with drag handles on; without them the label is the handle.
      await expect(column.locator('a.card-field-order-handle')).toHaveCount(handles ? await column.locator('.js-card-field-order-row').count() : 0);
      // Negative: the head rows sit at a fixed place, so they are not dragged.
      await expect(row('cardNumber')).not.toHaveClass(/is-positioned/);
      const grip = key => (handles ? row(key).locator('a.js-card-field-order-handle') : row(key).locator('.card-field-order-label.js-card-field-order-handle'));
      // Drag the Due date row onto Received date: Due date goes first among the dates.
      await dragOnto(page, grip('dueDate'), row('receivedDate'));
      await expect.poll(() => {
        const order = db.findOne('boards', { _id: board.boardId }).cardFieldOrder || [];
        return order.indexOf('dueDate') < order.indexOf('receivedDate');
      }).toBe(true);
      // The rows are redrawn from the stored order, not left as dropped.
      const keys = await column.locator('.js-card-field-order-row.is-positioned').evaluateAll(rows => rows.map(r => r.dataset.key));
      expect(keys.indexOf('dueDate')).toBeLessThan(keys.indexOf('receivedDate'));
      // The keyboard: Down on the focused grip moves the row one step back.
      await grip('dueDate').focus();
      await page.keyboard.press('ArrowDown');
      await expect.poll(() => {
        const order = db.findOne('boards', { _id: board.boardId }).cardFieldOrder || [];
        return order.indexOf('dueDate') > order.indexOf('receivedDate');
      }).toBe(true);
      // Negative: a modifier row has no place, so nothing of it is draggable.
      await expect(row('checklistDueDate')).not.toHaveClass(/is-positioned/);
      await expect(row('checklistDueDate').locator('.js-card-field-order-handle')).toHaveCount(0);
    } finally {
      db.updateOne('users', { _id: user.id }, { $unset: { 'profile.showDesktopDragHandles': '' } });
    }
  });
}

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
