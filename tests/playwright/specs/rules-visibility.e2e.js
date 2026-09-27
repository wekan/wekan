'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

async function withinRows(page) {
  const problems = await page.locator('.rules-page .trigger-item, .rules-page .rules-lists-item').evaluateAll(rows => rows.flatMap(row => {
    const bounds = row.getBoundingClientRect();
    return [...row.querySelectorAll('button, input, textarea, select, .trigger-text')].filter(el => {
      const r = el.getBoundingClientRect();
      return r.width && r.height && getComputedStyle(el).visibility !== 'hidden' && (r.left < bounds.left - 2 || r.right > bounds.right + 2 || r.top < bounds.top - 2 || r.bottom > bounds.bottom + 2);
    }).map(el => `${row.id || row.className}: ${el.className || el.tagName}`);
  }));
  expect(problems).toEqual([]);
}
for (const {width,theme,language} of [
  {width:1440,theme:'belize',language:'en'},
  {width:390,theme:'belize',language:'en'},
  {width:390,theme:'dark',language:'ar'},
  {width:1440,theme:'cleanlight',language:'en'},
]) test(`Rules text and controls remain inside their rows at ${width}px, ${theme}, ${language}`,  async ({ page, board, user }) => {
  await page.setViewportSize({width,height:950});
  db.updateOne('users',{_id:user.id},{$set:{'profile.globalThemeColor':theme,'profile.language':language}});
  const triggerId=db.uid('trigger'),actionId=db.uid('action'),ruleId=db.uid('rule');
  db.insertOne('triggers',{_id:triggerId,boardId:board.boardId,activityType:'createCard',desc:'Long trigger '.repeat(25)});
  db.insertOne('actions',{_id:actionId,boardId:board.boardId,actionType:'archive',desc:'Long action '.repeat(25)});
  db.insertOne('rules',{_id:ruleId,boardId:board.boardId,triggerId,actionId,title:'Long title '.repeat(40)});
  try {
    await loginWithToken(page,user.id,user.token);
    await navigateInApp(page,`/b/${board.boardId}/${board.slug}/rules`);
    await expect(page.locator('.rules-lists-item')).toHaveCount(1);
    await withinRows(page);
    await expect(page.locator('.js-goto-details')).toHaveCSS('color',theme === 'cleanlight' ? 'rgba(255, 255, 255, 0.85)' : 'rgb(255, 255, 255)');
    await expect(page.locator('.js-goto-details i')).toHaveCSS('color',await page.locator('.js-goto-details').evaluate(el=>getComputedStyle(el).color));
    await page.locator('.js-goto-details').click();
    await withinRows(page);
    await page.locator('.js-goback').click();
    const overlaps = await page.locator('.rules-lists-item').evaluate(row=>{
      const text=row.querySelector('p').getBoundingClientRect();
      const buttons=row.querySelector('.rules-btns-group').getBoundingClientRect();
      return Math.min(text.right,buttons.right)>Math.max(text.left,buttons.left)+1 && Math.min(text.bottom,buttons.bottom)>Math.max(text.top,buttons.top)+1;
    });
    expect(overlaps).toBe(false);
    await page.locator('#ruleTitle').fill('Visibility test '.repeat(12));
    await page.locator('.js-goto-trigger').click();
    for (const selector of ['.js-set-board-triggers','.js-set-card-triggers','.js-set-checklist-triggers','.js-set-scheduled-triggers','.js-set-button-triggers']) {
      await page.locator(selector).click();
      await expect(page.locator('.triggers-main-body')).toBeVisible();
      await withinRows(page);
    }
    await page.locator('.js-set-board-triggers').click();
    await page.locator('.js-add-gen-moved-trigger').click();
    for (const selector of ['.js-set-board-actions','.js-set-card-actions','.js-set-checklist-actions','.js-set-mail-actions']) {
      await page.locator(selector).click();
      await withinRows(page);
    }
    await page.locator('.js-toggle-page-sidebar').first().click();
    await page.locator('.js-rules-toggle-view').click();
    await expect(page.locator('.js-close-page-sidebar')).not.toBeVisible();
    await expect(page.locator('.rules-workflow')).toBeVisible();
    const overflow=await page.locator('.rules-workflow').evaluate(el=>el.scrollWidth>el.clientWidth+2);
    expect(overflow).toBe(false);
  } finally { for(const c of ['rules','actions','triggers']) db.deleteMany(c,{boardId:board.boardId}); }
});
