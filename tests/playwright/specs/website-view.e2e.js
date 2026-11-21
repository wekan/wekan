'use strict';
// Board View / Website (models/lib/websiteView.js): a public board whose
// public view is Website shows a visitor the board as a website - the
// Published cards, Pages as the menu, posts on the front page - and never a
// draft. tests/websiteFormat.test.cjs pins the rules.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

test('Website view: a visitor of a public board sees its website, not its drafts', async ({ page, user }) => {
  const stamp = Date.now();
  const board = db.seedBoard({ ownerId: user.id, title: `Site ${stamp}`, listCount: 2,
    cardTitlesPerList: [[`About ${stamp}`, `Hello ${stamp}`], [`Secret draft ${stamp}`]] });
  try {
    const [published, draft] = board.listIds;
    db.updateOne('lists', { _id: published }, { $set: { title: 'Published' } });
    db.updateOne('lists', { _id: draft }, { $set: { title: 'Draft' } });
    // A second swimlane, Pages, with the About page in it; the rest are posts.
    const pages = `pages-${stamp}`;
    db.insertOne('swimlanes', { _id: pages, title: 'Pages', boardId: board.boardId, sort: 0, type: 'swimlane', archived: false,
      createdAt: new Date(), modifiedAt: new Date() });
    const about = db.findCardIdByTitle({ boardId: board.boardId, title: `About ${stamp}` });
    db.updateOne('cards', { _id: about }, { $set: { swimlaneId: pages, description: `We **build** things ${stamp}.` } });
    db.updateOne('boards', { _id: board.boardId }, { $set: { permission: 'public', defaultPublicBoardView: 'board-view-website' } });

    // A visitor: the `page` fixture is not signed in.
    await page.goto(`/b/${board.boardId}/${board.slug}`, { waitUntil: 'commit' });
    const site = page.locator('.website-view');
    await expect(site).toBeVisible({ timeout: 30_000 });
    await expect(site.locator('.website-nav')).toContainText(`About ${stamp}`);
    await expect(site.locator('.website-summary')).toContainText(`Hello ${stamp}`);
    await expect(site).not.toContainText(`Secret draft ${stamp}`);
    await site.locator('.website-nav a.js-website-page').first().click();
    await expect(site.locator('.website-article')).toContainText(`build things ${stamp}`);
    await expect(site.locator('.website-article strong')).toHaveText('build');
    // Negative: the kanban is not what the visitor sees.
    await expect(page.locator('.js-list:not(.js-list-composer)')).toHaveCount(0);
  } finally {
    db.cleanup({ boardIds: [board.boardId] });
  }
});
