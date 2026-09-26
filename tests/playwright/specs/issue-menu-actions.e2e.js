'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

test('#2131: insert above and below from the existing swimlane popup', async ({ boardPage: page, board }) => {
  await new BoardPage(page).switchToSwimlanesView();
  const lane = page.locator('.swimlane-header-wrap').filter({ hasText: 'Default' });
  for (const placement of ['above', 'below']) {
    await lane.locator('.js-open-add-swimlane-menu').click();
    const popup = page.locator('.js-pop-over');
    await expect(popup.locator('.js-swimlane-placement[value="below"]')).toBeChecked();
    await popup.locator(`.js-swimlane-placement[value="${placement}"]`).check();
    await popup.locator('.swimlane-name-input').fill(`Inserted ${placement}`);
    await popup.locator('button[type="submit"]').click();
    await expect(page.locator('.swimlane-header').filter({ hasText: `Inserted ${placement}` })).toBeVisible();
  }
  const lanes = db.find('swimlanes', { boardId: board.boardId }).sort((a, b) => a.sort - b.sort);
  expect(lanes.map(l => l.title)).toEqual(['Inserted above', 'Default', 'Inserted below']);
});

test('#2131: read-only users cannot insert a swimlane', async ({ page, user2, board }) => {
  db.addBoardMember({ boardId: board.boardId, userId: user2.id });
  db.updateOne('boards', { _id: board.boardId }, { $set: { members: db.getBoard(board.boardId).members.map(m => m.userId === user2.id ? { ...m, isReadOnly: true } : m) } });
  await loginWithToken(page, user2.id, user2.token);
  await navigateInApp(page, `/b/${board.boardId}/${board.slug}`);
  await new BoardPage(page).switchToSwimlanesView();
  await expect(page.locator('.js-open-add-swimlane-menu')).toHaveCount(0);
  const result = await page.evaluate(async boardId => {
    try { await Meteor.callAsync('/swimlanes/insert', { boardId, title: 'Forbidden', sort: -1, type: 'swimlane' }); return 'allowed'; }
    catch (e) { return e.error; }
  }, board.boardId);
  expect(result).toBe(403);
  expect(db.find('swimlanes', { boardId: board.boardId })).toHaveLength(1);
});

test('#2644: tile actions confirm cloning and archiving; cancelling preserves the board', async ({ boardPage: page, board }) => {
  await navigateInApp(page, '/allboards/remaining');
  const tile = page.locator('.board-list-item').filter({ has: page.locator(`a[href*="/b/${board.boardId}/"]`) });
  await tile.locator('.js-board-tile-menu').click();
  await page.locator('.js-pop-over .js-clone-board').click();
  await expect(page.locator('.js-clone-board-form')).toBeVisible();
  expect(db.find('boards', { title: db.getBoard(board.boardId).title })).toHaveLength(1);
  const previousIds = db.find('boards', { 'members.userId': board.owner.id }).map(b => b._id);
  await page.locator('.js-clone-board-form input[type="submit"]').click();
  await expect.poll(() => db.find('boards', { 'members.userId': board.owner.id }).filter(b => !previousIds.includes(b._id)).length).toBe(1);
  const copies = db.find('boards', { 'members.userId': board.owner.id }).filter(b => !previousIds.includes(b._id));
  try {
    await navigateInApp(page, '/allboards/remaining');
    await tile.locator('.js-board-tile-menu').click();
    page.once('dialog', dialog => dialog.dismiss());
    await page.locator('.js-pop-over .js-archive-board').click();
    expect(db.getBoard(board.boardId).archived).toBe(false);
    page.once('dialog', dialog => dialog.accept());
    await page.locator('.js-pop-over .js-archive-board').click();
    await expect.poll(() => db.getBoard(board.boardId).archived).toBe(true);
  } finally { db.cleanup({ boardIds: copies.map(b => b._id) }); }
});

test('#2644: tile actions stay hidden for normal members and server rejects archive', async ({ page, board, user2 }) => {
  db.addBoardMember({ boardId: board.boardId, userId: user2.id });
  await loginWithToken(page, user2.id, user2.token);
  await navigateInApp(page, '/allboards/remaining');
  await expect(page.locator(`a[href*="/b/${board.boardId}/"]`).first()).toBeVisible();
  await expect(page.locator('.js-board-tile-menu')).toHaveCount(0);
  const result = await page.evaluate(async id => {
    try { await Meteor.callAsync('archiveBoard', id); return 'allowed'; }
    catch (e) { return e.error; }
  }, board.boardId);
  expect(result).toBe('error-board-notAdmin');
  expect(db.getBoard(board.boardId).archived).toBe(false);
});
