'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { columnFields } = require('../../../models/lib/boardSettingsColumns');
// A Scrum row's flag is a path into the board's Scrum settings.
const valueOf = (doc, field) => field.split('.').reduce((value, key) => value?.[key], doc);
async function openSettings(page, section) {
  await page.evaluate(section => {
    Popup.close();
    const evt = {currentTarget:document.body, target:document.body, preventDefault() {}, stopPropagation() {}};
    // Board Settings / Card is opened as the cog menu does: with no card.
    if (section === 'Card') Popup.open('boardCardSettings').call({currentData: () => ({})}, evt);
    else Popup.open(`board${section}Settings`)(evt);
  }, section);
}
// Board Settings / Card is Card Settings since 2026-10-28 (cardSettingsInline):
// the Draggable table, with its column actions, is in the Card section's
// hamburger - since the two panes, the Card pane's, opened under its line
// (cardSettingsInlinePanel), not as a popup layer.
async function openCardSectionMenu(page) {
  const pane = page.locator('.pop-over[data-popup="boardCardSettingsPopup"] .js-card-settings-pane[data-side="card"]');
  const section = pane.locator('.js-card-settings-section[data-section="card"]');
  await section.locator('.js-open-card-settings-section-menu').click();
  const menu = section.locator('.js-card-settings-panel[data-kind="section"]');
  await expect(menu).toBeVisible();
  return menu;
}
// Swimlane and List show their table in the popup; Card in Card's hamburger.
async function openColumns(page, section) {
  await openSettings(page, section);
  if (section === 'Card') await openCardSectionMenu(page);
}
for (const section of ['Swimlane','List','Card']) test(`${section} column actions set all, unset all and persist without changing other columns`, async ({boardPage:page, board, user}) => {
  const other = db.seedBoard({ownerId:user.id});
  const otherBefore = db.findOne('boards',{_id:other.boardId});
  const profileBefore = db.findOne('users',{_id:user.id}).profile;
  try {
    await openColumns(page, section);
    // Card: only Draggable has a select-all; Show on Minicard and Show on Card
    // are checkboxes in the sections, with none under the first entry
    // (docs/Features/Cards/Card-Fields.md).
    for (const column of section === 'Card' ? ['draggable'] : ['draggable','settings']) {
      const actions = page.locator(`.board-settings-column-actions[data-section="${section.toLowerCase()}"][data-column="${column}"]`);
      const fields = columnFields(section.toLowerCase(), column);
      const before = db.findOne('boards',{_id:board.boardId});
      for (const enabled of [true,false,false,true]) {
        const button = actions.locator(`[data-enabled="${enabled}"]`);
        await button.click();
        await expect(button).toBeEnabled();
        await expect.poll(() => {
          const saved = db.findOne('boards',{_id:board.boardId});
          return fields.every(field => valueOf(saved, field) === enabled);
        }).toBe(true);
        await expect(actions.locator('.warning')).toHaveCount(0);
        if (column === 'draggable') {
          const boxes = page.locator('.js-board-drag-setting');
          for (const box of await boxes.all()) enabled ? await expect(box).toBeChecked() : await expect(box).not.toBeChecked();
        }
      }
      const after = db.findOne('boards',{_id:board.boardId});
      for (const key of Object.keys(before).filter(key => /^(allows|showLabelText|labelsAbove|listWidthResizeLocked|swimlaneHeightResizeLocked|sameWidthForAllLists|.*FieldOrder)/.test(key) && !fields.includes(key))) expect(after[key],key).toEqual(before[key]);
      await page.reload();
      await openColumns(page, section);
      const saved = db.findOne('boards',{_id:board.boardId});
      expect(fields.every(field => valueOf(saved, field) === true)).toBe(true);
    }
    expect(db.findOne('boards',{_id:other.boardId})).toEqual(otherBefore);
    expect(db.findOne('users',{_id:user.id}).profile?.showLabelTextOverride).toEqual(profileBefore?.showLabelTextOverride);
  } finally { db.cleanup({boardIds:[other.boardId]}); }
});
test('column updates reject foreign boards, non-admin members and invalid columns', async ({boardPage:page, board, user, user2}) => {
  const other = db.seedBoard({ownerId:user2.id});
  const call = (id,section,column,enabled) => page.evaluate(async args => {
    try { await Meteor.callAsync('setBoardSettingsColumn',...args); return null; }
    catch (error) { return error.error; }
  },[id,section,column,enabled]);
  try {
    expect(await call(other.boardId,'card','card',false)).toBe('not-authorized');
    expect(await call(board.boardId,'card','members',false)).toBe('invalid-setting');
    expect(await call(board.boardId,'card','draggable','false')).toBeDefined();
    const before = db.findOne('boards',{_id:board.boardId});
    db.updateOne('boards',{_id:board.boardId},{$set:{members:before.members.map(member => member.userId === user.id ? {...member,isAdmin:false} : member)}});
    expect(await call(board.boardId,'card','card',false)).toBe('not-authorized');
    expect(db.findOne('boards',{_id:board.boardId}).allowsLabels).toEqual(before.allowsLabels);
    await page.reload();
    await openSettings(page,'Card');
    // The sections first: a count of 0 taken before they rendered passed in
    // Chromium without looking at anything. Then, in Card's hamburger where
    // the Draggable table is, no board-admin column actions
    // (boardSettingsColumnActions, data-column) for a non-admin member.
    await expect(page.locator('.pop-over[data-popup="boardCardSettingsPopup"] .js-card-settings-section').first()).toBeVisible();
    const menu = await openCardSectionMenu(page);
    await expect(menu.locator('.card-settings-section-menu')).toBeVisible();
    await expect(page.locator('.board-settings-column-actions[data-column]')).toHaveCount(0);
  } finally { db.cleanup({boardIds:[other.boardId]}); }
});

test('Card settings are the opened card\'s Card Settings: Draggable in Card\'s hamburger, each section a line per row', async ({ boardPage: page, board }) => {
  // docs/Features/Cards/Card-Fields.md: it was three columns (Draggable, Show
  // on Minicard, Show on Card), then the Admin Panel's left menu and pane
  // (2026-10-25); since 2026-10-28 it is the opened card's Card Settings
  // template (cardSettingsInline) - Show, then every section as a checklist.
  await expect(page.locator(`#js-list-${board.listIds[0]}`)).toBeVisible();
  for (const width of [1280, 800, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await openSettings(page, 'Card');
    const popup = page.locator('.pop-over[data-popup="boardCardSettingsPopup"]');
    await expect(popup).toBeVisible();
    // Two panes since 2026-10-28, the Minicard's and the Card's, at once.
    await expect(popup.locator('.js-card-settings-inline')).toHaveCount(2);
    await expect(popup.locator('.side-menu')).toHaveCount(0);
    // Draggable is not in the list itself: it is in Card's hamburger.
    await expect(popup.locator('.board-drag-settings')).toHaveCount(0);
    // A row is one line per side's pane, its checkbox that side's.
    for (const side of ['card', 'minicard']) {
      const line = popup.locator(`.js-card-settings-pane[data-side="${side}"] .js-card-settings-section[data-section="date"] .card-settings-line[data-key="dueDate"]`);
      await line.scrollIntoViewIfNeeded();
      await expect(line).toHaveAttribute('data-side', side);
      await expect(line).toHaveCount(1);
      await expect(line.locator(`.card-settings-side-${side}`)).toBeVisible();
    }
    expect(await popup.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    const menu = await openCardSectionMenu(page);
    await expect(menu.locator('.board-drag-settings')).toBeVisible();
  }
});

test('Card settings have no select-all for Show on Minicard or Show on Card (negative)', async ({ boardPage: page }) => {
  // In the Draggable table of Card's hamburger: Show on Minicard / Show on
  // Card are each section's own Select all / Select none, not a table column.
  await openColumns(page, 'Card');
  await expect(page.locator('.board-settings-column-actions[data-section="card"][data-column="draggable"]')).toBeVisible();
  await expect(page.locator('.board-settings-column-actions[data-section="card"][data-column="minicard"], .board-settings-column-actions[data-section="card"][data-column="card"]')).toHaveCount(0);
});
