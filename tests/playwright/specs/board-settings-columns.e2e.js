'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { columnFields } = require('../../../models/lib/boardSettingsColumns');
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
    for (const column of section === 'Card' ? ['draggable','minicard','card'] : ['draggable','settings']) {
      const actions = page.locator(`.board-settings-column-actions[data-section="${section.toLowerCase()}"][data-column="${column}"]`);
      const fields = columnFields(section.toLowerCase(), column);
      const before = db.findOne('boards',{_id:board.boardId});
      for (const enabled of [true,false,false,true]) {
        const button = actions.locator(`[data-enabled="${enabled}"]`);
        await button.click();
        await expect(button).toBeEnabled();
        await expect.poll(() => {
          const saved = db.findOne('boards',{_id:board.boardId});
          return fields.every(field => saved[field] === enabled);
        }).toBe(true);
        await expect(actions.locator('.warning')).toHaveCount(0);
        if (column === 'draggable') {
          const boxes = page.locator('.js-board-drag-setting');
          for (const box of await boxes.all()) enabled ? await expect(box).toBeChecked() : await expect(box).not.toBeChecked();
        } else if (section === 'Card') {
          const toggles = page.locator(`.card-field-order-column-${column} .card-field-order-row:not(.card-settings-row-personal) .card-field-order-toggle`);
          await expect(toggles).toHaveCount(fields.length);
          await expect.poll(() => toggles.evaluateAll((nodes, value) => nodes.every(node => node.classList.contains('is-checked') === value), enabled)).toBe(true);
        }
      }
      const after = db.findOne('boards',{_id:board.boardId});
      for (const key of Object.keys(before).filter(key => /^(allows|showLabelText|labelsAbove|listWidthResizeLocked|swimlaneHeightResizeLocked|sameWidthForAllLists|.*FieldOrder)/.test(key) && !fields.includes(key))) expect(after[key],key).toEqual(before[key]);
      await page.reload();
      await openSettings(page, section);
      const saved = db.findOne('boards',{_id:board.boardId});
      expect(fields.every(field => saved[field] === true)).toBe(true);
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
