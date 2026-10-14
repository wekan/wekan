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

test('#6699 rejects invalid lists and unauthorized group edits', async ({ boardPage: page, board, user2 }) => {
  const { loginWithToken } = require('../helpers/auth');
  const group = { _id: 'protected-group', name: '', listIds: board.listIds.slice(0, 2), limit: 1, enabled: true };
  db.updateOne('boards', { _id: board.boardId }, { $set: { wipLimitGroups: [group] } });
  const invoke = fields => page.evaluate(async ({ boardId, fields }) => {
    try {
      await Meteor.callAsync('updateWipLimitGroup', boardId, 'protected-group', fields);
      return 'accepted';
    } catch (error) { return error.error; }
  }, { boardId: board.boardId, fields });
  expect(await invoke({ listIds: [board.listIds[0], 'foreign-list'] })).toBe('invalid-lists');
  expect(await invoke({ limit: 0 })).toBe('invalid-limit');
  expect(await invoke({ unexpected: true })).not.toBe('accepted');
  await loginWithToken(page, user2.id, user2.token);
  expect(await invoke({ enabled: false })).toBe('not-authorized');
  expect(db.findOne('boards', { _id: board.boardId }).wipLimitGroups).toEqual([group]);
});

test('Southern Sotho WIP dialog distinguishes groups from enabling a limit', async ({ boardPage: page }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'st'));
  await page.evaluate(() => {
    Popup.close();
    Popup.open('wipLimitGroups', { titleKey: 'wip-limit-groups' })({
      currentTarget: document.body, target: document.body, preventDefault() {},
    });
  });
  await expect(page.locator('.js-pop-over .header-title')).toHaveText('Dihlopha tsa moedi wa WIP');
  const form = page.locator('.wip-limit-group-new');
  await expect(form.locator('.js-wip-limit-group-new-save')).toHaveValue('Eketsa sehlopha sa moedi wa WIP');
  await expect(form.locator('.js-wip-limit-group-swimlane option[value=""]')).toHaveText('Kgetha tsela');
  await expect(form.locator('.js-wip-limit-group-apply-swimlane')).toHaveText('Sebedisa tseleng');
  await expect(form).not.toContainText('Kgetha boto');
  await page.evaluate(() => Popup.close());
});

test('Haitian WIP dialog names groups and limits selection to swimlanes', async ({ boardPage: page, board }) => {
  db.updateOne('boards', { _id: board.boardId }, { $set: { wipLimitGroups: [{
    _id: 'translated-group', name: '', listIds: board.listIds.slice(0, 2), limit: 1, enabled: true,
  }] } });
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'ht'));
  await page.evaluate(() => {
    Popup.close();
    Popup.open('wipLimitGroups', { titleKey: 'wip-limit-groups' })({
      currentTarget: document.body, target: document.body, preventDefault() {},
    });
  });
  await expect(page.locator('.js-pop-over .header-title')).toHaveText('Gwoup limit WIP');
  const form = page.locator('.wip-limit-group-new');
  await expect(page.locator('form.wip-limit-group textarea[placeholder="Non gwoup la (opsyonèl)"]')).toBeVisible();
  await expect(form.locator('.js-wip-limit-group-new-save')).toHaveValue('Ajoute yon gwoup limit WIP');
  await expect(form.locator('.js-wip-limit-group-new-save')).not.toHaveValue(/Aktive/);
  await expect(form.locator('.js-wip-limit-group-swimlane option[value=""]')).toHaveText('Chwazi kouloir la');
  await expect(form.locator('.js-wip-limit-group-apply-swimlane')).toHaveText('Aplike nan kouloir la');
  await expect(form).not.toContainText('Chwazi tablo');
  await page.evaluate(() => Popup.close());
});

test('Malagasy WIP dialog distinguishes groups and swimlanes', async ({ boardPage: page }) => {
  await page.evaluate(async () => {
    await Meteor.callAsync('setLanguage', 'mg');
    Popup.close();
    Popup.open('wipLimitGroups', { titleKey: 'wip-limit-groups' })({
      currentTarget: document.body, target: document.body, preventDefault() {},
    });
  });
  await expect(page.locator('.js-pop-over .header-title')).toHaveText('Vondrona fetra WIP');
  const form = page.locator('.wip-limit-group-new');
  await expect(form.locator('.js-wip-limit-group-new-save')).toHaveValue('Ampio vondrona fetra WIP');
  await expect(form.locator('.js-wip-limit-group-new-save')).not.toHaveValue(/Alefaso/);
  await expect(form.locator('.js-wip-limit-group-swimlane option[value=""]')).toHaveText('Fidio ny lalana');
  await expect(form.locator('.js-wip-limit-group-apply-swimlane')).toHaveText('Ampiharo amin’ny lalana');
  await expect(form).not.toContainText('Fidio ny solaitra');
  await page.evaluate(() => Popup.close());
});
