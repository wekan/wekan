'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
for (const handles of [false,true]) for (const target of ['body','header','collapsed-header']) {
  test(`two selected lists move to another swimlane ${target} (handles ${handles})`, async ({boardPage:page,board,user}) => {
    await page.setViewportSize({width:1500,height:1500});
    db.updateOne('users',{_id:user.id},{$set:{'profile.showDesktopDragHandles':handles}});
    for (const id of board.listIds) db.updateOne('lists',{_id:id},{$set:{swimlaneId:board.swimlaneId}});
    const laneId=db.uid('lane');
    db.insertOne('swimlanes',{...db.findOne('swimlanes',{_id:board.swimlaneId}),_id:laneId,title:'Destination lane',sort:1,height:300});
    const cards=db.find('cards',{boardId:board.boardId,listId:{$in:board.listIds.slice(0,2)}});
    await page.reload();
    if (target === 'collapsed-header') {
      await page.locator('.js-swimlane-header').filter({hasText:'Destination lane'}).locator('.js-collapse-swimlane').click();
      for (const id of board.listIds.slice(0,2)) await page.locator(`#js-list-${id} .js-collapse`).click();
    }
    await page.locator('.js-multiselection-activate').click();
    for(const id of board.listIds.slice(0,2)) await page.locator(`.js-structural-selection[data-kind="list"][data-id="${id}"]`).click();
    const fromNode=page.locator(`#js-list-${board.listIds[0]}`).locator(handles?'.js-list-handle:visible':'.list-header-name').first();
    const toNode=target==='body'?page.locator(`#swimlane-${laneId}`):page.locator('.js-swimlane-header').filter({hasText:'Destination lane'});
    const from=await fromNode.boundingBox(),to=await toNode.boundingBox();
    await page.mouse.move(from.x+from.width/2,from.y+from.height/2);
    await page.mouse.down();
    await page.mouse.move(to.x+to.width/2,to.y+to.height/2,{steps:30});
    const preview = page.locator('.structural-drag-preview');
    await expect(preview).toBeVisible();
    await expect(preview.locator('.structural-drag-name span')).toHaveText(['List A','List B']);
    expect(await preview.evaluate(node=>getComputedStyle(node).transform)).not.toBe('none');
    if (!handles && target === 'body') await page.screenshot({path:test.info().outputPath('named-preview.png')});
    await page.mouse.up();
    await expect.poll(()=>db.find('lists',{_id:{$in:board.listIds.slice(0,2)},swimlaneId:laneId}).length).toBe(2);
    expect(db.findOne('lists',{_id:board.listIds[2]}).swimlaneId).toBe(board.swimlaneId);
    for(const card of cards) {
      const moved=db.findOne('cards',{_id:card._id});
      expect(moved.swimlaneId).toBe(laneId);
      expect(moved.listId).toBe(card.listId);
    }
    const movedLists = db.find('lists',{_id:{$in:board.listIds.slice(0,2)}}).sort((a,b)=>a.sort-b.sort);
    expect(movedLists.map(list=>list._id)).toEqual(board.listIds.slice(0,2));
    if (target === 'collapsed-header') await page.locator('.js-swimlane-header').filter({hasText:'Destination lane'}).locator('.js-collapse-swimlane').click();
    for(const id of board.listIds.slice(0,2)) await expect(page.locator(`#swimlane-${laneId} #js-list-${id}`)).toBeVisible();
    await page.reload();
    for(const id of board.listIds.slice(0,2)) await expect(page.locator(`#swimlane-${laneId} #js-list-${id}`)).toBeVisible();
  });
}
