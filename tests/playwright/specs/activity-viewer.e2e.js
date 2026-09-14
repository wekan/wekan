const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

test.describe.configure({ mode: 'serial' });
for (const policy of ['formatted', 'plain-links', 'plain-source']) {
  test(`card and sidebar activities obey ${policy}`, async ({ boardPage, board, user }) => {
    const setting = db.findOne('settings', {});
    const activityId = db.uid('activity-viewer');
    const title = '# Demo :thumbsup: <strong>allowed</strong> [link](https://example.com/) <img src="x" onerror="window.activityViewerAttack=1">';
    db.updateOne('settings', { _id: setting._id }, { $set: {
      renderLinksAsPlainText: policy === 'plain-links',
      alwaysShowCodeAsText: policy === 'plain-source',
    } });
    try {
      db.insertOne('activities', {
        _id: activityId, activityType: 'a-changedTitle', value: title,
        boardId: board.boardId, userId: user.id,
        cardId: db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' }),
        listId: board.listIds[0], createdAt: new Date(),
      });
      await boardPage.reload();
      const bp = new BoardPage(boardPage);
      await bp.openSidebar();
      if (!(await boardPage.locator(`.board-sidebar .activity[data-id="${activityId}"]`).count())) {
        await boardPage.locator('.js-toggle-show-activities').first().click();
      }
      await bp.clickCard(board.listIds[0], 'Alpha Card');
      const cp = new CardPage(boardPage);
      await cp.waitForOpen();
      await cp.root.locator('.js-toggle-card-section[data-section="activities"]').click();
      for (const root of [boardPage.locator('.board-sidebar'), cp.root]) {
        const activity = root.locator(`.activity[data-id="${activityId}"]`);
        await expect(activity).toBeVisible();
        await expect(activity.locator('.activity-desc')).not.toContainText('%s');
        await expect(activity.locator('[onerror], script')).toHaveCount(0);
        expect(await boardPage.evaluate(() => window.activityViewerAttack)).toBeUndefined();
        if (policy === 'plain-source') {
          await expect(activity.locator('pre').first()).toHaveText(title);
          await expect(activity.locator('strong')).toHaveCount(0);
        } else {
          await expect(activity.locator('strong').first()).toHaveText('allowed');
          await expect(activity).toContainText('👍');
          await expect(activity.locator('a[href="https://example.com/"]')).toHaveCount(policy === 'plain-links' ? 0 : 1);
        }
      }
    } finally {
      db.deleteOne('activities', { _id: activityId });
      db.updateOne('settings', { _id: setting._id }, { $set: {
        renderLinksAsPlainText: !!setting.renderLinksAsPlainText,
        alwaysShowCodeAsText: !!setting.alwaysShowCodeAsText,
      } });
    }
  });
}
