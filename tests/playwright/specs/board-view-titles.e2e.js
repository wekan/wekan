const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');

// These tests change instance-wide policies and restore them after each case.
test.describe.configure({ mode: 'serial' });
for (const view of [
  { name: 'minicard', title: '.minicard-title-text' },
  { name: 'opened card', title: '.card-details-title' },
  { name: 'opened card List dropdown', title: '.card-details-list-picker > summary' },
  { name: 'timeline', menu: '.js-open-timeline-view', title: '.timeline-card-title' },
  { name: 'assignee', menu: '.js-open-group-by-assignee-view', title: '.group-by-assignee-card-title' },
  { name: 'control chart', menu: '.js-open-control-chart-view', title: '.chart-data-table tbody td' },
  { name: 'cumulative flow', menu: '.js-open-cumulative-flow-view', title: '.chart-data-table thead th' },
  { name: 'DHTMLX Gantt', menu: '.js-open-gantt-dhtmlx-view', title: '.gantt_tree_content' },
]) {
  for (const policy of ['formatted', 'plain-links', 'plain-source']) {
    test(`${view.name} title honors ${policy}`, async ({ page, user, board }) => {
      const setting = db.findOne('settings', {});
      const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      db.updateOne('settings', { _id: setting._id }, { $set: {
        renderLinksAsPlainText: policy === 'plain-links',
        alwaysShowCodeAsText: policy === 'plain-source',
      } });
      try {
        db.updateOne('cards', { _id: card._id }, { $set: {
          title: '# Demo [card](https://example.com/) :thumbsup: :heart: :tada:',
          startAt: new Date(Date.now() - 86400000), dueAt: new Date(Date.now() + 86400000),
          endAt: new Date(),
        } });
        if (['cumulative flow', 'opened card List dropdown'].includes(view.name)) {
          db.updateOne('lists', { _id: card.listId }, { $set: {
            title: '# Demo [card](https://example.com/) :thumbsup: :heart: :tada:',
          } });
        }
        await loginWithToken(page, user.id, user.token);
        await openBoard(page, board.boardId, board.slug);
        if (view.menu) {
          await page.locator('.js-toggle-board-view').first().click();
          await page.locator(`.pop-over ${view.menu}`).click();
        }
        if (['opened card', 'opened card List dropdown'].includes(view.name)) {
          await new BoardPage(page).clickCard(board.listIds[0], 'Demo');
        }
        if (['control chart', 'cumulative flow'].includes(view.name)) {
          await expect(page.locator('.stats-view-title > .viewer')).toBeVisible();
          await expect(page.locator('.stats-view-title pre')).toHaveCount(policy === 'plain-source' ? 1 : 0);
        }
        const title = page.locator(view.title).filter({ hasText: 'Demo' }).first();
        if (policy === 'plain-source') {
          await expect(title.locator('pre')).toHaveText('# Demo [card](https://example.com/) :thumbsup: :heart: :tada:');
          await expect(title.locator('h1')).toHaveCount(0);
        } else {
          await expect(title.locator('h1')).toContainText('Demo card');
          if (['minicard', 'opened card'].includes(view.name)) {
            const sizes = await title.evaluate(el => [
              parseFloat(getComputedStyle(el.querySelector('h1')).fontSize),
              parseFloat(getComputedStyle(el.querySelector('.viewer')).fontSize),
            ]);
            expect(sizes[0]).toBeGreaterThan(sizes[1]);
          }
          await expect(title).toContainText('👍');
          if (view.name !== 'cumulative flow') {
            await expect(title).toContainText('❤️');
            await expect(title).toContainText('🎉');
          }
          await expect(title.locator('a[href="https://example.com/"]')).toHaveCount(policy === 'plain-links' ? 0 : 1);
        }
        await expect(title.locator('script')).toHaveCount(0);
        expect(errors).toEqual([]);
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
}
