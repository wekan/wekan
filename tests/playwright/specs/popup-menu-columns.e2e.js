'use strict';
const { test, expect } = require('../fixtures');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

for (const menu of ['boardChangeView', 'boardMenu', 'memberMenu', 'listAction', 'swimlaneAction', 'cardDetailsActions']) {
  test(`${menu} uses available width for its options`, async ({ boardPage: page, board }) => {
    const bp = new BoardPage(page);
    await expect(bp.minicard(board.listIds[0], 'Alpha Card')).toBeVisible();
    if (menu === 'listAction') await bp.openListMenu(board.listIds[0]);
    else if (menu === 'swimlaneAction') await page.locator('.js-open-swimlane-menu').first().click();
    else if (menu === 'cardDetailsActions') {
      await bp.clickCard(board.listIds[0], 'Alpha Card');
      const cp = new CardPage(page);
      await cp.waitForOpen();
      await cp.root.locator('.js-open-card-details-menu:visible').first().click();
    } else {
      await page.evaluate(name => Popup.open(name)({ currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} }), menu);
    }
    const popup = page.locator('.js-pop-over');
    await expect(popup).toHaveClass(/pop-over--menu-columns/);
    const options = popup.locator('.content.popup-menu-columns ul.pop-over-list li > a:visible');
    expect(await options.count()).toBeGreaterThanOrEqual(8);
    const boxes = await options.evaluateAll(els => els.map(el => {
      const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    }));
    expect(new Set(boxes.map(r => Math.round(r.left))).size).toBeGreaterThan(1);
    for (const r of boxes) {
      expect(r.left).toBeGreaterThanOrEqual(0);
      expect(r.top).toBeGreaterThanOrEqual(0);
      expect(r.right).toBeLessThanOrEqual(page.viewportSize().width);
      expect(r.bottom).toBeLessThanOrEqual(page.viewportSize().height);
    }
    const wrapper = popup.locator('.content-wrapper');
    expect(await wrapper.evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
    if (menu === 'memberMenu') {
      await popup.locator('.js-edit-profile').click();
      await expect(popup.locator('form')).toBeVisible();
      await expect(popup).not.toHaveClass(/pop-over--menu-columns/);
      await popup.locator('.js-back-view').click();
      await expect(popup).toHaveClass(/pop-over--menu-columns/);
    }
  });
}

test('Board View returns to one column on a phone and keeps chart navigation working', async ({ boardPage: page, board }) => {
  const bp = new BoardPage(page);
  await expect(bp.minicard(board.listIds[0], 'Alpha Card')).toBeVisible();
  await page.locator('.js-toggle-board-view').first().click();
  const popup = page.locator('.js-pop-over');
  await expect(popup).toHaveClass(/pop-over--menu-columns/);
  await page.setViewportSize({ width: 375, height: 800 });
  const menu = popup.locator('.popup-menu-columns');
  await expect(menu).toHaveCSS('column-count', 'auto');
  const options = menu.locator('li > a:visible');
  expect(await options.evaluateAll(els => new Set(els.map(el => Math.round(el.getBoundingClientRect().left))).size)).toBe(1);
  await popup.locator('.js-open-monte-carlo-view').click();
  await expect(page.locator('.chart-options')).toBeVisible();
});

test('long label picker uses columns and its edit form stays a form', async ({ boardPage: page, board }) => {
  const db = require('../helpers/db');
  const labels = Array.from({ length: 12 }, (_, i) => ({ _id: `wide-label-${i}`, name: `Column label ${i}`, color: 'green' }));
  db.updateOne('boards', { _id: board.boardId }, { $set: { labels } });
  await page.reload();
  const bp = new BoardPage(page), cp = new CardPage(page);
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  await cp.waitForOpen();
  await cp.openLabelSelector();
  const popup = page.locator('.js-pop-over');
  await expect(popup).toHaveClass(/pop-over--menu-columns/);
  const rows = popup.locator('li.js-card-label-item');
  await expect(rows).toHaveCount(12);
  expect(await rows.evaluateAll(els => new Set(els.map(el => Math.round(el.getBoundingClientRect().left))).size)).toBeGreaterThan(1);
  await rows.first().locator('.js-select-label').click();
  await expect.poll(() => db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' }).labelIds).toContain('wide-label-0');
  await rows.first().locator('.js-edit-label').click();
  await expect(popup.locator('form.edit-label')).toBeVisible();
  await expect(popup).not.toHaveClass(/pop-over--menu-columns/);
});

test('member search spans the columns and filtering keeps its width', async ({ boardPage: page, board }) => {
  const db = require('../helpers/db');
  const users = Array.from({ length: 9 }, (_, i) => ({ _id: db.uid('picker'), username: `picker${i}${board.boardId}`, profile: { fullname: `Picker Person ${i}` }, emails: [] }));
  db.insertMany('users', users);
  db.updateOne('boards', { _id: board.boardId }, { $push: { members: { $each: users.map(u => ({ userId: u._id, isActive: true, isAdmin: false })) } } });
  try {
    await page.reload();
    const bp = new BoardPage(page), cp = new CardPage(page);
    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();
    await cp.openMemberSelector();
    const popup = page.locator('.js-pop-over');
    await expect(popup).toHaveClass(/pop-over--menu-columns/);
    const search = popup.locator('.card-members-filter');
    await expect(search).toHaveCSS('column-span', 'all');
    const before = await popup.boundingBox();
    await search.fill('Picker Person 0');
    await search.press('ArrowRight');
    await expect(popup.locator('.js-select-member')).toHaveCount(1);
    await expect(popup).toHaveClass(/pop-over--menu-columns/);
    expect((await popup.boundingBox()).width).toBe(before.width);
    await popup.locator('.js-select-member').click();
    await expect.poll(() => db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' }).members).toContain(users[0]._id);
  } finally { db.cleanup({ userIds: users.map(u => u._id) }); }
});

test('wide Board View columns stay on screen in RTL', async ({ boardPage: page, board }) => {
  await expect(page.locator(`#js-list-${board.listIds[0]}`)).toBeVisible();
  await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
  await page.locator('.js-toggle-board-view').first().click();
  const popup = page.locator('.pop-over--menu-columns');
  await expect(popup).toBeVisible();
  const rect = await popup.boundingBox();
  expect(rect.x).toBeGreaterThanOrEqual(0);
  expect(rect.x + rect.width).toBeLessThanOrEqual(page.viewportSize().width);
  const options = popup.locator('.popup-menu-columns li > a');
  expect(await options.evaluateAll(els => new Set(els.map(el => Math.round(el.getBoundingClientRect().left))).size)).toBeGreaterThan(1);
  expect(await popup.locator('.content-wrapper').evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
});
