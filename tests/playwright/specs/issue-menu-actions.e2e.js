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
    const inputBounds = await popup.locator('.swimlane-name-input').boundingBox();
    for (const option of await popup.locator('.swimlane-placement-option').all()) {
      const radio = await option.locator('input').boundingBox();
      const label = await option.locator('span').boundingBox();
      expect(radio.y).toBeGreaterThanOrEqual(inputBounds.y + inputBounds.height);
      expect(label.x).toBeGreaterThanOrEqual(radio.x + radio.width);
      expect(Math.abs((radio.y + radio.height / 2) - (label.y + label.height / 2))).toBeLessThan(2);
    }
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

for (const withoutCards of [false, true]) {
  test(`#2321: multiselection duplicates boards without source history, without cards: ${withoutCards}`, async ({ boardPage: page, board }) => {
    const second = db.seedBoard({ ownerId: board.owner.id, title: 'Second bulk source', cardTitlesPerList: [['Second card']] });
    const sourceIds = [board.boardId, second.boardId];
    const historicalDate = new Date('2018-01-02T12:00:00Z');
    const history = sourceIds.flatMap((boardId, index) => [
      { _id: `history-board-${boardId}`, boardId, userId: board.owner.id,
        activityType: 'createBoard', createdAt: historicalDate },
      { _id: `history-card-${boardId}`, boardId, userId: board.owner.id,
        cardId: db.find('cards', { boardId })[0]._id,
        activityType: 'moveCard', createdAt: historicalDate,
        oldListId: `old-list-${index}`, listId: `new-list-${index}` },
    ]);
    db.insertMany('activities', history);
    const originalHistory = db.find('activities', { _id: { $in: history.map(a => a._id) } });
    const previousIds = db.find('boards', { 'members.userId': board.owner.id }).map(b => b._id);
    const copies = () => db.find('boards', { 'members.userId': board.owner.id }).filter(b => !previousIds.includes(b._id));
    try {
      await navigateInApp(page, '/allboards/remaining');
      await expect(page.locator('.js-board-tile-menu')).toHaveCount(0);
      await page.locator('.js-all-boards-sidebar-multiselection').first().click();
      for (const id of sourceIds) await page.locator(`li.js-board.${id} .js-toggle-board-multi-selection`).click();
      const action = page.locator('.js-duplicate-selected-boards');
      await expect(page.locator('.js-duplicate-selected-boards-without-cards')).toHaveCount(0);
      await action.click();
      await page.locator('.js-copy-cancel').click();
      expect(copies()).toHaveLength(0);
      await action.click();
      const popup = page.locator('.js-duplicate-boards-form');
      await expect(popup.locator('[role="checkbox"][aria-checked="true"]')).toHaveCount(10);
      if (withoutCards) await popup.locator('[data-field="cards"]').click();
      await popup.locator('button[type="submit"]').click();
      await expect(popup).toHaveCount(0);
      await expect.poll(() => copies().length).toBe(2);
      for (const copy of copies()) {
        await expect.poll(() => db.find('lists', { boardId: copy._id }).length).toBe(3);
        expect(db.find('swimlanes', { boardId: copy._id }).length).toBeGreaterThan(0);
        if (withoutCards) expect(db.find('cards', { boardId: copy._id })).toHaveLength(0);
        else await expect.poll(() => db.find('cards', { boardId: copy._id }).length).toBeGreaterThan(0);
      }
      const copiedHistory = db.find('activities', { boardId: { $in: copies().map(b => b._id) } });
      // Fresh creation events are legitimate; historical source events are not.
      expect(copiedHistory.some(a => new Date(a.createdAt).getTime() === historicalDate.getTime())).toBe(false);
      expect(copiedHistory.some(a => history.some(old => old._id === a._id || old.cardId && old.cardId === a.cardId))).toBe(false);
      expect(db.find('activities', { _id: { $in: history.map(a => a._id) } })).toEqual(originalHistory);
      for (const id of sourceIds) expect(db.find('cards', { boardId: id }).length).toBeGreaterThan(0);
    } finally { db.cleanup({ boardIds: [second.boardId, ...copies().map(b => b._id)] }); }
  });
}

test('board tiles have no action menu and normal members cannot archive or duplicate', async ({ page, board, user2 }) => {
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
  const copyResult = await page.evaluate(async id => {
    try { await Meteor.callAsync('copyBoard', id, { copyOptions: { cards: false } }); return 'allowed'; }
    catch (e) { return e.error; }
  }, board.boardId);
  expect(copyResult).toBe('not-authorized');
});
