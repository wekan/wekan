'use strict';

// docs/Features/Cards/Card-Fields.md: an opened card shows only the fields it
// has data in, plus its description, attachments and comments; "Card
// Settings" under the cover (it was "+ Add") adds the rest - right on the
// card, its sections as checklists (docs/Features/Cards/Card-Settings-On-Card.md).
// Board Settings / Card still opens the same settings as a popup.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

// Board Settings / Card: the popup, opened the way the board's cog menu does.
const settingsPopup = page => page.locator('.js-pop-over[data-popup="boardCardSettingsPopup"]');
async function openBoardCardSettings(page) {
  await page.evaluate(() => {
    Popup.close();
    Popup.open('boardCardSettings')({ currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} });
  });
  await expect(settingsPopup(page)).toBeVisible();
}

// These are the specs of the empty-field rules: the seeded board shows every
// field (helpers/db.js seedBoard, showEmptyCardFields), which they turn off.
test.beforeEach(({ board }) => {
  db.updateOne('boards', { _id: board.boardId }, { $set: { showEmptyCardFields: false }, $unset: { cardSettingsSectionOrder: '' } });
});

async function openCard(page, board) {
  const bp = new BoardPage(page);
  const cp = new CardPage(page);
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  await cp.waitForOpen();
  return page.locator('.card-details');
}

// Card Settings on the card: the button, then what replaced it.
async function openCardSettings(details) {
  await details.locator('.js-open-card-add-fields').click();
  const inline = details.locator('.js-card-settings-inline');
  await expect(inline).toBeVisible();
  return inline;
}
const sectionOf = (inline, id) => inline.locator(`.js-card-settings-section[data-section="${id}"]`);
const itemOf = (inline, key) => inline.locator(`.js-card-field-order-row[data-key="${key}"]`);
async function openItemMenu(page, inline, key) {
  await itemOf(inline, key).locator('.js-open-card-settings-item-menu').click();
  const menu = page.locator('.js-pop-over[data-popup="cardSettingsItemPopup"]');
  await expect(menu).toBeVisible();
  return menu;
}
// A hamburger's popup closes by its X, as every popup does.
async function closePopup(page) {
  const close = page.locator('.js-pop-over .js-close-pop-over');
  await close.first().click();
  await expect(page.locator('.js-pop-over')).toHaveCount(0);
}
async function openSectionMenu(page, inline, id) {
  await sectionOf(inline, id).locator('.js-open-card-settings-section-menu').click();
  const menu = page.locator('.js-pop-over[data-popup="cardSettingsSectionPopup"]');
  await expect(menu).toBeVisible();
  return menu;
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
  // "Card Settings" - no longer "+ Add" - is under the cover, above the fields.
  const add = details.locator('.js-open-card-add-fields');
  await expect(add).toBeVisible();
  await expect(add).toHaveText(/Card Settings/);
  await expect(add).not.toHaveText(/\+ ?Add/);
  const addBox = await add.boundingBox();
  const descBox = await details.locator('.card-details-items').boundingBox();
  expect(addBox.y).toBeLessThan(descBox.y + 1);
});

test('Card Settings replaces the button and the card below it: title and X, Show, the sections as checklists', async ({ boardPage: page, board }) => {
  const details = await openCard(page, board);
  const inline = await openCardSettings(details);
  // The button and everything below it are replaced, not covered: no popup.
  await expect(details.locator('.js-open-card-add-fields')).toHaveCount(0);
  await expect(details.locator('.card-details-left')).toHaveCount(0);
  await expect(details.locator('.card-details-right')).toHaveCount(0);
  await expect(settingsPopup(page)).toHaveCount(0);
  // Top to bottom: the title with its X at the right of the same line, Show
  // and its radios (Show on Card chosen), then the sections.
  const title = await inline.locator('.card-settings-inline-title').boundingBox();
  const close = await inline.locator('.js-close-card-settings').boundingBox();
  expect(close.x).toBeGreaterThan(title.x);
  expect(Math.abs((close.y + close.height / 2) - (title.y + title.height / 2))).toBeLessThan(title.height);
  const show = await inline.locator('.card-settings-inline-show').boundingBox();
  expect(show.y).toBeGreaterThan(title.y);
  await expect(inline.locator('.js-card-settings-show-side[value="card"]')).toBeChecked();
  await expect(inline.locator('.js-card-settings-show-side[value="minicard"]')).not.toBeChecked();
  const first = await inline.locator('.js-card-settings-section').first().boundingBox();
  expect(first.y).toBeGreaterThan(show.y);
  // The sections in the table's order, each a title with its count and hamburger.
  await expect(inline.locator('.js-card-settings-section').first()).toHaveAttribute('data-section', 'card');
  const date = sectionOf(inline, 'date');
  await expect(date.locator('.card-settings-inline-section-title')).toBeVisible();
  await expect(date.locator('.card-settings-inline-section-count')).toHaveText(/^\d+\/\d+$/);
  await expect(date.locator('.js-open-card-settings-section-menu')).toBeVisible();
  await expect(itemOf(date, 'dueDate')).toBeVisible();
  // The X puts the card back.
  await inline.locator('.js-close-card-settings').click();
  await expect(inline).toHaveCount(0);
  await expect(details.locator('.js-open-card-add-fields')).toBeVisible();
  await expect(details.locator('.card-details-left')).toHaveCount(1);
});

test('the checkbox is the chosen side\'s Show on Card / Show on Minicard, for the whole board', async ({ boardPage: page, board }) => {
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsDueDate: true, allowsDueDateOnMinicard: false } });
  const details = await openCard(page, board);
  const inline = await openCardSettings(details);
  const toggle = () => itemOf(inline, 'dueDate').locator('.card-field-order-toggle');
  // Show on Card: Due is on for the board's cards.
  await expect(itemOf(inline, 'dueDate')).toHaveAttribute('data-side', 'card');
  await expect(toggle()).toHaveAttribute('aria-checked', 'true');
  await toggle().click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).allowsDueDate).toBe(false);
  await expect(toggle()).toHaveAttribute('aria-checked', 'false');
  // Negative: the minicard's setting is not touched by the card's checkbox.
  expect(db.findOne('boards', { _id: board.boardId }).allowsDueDateOnMinicard).toBe(false);
  await toggle().click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).allowsDueDate).toBe(true);
  // Show on Minicard: the same rows, now the minicard's checkboxes.
  await inline.locator('.js-card-settings-show-side[value="minicard"]').check();
  await expect(itemOf(inline, 'dueDate')).toHaveAttribute('data-side', 'minicard');
  await expect(toggle()).toHaveAttribute('aria-checked', 'false');
  await toggle().click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).allowsDueDateOnMinicard).toBe(true);
  expect(db.findOne('boards', { _id: board.boardId }).allowsDueDate).toBe(true);
});

test('a row\'s hamburger: On this card shows an empty field, and hides one with data', async ({ boardPage: page, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsDueDate: true, allowsComments: true } });
  db.updateOne('cards', { _id: card._id }, { $unset: { dueAt: '', shownFields: '', hiddenFields: '' } });
  const details = await openCard(page, board);
  const inline = await openCardSettings(details);
  const menu = await openItemMenu(page, inline, 'dueDate');
  const thisCard = menu.locator('.js-card-add-field[data-key="dueDate"]');
  await expect(thisCard).toHaveAttribute('aria-checked', 'false');
  await thisCard.click();
  await expect(thisCard).toHaveAttribute('aria-checked', 'true');
  await expect.poll(() => db.findOne('cards', { _id: card._id }).shownFields).toEqual(['dueDate']);
  // Unticking an always-shown field hides it from this card.
  const comments = await openItemMenu(page, inline, 'comments');
  await comments.locator('.js-card-add-field[data-key="comments"]').click();
  await expect.poll(() => db.findOne('cards', { _id: card._id }).hiddenFields).toEqual(['comments']);
  await closePopup(page);
  await inline.locator('.js-close-card-settings').click();
  await expect(details.locator('.card-details-item-due')).toHaveCount(1);
  await expect(details.locator('.js-toggle-card-section[data-section="comments"]')).toHaveCount(0);
});

test('a field with data is shown without adding it, unless the board turns it off', async ({ boardPage: page, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsDueDate: true } });
  db.updateOne('cards', { _id: card._id }, { $set: { dueAt: new Date(Date.now() + 86400000) }, $unset: { shownFields: '', hiddenFields: '' } });
  const details = await openCard(page, board);
  await expect(details.locator('.card-details-item-due, .js-edit-due-date, .card-date.due-date').first()).toBeVisible();
  // Negative: Board Settings / Card off - not on the card, and its Show on
  // Card checkbox in Card Settings is unticked.
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsDueDate: false } });
  await expect(details.locator('.card-details-item-due, .js-edit-due-date')).toHaveCount(0);
  const inline = await openCardSettings(details);
  await expect(itemOf(inline, 'dueDate').locator('.card-field-order-toggle')).not.toHaveClass(/is-checked/);
});

test('sections drag like checklists, rows within their section; sections collapse', async ({ boardPage: page, board, user }) => {
  db.updateOne('users', { _id: user.id }, { $set: { 'profile.showDesktopDragHandles': false } });
  const details = await openCard(page, board);
  const inline = await openCardSettings(details);
  // Both ends on screen: the target scrolled to the top, the source (a few
  // sections below it) under it - scrolling each into view in turn could
  // leave the other above the window, and the drop then landed nowhere.
  const drag = async (source, target) => {
    await target.evaluate(el => el.scrollIntoView({ block: 'start' }));
    const from = await source.boundingBox();
    const to = await target.boundingBox();
    const height = page.viewportSize().height;
    expect(to.y).toBeGreaterThanOrEqual(0);
    expect(from.y + from.height).toBeLessThanOrEqual(height);
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2 + 8, { steps: 3 });
    await page.mouse.move(to.x + to.width / 2, to.y + 2, { steps: 12 });
    await page.mouse.up();
  };
  // Members dragged by its title above Date.
  await drag(sectionOf(inline, 'members').locator('.card-settings-inline-section-title'), sectionOf(inline, 'date').locator('.card-settings-inline-section-title'));
  await expect.poll(() => {
    const order = db.findOne('boards', { _id: board.boardId }).cardSettingsSectionOrder || [];
    return order.indexOf('members') !== -1 && order.indexOf('members') < order.indexOf('date');
  }).toBe(true);
  const ids = await inline.locator('.js-card-settings-section').evaluateAll(els => els.map(el => el.dataset.section));
  expect(ids.indexOf('members')).toBeLessThan(ids.indexOf('date'));
  // The keyboard: Down on the focused title moves it one step back.
  await sectionOf(inline, 'members').locator('.card-settings-inline-section-title').focus();
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => {
    const order = db.findOne('boards', { _id: board.boardId }).cardSettingsSectionOrder || [];
    return order.indexOf('members') > order.indexOf('date');
  }).toBe(true);
  // A row within its section: Due dragged above Received moves it on the card.
  const date = sectionOf(inline, 'date');
  await drag(itemOf(date, 'dueDate').locator('.card-settings-line-label'), itemOf(date, 'receivedDate'));
  await expect.poll(() => {
    const order = db.findOne('boards', { _id: board.boardId }).cardFieldOrder || [];
    return order.indexOf('dueDate') < order.indexOf('receivedDate');
  }).toBe(true);
  // Collapsed: the rows hidden, the title and its count still there; kept per user.
  await date.locator('.js-toggle-card-settings-section').click();
  await expect(date).toHaveClass(/is-collapsed/);
  await expect(itemOf(date, 'dueDate')).toBeHidden();
  await expect(date.locator('.card-settings-inline-section-count')).toBeVisible();
  await expect.poll(() => db.findOne('users', { _id: user.id }).profile.collapsedCardSections?.[board.boardId]?.['card-settings-date']).toBe(true);
  await date.locator('.js-toggle-card-settings-section').click();
  await expect(itemOf(date, 'dueDate')).toBeVisible();
  db.updateOne('boards', { _id: board.boardId }, { $unset: { cardFieldOrder: '', cardSettingsSectionOrder: '' } });
});

test('"Scrum settings" is the section title, not repeated before each Scrum row', async ({ boardPage: page, board }) => {
  const details = await openCard(page, board);
  const inline = await openCardSettings(details);
  const scrum = sectionOf(inline, 'scrum');
  const scrumTitle = (await scrum.locator('.card-settings-inline-section-title').textContent()).trim();
  const labels = await scrum.locator('.card-settings-line-label').allTextContents();
  expect(labels.length).toBeGreaterThan(0);
  for (const text of labels) expect(text).not.toContain(scrumTitle);
});

// #6806: Show empty - the fields every card of the board shows, empty or not,
// by default the description, attachments and comments - in a row's hamburger.
test('"Show empty": an empty card shows the board\'s chosen fields, the default four can be unticked, and On this card still hides one', async ({ boardPage: page, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsDueDate: true, allowsLabels: true, allowsComments: true }, $unset: { cardFieldsAlwaysShown: '' } });
  db.updateOne('cards', { _id: card._id }, { $unset: { dueAt: '', shownFields: '', hiddenFields: '' }, $set: { labelIds: [] } });
  db.deleteMany('card_comments', { cardId: card._id });
  const details = await openCard(page, board);
  // Negative: before it is ticked, the empty Due date is not on the card.
  await expect(details.locator('.card-details-item-due')).toHaveCount(0);
  const inline = await openCardSettings(details);
  // The default: Comments is ticked.
  let menu = await openItemMenu(page, inline, 'comments');
  await expect(menu.locator('.js-card-always-show[data-key="comments"]')).toHaveAttribute('aria-checked', 'true');
  // Due date: tick it, and every card shows it.
  menu = await openItemMenu(page, inline, 'dueDate');
  const due = menu.locator('.js-card-always-show[data-key="dueDate"]');
  await expect(due).toHaveAttribute('aria-checked', 'false');
  await due.click();
  await expect(due).toHaveAttribute('aria-checked', 'true');
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).cardFieldsAlwaysShown)
    .toEqual(['dueDate', 'descriptionTitle', 'descriptionText', 'attachments', 'comments']);
  // The card follows the board: ticked On this card, nothing stored on the card.
  await expect(menu.locator('.js-card-add-field[data-key="dueDate"]')).toHaveAttribute('aria-checked', 'true');
  expect(db.findOne('cards', { _id: card._id }).shownFields || []).toEqual([]);
  // On this card still hides it from this card alone.
  await menu.locator('.js-card-add-field[data-key="dueDate"]').click();
  await expect.poll(() => db.findOne('cards', { _id: card._id }).hiddenFields).toEqual(['dueDate']);
  // Comments unticked: a card without comments has no comments section.
  menu = await openItemMenu(page, inline, 'comments');
  await menu.locator('.js-card-always-show[data-key="comments"]').click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).cardFieldsAlwaysShown).not.toContain('comments');
  await closePopup(page);
  await inline.locator('.js-close-card-settings').click();
  await expect(details.locator('.card-details-item-due')).toHaveCount(0);
  await expect(details.locator('.js-toggle-card-section[data-section="comments"]')).toHaveCount(0);
});

// Card's hamburger holds what is not a field: Show empty fields (off by
// default), which shows every field and takes Show empty out of the rows'
// hamburgers while keeping its ticks.
test('Card\'s hamburger: "Show empty fields" shows every field while keeping the Show empty ticks', async ({ boardPage: page, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsDueDate: true, cardFieldsAlwaysShown: ['labels', 'descriptionTitle', 'descriptionText', 'attachments', 'comments'] }, $unset: { showEmptyCardFields: '' } });
  db.updateOne('cards', { _id: card._id }, { $unset: { dueAt: '', shownFields: '', hiddenFields: '' } });
  const details = await openCard(page, board);
  const inline = await openCardSettings(details);
  const menu = await openSectionMenu(page, inline, 'card');
  const showEmpty = menu.locator('.js-show-empty-card-fields');
  await expect(showEmpty).toHaveAttribute('aria-checked', 'false');
  await showEmpty.click();
  await expect(showEmpty).toHaveAttribute('aria-checked', 'true');
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).showEmptyCardFields).toBe(true);
  // Negative: the Show empty ticks are kept, and Show empty leaves the rows' hamburgers.
  expect(db.findOne('boards', { _id: board.boardId }).cardFieldsAlwaysShown).toContain('labels');
  await closePopup(page);
  const due = await openItemMenu(page, inline, 'dueDate');
  await expect(due.locator('.js-card-always-show')).toHaveCount(0);
  await closePopup(page);
  // Unticked: Show empty is back, as it was.
  const again = await openSectionMenu(page, inline, 'card');
  await again.locator('.js-show-empty-card-fields').click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).showEmptyCardFields).toBe(false);
  await closePopup(page);
  const labels = await openItemMenu(page, inline, 'labels');
  await expect(labels.locator('.js-card-always-show[data-key="labels"]')).toHaveAttribute('aria-checked', 'true');
});

// #6830: "Show empty fields" shows only what the board allows - with Board
// Settings / Scrum all off, no "Scrum settings" on the card.
test('"Show empty fields" shows no Scrum section while the board has Scrum off', async ({ boardPage: page, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('cards', { _id: card._id }, { $unset: { scrum: '', shownFields: '', hiddenFields: '' } });
  db.updateOne('boards', { _id: board.boardId }, { $set: { showEmptyCardFields: true, 'scrum.visibility': {} } });
  const scrumHeading = details => details.locator('.js-toggle-card-section[data-section="scrum"]');
  let details = await openCard(page, board);
  await expect(details.locator('.js-toggle-card-section[data-section="description"]')).toBeVisible();
  await expect(scrumHeading(details)).toHaveCount(0);
  // Negative: the field the board turns on is there, empty.
  db.updateOne('boards', { _id: board.boardId }, { $set: { 'scrum.visibility': { cardSprint: true } } });
  await page.reload({ waitUntil: 'domcontentloaded' });
  details = await openCard(page, board);
  await expect(scrumHeading(details)).toHaveCount(1);
});

// A section's hamburger: Select all / Select none of the shown side, of On
// this card and of Show empty, for that section's rows only.
test('a section\'s hamburger selects all or none of its rows, per column', async ({ boardPage: page, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsReceivedDate: true, allowsStartDate: true, allowsDueDate: true, allowsEndDate: true }, $unset: { showEmptyCardFields: '', cardFieldsAlwaysShown: '' } });
  db.updateOne('cards', { _id: card._id }, { $unset: { shownFields: '', hiddenFields: '', receivedAt: '', startAt: '', dueAt: '', endAt: '' } });
  const details = await openCard(page, board);
  const inline = await openCardSettings(details);
  const date = sectionOf(inline, 'date');
  const select = async (column, value) => {
    const menu = await openSectionMenu(page, inline, 'date');
    await menu.locator(`.js-card-settings-inline-select[data-column="${column}"][data-value="${value}"]`).click();
    await closePopup(page);
  };
  // On this card: all four empty dates shown on the card, then none.
  await select('this', 'all');
  await expect.poll(() => (db.findOne('cards', { _id: card._id }).shownFields || []).length).toBeGreaterThanOrEqual(4);
  await select('this', 'none');
  await expect.poll(() => (db.findOne('cards', { _id: card._id }).shownFields || []).length).toBe(0);
  // Show empty: one write of the board's list.
  await select('always', 'all');
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).cardFieldsAlwaysShown).toEqual(expect.arrayContaining(['receivedDate', 'startDate', 'dueDate', 'endDate']));
  await select('always', 'none');
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).cardFieldsAlwaysShown).not.toContain('dueDate');
  // Show on Card: the section's checkboxes, through their own handlers.
  await select('card', 'none');
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).allowsDueDate).toBe(false);
  await expect(date.locator('.card-field-order-toggle[aria-checked="true"]')).toHaveCount(0);
  await select('card', 'all');
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).allowsDueDate).toBe(true);
  // Negative: another section's rows are untouched.
  expect(db.findOne('boards', { _id: board.boardId }).allowsMembers).not.toBe(false);
});

// Card's hamburger: Ask for a reason is the same animated checkbox, in the
// same place, as Show empty fields; the select buttons look like Draggable's.
test('Card\'s hamburger: Ask for a reason lines up with Show empty fields, and the select buttons match Draggable\'s', async ({ boardPage: page, board }) => {
  db.updateOne('boards', { _id: board.boardId }, { $set: { askForMoveReason: false } });
  const details = await openCard(page, board);
  const inline = await openCardSettings(details);
  const menu = await openSectionMenu(page, inline, 'card');
  const a = await menu.locator('.js-show-empty-card-fields .materialCheckBox').boundingBox();
  const b = await menu.locator('.js-ask-move-reason .materialCheckBox').boundingBox();
  expect(Math.abs(a.x - b.x)).toBeLessThan(1);
  expect(Math.abs(a.width - b.width)).toBeLessThan(1);
  const askLink = menu.locator('.js-ask-move-reason');
  await expect(askLink).toHaveAttribute('aria-checked', 'false');
  await askLink.click();
  await expect(askLink).toHaveAttribute('aria-checked', 'true');
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).askForMoveReason).toBe(true);
  const style = loc => loc.evaluate(el => {
    const s = getComputedStyle(el);
    return { color: s.color, background: s.backgroundColor };
  });
  const draggable = await style(menu.locator('.board-drag-settings .js-set-settings-column').first());
  const selectButton = await style(menu.locator('.js-card-settings-inline-select').first());
  expect(selectButton).toEqual(draggable);
});

// ── Board Settings / Card: the popup ────────────────────────────────────────

test('Board Settings / Card is still the popup: it moves by its title, maximizes beside its close button, shows the labels', async ({ boardPage: page }) => {
  await openBoardCardSettings(page);
  const popup = settingsPopup(page);
  const label = popup.locator('.card-settings-line-label').first();
  await expect(label).toBeVisible();
  const labelBox = await label.boundingBox();
  const popupBox = await popup.boundingBox();
  expect(labelBox.width).toBeGreaterThan(30);
  expect(labelBox.x + labelBox.width).toBeLessThanOrEqual(popupBox.x + popupBox.width + 1);
  const max = popup.locator('.js-popup-maximize');
  await expect(max).toBeVisible();
  expect((await max.boundingBox()).x).toBeLessThan((await popup.locator('.js-close-pop-over').boundingBox()).x);
  const before = await popup.boundingBox();
  const title = await popup.locator('.header-title').boundingBox();
  await page.mouse.move(title.x + 10, title.y + title.height / 2);
  await page.mouse.down();
  await page.mouse.move(title.x - 30, title.y + title.height / 2 + 40, { steps: 5 });
  await page.mouse.up();
  const after = await popup.boundingBox();
  expect(Math.abs(after.x - before.x) + Math.abs(after.y - before.y)).toBeGreaterThan(20);
  await max.click();
  await expect(popup).toHaveClass(/pop-over--maximized/);
  await popup.locator('.js-popup-minimize').click();
  await expect(popup).not.toHaveClass(/pop-over--maximized/);
  // Negative: with no card, no On this card column.
  await expect(popup.locator('.card-settings-side-head-this')).toHaveCount(0);
});

test('Board Settings / Card: headings aligned with their cells, labels whole', async ({ boardPage: page }) => {
  await page.setViewportSize({ width: 1400, height: 1000 });
  await openBoardCardSettings(page);
  const popup = settingsPopup(page);
  await popup.locator('.js-card-settings-menu[data-id="date"]').click();
  for (const side of ['minicard', 'card', 'always']) {
    const head = await popup.locator(`.card-settings-side-head-${side}`).boundingBox();
    const cell = await popup.locator(`.card-settings-line .card-settings-side-${side}`).first().boundingBox();
    expect(Math.abs(head.x - cell.x)).toBeLessThan(2);
  }
  for (const list of ['card', 'minicard']) {
    const scope = popup.locator(`.card-settings-list-${list}`);
    const headLabel = await scope.locator('.card-settings-pane-head-label').boundingBox();
    const rowLabel = await scope.locator('.card-settings-line-label').first().boundingBox();
    expect(Math.abs(headLabel.x - rowLabel.x)).toBeLessThan(2);
  }
  const pane = await popup.locator('.main-body').boundingBox();
  for (const label of await popup.locator('.card-settings-line-label').all()) {
    const box = await label.boundingBox();
    expect(box.x + box.width).toBeLessThanOrEqual(pane.x + pane.width + 1);
  }
});
