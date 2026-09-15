const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

async function openTimeView(page) {
  await page.locator('.js-toggle-board-view').first().click();
  await page.locator('.pop-over .js-open-time-view').click();
}

test('Time view renders card title Markdown and emoji through the safe viewer', async ({ page, user, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('cards', { _id: card._id }, { $set: {
    title: '# Demo card :thumbsup:', spentTime: 2,
  } });
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  await openTimeView(page);
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
    await openTimeView(page);
    const title = page.locator('.time-view-card-title').filter({ hasText: 'Demo card' });
    await expect(title.locator('pre')).toHaveText('# Demo card :thumbsup:');
    await expect(title.locator('h1')).toHaveCount(0);
  } finally {
    db.updateOne('settings', { _id: setting._id }, setting.alwaysShowCodeAsText === undefined
      ? { $unset: { alwaysShowCodeAsText: '' } }
      : { $set: { alwaysShowCodeAsText: setting.alwaysShowCodeAsText } });
  }
});

for (const plainLinks of [false, true]) {
  test(`Time view honors render-links-as-plain-text=${plainLinks}`, async ({ page, user, board }) => {
    const setting = db.findOne('settings', {});
    const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    db.updateOne('settings', { _id: setting._id }, { $set: {
      renderLinksAsPlainText: plainLinks, alwaysShowCodeAsText: false,
    } });
    try {
      db.updateOne('cards', { _id: card._id }, { $set: {
        title: '# Demo [card](https://example.com/) :thumbsup:', spentTime: 2,
      } });
      await loginWithToken(page, user.id, user.token);
      await openBoard(page, board.boardId, board.slug);
      await openTimeView(page);
      const title = page.locator('.time-view-card-title').filter({ hasText: 'Demo' });
      await expect(title.locator('h1')).toContainText('Demo card');
      await expect(title).toContainText('👍');
      await expect(title.locator('a[href="https://example.com/"]')).toHaveCount(plainLinks ? 0 : 1);
    } finally {
      const update = { $set: {}, $unset: {} };
      for (const key of ['renderLinksAsPlainText', 'alwaysShowCodeAsText']) {
        if (setting[key] === undefined) update.$unset[key] = '';
        else update.$set[key] = setting[key];
      }
      if (!Object.keys(update.$set).length) delete update.$set;
      if (!Object.keys(update.$unset).length) delete update.$unset;
      db.updateOne('settings', { _id: setting._id }, update);
    }
  });
}
