'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
async function openSettings(page, section) {
  await page.evaluate(section => {
    Popup.close();
    const opener = document.body;
    Popup.open(`board${section}Settings`)({currentTarget: opener, target: opener, preventDefault() {}, stopPropagation() {}});
  }, section);
}
test('board drag columns default checked, persist independently and update sortables', async ({ boardPage: page, board }) => {
  for (const [section, kinds] of [['Swimlane', ['swimlane']], ['List', ['list']], ['Card', ['card', 'checklist', 'item', 'subtask']]]) {
    await openSettings(page, section);
    for (const kind of kinds) {
      const checkbox = page.locator(`.js-board-drag-setting[data-kind="${kind}"]`);
      await expect(checkbox).toBeChecked();
      await checkbox.uncheck();
      await expect(checkbox).toBeEnabled();
      await expect(checkbox).not.toBeChecked();
    }
  }
  await page.reload();
  await expect.poll(() => page.locator('.js-minicards').first().evaluate(node => $(node).data('uiSortable')?.options.disabled)).toBe(true);
  await expect.poll(() => page.locator('.js-lists').first().evaluate(node => $(node).data('uiSortable')?.options.disabled)).toBe(true);
  await expect.poll(() => page.locator('.js-swimlanes').evaluate(node => $(node).data('uiSortable')?.options.items)).toBe('.no-draggable-swimlanes');
  await openSettings(page, 'Card');
  for (const kind of ['card', 'checklist', 'item', 'subtask']) await expect(page.locator(`[data-kind="${kind}"].js-board-drag-setting`)).not.toBeChecked();
  expect(db.findOne('boards', {_id: board.boardId}).allowsCardDragging).toBe(false);
  await page.locator('[data-kind="card"].js-board-drag-setting').check();
  await expect.poll(() => db.findOne('boards', {_id: board.boardId}).allowsCardDragging).toBe(true);
  expect(db.findOne('boards', {_id: board.boardId}).allowsChecklistItemDragging).toBe(false);
});
test('deny foreign board settings and disabled mixed drag, retain explicit menu moves', async ({ boardPage: page, board, user2 }) => {
  const other = db.seedBoard({ownerId: user2.id, cardTitlesPerList: [['Private']]});
  const call = (method, ...args) => page.evaluate(async ({method, args}) => {
    try { return {result: await Meteor.callAsync(method, ...args)}; }
    catch (error) { return {error: error.error}; }
  }, {method, args});
  try {
    expect((await call('setBoardDragging', other.boardId, 'card', false)).error).toBe('not-authorized');
    expect((await call('setBoardDragging', board.boardId, 'unknown', false)).error).toBe('invalid-setting');
    expect((await call('setBoardDragging', board.boardId, 'card', 'false')).error).toBeDefined();
    expect((await call('setBoardDragging', board.boardId, 'card', false)).error).toBeUndefined();
    const card = db.findOne('cards', {boardId: board.boardId, title: 'Alpha Card'});
    const selection = [{kind:'card', id:card._id}];
    const target = {boardId:board.boardId, swimlaneId:board.swimlaneId, listId:board.listIds[1]};
    expect((await call('moveBoardObjects', board.boardId, selection, target, {drag:true})).error).toBe('drag-disabled');
    expect(db.findOne('cards', {_id:card._id}).listId).toBe(card.listId);
    expect((await call('moveBoardObjects', board.boardId, selection, target)).error).toBeUndefined();
    expect(db.findOne('cards', {_id:card._id}).listId).toBe(board.listIds[1]);
    expect(db.findOne('boards', {_id:other.boardId}).allowsCardDragging).not.toBe(false);
  } finally { db.cleanup({boardIds:[other.boardId]}); }
});
for (const handles of [false, true]) test(`disabled checklist items stay put on minicards and opened cards (handles ${handles})`, async ({boardPage: page, board, user}) => {
  const BoardPage = require('../pages/BoardPage');
  const CardPage = require('../pages/CardPage');
  const bp = new BoardPage(page), cp = new CardPage(page);
  await page.setViewportSize({width:1500, height:1300});
  db.updateOne('users', {_id:user.id}, {$set:{'profile.showDesktopDragHandles':handles}});
  const card = db.findOne('cards', {boardId:board.boardId, title:'Alpha Card'});
  const id = db.uid('check');
  db.insertOne('checklists', {_id:id, cardId:card._id, boardId:board.boardId, title:'Locked tasks', sort:0, showChecklistAtMinicard:true, createdAt:new Date()});
  for (let sort=0; sort<3; sort++) db.insertOne('checklistItems', {_id:db.uid('item'), cardId:card._id, boardId:board.boardId, checklistId:id, title:String(sort+1), sort, isFinished:false});
  await page.evaluate(boardId => Meteor.callAsync('setBoardDragging', boardId, 'item', false), board.boardId);
  await page.reload();
  const drag = async items => {
    await expect(items).toHaveCount(3);
    await items.last().scrollIntoViewIfNeeded();
    await items.first().hover();
    const from = await (handles ? items.first().locator('.checklistitem-handle') : items.first()).boundingBox();
    const to = await items.last().boundingBox();
    await page.mouse.move(from.x+from.width/2, from.y+from.height/2);
    await page.mouse.down();
    await page.mouse.move(from.x+from.width/2, to.y+to.height-2, {steps:20});
    await page.mouse.up();
  };
  const titles = items => items.locator('.item-title').allTextContents().then(values => values.map(value => value.trim()));
  const miniItems = bp.minicard(board.listIds[0], 'Alpha Card').locator('.js-checklist-item');
  await drag(miniItems);
  expect(await titles(miniItems)).toEqual(['1','2','3']);
  expect(db.findOne('cards', {_id:card._id}).listId).toBe(card.listId);
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  await cp.waitForOpen();
  const items = cp.root.locator('.js-checklist-item');
  await drag(items);
  expect(await titles(items)).toEqual(['1','2','3']);
  await page.evaluate(boardId => Meteor.callAsync('setBoardDragging', boardId, 'item', true), board.boardId);
  await expect.poll(() => items.first().evaluate(node => $(node).closest('.js-checklist-items').sortable('option', 'disabled'))).toBe(false);
  await drag(items);
  await expect.poll(() => titles(items)).toEqual(['2','3','1']);
});
