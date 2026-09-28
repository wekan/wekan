'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

async function copy(page, source, destination, values) {
  return page.evaluate(async ({ source, destination, values }) => {
    try { return { id: await Meteor.callAsync('copyCard', source._id, destination.boardId,
      destination.swimlaneId, destination.listId, false, values) }; }
    catch (error) { return { error: error.error }; }
  }, { source, destination, values });
}

test('copy refuses source identity overrides before copying private children', async ({ page, user, user2, board }) => {
  const privateBoard = db.seedBoard({ ownerId: user2.id, title: 'Private copy fixture', cardTitlesPerList: [['Private card']] });
  try {
    const source = db.find('cards', { boardId: board.boardId })[0];
    const secret = db.find('cards', { boardId: privateBoard.boardId })[0];
    db.insertOne('checklists', { _id: `private-checklist-${secret._id}`, cardId: secret._id,
      boardId: privateBoard.boardId, title: 'PRIVATE-COPY-FIXTURE', sort: 0, createdAt: new Date() });
    await loginWithToken(page, user.id, user.token);
    const before = db.countDocuments('cards', { boardId: board.boardId });
    const activities = db.countDocuments('activities', { boardId: board.boardId });
    const result = await copy(page, source, source, { _id: secret._id });
    const children = result.id ? db.find('checklists', { cardId: result.id }).map(item => item.title) : [];
    expect(result.error, `Copied children: ${JSON.stringify(children)}`).toBeTruthy();
    expect(db.countDocuments('activities', { boardId: board.boardId })).toBe(activities);
    await expect.poll(() => db.findOne('eventlog', { bleed: 'CopyIdentityBleed', username: user.username })?.count).toBeGreaterThan(0);
    expect(db.countDocuments('cards', { boardId: board.boardId })).toBe(before);
    expect(db.find('checklists', { boardId: board.boardId }).map(item => item.title)).not.toContain('PRIVATE-COPY-FIXTURE');
  } finally { db.cleanup({ boardIds: [privateBoard.boardId] }); }
});

test('copy accepts only text overrides and preserves its source and child identities', async ({ page, user, board }) => {
  const source = db.find('cards', { boardId: board.boardId })[0];
  db.insertOne('checklists', { _id: `public-checklist-${source._id}`, cardId: source._id,
    boardId: board.boardId, title: 'Expected checklist', sort: 0, createdAt: new Date() });
  await loginWithToken(page, user.id, user.token);
  for (const values of [{ title: {} }, { description: [] }, { description: null }]) {
    const before = db.countDocuments('cards', { boardId: board.boardId });
    expect((await copy(page, source, source, values)).error, JSON.stringify(values)).toBeTruthy();
    expect(db.countDocuments('cards', { boardId: board.boardId })).toBe(before);
  }
  expect(db.findOne('users', { _id: user.id }).loginDisabled).not.toBe(true);
  expect(db.countDocuments('eventlog', { bleed: 'CopyIdentityBleed', username: user.username })).toBe(0);
  const result = await copy(page, source, source, { title: 'Verified copy', description: 'Independent text' });
  expect(result.error).toBeUndefined();
  expect(db.findOne('cards', { _id: result.id })).toMatchObject({ title: 'Verified copy', description: 'Independent text' });
  expect(db.findOne('cards', { _id: source._id }).title).toBe(source.title);
  expect(db.find('checklists', { cardId: result.id }).map(item => item.title)).toEqual(['Expected checklist']);
  expect((await copy(page, source, source, {})).error).toBeUndefined();
  await openBoard(page, board.boardId, board.slug);
  await expect(page.locator('.minicard').filter({ hasText: 'Verified copy' }).first()).toBeVisible();
  const before = db.countDocuments('cards', { boardId: board.boardId });
  expect((await copy(page, source, source, { boardId: 'foreign' })).error).toBe('bad-request');
  expect(db.countDocuments('cards', { boardId: board.boardId })).toBe(before);
});

test('the copy dialog still creates a renamed card', async ({ page, user, board }) => {
  const CardPage = require('../pages/CardPage');
  const source = db.find('cards', { boardId: board.boardId })[0];
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  await page.locator('.minicard').filter({ hasText: source.title }).first().click();
  const card = new CardPage(page);
  await card.waitForOpen();
  await card.openActionsMenu();
  await card.clickAction('.js-copy-card');
  const popup = page.locator('.js-pop-over');
  await popup.locator('#copy-card-title').fill('Copy from dialog');
  await popup.locator('button.js-done').click();
  await expect.poll(() => db.countDocuments('cards', { boardId: board.boardId, title: 'Copy from dialog' })).toBe(1);
  expect(db.findOne('cards', { _id: source._id }).title).toBe(source.title);
});
