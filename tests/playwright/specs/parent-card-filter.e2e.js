'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');
const { openBoard, loginWithToken } = require('../helpers/auth');

for (const readOnly of [false, true]) test(`#1871 parent filtering works for ${readOnly ? 'read-only members' : 'board admins'} without changing cards`, async ({ page, board, user, user2 }) => {
  const alpha = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const beta = db.findOne('cards', { boardId: board.boardId, title: 'Beta Card' });
  const childId = db.uid('child'), grandchildId = db.uid('grandchild');
  const foreign = db.seedBoard({ ownerId: user2.id, cardTitlesPerList: [['Private parent title']] });
  const other = db.seedBoard({ ownerId: user.id, cardTitlesPerList: [['Another board card']] });
  try {
    const privateParent = db.findOne('cards', { boardId: foreign.boardId, title: 'Private parent title' });
    db.updateOne('cards', { _id: beta._id }, { $set: { parentId: alpha._id } });
    db.updateOne('cards', { boardId: board.boardId, title: 'Gamma Card' }, { $set: { parentId: privateParent._id } });
    db.insertMany('cards', [
      { ...beta, _id: childId, title: 'Second child', parentId: alpha._id, sort: 10 },
      { ...beta, _id: grandchildId, title: 'Grandchild', parentId: beta._id, sort: 20 },
    ]);
    if (readOnly) {
      const current = db.findOne('boards', { _id: board.boardId });
      db.updateOne('boards', { _id: board.boardId }, { $set: { members: current.members.map(m => m.userId === user.id ? { ...m, isAdmin: false, isReadOnly: true } : m) } });
    }
    const before = db.find('cards', { boardId: board.boardId }).map(c => ({ _id: c._id, title: c.title, parentId: c.parentId }));
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    const bp = new BoardPage(page), cp = new CardPage(page);
    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();
    await cp.root.locator('.js-open-card-details-menu:visible').first().click();
    await page.locator('.js-filter-subtasks').click();
    const cards = page.locator('.board-canvas .js-minicard');
    await expect.poll(() => cards.evaluateAll(els => els.map(el => el.dataset.cardId).sort())).toEqual([beta._id, childId].sort());
    await expect(page.locator('.js-card-details')).toHaveCount(0);
    const sidebar = page.locator('.board-sidebar');
    await expect(sidebar.locator('.js-toggle-parent-filter')).toHaveCount(2);
    await expect(sidebar).not.toContainText('Private parent title');
    expect(await page.evaluate(id => Meteor.connection._stores.cards._getCollection().findOne(id), privateParent._id)).toBeUndefined();
    await sidebar.locator(`.js-toggle-parent-filter[data-parent-id="${alpha._id}"]`).click();
    await expect(cards).toHaveCount(5);
    await sidebar.locator(`.js-toggle-parent-filter[data-parent-id="${beta._id}"]`).click();
    await expect(cards).toHaveCount(1);
    await expect(cards).toHaveAttribute('data-card-id', grandchildId);
    await sidebar.locator('.js-clear-all').click();
    await expect(cards).toHaveCount(5);
    await sidebar.locator(`.js-toggle-parent-filter[data-parent-id="${alpha._id}"]`).click();
    await openBoard(page, other.boardId, other.slug);
    await expect(page.locator('.js-minicard').filter({ hasText: 'Another board card' })).toBeVisible();
    expect(db.find('cards', { boardId: board.boardId }).map(c => ({ _id: c._id, title: c.title, parentId: c.parentId }))).toEqual(before);
  } finally { db.cleanup({ boardIds: [foreign.boardId, other.boardId] }); }
});
