'use strict';

// Search phrases in plain language (docs/Features/Pages/Search-Phrases.md):
// a phrase runs as its operators and the page says which; operators are left
// alone; the Admin Panel tick turns it off.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const SearchPage = require('../pages/SearchPage');

test.describe('Search phrases', () => {
  test('"my cards" finds my cards and shows the query it ran', async ({ boardPage, board, user }) => {
    const me = db.findOne('users', { _id: user.id });
    db.updateOne('cards', { boardId: board.boardId, title: 'Alpha Card' }, { $set: { members: [user.id] } });
    const sp = new SearchPage(boardPage);
    await sp.navigateToGlobalSearch();
    await sp.globalSearch('my cards');
    await expect(boardPage.locator('.js-search-phrased')).toContainText(`user:${me.username}`);
    await expect.poll(() => sp.globalSearchResultTitles(), { timeout: 20000 }).toContain('Alpha Card');
    expect(await sp.globalSearchResultTitles()).not.toContain('Beta Card');

    // Written operators are run as written (negative).
    await sp.globalSearch(`user:${me.username}`);
    await expect(boardPage.locator('.js-search-phrased')).toHaveCount(0);
  });

  test('Admin Panel / Visibility / Features turns the phrases off (negative)', async ({ boardPage }) => {
    const setting = db.findOne('settings', {});
    const states = { ...(setting.featureStates || {}), 'search-phrases': false };
    db.updateOne('settings', { _id: setting._id }, { $set: { featureStates: states } });
    try {
      const sp = new SearchPage(boardPage);
      await sp.navigateToGlobalSearch();
      // The setting is written straight to the database, and the browser has it
      // when the published Settings document arrives - a search sent before that
      // still ran the phrase (both browsers, now and then). So the search is
      // repeated until the browser has it; a phrase that is never turned off
      // still fails here.
      await expect(async () => {
        await sp.globalSearch('my cards');
        await expect(boardPage.locator('.js-search-phrased')).toHaveCount(0, { timeout: 2000 });
      }).toPass({ timeout: 20000 });
    } finally {
      db.updateOne('settings', { _id: setting._id }, { $set: { featureStates: { ...states, 'search-phrases': true } } });
    }
  });
});
