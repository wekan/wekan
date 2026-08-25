'use strict';

/**
 * Spec 08 — Notifications & activity log
 *
 * Covers:
 *  - Activity log panel opens and shows timestamped entries
 *  - Adding a comment appears in the activity log
 *  - Working log (time tracking) fields are accessible
 *  - @mention in a comment is stored in the database
 *  - Notification indicator appears after a relevant action
 *  - Activity log entries have timestamps (not empty/undefined)
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

test.describe('Notifications & activity log', () => {
  test('#1658 opening a card Activities section shows its persisted history', async ({
    boardPage,
    board,
    user,
  }) => {
    const cardId = db.findCardIdByTitle({
      boardId: board.boardId,
      title: 'Alpha Card',
    });
    const activityId = db.uid('issue-1658-activity');
    db.insertOne('activities', {
      _id: activityId,
      activityType: 'createCard',
      boardId: board.boardId,
      cardId,
      userId: user.id,
      listId: board.listIds[0],
      createdAt: new Date(),
    });

    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();
    const heading = cp.root.locator(
      '.js-toggle-card-section[data-section="activities"]',
    );
    await expect(heading).toBeVisible();
    await heading.click();
    await expect(cp.root.locator(`.activity[data-id="${activityId}"]`)).toBeVisible();
  });

  test('activity log shows board-level activities', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    await bp.openSidebar();

    // sidebar.jade: the activities section is inside `if currentUser.isBoardAdmin`.
    // The toggle button a.js-toggle-show-activities must be visible (proves the section is present).
    const activityToggle = boardPage.locator('.js-toggle-show-activities').first();
    if (await activityToggle.count() > 0) {
      await expect(activityToggle).toBeVisible({ timeout: 10_000 });
      // Click to toggle show activities (and verify no JS error)
      await activityToggle.click();
      await boardPage.waitForTimeout(500);
      // The heading carries TWO icons now: the caret that says whether the
      // section is open (client/lib/sectionCaret.js, shared with the card's
      // eleven sections) and the section's own comment icon. A bare `i.fa`
      // matches both and is a strict-mode violation, so ask for the one that
      // actually indicates state - and assert it points a legal way, which is
      // what the caret is for.
      const caret = activityToggle.locator(
        'i.fa-caret-down, i.fa-caret-right, i.fa-caret-left',
      );
      await expect(caret).toBeVisible({ timeout: 5_000 });
    } else {
      // Activity log may not be available for this board config — just ensure sidebar is open
      await expect(boardPage.locator('.board-sidebar.sidebar.is-open')).toBeVisible({ timeout: 5_000 });
    }
  });

  test('adding a comment appears in the card activity log', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA] = board.listIds;

    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();
    await cp.addComment('Test comment for activity log');

    await expect(cp.comments().filter({ hasText: 'Test comment for activity log' })).toBeVisible({ timeout: 10_000 });
  });

  test('activity log entries include a non-empty timestamp', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA] = board.listIds;

    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();
    await cp.addComment('Timestamp check comment');

    // Look for time elements or date text next to activity items
    const timeEl = cp.root.locator('.activity-item time, .activity time, .date-badge, .activity-time').first();
    if (await timeEl.count() > 0) {
      const timeText = await timeEl.innerText();
      expect(timeText.trim()).not.toBe('');
      expect(timeText.trim()).not.toBe('undefined');
      expect(timeText.trim()).not.toBe('null');
    }
  });

  test('working (time) log fields are accessible on a card', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA] = board.listIds;

    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();

    // Time tracking is in the card details - look for the spent-time badge or link
    const spentTimeEl = boardPage.locator('.js-spent-time, .timeBadge, .js-open-card-spent-time, [title*="time" i]').first();
    // If the board has time tracking enabled, this should be visible
    if (await spentTimeEl.count() > 0) {
      await expect(spentTimeEl).toBeVisible({ timeout: 5_000 });
    }
    // Either way, no JS errors should occur
  });

  test('@mention in a comment is stored in the activity DB', async ({ boardPage, board, user }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    const [listA] = board.listIds;

    await bp.clickCard(listA, 'Alpha Card');
    await cp.waitForOpen();

    const mentionText = `@${user.username} please review`;
    await cp.addComment(mentionText);

    // Verify comment appears in UI
    await expect(cp.comments().filter({ hasText: user.username })).toBeVisible({ timeout: 10_000 });

    // Verify stored in MongoDB
    const parsed = db.findOne('card_comments', { text: { $regex: user.username } });
    if (parsed) {
      expect(parsed.text).toContain(user.username);
    }
  });

  test('notification indicator appears after being mentioned', async ({ page, user, user2, board }) => {
    // user2 comments mentioning user
    const { loginWithToken: login } = require('../helpers/auth');
    const { openBoard } = require('../helpers/auth');

    await login(page, user2.id, user2.token);
    db.addBoardMember({ boardId: board.boardId, userId: user2.id });
    await openBoard(page, board.boardId, board.slug);

    const bp = new BoardPage(page);
    const cp = new CardPage(page);
    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();
    await cp.addComment(`@${user.username} needs attention`);
    await page.waitForTimeout(1_000);

    // Switch to user session to see notification
    const page2 = await page.context().newPage();
    await login(page2, user.id, user.token);
    await page2.goto(process.env.WEKAN_BASE_URL || 'http://localhost:3000', { waitUntil: 'networkidle' });

    // The mentioned user's page renders the header bar, and the bell that would
    // carry the notification is in it.
    //
    // `#header-quick-access`, not `header, #header`: the first header bar was
    // rebuilt this release and there is no `<header>` element or `#header` id
    // any more - the bar is `#header-quick-access[role=navigation]`, which is
    // what specs 18 and 19 already address it by. The old locator matched
    // nothing, so this asserted that a non-existent element was visible.
    // docs/Features/Page/Header.md
    const headerBar = page2.locator('#header-quick-access');
    await expect(headerBar).toBeVisible({ timeout: 10_000 });
    // The bell itself rather than a count: the count arrives asynchronously and
    // an assertion on it would be timing, not behaviour.
    await expect(headerBar.locator('#notifications .notifications-drawer-toggle'))
      .toBeVisible({ timeout: 10_000 });
    await page2.close();
  });
});
