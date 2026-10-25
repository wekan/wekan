'use strict';

// docs/Features/Cards/Card-Fields.md: an opened card shows only the fields it
// has data in, plus its description, attachments and comments; "+ Add" under
// the cover - the Admin Panel's left menu and pane - adds the rest.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

// "+ Add" opens Board Settings / Card - the same popup - for this card.
const addPopup = page => page.locator('.js-pop-over[data-popup="boardCardSettingsPopup"]');

async function openCard(page, board) {
  const bp = new BoardPage(page);
  const cp = new CardPage(page);
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  await cp.waitForOpen();
  return page.locator('.card-details');
}

test('an empty card shows its description, attachments and comments - and no empty date or member', async ({ boardPage: page, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('cards', { _id: card._id }, { $unset: { dueAt: '', startAt: '', receivedAt: '', endAt: '', shownFields: '', hiddenFields: '' }, $set: { members: [], assignees: [], labelIds: [] } });
  const details = await openCard(page, board);
  await expect(details.locator('.card-details-group-description, .js-card-description, .card-description')).not.toHaveCount(0);
  await expect(details.locator('.js-toggle-card-section[data-section="attachments"]')).toHaveCount(1);
  await expect(details.locator('.js-toggle-card-section[data-section="comments"]')).toHaveCount(1);
  // Negative: no empty Date, Members or Labels section.
  await expect(details.locator('.js-add-due-date, .card-details-item-due')).toHaveCount(0);
  await expect(details.locator('.card-details-item-members')).toHaveCount(0);
  await expect(details.locator('.card-details-item-labels')).toHaveCount(0);
  // "+ Add" is under the cover, above the fields.
  const add = details.locator('.js-open-card-add-fields');
  await expect(add).toBeVisible();
  const addBox = await add.boundingBox();
  const descBox = await details.locator('.card-details-items').boundingBox();
  expect(addBox.y).toBeLessThan(descBox.y + 1);
});

test('"+ Add": sections on the left, fields with checkboxes on the right; ticking shows the field', async ({ boardPage: page, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsDueDate: true, allowsMembers: true } });
  db.updateOne('cards', { _id: card._id }, { $unset: { dueAt: '', shownFields: '', hiddenFields: '' }, $set: { members: [] } });
  const details = await openCard(page, board);
  await details.locator('.js-open-card-add-fields').click();
  const popup = addPopup(page);
  await expect(popup).toBeVisible();
  // The Admin Panel's own menu and pane title.
  await expect(popup.locator('.setting-content .content-body .side-menu')).toBeVisible();
  await expect(popup.locator('.js-card-settings-menu[data-id="date"]')).toBeVisible();
  await expect(popup.locator('.js-card-settings-menu[data-id="members"]')).toBeVisible();
  await expect(popup.locator('.admin-pane-title')).toBeVisible();
  // Each row: Show on Minicard, Show on Card - and, from a card, On this card.
  await expect(popup.locator('.card-settings-side-head-minicard')).toBeVisible();
  await expect(popup.locator('.card-settings-side-head-card')).toBeVisible();
  await expect(popup.locator('.card-settings-side-head-this')).toBeVisible();

  // Date: Due is unticked on an empty card; ticking it shows it on the card.
  await popup.locator('.js-card-settings-menu[data-id="date"]').click();
  const due = popup.locator('.js-card-add-field[data-key="dueDate"]');
  await expect(due).toHaveAttribute('aria-checked', 'false');
  await due.click();
  await expect(due).toHaveAttribute('aria-checked', 'true');
  await expect.poll(() => db.findOne('cards', { _id: card._id }).shownFields).toEqual(['dueDate']);

  // Members section: the pane changes to its fields.
  await popup.locator('.js-card-settings-menu[data-id="members"]').click();
  await expect(popup.locator('.js-card-add-field[data-key="members"]')).toBeVisible();
  // The board-wide checkboxes of the same row are there too.
  await expect(popup.locator('.js-card-field-order-row[data-key="members"][data-side="card"] .card-field-order-toggle')).toBeVisible();
  await expect(popup.locator('.js-card-field-order-row[data-key="members"][data-side="minicard"] .card-field-order-toggle')).toBeVisible();
  await expect(popup.locator('.js-card-add-field[data-key="dueDate"]')).toHaveCount(0);

  // Unticking an always-shown field hides it from this card.
  await popup.locator('.js-card-settings-menu[data-id="comments"]').click();
  await popup.locator('.js-card-add-field[data-key="comments"]').click();
  await expect.poll(() => db.findOne('cards', { _id: card._id }).hiddenFields).toEqual(['comments']);
  await expect(details.locator('.js-toggle-card-section[data-section="comments"]')).toHaveCount(0);
});

test('a field with data is shown without adding it, unless the board turns it off', async ({ boardPage: page, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsDueDate: true } });
  db.updateOne('cards', { _id: card._id }, { $set: { dueAt: new Date(Date.now() + 86400000) }, $unset: { shownFields: '', hiddenFields: '' } });
  const details = await openCard(page, board);
  await expect(details.locator('.card-details-item-due, .js-edit-due-date, .card-date.due-date').first()).toBeVisible();
  // Negative: Board Settings / Card off - not on the card, and its Show on
  // Card checkbox in the same popup is unticked.
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsDueDate: false } });
  await expect(details.locator('.card-details-item-due, .js-edit-due-date')).toHaveCount(0);
  await details.locator('.js-open-card-add-fields').click();
  await addPopup(page).locator('.js-card-settings-menu[data-id="date"]').click();
  await expect(addPopup(page).locator('.js-card-field-order-row[data-key="dueDate"][data-side="card"] .card-field-order-toggle')).not.toHaveClass(/is-checked/);
});

test('the "+ Add" popup moves by its title, maximizes beside its close button, and shows the labels', async ({ boardPage: page, board }) => {
  const details = await openCard(page, board);
  await details.locator('.js-open-card-add-fields').click();
  const popup = addPopup(page);
  await expect(popup).toBeVisible();
  // Wide enough for the pane's labels, not only the checkboxes and icons.
  const label = popup.locator('.card-settings-line-label').first();
  await expect(label).toBeVisible();
  const labelBox = await label.boundingBox();
  const popupBox = await popup.boundingBox();
  expect(labelBox.width).toBeGreaterThan(30);
  expect(labelBox.x + labelBox.width).toBeLessThanOrEqual(popupBox.x + popupBox.width + 1);
  // Maximize / minimize sit before the close X.
  const max = popup.locator('.js-popup-maximize');
  await expect(max).toBeVisible();
  expect((await max.boundingBox()).x).toBeLessThan((await popup.locator('.js-close-pop-over').boundingBox()).x);
  // Moved by its title bar.
  const before = await popup.boundingBox();
  const title = await popup.locator('.header-title').boundingBox();
  await page.mouse.move(title.x + 10, title.y + title.height / 2);
  await page.mouse.down();
  await page.mouse.move(title.x - 30, title.y + title.height / 2 + 40, { steps: 5 });
  await page.mouse.up();
  const after = await popup.boundingBox();
  expect(Math.abs(after.x - before.x) + Math.abs(after.y - before.y)).toBeGreaterThan(20);
  // Maximized, it fills the window; minimized, it is back.
  await max.click();
  await expect(popup).toHaveClass(/pop-over--maximized/);
  await popup.locator('.js-popup-minimize').click();
  await expect(popup).not.toHaveClass(/pop-over--maximized/);
});

test('"Scrum settings" is the section title, not repeated before each Scrum row', async ({ boardPage: page, board }) => {
  const details = await openCard(page, board);
  await details.locator('.js-open-card-add-fields').click();
  const popup = addPopup(page);
  await popup.locator('.js-card-settings-menu[data-id="scrum"]').click();
  await expect(popup.locator('.admin-pane-title')).toBeVisible();
  const labels = await popup.locator('.card-settings-line-label').allTextContents();
  expect(labels.length).toBeGreaterThan(0);
  const scrumTitle = (await popup.locator('.admin-pane-title').textContent()).trim();
  for (const text of labels) expect(text).not.toContain(scrumTitle);
});
