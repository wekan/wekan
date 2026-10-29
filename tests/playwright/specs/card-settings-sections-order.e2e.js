'use strict';

// docs/Features/Cards/Card-Settings.md (2026-10-28): ONE section model. The
// opened card draws Card Settings' sections in the Card pane's order, each
// section's fields in its row order; the minicard does the same for the
// Minicard pane, without headings. Board Settings / Card shows both panes -
// Minicard first - side by side when there is room, each collapsible and
// scrolling on its own, with a splitter between them; a hamburger opens its
// content under its line, inside the pane, not in a popup.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const SCRUM_VISIBILITY = ['cardSprint', 'cardPastSprints', 'cardRelease', 'cardIssueType',
  'cardAcceptanceCriteria', 'cardBacklogRank'];

const popupOf = page => page.locator('.js-pop-over[data-popup="boardCardSettingsPopup"]');
const paneOf = (page, side) => popupOf(page).locator(`.js-card-settings-pane[data-side="${side}"]`);
const sectionIn = (pane, id) => pane.locator(`.js-card-settings-section[data-section="${id}"]`);
const rowIn = (pane, key) => pane.locator(`.js-card-field-order-row[data-key="${key}"]`);

async function openCardSettings(page) {
  await page.evaluate(() => {
    Popup.close();
    Popup.open('boardCardSettings').call({ currentData: () => ({}) }, { currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} });
  });
  await expect(popupOf(page)).toBeVisible();
  await expect(paneOf(page, 'card')).toBeVisible();
}
async function closeCardSettings(page) {
  await page.evaluate(() => Popup.close());
  await expect(popupOf(page)).toHaveCount(0);
}
async function openCard(page, board) {
  const bp = new BoardPage(page);
  const cp = new CardPage(page);
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  await cp.waitForOpen();
  return page.locator('.card-details');
}
// The ids of a pane's sections, top to bottom.
const paneSections = pane => pane.locator(':scope .js-card-settings-sections-sortable > .js-card-settings-section')
  .evaluateAll(els => els.map(el => el.dataset.section));
// The ids of the opened card's sections, top to bottom.
const cardSections = page => page.locator('.card-details .card-details-items > .card-details-section')
  .evaluateAll(els => els.map(el => el.dataset.cardSection));
async function dragOnto(page, source, target) {
  await target.scrollIntoViewIfNeeded();
  await source.scrollIntoViewIfNeeded();
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2 + 8, { steps: 3 });
  // Into the target's upper third - above its middle, so the dragged one goes
  // before it - not on its very edge, which is the list's own edge for the
  // first one and read as a drop outside the list in Firefox.
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 3, { steps: 12 });
  await page.mouse.up();
}

// A section is dragged with the pane's sections folded: each pane scrolls on
// its own, and a section far down dragged onto the first one scrolled the
// first out of view in Firefox, so the drop landed outside the pane and went
// back where it was (as a drop outside its list should).
async function foldSections(pane) {
  const carets = pane.locator('.js-card-settings-section .js-toggle-card-settings-section[aria-expanded="true"]');
  while (await carets.count()) {
    await carets.first().click();
  }
}
async function unfoldSection(pane, id) {
  const caret = sectionIn(pane, id).locator('.js-toggle-card-settings-section');
  if ((await caret.getAttribute('aria-expanded')) === 'false') await caret.click();
  await expect(caret).toHaveAttribute('aria-expanded', 'true');
}

test.beforeEach(({ board, user }) => {
  db.updateOne('boards', { _id: board.boardId }, { $unset: {
    cardSettingsSectionOrder: '', minicardSettingsSectionOrder: '', cardFieldOrder: '', minicardFieldOrder: '',
    cardSettingsHiddenOnCard: '', cardSettingsHiddenOnMinicard: '',
  } });
  db.updateOne('users', { _id: user.id }, { $unset: { 'profile.cardSettingsSplit': '', 'profile.collapsedCardSections': '' },
    $set: { 'profile.showDesktopDragHandles': false } });
});

test('a default board: the opened card draws the Card pane\'s sections in its order, Labels first', async ({ boardPage: page, board }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  const card = await openCard(page, board);
  const onCard = await cardSections(page);
  expect(onCard[0]).toBe('labels');
  await openCardSettings(page);
  const inPane = await paneSections(paneOf(page, 'card'));
  expect(inPane[0]).toBe('labels');
  // The card's sections are the pane's, in the pane's order (a section the
  // card has nothing to show for is left out of the card, never reordered).
  expect(inPane.filter(id => onCard.includes(id))).toEqual(onCard);
  // Each section headed with Card Settings' icon and title.
  await expect(card.locator('.card-details-section[data-card-section="date"] .js-toggle-card-section[data-section="date"] .fa-calendar')).toHaveCount(1);
  await expect(card.locator('.card-details-section[data-card-section="card"] .js-toggle-card-section[data-section="card"] .fa-id-card-o')).toHaveCount(1);
});

test('with every field allowed, the card draws exactly the Card pane\'s sections', async ({ boardPage: page, board }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  const visibility = Object.fromEntries(SCRUM_VISIBILITY.map(k => [k, true]));
  db.updateOne('boards', { _id: board.boardId }, { $set: {
    allowsLabels: true, allowsReceivedDate: true, allowsStartDate: true, allowsDueDate: true, allowsEndDate: true,
    allowsMembers: true, allowsDependencies: true, allowsSpentTime: true, allowsCustomFields: true, allowsVote: true,
    allowsPoker: true, allowsDescriptionTitle: true, allowsDescriptionText: true, allowsChecklists: true,
    allowsSubtasks: true, allowsAttachments: true, allowsComments: true, 'scrum.visibility': visibility,
  } });
  await page.reload();
  await openCard(page, board);
  const onCard = await cardSections(page);
  await openCardSettings(page);
  const inPane = await paneSections(paneOf(page, 'card'));
  expect(onCard).toEqual(inPane);
});

test('dragging a section in the Card pane reorders the card, not the minicard', async ({ boardPage: page, board }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await openCardSettings(page);
  const pane = paneOf(page, 'card');
  await foldSections(pane);
  await dragOnto(page, sectionIn(pane, 'description').locator('.card-settings-inline-section-title'), sectionIn(pane, 'labels'));
  await expect.poll(() => (db.findOne('boards', { _id: board.boardId }).cardSettingsSectionOrder || [])[0]).toBe('description');
  // Negative: the minicard's section order is its own.
  expect(db.findOne('boards', { _id: board.boardId }).minicardSettingsSectionOrder).toBeFalsy();
  await closeCardSettings(page);
  await openCard(page, board);
  await expect.poll(async () => (await cardSections(page))[0]).toBe('description');
});

test('dragging Due above Received in the Card pane reorders them on the card, inside Date', async ({ boardPage: page, board }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsReceivedDate: true, allowsDueDate: true } });
  await openCardSettings(page);
  const pane = paneOf(page, 'card');
  await dragOnto(page, rowIn(pane, 'dueDate').locator('.card-settings-line-label'), rowIn(pane, 'receivedDate'));
  await expect.poll(() => {
    const order = db.findOne('boards', { _id: board.boardId }).cardFieldOrder || [];
    return order.indexOf('dueDate') !== -1 && order.indexOf('dueDate') < order.indexOf('receivedDate');
  }).toBe(true);
  await closeCardSettings(page);
  const card = await openCard(page, board);
  const date = card.locator('.card-details-section[data-card-section="date"]');
  const keys = await date.locator('.card-details-item-received, .card-details-item-due')
    .evaluateAll(els => els.map(el => (el.classList.contains('card-details-item-due') ? 'due' : 'received')));
  expect(keys).toEqual(['due', 'received']);
});

test('the minicard follows the Minicard pane: its section order and its rows, and not the card\'s', async ({ boardPage: page, board, user }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  const alpha = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsDueDate: true, allowsMembers: true, allowsAssignee: true,
    allowsMembersOnMinicard: true, allowsAssigneeOnMinicard: true, allowsDueDateOnMinicard: true } });
  db.updateOne('cards', { _id: alpha._id }, { $set: { dueAt: new Date(Date.now() + 86400000), members: [user.id], assignees: [user.id] } });
  await page.reload();
  const minicard = new BoardPage(page).minicard(board.listIds[0], 'Alpha Card');
  await expect(minicard.locator('.minicard-members')).toBeVisible();
  // The default: the dates line before the people, assignees before members.
  const order = () => minicard.locator('.dates, .minicard-members, .minicard-assignees')
    .evaluateAll(els => els.map(el => el.className.split(' ')[0]));
  expect((await order()).filter(c => c !== '')).toEqual(['dates', 'minicard-assignees', 'minicard-members']);
  await openCardSettings(page);
  const pane = paneOf(page, 'minicard');
  // A section dragged in the Minicard pane: Members above Scrum settings (the first).
  await foldSections(pane);
  await dragOnto(page, sectionIn(pane, 'members').locator('.card-settings-inline-section-title'), sectionIn(pane, 'scrum'));
  await expect.poll(() => (db.findOne('boards', { _id: board.boardId }).minicardSettingsSectionOrder || [])[0]).toBe('members');
  // Negative: the opened card's section order is untouched.
  expect(db.findOne('boards', { _id: board.boardId }).cardSettingsSectionOrder).toBeFalsy();
  // A row dragged in the Minicard pane: Members above Assignee, inside Members.
  await unfoldSection(pane, 'members');
  await dragOnto(page, rowIn(pane, 'members').locator('.card-settings-line-label'), rowIn(pane, 'assignee'));
  await expect.poll(() => {
    const flat = db.findOne('boards', { _id: board.boardId }).minicardFieldOrder || [];
    return flat.indexOf('members') !== -1 && flat.indexOf('members') < flat.indexOf('assignee');
  }).toBe(true);
  expect(db.findOne('boards', { _id: board.boardId }).cardFieldOrder).toBeFalsy();
  await closeCardSettings(page);
  await expect.poll(async () => (await order()).filter(c => c !== '')).toEqual(['minicard-members', 'minicard-assignees', 'dates']);
});

test('two panes side by side, Minicard first; each scrolls on its own, collapses, and stacks when narrow', async ({ boardPage: page }) => {
  await page.setViewportSize({ width: 1400, height: 700 });
  await openCardSettings(page);
  const mini = paneOf(page, 'minicard');
  const card = paneOf(page, 'card');
  // No Show radio: both sides are visible.
  await expect(popupOf(page).locator('.js-card-settings-show-side')).toHaveCount(0);
  await expect(mini.locator('.card-settings-pane-title')).toBeVisible();
  const m = await mini.boundingBox();
  const c = await card.boundingBox();
  expect(m.x + m.width).toBeLessThanOrEqual(c.x + 1);
  expect(Math.abs(m.y - c.y)).toBeLessThan(4);
  // Each body scrolls on its own.
  const miniBody = mini.locator('.js-card-settings-pane-body');
  const cardBody = card.locator('.js-card-settings-pane-body');
  await cardBody.evaluate(el => { el.scrollTop = 200; });
  expect(await cardBody.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  expect(await miniBody.evaluate(el => el.scrollTop)).toBe(0);
  // The caret collapses a pane; the other takes the width; it is kept.
  await mini.locator('.js-toggle-card-settings-pane').click();
  await expect(miniBody).toBeHidden();
  await expect(mini.locator('.js-toggle-card-settings-pane')).toHaveAttribute('aria-expanded', 'false');
  await expect(popupOf(page).locator('.js-card-settings-splitter')).toBeHidden();
  const wider = await card.boundingBox();
  expect(wider.width).toBeGreaterThan(c.width + 50);
  await closeCardSettings(page);
  await openCardSettings(page);
  await expect(paneOf(page, 'minicard').locator('.js-card-settings-pane-body')).toBeHidden();
  await paneOf(page, 'minicard').locator('.js-toggle-card-settings-pane').click();
  await expect(paneOf(page, 'minicard').locator('.js-card-settings-pane-body')).toBeVisible();
  // Narrow: stacked, Minicard above Card, no splitter.
  await closeCardSettings(page);
  await page.setViewportSize({ width: 500, height: 900 });
  await openCardSettings(page);
  const m2 = await paneOf(page, 'minicard').boundingBox();
  const c2 = await paneOf(page, 'card').boundingBox();
  expect(m2.y + m2.height).toBeLessThanOrEqual(c2.y + 1);
  await expect(popupOf(page).locator('.js-card-settings-splitter')).toBeHidden();
});

test('a checkbox in the Minicard pane is the minicard\'s, in the Card pane the card\'s', async ({ boardPage: page, board }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsCardNumber: false, allowsCardNumberOnMinicard: false } });
  await openCardSettings(page);
  await rowIn(paneOf(page, 'minicard'), 'cardNumber').locator('.card-field-order-toggle').click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).allowsCardNumberOnMinicard).toBe(true);
  expect(db.findOne('boards', { _id: board.boardId }).allowsCardNumber).toBe(false);
  await rowIn(paneOf(page, 'card'), 'cardNumber').locator('.card-field-order-toggle').click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).allowsCardNumber).toBe(true);
  expect(db.findOne('boards', { _id: board.boardId }).allowsCardNumberOnMinicard).toBe(true);
});

test('the splitter: dragged it widens one pane, clamped, kept, reset by a double-click, moved by the keys', async ({ boardPage: page, user }) => {
  await page.setViewportSize({ width: 1400, height: 800 });
  await openCardSettings(page);
  const splitter = popupOf(page).locator('.js-card-settings-splitter');
  await expect(splitter).toBeVisible();
  await expect(splitter).toHaveAttribute('role', 'separator');
  const mini = paneOf(page, 'minicard');
  const card = paneOf(page, 'card');
  const m0 = (await mini.boundingBox()).width;
  const c0 = (await card.boundingBox()).width;
  const s = await splitter.boundingBox();
  await page.mouse.move(s.x + s.width / 2, s.y + 40);
  await page.mouse.down();
  await page.mouse.move(s.x + s.width / 2 + 120, s.y + 40, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => (await mini.boundingBox()).width).toBeGreaterThan(m0 + 80);
  expect((await card.boundingBox()).width).toBeLessThan(c0 - 80);
  await expect.poll(() => db.findOne('users', { _id: user.id }).profile.cardSettingsSplit).toBeGreaterThan(0.55);
  // Kept: reopened, the same split.
  const kept = (await mini.boundingBox()).width;
  await closeCardSettings(page);
  await openCardSettings(page);
  expect(Math.abs((await paneOf(page, 'minicard').boundingBox()).width - kept)).toBeLessThan(6);
  // Negative: it cannot squeeze the Card pane below its minimum (16em).
  const s2 = await splitter.boundingBox();
  await page.mouse.move(s2.x + s2.width / 2, s2.y + 40);
  await page.mouse.down();
  await page.mouse.move(s2.x + 2000, s2.y + 40, { steps: 8 });
  await page.mouse.up();
  const em = await card.evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  expect((await card.boundingBox()).width).toBeGreaterThanOrEqual(16 * em - 2);
  // A double-click: half and half again.
  await splitter.dblclick();
  await expect.poll(async () => Math.abs((await mini.boundingBox()).width - (await card.boundingBox()).width)).toBeLessThan(8);
  // The keys: ArrowRight widens the Minicard pane a step, Home makes it the narrowest.
  const before = (await mini.boundingBox()).width;
  await splitter.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => (await mini.boundingBox()).width).toBeGreaterThan(before + 10);
  await page.keyboard.press('Home');
  await expect.poll(async () => (await mini.boundingBox()).width).toBeLessThan(16 * em + 4);
});

test('a hamburger opens its content under its line inside the pane, not in a popup', async ({ boardPage: page, board }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await openCardSettings(page);
  const pane = paneOf(page, 'card');
  const head = sectionIn(pane, 'card').locator('.card-settings-inline-section-head');
  const burger = head.locator('.js-open-card-settings-section-menu');
  await expect(burger).toHaveAttribute('aria-expanded', 'false');
  await burger.click();
  const panel = sectionIn(pane, 'card').locator('.js-card-settings-panel');
  await expect(panel).toBeVisible();
  await expect(burger).toHaveAttribute('aria-expanded', 'true');
  await expect(burger).toHaveClass(/is-open/);
  // No second popup: Card Settings is the only one.
  await expect(page.locator('.js-pop-over')).toHaveCount(1);
  // Directly under the section's line, inside the pane.
  const h = await head.boundingBox();
  const p = await panel.boundingBox();
  const pb = await pane.boundingBox();
  expect(Math.abs(p.y - (h.y + h.height))).toBeLessThan(14);
  expect(p.x).toBeGreaterThanOrEqual(pb.x - 1);
  expect(p.x + p.width).toBeLessThanOrEqual(pb.x + pb.width + 1);
  // A checkbox in the panel toggles exactly once.
  const before = db.findOne('boards', { _id: board.boardId }).askForMoveReason === true;
  await panel.locator('.js-ask-move-reason').click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).askForMoveReason === true).toBe(!before);
  await page.waitForTimeout(400);
  expect(db.findOne('boards', { _id: board.boardId }).askForMoveReason === true).toBe(!before);
  // The same hamburger again closes it.
  await burger.click();
  await expect(panel).toHaveCount(0);
  await expect(burger).toHaveAttribute('aria-expanded', 'false');
  // Another hamburger closes the first.
  await burger.click();
  await expect(panel).toBeVisible();
  const subtasks = sectionIn(pane, 'subtasks').locator('.js-open-card-settings-section-menu');
  await subtasks.click();
  await expect(panel).toHaveCount(0);
  await expect(sectionIn(pane, 'subtasks').locator('.js-card-settings-panel .board-subtask-settings')).toBeVisible();
  // Escape closes the panel, not Card Settings.
  await page.keyboard.press('Escape');
  await expect(sectionIn(pane, 'subtasks').locator('.js-card-settings-panel')).toHaveCount(0);
  await expect(popupOf(page)).toBeVisible();
});

test('a custom field\'s hamburger edits it inline, and the + creates one inline; Card Settings stays', async ({ boardPage: page, board }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  db.insertOne('customFields', { _id: `cf${Date.now()}`, boardIds: [board.boardId], name: 'Priority', type: 'text',
    settings: {}, showOnCard: false, automaticallyOnCard: false, alwaysOnCard: false, showLabelOnMiniCard: false, sort: 0 });
  await page.reload();
  await openCardSettings(page);
  const pane = paneOf(page, 'card');
  const item = pane.locator('.js-card-settings-custom-field').first();
  await item.locator('.js-card-settings-edit-custom-field').click();
  const panel = sectionIn(pane, 'customFields').locator('.js-card-settings-panel');
  await expect(panel.locator('form')).toBeVisible();
  await expect(page.locator('.js-pop-over')).toHaveCount(1);
  await panel.locator('.js-field-show-on-card').click();
  await panel.locator('button.primary').click();
  await expect(panel).toHaveCount(0);
  await expect(popupOf(page)).toBeVisible();
  await expect.poll(() => db.findOne('customFields', { name: 'Priority', boardIds: board.boardId }).showOnCard).toBe(true);
  // The +: a new field's form under it.
  await sectionIn(pane, 'customFields').locator('.js-card-settings-add-custom-field').click();
  const create = sectionIn(pane, 'customFields').locator('.js-card-settings-panel');
  await create.locator('.js-field-name').fill('Estimate');
  await create.locator('button.primary').click();
  await expect(create).toHaveCount(0);
  await expect(pane.locator('.js-card-settings-custom-field', { hasText: 'Estimate' })).toBeVisible();
  await expect(popupOf(page)).toBeVisible();
});

test('the corner grip resizes Card Settings; the panes follow, and stack below two panes\' width', async ({ boardPage: page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await openCardSettings(page);
  const popup = popupOf(page);
  const grip = popup.locator('> button.js-date-popup-resize');
  await expect(grip).toBeVisible();
  const before = await popup.boundingBox();
  const g = await grip.boundingBox();
  // Smaller.
  await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2);
  await page.mouse.down();
  await page.mouse.move(g.x - 200, g.y - 150, { steps: 10 });
  await page.mouse.up();
  const smaller = await popup.boundingBox();
  expect(smaller.width).toBeLessThan(before.width - 150);
  expect(smaller.height).toBeLessThan(before.height - 100);
  // Still side by side, each pane filling the popup's height and scrolling alone.
  const m = await paneOf(page, 'minicard').boundingBox();
  const c = await paneOf(page, 'card').boundingBox();
  expect(m.x + m.width).toBeLessThanOrEqual(c.x + 1);
  expect(c.y + c.height).toBeLessThanOrEqual(smaller.y + smaller.height + 1);
  const cardBody = paneOf(page, 'card').locator('.js-card-settings-pane-body');
  await cardBody.evaluate(el => { el.scrollTop = 150; });
  expect(await paneOf(page, 'minicard').locator('.js-card-settings-pane-body').evaluate(el => el.scrollTop)).toBe(0);
  // Narrower than two panes: stacked.
  const g2 = await grip.boundingBox();
  await page.mouse.move(g2.x + g2.width / 2, g2.y + g2.height / 2);
  await page.mouse.down();
  await page.mouse.move(g2.x - 400, g2.y, { steps: 10 });
  await page.mouse.up();
  const m2 = await paneOf(page, 'minicard').boundingBox();
  const c2 = await paneOf(page, 'card').boundingBox();
  expect(m2.y + m2.height).toBeLessThanOrEqual(c2.y + 1);
  // Larger again: side by side.
  const g3 = await grip.boundingBox();
  await page.mouse.move(g3.x + g3.width / 2, g3.y + g3.height / 2);
  await page.mouse.down();
  await page.mouse.move(g3.x + 600, g3.y + 200, { steps: 10 });
  await page.mouse.up();
  const larger = await popup.boundingBox();
  expect(larger.width).toBeGreaterThan(m2.width + 300);
  const m3 = await paneOf(page, 'minicard').boundingBox();
  const c3 = await paneOf(page, 'card').boundingBox();
  expect(m3.x + m3.width).toBeLessThanOrEqual(c3.x + 1);
});
