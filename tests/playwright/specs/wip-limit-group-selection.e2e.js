'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

test('#6699 WIP groups allow mouse and keyboard selection and persist editing', async ({ boardPage: page, board }) => {
  await page.evaluate(() => {
    Popup.close();
    const opener = document.body;
    Popup.open('wipLimitGroups')({ currentTarget: opener, target: opener, preventDefault() {} });
  });
  const form = page.locator('.wip-limit-group-new');
  const boxes = form.locator('input[type="checkbox"]');
  await expect(boxes).toHaveCount(3);
  await expect(boxes.first()).toBeVisible();
  await boxes.nth(0).check();
  await boxes.nth(1).focus();
  await page.keyboard.press('Space');
  await expect(boxes.nth(1)).toBeChecked();
  await expect(boxes.nth(2)).not.toBeChecked();
  await form.locator('.js-wip-limit-group-new-save').click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).wipLimitGroups?.length).toBe(1);
  const saved = page.locator('form.wip-limit-group');
  await expect(saved.locator('input[type="checkbox"]')).toHaveCount(3);
  await saved.locator(`[data-list-id="${board.listIds[1]}"]`).uncheck();
  await saved.locator(`[data-list-id="${board.listIds[2]}"]`).check();
  await saved.locator('.js-wip-limit-group-save').click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).wipLimitGroups[0].listIds.sort())
    .toEqual([board.listIds[0], board.listIds[2]].sort());
});
