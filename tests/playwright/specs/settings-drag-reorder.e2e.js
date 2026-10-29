'use strict';

// Board Settings / Board View and Board Settings / Card reorder by drag and
// drop (2026-10-02; Card's arrows of 2026-10-25 back to drag and drop on
// 2026-10-27; since 2026-10-28 the opened card's Card Settings, a "Show"
// radio choosing the card's or the minicard's side of each section). With
// drag handles on, the handle is what is dragged, else the row's icon and
// label. The Up and Down keys on the focused handle or label move a row one
// step in its list.
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

test('Board Settings / Card reorders each side by drag and drop and by the arrow keys', async ({ boardPage: page, board, user }) => {
  try {
    setHandles(user.id, false);
    await page.reload();
    await page.evaluate(() => {
      Popup.close();
      Popup.open('boardCardSettings').call({ currentData: () => ({}) }, { currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} });
    });
    // Board Settings / Card is the opened card's Card Settings since
    // 2026-10-28 (cardSettingsInline): each section a checklist, its rows the
    // side the "Show" radio chooses, dragged within their section.
    const popup = page.locator('.js-pop-over[data-popup="boardCardSettingsPopup"]');
    // A pane per side since 2026-10-28 (no "Show" radio): `show` picks which
    // pane the locators below look in.
    let side = 'card';
    const pane = () => popup.locator(`.js-card-settings-pane[data-side="${side}"]`);
    const section = id => pane().locator(`.js-card-settings-section[data-section="${id}"]`);
    const row = key => pane().locator(`.js-card-field-order-row[data-key="${key}"]`);
    const show = async which => { side = which; await expect(pane()).toBeVisible(); };
    await expect(row('dueDate')).toBeVisible();
    // Negative: the head rows sit at a fixed place, so they are not dragged.
    await expect(section('card').locator('.js-card-field-order-row[data-key="cardNumber"] .js-card-field-order-handle')).toHaveCount(0);
    // Drag Due by its name onto Received: first in the section, and in the card's order.
    await dragOnto(page, row('dueDate').locator('.card-settings-line-label'), row('receivedDate'));
    await expect.poll(() => {
      const order = db.findOne('boards', { _id: board.boardId }).cardFieldOrder || [];
      return order.indexOf('dueDate') !== -1 && order.indexOf('dueDate') < order.indexOf('receivedDate');
    }).toBe(true);
    // First of the rows that HAVE a place: the Date section opens with Mark as
    // complete, a head row of the card's title bar drawn at a fixed place
    // (models/lib/cardFieldOrder.js), never moved by the order.
    await expect(section('date').locator('.js-card-field-order-row.is-positioned').first()).toHaveAttribute('data-key', 'dueDate');
    // The minicard's order is its own: untouched.
    expect(db.findOne('boards', { _id: board.boardId }).minicardFieldOrder).toBeFalsy();
    // The keyboard: Down on the focused name moves the row one row back.
    await row('dueDate').locator('.card-settings-line-label').focus();
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => {
      const order = db.findOne('boards', { _id: board.boardId }).cardFieldOrder || [];
      return order.indexOf('dueDate') > order.indexOf('receivedDate');
    }).toBe(true);
    // The minicard's order, by the handle when drag handles are on.
    setHandles(user.id, true);
    await show('minicard');
    await expect(row('endDate')).toHaveAttribute('data-side', 'minicard');
    await expect(row('endDate').locator('a.js-card-field-order-handle')).toBeVisible();
    await dragOnto(page, row('endDate').locator('a.js-card-field-order-handle'), row('receivedDate'));
    await expect.poll(() => {
      const order = db.findOne('boards', { _id: board.boardId }).minicardFieldOrder || [];
      return order.indexOf('endDate') !== -1 && order.indexOf('endDate') < order.indexOf('receivedDate');
    }).toBe(true);
    // Negative: the arrows are gone.
    await expect(page.locator('.js-card-field-order-up, .js-card-field-order-down')).toHaveCount(0);
  } finally {
    setHandles(user.id, false);
    db.updateOne('boards', { _id: board.boardId }, { $unset: { cardFieldOrder: '', minicardFieldOrder: '' } });
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
