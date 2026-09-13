const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

test('Time view renders card title Markdown and emoji through the safe viewer', async ({ page, user, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('cards', { _id: card._id }, { $set: {
    title: '# Demo card :thumbsup:', spentTime: 2,
  } });
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  await page.locator('.js-open-time-view').first().click();
  const title = page.locator('.time-view-card-title').filter({ hasText: 'Demo card' });
  await expect(title.locator('h1')).toContainText('Demo card');
  await expect(title).not.toContainText(':thumbsup:');
  await expect(title).not.toContainText('# Demo');
  await expect(title).toContainText('👍');
  await expect(title.locator('script')).toHaveCount(0);
});

test('Time view honors the Admin Panel plain-text security setting', async ({ page, user, board }) => {
  const setting = db.findOne('settings', {});
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('settings', { _id: setting._id }, { $set: { alwaysShowCodeAsText: true } });
  try {
    db.updateOne('cards', { _id: card._id }, { $set: {
      title: '# Demo card :thumbsup:', spentTime: 2,
    } });
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.js-open-time-view').first().click();
    const title = page.locator('.time-view-card-title').filter({ hasText: 'Demo card' });
    await expect(title.locator('pre')).toHaveText('# Demo card :thumbsup:');
    await expect(title.locator('h1')).toHaveCount(0);
  } finally {
    db.updateOne('settings', { _id: setting._id }, setting.alwaysShowCodeAsText === undefined
      ? { $unset: { alwaysShowCodeAsText: '' } }
      : { $set: { alwaysShowCodeAsText: setting.alwaysShowCodeAsText } });
  }
});
