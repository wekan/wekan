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

// These are the specs of the empty-field rules: the seeded board shows every
// field (helpers/db.js seedBoard, showEmptyCardFields), which they turn off.
test.beforeEach(({ board }) => {
  db.updateOne('boards', { _id: board.boardId }, { $set: { showEmptyCardFields: false } });
});

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
  const scrumMenu = popup.locator('.js-card-settings-menu[data-id="scrum"]');
  await scrumMenu.click();
  // Card Settings opens on Card now, so wait for the pane to BE Scrum's
  // before reading it: read too early, the title was "Card" and every label
  // with "Card" in it failed.
  const scrumTitle = (await scrumMenu.textContent()).trim();
  await expect(popup.locator('.admin-pane-title')).toHaveText(scrumTitle);
  const labels = await popup.locator('.card-settings-line-label').allTextContents();
  expect(labels.length).toBeGreaterThan(0);
  for (const text of labels) expect(text).not.toContain(scrumTitle);
});

// #6806: Show empty - the fields every card of the board shows, empty or not,
// by default the description, attachments and comments.
test('"Show empty": an empty card shows the board\'s chosen fields, the default four can be unticked, and On this card still hides one', async ({ boardPage: page, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsDueDate: true, allowsLabels: true, allowsComments: true }, $unset: { cardFieldsAlwaysShown: '' } });
  db.updateOne('cards', { _id: card._id }, { $unset: { dueAt: '', shownFields: '', hiddenFields: '' }, $set: { labelIds: [] } });
  db.deleteMany('card_comments', { cardId: card._id });
  const details = await openCard(page, board);
  // Negative: before it is ticked, the empty Due date is not on the card.
  await expect(details.locator('.card-details-item-due')).toHaveCount(0);
  await details.locator('.js-open-card-add-fields').click();
  const popup = addPopup(page);
  await expect(popup.locator('.card-settings-side-head-always')).toBeVisible();
  // The default: Comments is ticked.
  await popup.locator('.js-card-settings-menu[data-id="comments"]').click();
  const comments = popup.locator('.js-card-always-show[data-key="comments"]');
  await expect(comments).toHaveAttribute('aria-checked', 'true');
  // Due date: tick it, and every card shows it.
  await popup.locator('.js-card-settings-menu[data-id="date"]').click();
  const due = popup.locator('.js-card-always-show[data-key="dueDate"]');
  await expect(due).toHaveAttribute('aria-checked', 'false');
  await due.click();
  await expect(due).toHaveAttribute('aria-checked', 'true');
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).cardFieldsAlwaysShown)
    .toEqual(['dueDate', 'descriptionTitle', 'descriptionText', 'attachments', 'comments']);
  // The card follows the board: Due date shown, ticked On this card, nothing stored on the card.
  await expect(popup.locator('.js-card-add-field[data-key="dueDate"]')).toHaveAttribute('aria-checked', 'true');
  await expect(details.locator('.card-details-item-due')).toHaveCount(1);
  expect(db.findOne('cards', { _id: card._id }).shownFields || []).toEqual([]);
  // On this card still hides it from this card alone.
  await popup.locator('.js-card-add-field[data-key="dueDate"]').click();
  await expect.poll(() => db.findOne('cards', { _id: card._id }).hiddenFields).toEqual(['dueDate']);
  await expect(details.locator('.card-details-item-due')).toHaveCount(0);
  // Comments unticked: a card without comments has no comments section.
  await popup.locator('.js-card-settings-menu[data-id="comments"]').click();
  await popup.locator('.js-card-always-show[data-key="comments"]').click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).cardFieldsAlwaysShown).not.toContain('comments');
  await expect(details.locator('.js-toggle-card-section[data-section="comments"]')).toHaveCount(0);
});

// Card Settings opens on Card; its "Show empty fields" (off by default) shows
// every field on every card and hides the Show empty columns, keeping their ticks.
test('Card Settings opens on Card, and "Show empty fields" shows every field while keeping the Show empty ticks', async ({ boardPage: page, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsDueDate: true, cardFieldsAlwaysShown: ['labels', 'descriptionTitle', 'descriptionText', 'attachments', 'comments'] }, $unset: { showEmptyCardFields: '' } });
  db.updateOne('cards', { _id: card._id }, { $unset: { dueAt: '', shownFields: '', hiddenFields: '' } });
  const details = await openCard(page, board);
  await details.locator('.js-open-card-add-fields').click();
  const popup = addPopup(page);
  // The topmost entry is open, with Show empty fields unticked under its title.
  await expect(popup.locator('li.active .js-card-settings-menu[data-id="card"]')).toHaveCount(1);
  await expect(popup.locator('li.active .js-card-settings-menu')).toHaveCount(1);
  const showEmpty = popup.locator('.js-show-empty-card-fields');
  await expect(showEmpty).toBeVisible();
  await expect(showEmpty).toHaveAttribute('aria-checked', 'false');
  await expect(details.locator('.card-details-item-due')).toHaveCount(0);
  await expect(popup.locator('.card-settings-side-head-always')).toBeVisible();
  // Ticked: every field on the card, the Show empty column hidden.
  await showEmpty.click();
  await expect(showEmpty).toHaveAttribute('aria-checked', 'true');
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).showEmptyCardFields).toBe(true);
  await expect(details.locator('.card-details-item-due')).toHaveCount(1);
  await expect(popup.locator('.card-settings-side-head-always')).toBeHidden();
  // Negative: the Show empty ticks are kept.
  expect(db.findOne('boards', { _id: board.boardId }).cardFieldsAlwaysShown).toContain('labels');
  // Unticked: the column is back as it was.
  await showEmpty.click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).showEmptyCardFields).toBe(false);
  await expect(popup.locator('.card-settings-side-head-always')).toBeVisible();
  await expect(details.locator('.card-details-item-due')).toHaveCount(0);
  await popup.locator('.js-card-settings-menu[data-id="labels"]').click();
  await expect(popup.locator('.js-card-always-show[data-key="labels"]')).toHaveAttribute('aria-checked', 'true');
});

// Every pane: Select all / Select none under each column heading; a heading
// and the cells under it start at the same x; no label is cut in a 1400px window.
test('Card Settings: Select all / Select none per column, headings aligned with their cells, labels whole', async ({ boardPage: page, board }) => {
  await page.setViewportSize({ width: 1400, height: 1000 });
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsReceivedDate: true, allowsStartDate: true, allowsDueDate: true, allowsEndDate: true }, $unset: { showEmptyCardFields: '', cardFieldsAlwaysShown: '' } });
  db.updateOne('cards', { _id: card._id }, { $unset: { shownFields: '', hiddenFields: '', receivedAt: '', startAt: '', dueAt: '', endAt: '' } });
  const details = await openCard(page, board);
  await details.locator('.js-open-card-add-fields').click();
  const popup = addPopup(page);
  await popup.locator('.js-card-settings-menu[data-id="date"]').click();

  // Aligned: each heading starts where its column's cells start.
  for (const side of ['this', 'minicard', 'card', 'always']) {
    const head = await popup.locator(`.card-settings-side-head-${side}`).boundingBox();
    const sel = side === 'this' ? '.card-settings-side-this' : side === 'always' ? '.card-settings-side-always' : `.card-settings-side-${side}`;
    const cell = await popup.locator(`.card-settings-line ${sel}`).first().boundingBox();
    expect(Math.abs(head.x - cell.x)).toBeLessThan(2);
  }
  // Each of the two lists (Show on Card, Show on Minicard) has its own heading
  // line, so the field column is compared within each list.
  for (const list of ['card', 'minicard']) {
    const scope = popup.locator(`.card-settings-list-${list}`);
    const headLabel = await scope.locator('.card-settings-pane-head-label').boundingBox();
    const rowLabel = await scope.locator('.card-settings-line-label').first().boundingBox();
    expect(Math.abs(headLabel.x - rowLabel.x)).toBeLessThan(2);
  }
  // Whole: every label ends inside the pane.
  const pane = await popup.locator('.main-body').boundingBox();
  for (const label of await popup.locator('.card-settings-line-label').all()) {
    const box = await label.boundingBox();
    expect(box.x + box.width).toBeLessThanOrEqual(pane.x + pane.width + 1);
  }

  // On this card: Select all shows the four empty dates on the card, Select none hides them.
  await popup.locator('.card-settings-side-head-this .js-card-settings-select[data-value="all"]').click();
  await expect.poll(() => (db.findOne('cards', { _id: card._id }).shownFields || []).length).toBeGreaterThanOrEqual(4);
  await expect(popup.locator('.js-card-add-field[aria-checked="false"]')).toHaveCount(0);
  await popup.locator('.card-settings-side-head-this .js-card-settings-select[data-value="none"]').click();
  await expect(popup.locator('.js-card-add-field[aria-checked="true"]')).toHaveCount(0);

  // Show empty: Select all writes the board's list in one go.
  await popup.locator('.card-settings-side-head-always .js-card-settings-select[data-value="all"]').click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).cardFieldsAlwaysShown).toEqual(expect.arrayContaining(['receivedDate', 'startDate', 'dueDate', 'endDate']));
  await popup.locator('.card-settings-side-head-always .js-card-settings-select[data-value="none"]').click();
  await expect(popup.locator('.js-card-always-show[aria-checked="true"]')).toHaveCount(0);

  // Show on Card: Select none unticks the section's rows, Select all ticks them again.
  await popup.locator('.card-settings-side-head-card .js-card-settings-select[data-value="none"]').click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).allowsDueDate).toBe(false);
  await expect(popup.locator('.js-card-field-order-row[data-side="card"] .card-field-order-toggle[aria-checked="true"]')).toHaveCount(0);
  await popup.locator('.card-settings-side-head-card .js-card-settings-select[data-value="all"]').click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).allowsDueDate).toBe(true);
  // Negative: another section's rows are untouched.
  expect(db.findOne('boards', { _id: board.boardId }).allowsMembers).not.toBe(false);
});

// Ask for a reason is the same animated checkbox, in the same place, as Show
// empty fields; Select all / Select none look like the Draggable table's buttons.
test('Card Settings / Card: Ask for a reason lines up with Show empty fields, and the select buttons match Draggable\'s', async ({ boardPage: page, board }) => {
  db.updateOne('boards', { _id: board.boardId }, { $set: { askForMoveReason: false } });
  const details = await openCard(page, board);
  await details.locator('.js-open-card-add-fields').click();
  const popup = addPopup(page);
  const showEmpty = popup.locator('.js-show-empty-card-fields .materialCheckBox');
  const ask = popup.locator('.js-ask-move-reason .materialCheckBox');
  const a = await showEmpty.boundingBox();
  const b = await ask.boundingBox();
  expect(Math.abs(a.x - b.x)).toBeLessThan(1);
  expect(Math.abs(a.width - b.width)).toBeLessThan(1);
  const askLink = popup.locator('.js-ask-move-reason');
  await expect(askLink).toHaveAttribute('aria-checked', 'false');
  await askLink.click();
  await expect(askLink).toHaveAttribute('aria-checked', 'true');
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).askForMoveReason).toBe(true);

  // The same colours as the Draggable table's Select all.
  const style = loc => loc.evaluate(el => {
    const s = getComputedStyle(el);
    return { color: s.color, background: s.backgroundColor };
  });
  const draggable = await style(popup.locator('.board-drag-settings .js-set-settings-column').first());
  const select = await style(popup.locator('.js-card-settings-select').first());
  expect(select).toEqual(draggable);
});
