'use strict';

// docs/Features/Cards/Card-Fields.md: an opened card shows EVERY field its
// board shows on cards, empty or not; "Card Settings" under the cover (it was
// "+ Add") opens Card Settings right on the card, its sections as checklists
// (docs/Features/Cards/Card-Settings.md) - each with a checkbox of its
// own for the whole section, a one-row section as one line, Custom Fields'
// items the board's custom fields. Board Settings / Card is the same template,
// cardSettingsInline, in a popup.
//
// Deliberate change (2026-10-28): "On this card", "Show empty" and "Show empty
// fields" are gone, with the hamburger's Select all / Select none; the specs
// of those are replaced below by the specs of what replaced them.
//
// Deliberate change (2026-10-28, later): Board Settings / Card shows BOTH
// sides at once, a Minicard pane and a Card pane, instead of a "Show" radio
// choosing one - so a spec that switched the radio now uses the other pane
// (paneOf); and a hamburger opens its content UNDER its line inside the pane
// instead of as a popup layer on top of Card Settings - so the specs of the
// layer are the specs of the panel now.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

// Board Settings / Card: the popup, opened the way the board's cog menu does.
const settingsPopup = page => page.locator('.js-pop-over[data-popup="boardCardSettingsPopup"]');
async function openBoardCardSettings(page) {
  await page.evaluate(() => {
    Popup.close();
    // As the cog menu's entry does: Card Settings with no card.
    Popup.open('boardCardSettings').call({ currentData: () => ({}) }, { currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} });
  });
  await expect(settingsPopup(page)).toBeVisible();
}

// Every spec starts from the board's own order and no section hidden.
test.beforeEach(({ board }) => {
  db.updateOne('boards', { _id: board.boardId }, { $unset: { cardSettingsSectionOrder: '', minicardSettingsSectionOrder: '', cardSettingsHiddenOnCard: '', cardSettingsHiddenOnMinicard: '' } });
});

async function openCard(page, board) {
  const bp = new BoardPage(page);
  const cp = new CardPage(page);
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  await cp.waitForOpen();
  return page.locator('.card-details');
}

// Card Settings is Board Settings / Card: the popup's two panes. One side's
// pane - the Card pane unless asked for the Minicard's.
const paneOf = (page, side = 'card') => settingsPopup(page).locator(`.js-card-settings-pane[data-side="${side}"]`);
async function openCardSettings(page, side = 'card') {
  await openBoardCardSettings(page);
  const inline = paneOf(page, side);
  await expect(inline).toBeVisible();
  return inline;
}
const sectionOf = (inline, id) => inline.locator(`.js-card-settings-section[data-section="${id}"]`);
const itemOf = (inline, key) => inline.locator(`.js-card-field-order-row[data-key="${key}"]`);
async function openItemMenu(page, inline, key) {
  await itemOf(inline, key).locator('.js-open-card-settings-item-menu').click();
  const menu = inline.locator('.js-card-settings-panel[data-kind="row"]');
  await expect(menu).toBeVisible();
  return menu;
}
// A hamburger of Card Settings opens its content under its line, inside the
// pane (sidebar.jade cardSettingsInlinePanel); the popup's X closes Card
// Settings, the panel's X the panel alone.
async function closePopup(page) {
  const close = page.locator('.js-pop-over .js-close-pop-over');
  await close.first().click();
  await expect(page.locator('.js-pop-over')).toHaveCount(0);
}
async function backToCardSettings(page) {
  await settingsPopup(page).locator('.js-close-card-settings-panel').first().click();
  await expect(settingsPopup(page).locator('.js-card-settings-panel')).toHaveCount(0);
  await expect(settingsPopup(page)).toBeVisible();
}
async function openSectionMenu(page, inline, id) {
  await sectionOf(inline, id).locator('.js-open-card-settings-section-menu').click();
  const menu = sectionOf(inline, id).locator('.js-card-settings-panel[data-kind="section"]');
  await expect(menu).toBeVisible();
  return menu;
}

// A hamburger opens its content UNDER its line, inside the pane, pushing the
// rest down - no popup; it shows it is open; its own button, the panel's X,
// another hamburger and Escape close it.
test('a hamburger opens under its section\'s line inside the pane, not on top of Card Settings', async ({ boardPage: page }) => {
  await openBoardCardSettings(page);
  const popup = settingsPopup(page);
  const inline = paneOf(page);
  const head = sectionOf(inline, 'card').locator('.card-settings-inline-section-head');
  const button = head.locator('.js-open-card-settings-section-menu');
  await button.click();
  const panel = sectionOf(inline, 'card').locator('.js-card-settings-panel');
  await expect(panel).toBeVisible();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(button).toHaveClass(/is-open/);
  // No layer, no second popup.
  await expect(popup.locator('.js-popup-layer')).toHaveCount(0);
  await expect(page.locator('.js-pop-over')).toHaveCount(1);
  // Under the section's line, inside the pane; the section below it pushed down.
  const h = await head.boundingBox();
  const l = await panel.boundingBox();
  const p = await inline.boundingBox();
  expect(Math.abs(l.y - (h.y + h.height))).toBeLessThan(14);
  expect(l.x).toBeGreaterThanOrEqual(p.x - 1);
  expect(l.x + l.width).toBeLessThanOrEqual(p.x + p.width + 1);
  const next = await sectionOf(inline, 'time').boundingBox();
  expect(next.y).toBeGreaterThan(l.y + l.height - 1);
  // Its own button closes it.
  await button.click();
  await expect(panel).toHaveCount(0);
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  // The panel's X closes the panel alone, not Card Settings.
  await button.click();
  await panel.locator('.js-close-card-settings-panel').click();
  await expect(panel).toHaveCount(0);
  await expect(popup).toBeVisible();
});

test('an empty card shows every field its board shows on cards - Due, Members, Labels - with no per-card action', async ({ boardPage: page, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsDueDate: true, allowsMembers: true, allowsLabels: true, allowsComments: true } });
  db.updateOne('cards', { _id: card._id }, { $unset: { dueAt: '', startAt: '', receivedAt: '', endAt: '', shownFields: '', hiddenFields: '' }, $set: { members: [], assignees: [], labelIds: [] } });
  const details = await openCard(page, board);
  await expect(details.locator('.card-details-item-due')).toHaveCount(1);
  await expect(details.locator('.card-details-item-members')).toHaveCount(1);
  await expect(details.locator('.card-details-item-labels')).toHaveCount(1);
  await expect(details.locator('.js-toggle-card-section[data-section="comments"]')).toHaveCount(1);
  // A legacy per-card "hidden" choice is not read any more.
  db.updateOne('cards', { _id: card._id }, { $set: { hiddenFields: ['dueDate'] } });
  await page.waitForTimeout(500);
  await expect(details.locator('.card-details-item-due')).toHaveCount(1);
  // Negative: Show on Card off still hides it.
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsDueDate: false } });
  await expect(details.locator('.card-details-item-due')).toHaveCount(0);
  db.updateOne('cards', { _id: card._id }, { $unset: { hiddenFields: '' } });
});

// Deliberate change (2026-10-28): the opened card's "Card Settings" button,
// which drew Card Settings on the card in place of everything below it, is
// gone - Card Settings is only Board Settings / Card.
test('negative: the opened card has no Card Settings button and no Card Settings of its own', async ({ boardPage: page, board }) => {
  const details = await openCard(page, board);
  await expect(details.locator('.card-details-left')).toHaveCount(1);
  await expect(details.locator('.card-details-items').first()).toBeVisible();
  await expect(details.locator('.js-open-card-add-fields')).toHaveCount(0);
  await expect(details.locator('.js-card-settings-inline')).toHaveCount(0);
  await expect(page.locator('.card-details .js-card-settings-inline, .card-details-add-fields')).toHaveCount(0);
});

test('Card Settings is Board Settings / Card: two panes, then the sections as checklists, each with its own checkbox', async ({ boardPage: page, board }) => {
  const inline = await openCardSettings(page);
  // The popup's header is the title and the X: no second title or X inside.
  await expect(settingsPopup(page).locator('.js-close-pop-over')).toBeVisible();
  await expect(inline.locator('.card-settings-inline-head, .js-close-card-settings')).toHaveCount(0);
  // No Show radio: a pane per side, its title over its sections.
  await expect(settingsPopup(page).locator('.js-card-settings-show-side')).toHaveCount(0);
  await expect(paneOf(page, 'minicard')).toBeVisible();
  const head = await inline.locator('.card-settings-pane-head').boundingBox();
  const first = await inline.locator('.js-card-settings-section').first().boundingBox();
  expect(first.y).toBeGreaterThan(head.y);
  // The sections in the Card side's default order - Labels first, as on the
  // opened card - each a title with its checkbox and count.
  await expect(inline.locator('.js-card-settings-section').first()).toHaveAttribute('data-section', 'labels');
  await expect(paneOf(page, 'minicard').locator('.js-card-settings-section').first()).toHaveAttribute('data-section', 'scrum');
  const date = sectionOf(inline, 'date');
  await expect(date.locator('.card-settings-inline-section-title')).toBeVisible();
  await expect(date.locator('.card-settings-inline-section-count')).toHaveText(/^\d+\/\d+$/);
  await expect(date.locator('.js-card-settings-section-shown')).toBeVisible();
  await expect(itemOf(date, 'dueDate')).toBeVisible();
  // List title is a card's own row: there is no card here, so it is not drawn.
  await expect(itemOf(inline, 'listTitle')).toHaveCount(0);
  await closePopup(page);
});

test('the checkbox is the chosen side\'s Show on Card / Show on Minicard, for the whole board', async ({ boardPage: page, board }) => {
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsDueDate: true, allowsDueDateOnMinicard: false } });
  const details = await openCard(page, board);
  const inline = await openCardSettings(page);
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
  // The Minicard pane: the same rows, the minicard's checkboxes.
  const mini = paneOf(page, 'minicard');
  const miniToggle = () => itemOf(mini, 'dueDate').locator('.card-field-order-toggle');
  await expect(itemOf(mini, 'dueDate')).toHaveAttribute('data-side', 'minicard');
  await expect(miniToggle()).toHaveAttribute('aria-checked', 'false');
  await miniToggle().click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).allowsDueDateOnMinicard).toBe(true);
  expect(db.findOne('boards', { _id: board.boardId }).allowsDueDate).toBe(true);
});

test('a hamburger is drawn only when it has something in it: none on Date or its rows, one on Card', async ({ boardPage: page, board, user }) => {
  db.updateOne('users', { _id: user.id }, { $unset: { 'profile.showLabelTextOverride': '', 'profile.showCardLabelTextOverride': '' } });
  const details = await openCard(page, board);
  const inline = await openCardSettings(page);
  const date = sectionOf(inline, 'date');
  await expect(itemOf(date, 'dueDate')).toBeVisible();
  await expect(date.locator('.js-open-card-settings-section-menu')).toHaveCount(0);
  await expect(date.locator('.js-open-card-settings-item-menu')).toHaveCount(0);
  // Card's hamburger: Ask for a reason and the Draggable table - and nothing
  // of the removed On this card / Show empty / Show empty fields / Select all.
  const menu = await openSectionMenu(page, inline, 'card');
  await expect(menu.locator('.js-ask-move-reason')).toBeVisible();
  await expect(menu.locator('.board-drag-settings')).toBeVisible();
  await expect(menu.locator('.js-show-empty-card-fields, .js-card-settings-inline-select, .js-card-add-field, .js-card-always-show')).toHaveCount(0);
  // Its X closes it; Card Settings stays.
  await backToCardSettings(page);
  // Subtasks has the board's Subtask settings: a hamburger. Voting's Edit
  // voting is the card's own (on the card's Voting heading): none here.
  await expect(sectionOf(inline, 'subtasks').locator('.js-open-card-settings-section-menu')).toHaveCount(1);
  await expect(sectionOf(inline, 'vote').locator('.js-open-card-settings-section-menu')).toHaveCount(0);
  await expect(sectionOf(inline, 'customFields').locator('.js-open-card-settings-section-menu')).toHaveCount(0);
  // Negative: no row of the whole Card Settings has an On this card menu.
  await expect(inline.locator('.js-card-add-field, .js-card-always-show')).toHaveCount(0);
  await closePopup(page);
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
  const inline = await openCardSettings(page);
  await expect(itemOf(inline, 'dueDate').locator('.card-field-order-toggle')).not.toHaveClass(/is-checked/);
});

// A space's width between a checkbox and its label, ticked or not, on the
// rows and in a hamburger - and the label stays put when the box is ticked.
test('a checkbox and its label are a space apart, on the rows and in the hamburgers', async ({ boardPage: page, board }) => {
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsDueDate: true, allowsStartDate: false } });
  const details = await openCard(page, board);
  const inline = await openCardSettings(page);
  const gaps = (selector, label) => page.evaluate(([selector, label]) => [...document.querySelectorAll(selector)].map(row => {
    const box = row.querySelector('.materialCheckBox');
    return {
      checked: box.classList.contains('is-checked'),
      gap: row.querySelector(label).getBoundingClientRect().left - box.getBoundingClientRect().right,
      left: Math.round(row.querySelector(label).getBoundingClientRect().left),
    };
  }), [selector, label]);
  await expect(itemOf(inline, 'dueDate').locator('.card-field-order-toggle')).toHaveAttribute('aria-checked', 'true');
  const rows = await gaps('.js-card-settings-pane[data-side="card"] .js-card-settings-section[data-section="date"] .js-card-field-order-row', '.card-settings-line-label');
  expect(rows.some(r => r.checked) && rows.some(r => !r.checked)).toBe(true);
  for (const row of rows) expect(row.gap).toBeGreaterThanOrEqual(3);
  // Negative: ticking moves no label.
  expect(new Set(rows.map(r => r.left)).size).toBe(1);
  const menu = await openSectionMenu(page, inline, 'card');
  await expect(menu.locator('.js-ask-move-reason')).toBeVisible();
  const options = await gaps('.js-card-settings-panel .card-settings-section-menu .card-settings-board-option > a.flex', 'span:last-child');
  // Ask for a reason is the one checkbox left there (Show empty fields is gone).
  expect(options.length).toBeGreaterThanOrEqual(1);
  for (const option of options) expect(option.gap).toBeGreaterThanOrEqual(3);
  await closePopup(page);
});

test('sections drag like checklists, rows within their section; sections collapse', async ({ boardPage: page, board, user }) => {
  db.updateOne('users', { _id: user.id }, { $set: { 'profile.showDesktopDragHandles': false } });
  const details = await openCard(page, board);
  const inline = await openCardSettings(page);
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
  // Negative: the Minicard pane's own order is untouched.
  expect(db.findOne('boards', { _id: board.boardId }).minicardSettingsSectionOrder).toBeFalsy();
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
  const inline = await openCardSettings(page);
  const scrum = sectionOf(inline, 'scrum');
  const scrumTitle = (await scrum.locator('.card-settings-inline-section-title').textContent()).trim();
  const labels = await scrum.locator('.card-settings-line-label').allTextContents();
  expect(labels.length).toBeGreaterThan(0);
  for (const text of labels) expect(text).not.toContain(scrumTitle);
});

// ── The section's own checkbox ──────────────────────────────────────────────

test('Show on Card: unticking a section hides it whole from the opened card, its rows stay ticked; ticking restores', async ({ boardPage: page, board }) => {
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsDueDate: true, allowsStartDate: true, allowsMembers: true, allowsDueDateOnMinicard: true } });
  const details = await openCard(page, board);
  const inline = await openCardSettings(page);
  const date = sectionOf(inline, 'date');
  const box = date.locator('.js-card-settings-section-shown');
  await expect(box).toHaveAttribute('aria-checked', 'true');
  // Left of the title, after the caret.
  const caretBox = await date.locator('.js-toggle-card-settings-section').boundingBox();
  const boxBox = await box.boundingBox();
  const titleBox = await date.locator('.card-settings-inline-section-title').boundingBox();
  expect(caretBox.x).toBeLessThan(boxBox.x);
  expect(boxBox.x).toBeLessThan(titleBox.x);
  await box.click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).cardSettingsHiddenOnCard).toEqual(['date']);
  await expect(box).toHaveAttribute('aria-checked', 'false');
  // The rows keep their own ticks, and the count stays.
  await expect(itemOf(date, 'dueDate').locator('.card-field-order-toggle')).toHaveAttribute('aria-checked', 'true');
  await expect(date.locator('.card-settings-inline-section-count')).toHaveText(/^\d+\/\d+$/);
  expect(db.findOne('boards', { _id: board.boardId }).allowsDueDate).toBe(true);
  await closePopup(page);
  await expect(details.locator('.card-details-item-due')).toHaveCount(0);
  await expect(details.locator('.card-details-item-start')).toHaveCount(0);
  await expect(details.locator('.card-details-item-members')).toHaveCount(1, { timeout: 5000 });
  // The minicard is not affected: its side has its own list.
  expect(db.findOne('boards', { _id: board.boardId }).cardSettingsHiddenOnMinicard || []).toEqual([]);
  // Ticking it back restores exactly what was shown.
  const again = await openCardSettings(page);
  await sectionOf(again, 'date').locator('.js-card-settings-section-shown').click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).cardSettingsHiddenOnCard).toEqual([]);
  await closePopup(page);
  await expect(details.locator('.card-details-item-due')).toHaveCount(1);
  await expect(details.locator('.card-details-item-start')).toHaveCount(1);
});

test('Show on Minicard: unticking a section hides it from every minicard only, the opened card unaffected', async ({ boardPage: page, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsDueDate: true, allowsDueDateOnMinicard: true } });
  db.updateOne('cards', { _id: card._id }, { $set: { dueAt: new Date(Date.now() + 86400000) } });
  const minicard = new BoardPage(page).minicard(board.listIds[0], 'Alpha Card');
  await expect(minicard.locator('.due-date').first()).toBeVisible();
  const details = await openCard(page, board);
  const inline = await openCardSettings(page, 'minicard');
  const date = sectionOf(inline, 'date');
  await expect(itemOf(date, 'dueDate')).toHaveAttribute('data-side', 'minicard');
  await date.locator('.js-card-settings-section-shown').click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).cardSettingsHiddenOnMinicard).toEqual(['date']);
  await expect(itemOf(date, 'dueDate').locator('.card-field-order-toggle')).toHaveAttribute('aria-checked', 'true');
  await expect(minicard.locator('.due-date')).toHaveCount(0);
  // Negative: the card side is untouched - its own checkbox still ticked.
  expect(db.findOne('boards', { _id: board.boardId }).cardSettingsHiddenOnCard || []).toEqual([]);
  await expect(sectionOf(paneOf(page, 'card'), 'date').locator('.js-card-settings-section-shown')).toHaveAttribute('aria-checked', 'true');
  await closePopup(page);
  await expect(details.locator('.card-details-item-due')).toHaveCount(1);
  db.updateOne('boards', { _id: board.boardId }, { $unset: { cardSettingsHiddenOnMinicard: '' } });
  await expect(minicard.locator('.due-date').first()).toBeVisible();
});

test('a section with one row is one line: one checkbox, its name, its hamburger when it has one - the field\'s own flag', async ({ boardPage: page, board }) => {
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsVote: true } });
  const details = await openCard(page, board);
  const inline = await openCardSettings(page);
  const vote = sectionOf(inline, 'vote');
  await expect(vote).toHaveClass(/is-single/);
  await expect(vote.locator('.js-toggle-card-settings-section')).toHaveCount(0);
  await expect(vote.locator('.card-settings-inline-section-count')).toHaveCount(0);
  await expect(vote.locator('.card-settings-inline-items')).toHaveCount(0);
  const box = vote.locator('.js-card-settings-single-toggle');
  await expect(box).toHaveCount(1);
  await expect(box).toBeVisible();
  // Voting's hamburger had only the card's Edit voting: nothing here, no icon.
  await expect(vote.locator('.js-open-card-settings-section-menu')).toHaveCount(0);
  // Subtasks is one line too, with the board's Subtask settings in its hamburger.
  await expect(sectionOf(inline, 'subtasks')).toHaveClass(/is-single/);
  await expect(sectionOf(inline, 'subtasks').locator('.js-open-card-settings-section-menu')).toHaveCount(1);
  await expect(box).toHaveAttribute('aria-checked', 'true');
  await box.click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).allowsVote).toBe(false);
  await expect(box).toHaveAttribute('aria-checked', 'false');
  // Negative: no section hidden for it - it is the field's flag.
  expect(db.findOne('boards', { _id: board.boardId }).cardSettingsHiddenOnCard || []).toEqual([]);
  await box.click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).allowsVote).toBe(true);
  // Hidden whole (as an older board may have it): unticked; ticking shows it again.
  db.updateOne('boards', { _id: board.boardId }, { $set: { cardSettingsHiddenOnCard: ['vote'] } });
  await expect(box).toHaveAttribute('aria-checked', 'false');
  await box.click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).cardSettingsHiddenOnCard).toEqual([]);
  expect(db.findOne('boards', { _id: board.boardId }).allowsVote).toBe(true);
  await expect(box).toHaveAttribute('aria-checked', 'true');
});

test('Card\'s hamburger: Ask for a reason is the rows\' kind of checkbox, a board admin\'s', async ({ boardPage: page, board }) => {
  db.updateOne('boards', { _id: board.boardId }, { $set: { askForMoveReason: false } });
  const details = await openCard(page, board);
  const inline = await openCardSettings(page);
  const menu = await openSectionMenu(page, inline, 'card');
  const askLink = menu.locator('.js-ask-move-reason');
  await expect(askLink.locator('.materialCheckBox')).toBeVisible();
  await expect(askLink).toHaveAttribute('aria-checked', 'false');
  await askLink.click();
  await expect(askLink).toHaveAttribute('aria-checked', 'true');
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).askForMoveReason).toBe(true);
  // Negative: Show empty fields, which it used to line up with, is gone.
  await expect(menu.locator('.js-show-empty-card-fields')).toHaveCount(0);
});

// ── Board Settings / Card: the popup ────────────────────────────────────────
// Since 2026-10-28 the popup is Card Settings itself (cardSettingsInline): a
// Minicard pane and a Card pane, the sections as checklists, the rest in
// their hamburgers. Its old left menu and right pane are gone.

test('Board Settings / Card is still the popup: it moves by its title, maximizes beside its close button, shows the labels', async ({ boardPage: page }) => {
  await openBoardCardSettings(page);
  const popup = settingsPopup(page);
  const label = popup.locator('.card-settings-line-label').first();
  await expect(label).toBeVisible();
  const labelBox = await label.boundingBox();
  const popupBox = await popup.boundingBox();
  expect(labelBox.width).toBeGreaterThan(30);
  expect(labelBox.x + labelBox.width).toBeLessThanOrEqual(popupBox.x + popupBox.width + 1);
  // As wide as two panes need (1100px since the two sides became two panes
  // side by side; it was 600px for one column), not the old 1200px left menu
  // + pane.
  expect(popupBox.width).toBeLessThanOrEqual(1120);
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
  // Negative: no On this card, no Show empty, and so no row hamburger on Due.
  await expect(popup.locator('.js-card-add-field, .js-card-always-show')).toHaveCount(0);
  await expect(itemOf(popup, 'dueDate').locator('.js-open-card-settings-item-menu')).toHaveCount(0);
});

// Was "headings aligned with their cells": what is left to pin is that every
// label of either pane is whole inside its pane and nothing scrolls sideways.
test('Board Settings / Card: labels whole in both panes, no sideways scroll', async ({ boardPage: page }) => {
  await page.setViewportSize({ width: 1400, height: 1000 });
  await openBoardCardSettings(page);
  const popup = settingsPopup(page);
  for (const side of ['card', 'minicard']) {
    const pane = paneOf(page, side);
    await expect(itemOf(pane, 'dueDate')).toHaveAttribute('data-side', side);
    const box = await pane.boundingBox();
    for (const label of await pane.locator('.card-settings-line-label').all()) {
      const l = await label.boundingBox();
      if (!l) continue; // a collapsed section's row
      expect(l.x).toBeGreaterThanOrEqual(box.x - 1);
      expect(l.x + l.width).toBeLessThanOrEqual(box.x + box.width + 1);
    }
    expect(await pane.locator('.js-card-settings-pane-body').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  }
});

// ── Custom Fields: the board's custom fields as items ──────────────────────

const fieldsOf = board => db.find('customFields', { boardIds: board.boardId });
function seedFields(board, names) {
  db.deleteMany('customFields', { boardIds: board.boardId });
  names.forEach((name, sort) => db.insertOne('customFields', {
    _id: `cf-${board.boardId}-${sort}`, boardIds: [board.boardId], name, type: 'text', settings: {},
    showOnCard: false, automaticallyOnCard: false, alwaysOnCard: false, showLabelOnMiniCard: false,
    showSumAtTopOfList: false, sort, createdAt: new Date(), modifiedAt: new Date(),
  }));
}
const customItems = inline => sectionOf(inline, 'customFields').locator('.js-card-settings-custom-field');
const itemNames = async inline => (await customItems(inline).allTextContents()).map(t => t.trim());

test('Custom Fields: its items are the board\'s custom fields; + adds one, the last item', async ({ boardPage: page, board }) => {
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsCustomFields: true } });
  seedFields(board, ['Priority', 'Estimate']);
  const inline = await openCardSettings(page);
  const cf = sectionOf(inline, 'customFields');
  // Not one line, no "Custom Fields > Custom Fields" item; its own checkbox
  // is the board's Custom Fields flag; no hamburger (the + replaced Create Field).
  await expect(cf).not.toHaveClass(/is-single/);
  await expect(itemOf(cf.locator('.card-settings-inline-items'), 'customFields')).toHaveCount(0);
  await expect(cf.locator('.js-open-card-settings-section-menu')).toHaveCount(0);
  await expect(cf.locator('.card-settings-section-toggle')).toHaveAttribute('aria-checked', 'true');
  await expect.poll(() => itemNames(inline)).toEqual(['Priority', 'Estimate']);
  // The + is under the items.
  const plus = cf.locator('.js-card-settings-add-custom-field');
  const last = await customItems(inline).last().boundingBox();
  expect((await plus.boundingBox()).y).toBeGreaterThan(last.y);
  await plus.click();
  // The form opens under the +, inside the pane - no popup of its own.
  const form = cf.locator('.js-card-settings-panel[data-kind="create"]');
  await expect(form).toBeVisible();
  await expect(plus).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.js-pop-over')).toHaveCount(1);
  const box = await form.boundingBox();
  const pane = await inline.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(pane.x - 1);
  expect(box.x + box.width).toBeLessThanOrEqual(pane.x + pane.width + 1);
  expect(box.y).toBeGreaterThan((await plus.boundingBox()).y);
  await form.locator('.js-field-name').fill('Risk');
  await form.locator('button.primary, .primary').first().click();
  await expect.poll(() => fieldsOf(board).map(f => f.name).sort()).toEqual(['Estimate', 'Priority', 'Risk']);
  // Saved: the panel closes, Card Settings stays.
  await expect(form).toHaveCount(0);
  await expect(settingsPopup(page)).toBeVisible();
  const risk = fieldsOf(board).find(f => f.name === 'Risk');
  expect(risk.sort).toBe(2);
  const reopened = await openCardSettings(page);
  await expect.poll(() => itemNames(reopened)).toEqual(['Priority', 'Estimate', 'Risk']);
  await closePopup(page);
});

test('Custom Fields: an item\'s checkbox per side - Show on Minicard is showOnCard, Show on Card is alwaysOnCard', async ({ boardPage: page, board }) => {
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsCustomFields: true, allowsCustomFieldsOnMinicard: true } });
  seedFields(board, ['Priority']);
  const id = fieldsOf(board)[0]._id;
  const inline = await openCardSettings(page);
  const toggle = customItems(inline).first().locator('.card-field-order-toggle');
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await toggle.click();
  await expect.poll(() => db.findOne('customFields', { _id: id }).alwaysOnCard).toBe(true);
  expect(db.findOne('customFields', { _id: id }).showOnCard).toBe(false);
  // Added to every card of the board (server/models/customFields.js addToAllCards).
  await expect.poll(() => db.find('cards', { boardId: board.boardId }).every(c => (c.customFields || []).some(f => f._id === id))).toBe(true);
  const mini = paneOf(page, 'minicard');
  const miniToggle = customItems(mini).first().locator('.card-field-order-toggle');
  await expect(customItems(mini).first()).toHaveAttribute('data-side', 'minicard');
  await expect(miniToggle).toHaveAttribute('aria-checked', 'false');
  await miniToggle.click();
  await expect.poll(() => db.findOne('customFields', { _id: id }).showOnCard).toBe(true);
  await expect(miniToggle).toHaveAttribute('aria-checked', 'true');
  await miniToggle.click();
  await expect.poll(() => db.findOne('customFields', { _id: id }).showOnCard).toBe(false);
  // Its hamburger is the custom field's own edit form, under the item.
  await customItems(inline).first().locator('.js-card-settings-edit-custom-field').click();
  const edit = sectionOf(inline, 'customFields').locator('.js-card-settings-panel[data-kind="field"]');
  await expect(edit.locator('form')).toBeVisible();
  await expect(customItems(inline).first().locator('.js-card-settings-edit-custom-field')).toHaveAttribute('aria-expanded', 'true');
  await closePopup(page);
});

test('Custom Fields: an item dragged above another changes sort, and the card follows', async ({ boardPage: page, board, user }) => {
  setHandles(user.id, false);
  await page.reload();
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsCustomFields: true } });
  seedFields(board, ['Priority', 'Estimate']);
  const [priority, estimate] = ['Priority', 'Estimate'].map(n => fieldsOf(board).find(f => f.name === n)._id);
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('cards', { _id: card._id }, { $set: { customFields: [{ _id: priority, value: 'P' }, { _id: estimate, value: 'E' }] } });
  const inline = await openCardSettings(page);
  const items = customItems(inline);
  await expect.poll(() => itemNames(inline)).toEqual(['Priority', 'Estimate']);
  // Dropped on the upper part of the first item (its very top edge is the
  // list's own edge, which jQuery UI counts as leaving the list).
  await items.nth(0).evaluate(el => el.scrollIntoView({ block: 'center' }));
  const from = await items.nth(1).locator('.card-settings-line-label').boundingBox();
  const to = await items.nth(0).boundingBox();
  await page.mouse.move(from.x + 20, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + 20, from.y + from.height / 2 + 8, { steps: 3 });
  await page.mouse.move(from.x + 20, to.y + to.height * 0.3, { steps: 12 });
  await page.mouse.up();
  await expect.poll(() => db.findOne('customFields', { _id: estimate }).sort).toBeLessThan(db.findOne('customFields', { _id: priority }).sort);
  await expect.poll(() => itemNames(inline)).toEqual(['Estimate', 'Priority']);
  // The keyboard: Down on the focused name moves it back.
  await items.first().locator('.js-card-settings-custom-field-handle').focus();
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => db.findOne('customFields', { _id: priority }).sort).toBeLessThan(db.findOne('customFields', { _id: estimate }).sort);
  await closePopup(page);
  // The opened card draws them in that order.
  const details = await openCard(page, board);
  const names = await details.locator('.card-details-item-customfield .card-details-item-title').allTextContents();
  expect(names.map(n => n.trim()).filter(Boolean).slice(0, 2)).toEqual(['Priority', 'Estimate']);
});

// Negative: who may not change the board (a read-only member) sees no + and
// disabled boxes.
test('Card Settings for a member who may not change the board: no +, disabled checkboxes', async ({ boardPage: page, board, user }) => {
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsCustomFields: true } });
  seedFields(board, ['Priority']);
  const b = db.findOne('boards', { _id: board.boardId });
  const members = (b.members || []).map(m => (m.userId === user.id ? { ...m, isAdmin: false, isReadOnly: true } : m));
  db.updateOne('boards', { _id: board.boardId }, { $set: { members } });
  try {
    await page.reload();
    const inline = await openCardSettings(page);
    await expect(sectionOf(inline, 'customFields').locator('.js-card-settings-add-custom-field')).toHaveCount(0);
    await expect(customItems(inline).first().locator('.card-field-order-toggle')).toHaveClass(/is-disabled/);
    await expect(customItems(inline).first().locator('.js-card-settings-edit-custom-field')).toHaveCount(0);
    await expect(sectionOf(inline, 'date').locator('.card-settings-section-toggle')).toHaveClass(/is-disabled/);
    await expect(sectionOf(inline, 'date').locator('.js-card-settings-section-shown')).toHaveCount(0);
    await closePopup(page);
  } finally {
    db.updateOne('boards', { _id: board.boardId }, { $set: { members: b.members } });
  }
});

// The old left menu and its single right pane are gone; the two panes of
// 2026-10-28 are one per SIDE (minicard, card), not a menu's content pane.
test('Board Settings / Card has no left menu and no menu pane any more (negative)', async ({ boardPage: page }) => {
  await openBoardCardSettings(page);
  const popup = settingsPopup(page);
  await expect(popup.locator('.js-card-settings-section').first()).toBeVisible();
  await expect(popup.locator('.js-card-settings-menu')).toHaveCount(0);
  await expect(popup.locator('.card-settings-pane')).toHaveCount(2);
  await expect(popup.locator('.card-settings-pane:not([data-side="minicard"]):not([data-side="card"])')).toHaveCount(0);
  await expect(popup.locator('.card-settings-list-card, .card-settings-list-minicard')).toHaveCount(0);
  await expect(popup.locator('.js-card-settings-select')).toHaveCount(0);
  await expect(popup.locator('.board-card-settings, .side-menu')).toHaveCount(0);
});

// ── Dragging a row: by its handle, by its label, and only within its section ─

const setHandles = (userId, on) => db.updateOne('users', { _id: userId }, { $set: { 'profile.showDesktopDragHandles': on } });
const cardOrderOf = board => (db.findOne('boards', { _id: board.boardId }).cardFieldOrder || []).join(' ');
// Both ends on screen: the target scrolled to the top, the source under it.
async function dragTo(page, source, target) {
  await target.evaluate(el => el.scrollIntoView({ block: 'start' }));
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  expect(to.y).toBeGreaterThanOrEqual(0);
  expect(from.y + from.height).toBeLessThanOrEqual(page.viewportSize().height);
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2 + 8, { steps: 3 });
  await page.mouse.move(to.x + to.width / 2, to.y + 2, { steps: 12 });
  await page.mouse.up();
}
// A drop that must write nothing: given the time a write would take.
async function expectNoWrite(page, read, before) {
  await page.waitForTimeout(1500);
  expect(read()).toBe(before);
}

test('drag handles on: a row is dragged by its handle only, not by its label', async ({ boardPage: page, board, user }) => {
  setHandles(user.id, true);
  try {
    await page.reload();
    const details = await openCard(page, board);
    const inline = await openCardSettings(page);
    const date = sectionOf(inline, 'date');
    const due = itemOf(date, 'dueDate');
    await expect(due.locator('a.js-card-field-order-handle')).toBeVisible();
    // The label is not a handle then: dragging it moves nothing.
    await expect(due.locator('.card-settings-line-label.js-card-field-order-handle')).toHaveCount(0);
    const before = cardOrderOf(board);
    await dragTo(page, due.locator('.card-settings-line-label'), itemOf(date, 'receivedDate'));
    await expectNoWrite(page, () => cardOrderOf(board), before);
    // The handle does.
    await dragTo(page, due.locator('a.js-card-field-order-handle'), itemOf(date, 'receivedDate'));
    await expect.poll(() => {
      const order = db.findOne('boards', { _id: board.boardId }).cardFieldOrder || [];
      return order.indexOf('dueDate') !== -1 && order.indexOf('dueDate') < order.indexOf('receivedDate');
    }).toBe(true);
  } finally {
    setHandles(user.id, false);
    db.updateOne('boards', { _id: board.boardId }, { $unset: { cardFieldOrder: '' } });
  }
});

test('drag handles off: the row\'s label is its handle', async ({ boardPage: page, board, user }) => {
  setHandles(user.id, false);
  try {
    await page.reload();
    const details = await openCard(page, board);
    const inline = await openCardSettings(page);
    const date = sectionOf(inline, 'date');
    const due = itemOf(date, 'dueDate');
    // Negative: no separate handle is drawn.
    await expect(due.locator('a.js-card-field-order-handle')).toHaveCount(0);
    await expect(due.locator('.card-settings-line-label.js-card-field-order-handle')).toHaveCount(1);
    await dragTo(page, due.locator('.card-settings-line-label'), itemOf(date, 'receivedDate'));
    await expect.poll(() => {
      const order = db.findOne('boards', { _id: board.boardId }).cardFieldOrder || [];
      return order.indexOf('dueDate') !== -1 && order.indexOf('dueDate') < order.indexOf('receivedDate');
    }).toBe(true);
  } finally {
    db.updateOne('boards', { _id: board.boardId }, { $unset: { cardFieldOrder: '' } });
  }
});

test('a row dropped on another section goes back to its own, and nothing is written', async ({ boardPage: page, board, user }) => {
  setHandles(user.id, false);
  try {
    await page.reload();
    const details = await openCard(page, board);
    const inline = await openCardSettings(page);
    const date = sectionOf(inline, 'date');
    const members = sectionOf(inline, 'members');
    const before = cardOrderOf(board);
    // Creator (Members) dragged onto Due (Date), above it on screen.
    await dragTo(page, itemOf(members, 'creator').locator('.card-settings-line-label'), itemOf(date, 'dueDate'));
    await expectNoWrite(page, () => cardOrderOf(board), before);
    await expect(itemOf(members, 'creator')).toHaveCount(1);
    await expect(itemOf(date, 'creator')).toHaveCount(0);
    // And a Date row onto the Labels section above it.
    const general = sectionOf(inline, 'labels');
    await dragTo(page, itemOf(date, 'endDate').locator('.card-settings-line-label'), itemOf(general, 'stickers'));
    await expectNoWrite(page, () => cardOrderOf(board), before);
    await expect(itemOf(date, 'endDate')).toHaveCount(1);
    await expect(itemOf(general, 'endDate')).toHaveCount(0);
    // A drop within its own section still writes: the drag itself works.
    await dragTo(page, itemOf(date, 'dueDate').locator('.card-settings-line-label'), itemOf(date, 'receivedDate'));
    await expect.poll(() => cardOrderOf(board)).not.toBe(before);
  } finally {
    db.updateOne('boards', { _id: board.boardId }, { $unset: { cardFieldOrder: '' } });
  }
});
