'use strict';
const { openRulesMenuEntry } = require('../helpers/rulesMenu');
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

async function seedRule(board, user) {
  const triggerId = db.uid('trigger'), actionId = db.uid('action'), id = db.uid('rule');
  db.insertOne('triggers', { _id: triggerId, boardId: board.boardId, activityType: 'createCard', listName: '*', swimlaneName: '*', cardTitle: '*', userId: '*', desc: 'When a card is created', extraData: { keep: 'unchanged' } });
  db.insertOne('actions', { _id: actionId, boardId: board.boardId, actionType: 'markCardComplete', desc: 'Mark card complete' });
  db.insertOne('rules', { _id: id, boardId: board.boardId, triggerId, actionId, title: 'Existing block rule', enabled: false, createdAt: new Date() });
  return { id, triggerId, actionId };
}
function clean(boardId) { for (const c of ['rules', 'triggers', 'actions']) db.deleteMany(c, { boardId }); }

test('Blocks loads on demand, edits real rules without data loss and creates executable rules', async ({ page, board, user }) => {
  const ids = await seedRule(board, user);
  const errors=[]; page.on('pageerror', error=>errors.push(error.message));
  try {
    await loginWithToken(page, user.id, user.token);
    await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules`);
    await expect(page.locator('.rules-list')).toBeVisible();
    await expect(page.locator('.blocklySvg')).toHaveCount(0);
    await openRulesMenuEntry(page, 'js-open-rules-blocks-view');
    await expect(page.locator('.rules-blocks .blocklySvg')).toBeVisible();
    await page.locator('.js-blocks-rule').selectOption(ids.id);
    await expect(page.locator('.rules-blocks .blocklyText').filter({ hasText: 'When: Card is created' }).first()).toBeVisible();
    await page.locator('.js-blocks-title').fill('Updated block rule');
    await page.locator('.js-blocks-save').click();
    await expect.poll(()=>db.findOne('rules',{_id:ids.id}).title).toBe('Updated block rule');
    expect(db.findOne('rules',{_id:ids.id}).enabled).toBe(false);
    expect(db.findOne('triggers',{_id:ids.triggerId}).extraData).toEqual({keep:'unchanged'});
    await page.locator('.js-blocks-form').click();
    await expect(page.locator('.triggers-content')).toBeVisible();
    await openRulesMenuEntry(page, 'js-open-rules-blocks-view');
    await expect(page.locator('.rules-blocks .blocklySvg')).toBeVisible();
    await page.locator('.js-blocks-title').fill('Incomplete blocks');
    await page.locator('.js-blocks-save').click();
    await expect(page.locator('.rules-blocks [role="alert"]')).toContainText('Connect exactly one');
    expect(db.find('rules',{boardId:board.boardId})).toHaveLength(1);
    // Exercise the real Blockly workspace loader, then save using the visible UI.
    await page.evaluate(() => {
      let view = Blaze.getView(document.querySelector('.js-rules-blocks-workspace'));
      while (view && view.name !== 'Template.rulesBlocks') view = view.parentView;
      const tpl = view.templateInstance();
      tpl.editor.load({activityType:'createCard',listName:'*',swimlaneName:'*',cardTitle:'*',userId:'*'}, {actionType:'markCardComplete'});
    });
    await page.locator('.js-blocks-title').fill('Complete new cards');
    await page.locator('.js-blocks-save').click();
    await expect.poll(()=>db.find('rules',{boardId:board.boardId}).length).toBe(2);
    const created = await page.evaluate(({boardId,listId,swimlaneId}) => Meteor.callAsync('/cards/insert', {boardId,listId,swimlaneId,title:'Created by Blocks test',sort:99,type:'cardType-card',archived:false}), {boardId:board.boardId,listId:board.listIds[0],swimlaneId:board.swimlaneId});
    await expect.poll(()=>db.findOne('cards',{_id:created})?.dueComplete).toBe(true);
    expect(errors).toEqual([]);
  } finally { clean(board.boardId); }
});

test('Blocks keeps rule writes restricted to board admins', async ({ page, board, user2 }) => {
  db.addBoardMember({boardId:board.boardId,userId:user2.id});
  try {
    await loginWithToken(page,user2.id,user2.token);
    await navigateInApp(page,`/b/${board.boardId}/${board.slug}/rules`);
    // The Rules views are in Board Settings for board admins only, so a member
    // is not offered them there (negative). The page itself must still refuse
    // when the Blocks view is reached some other way, e.g. a stored mode.
    await page.locator('.js-toggle-page-sidebar').first().click();
    await page.locator('.board-sidebar .js-open-board-menu').click();
    await page.locator('.js-pop-over').waitFor();
    await expect(page.locator('.js-pop-over [class*="js-open-rules"]')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await page.evaluate(() => { Session.set('rulesViewMode', 'blocks'); Session.set('rulesViewRequest', (Session.get('rulesViewRequest') || 0) + 1); });
    await expect(page.locator('.rules-blocks')).toContainText('administrator permission');
    await expect(page.locator('.blocklySvg')).toHaveCount(0);
    const result = await page.evaluate(async boardId=>{
      try { await Meteor.callAsync('rules.createRule',boardId,'Forbidden',{activityType:'createCard'},{actionType:'archive'}); return 'allowed'; }
      catch(error) { return error.error; }
    },board.boardId);
    expect(result).toBe('not-authorized');
    expect(db.find('rules',{boardId:board.boardId})).toHaveLength(0);
  } finally { clean(board.boardId); }
});

for (const language of ['fi','ar','gu-IN','sv','sl','vi','ku','ckb','tt','so','ny','mi','sm','tk_TM','yi','bho','mai','or_IN','kok','pap','ary','st','tn','nso','zu','zu-ZA','xh','ss','nd','ts','ve','bi','tpi','fj','to','haw','om','rw','rn','lg','wa','wa-RR','ace','gv','se','ve-CC','rup','ak','bm','ee','wo','ff','ks','bua','cv','sah','bo','dz','ti','qu','ay','gn','ve-PP','vo','tlh','nah','wal','zgh','wuu-Hans','kl','iu','tig','chr']) test(`Blocks supports localized drag, field editing and context menus: ${language}`, async ({page,board,user}) => {
  const translations=require(`../../../imports/i18n/data/${language}.i18n.json`);
  db.updateOne('users',{_id:user.id},{$set:{'profile.language':language}});
  const ids=await seedRule(board,user);
  try {
    await loginWithToken(page,user.id,user.token);
    await navigateInApp(page,`/b/${board.boardId}/${board.slug}/rules`);
    await page.locator('.js-toggle-page-sidebar').first().click();
    await page.locator('.board-sidebar .js-open-board-menu').click();
    await expect(page.locator('.js-pop-over .js-open-rules-blocks-view')).toContainText(translations['r-blocks-view']);
    await page.locator('.js-pop-over .js-open-rules-blocks-view').click();
    await page.locator('.js-blocks-rule').selectOption(ids.id);
    const workspace=page.locator('.rules-blocks-workspace');
    await workspace.scrollIntoViewIfNeeded();
    const block=workspace.locator('.blocklySvg > .blocklyWorkspace > .blocklyBlockCanvas > .blocklyDraggable').first();
    await expect(block).toBeVisible();
    // Compare workspace coordinates: the dirty-state banner can move the
    // editor in the page while a block is being dragged.
    const blockY=()=>block.evaluate(element=>element.transform.baseVal.consolidate().matrix.f);
    const beforeY=await blockY();
    const before=await block.boundingBox();
    await page.mouse.move(before.x+before.width/2,before.y+12);
    await page.mouse.down();
    await page.mouse.move(before.x+before.width/2+65,before.y+72,{steps:12});
    await page.mouse.up();
    await expect.poll(async()=>Math.abs(await blockY()-beforeY)).toBeGreaterThan(20);
    await block.locator('.blocklyEditableField').first().dblclick();
    const input=page.locator('.blocklyHtmlInput');
    await input.fill('Localized list');
    await input.press('Enter');
    await page.locator('.js-blocks-save').click();
    await expect.poll(()=>db.findOne('triggers',{_id:ids.triggerId}).listName).toBe('Localized list');
    await workspace.scrollIntoViewIfNeeded();
    await block.locator('.blocklyPath').first().click({button:'right',position:{x:30,y:12}});
    await expect(page.locator('.blocklyContextMenu')).toContainText(translations['blockly-DUPLICATE_BLOCK']);
    // Workspace comments are switched off on purpose (editor.js: `comments:
    // false` - a comment has no rule equivalent), so the menu never offers
    // "Add comment" in any language. c9cc757aa1 expected it in 64 locales.
    await expect(page.locator('.blocklyContextMenu')).not.toContainText(translations['blockly-ADD_COMMENT']);
    await page.keyboard.press('Escape');
  } finally { clean(board.boardId); }
});
