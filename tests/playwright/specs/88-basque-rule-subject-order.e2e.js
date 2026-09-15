'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard, navigateInApp } = require('../helpers/auth');

test('Basque named controls and saved descriptions keep the demonstrative last', async ({ page, adminUser }) => {
  const board = db.seedBoard({ ownerId: adminUser.id, title: 'Basque subject order', listCount: 1 });
  const previous = db.findOne('users', { _id: adminUser.id }).profile?.language;
  try {
    db.updateOne('users', { _id: adminUser.id }, { $set: { 'profile.language': 'eu' } });
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules`);
    await page.locator('#ruleTitle').fill('Basque named checklist');
    await page.locator('.js-goto-trigger').click();
    await page.locator('.js-set-card-triggers').click();
    for (const id of ['spec-label', 'spec-member', 'spec-assignee']) {
      const row = page.locator(`#${id}`).locator('xpath=../..');
      await expect(row).toBeVisible();
      expect(await row.evaluate(el => {
        const children = [...el.children];
        return children[0].classList.contains('trigger-dropdown') && /hau$/.test(children[1].textContent.trim());
      })).toBe(true);
    }
    await page.locator('.js-set-checklist-triggers').click();
    for (const id of ['check-name', 'spec-comp-check-name', 'check-item-name']) {
      const row = page.locator(`#${id}`).locator('xpath=../..');
      await expect(row).toBeVisible();
      expect(await row.evaluate(el => el.children[0].classList.contains('trigger-dropdown') && /hau$/.test(el.children[1].textContent.trim()))).toBe(true);
    }
    await page.locator('#check-name').fill('Demo');
    await page.locator('.js-add-spec-check-trigger.js-goto-action').click();
    await page.locator('.js-add-gen-move-action.js-goto-rules').first().click();
    await expect.poll(() => db.find('triggers', { boardId: board.boardId }).map(item => item.desc).join('\n'))
      .toContain('Demo kontrol-zerrenda hau');
    expect(db.find('triggers', { boardId: board.boardId }).map(item => item.desc).join('\n'))
      .not.toContain('kontrol-zerrenda hau Demo');
    db.updateOne('users', { _id: adminUser.id }, { $set: { 'profile.language': 'en' } });
    await page.reload();
    // Reload keeps this page's HttpOnly session cookie. Logging in with the
    // same fixture token again would replace that session unnecessarily.
    await openBoard(page, board.boardId, board.slug);
    await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules`);
    await page.locator('#ruleTitle').fill('English unchanged');
    await page.locator('.js-goto-trigger').click();
    await page.locator('.js-set-card-triggers').click();
    const englishRow = page.locator('#spec-member').locator('xpath=../..');
    await expect(englishRow).toBeVisible();
    expect(await englishRow.evaluate(el => el.children[0].classList.contains('trigger-text'))).toBe(true);
  } finally {
    db.updateOne('users', { _id: adminUser.id }, previous === undefined
      ? { $unset: { 'profile.language': '' } }
      : { $set: { 'profile.language': previous } });
    db.cleanup({ boardIds: [board.boardId] });
  }
});
