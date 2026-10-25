'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { columnFields } = require('../../../models/lib/boardSettingsColumns');
// A Scrum row's flag is a path into the board's Scrum settings.
const valueOf = (doc, field) => field.split('.').reduce((value, key) => value?.[key], doc);
async function openSettings(page, section) {
  await page.evaluate(section => {
    Popup.close();
    Popup.open(`board${section}Settings`)({currentTarget:document.body, target:document.body, preventDefault() {}, stopPropagation() {}});
  }, section);
}
for (const section of ['Swimlane','List','Card']) test(`${section} column actions set all, unset all and persist without changing other columns`, async ({boardPage:page, board, user}) => {
  const other = db.seedBoard({ownerId:user.id});
  const otherBefore = db.findOne('boards',{_id:other.boardId});
  const profileBefore = db.findOne('users',{_id:user.id}).profile;
  try {
    await openSettings(page, section);
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
      await openSettings(page, section);
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
    await expect(page.locator('.board-settings-column-actions')).toHaveCount(0);
  } finally { db.cleanup({boardIds:[other.boardId]}); }
});

test('Card settings are the Admin Panel left menu and pane: Draggable in the first entry, each section a line per row', async ({ boardPage: page, board }) => {
  // docs/Features/Cards/Card-Fields.md (2026-10-25): it was three columns
  // (Draggable, Show on Minicard, Show on Card); now a left menu of sections and
  // a pane, the same popup the opened card's "+ Add" opens.
  await expect(page.locator(`#js-list-${board.listIds[0]}`)).toBeVisible();
  for (const width of [1280, 800, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await openSettings(page, 'Card');
    const popup = page.locator('.pop-over[data-popup="boardCardSettingsPopup"]');
    await expect(popup).toBeVisible();
    await expect(popup.locator('.setting-content .content-body .side-menu')).toBeVisible();
    await expect(popup.locator('.board-drag-settings')).toBeVisible();
    await popup.locator('.js-card-settings-menu[data-id="date"]').click();
    await expect(popup.locator('.board-drag-settings')).toHaveCount(0);
    const line = popup.locator('.card-settings-line[data-key="dueDate"]');
    await expect(line).toBeVisible();
    const [mini, card] = await Promise.all(['minicard', 'card'].map(side => line.locator(`.card-settings-side-${side}`).boundingBox()));
    expect(mini.x).toBeLessThan(card.x);
    expect(await popup.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  }
});

test('Card settings have no select-all for Show on Minicard or Show on Card (negative)', async ({ boardPage: page }) => {
  await openSettings(page, 'Card');
  await expect(page.locator('.board-settings-column-actions[data-section="card"][data-column="draggable"]')).toBeVisible();
  await expect(page.locator('.board-settings-column-actions[data-section="card"][data-column="minicard"], .board-settings-column-actions[data-section="card"][data-column="card"]')).toHaveCount(0);
});
