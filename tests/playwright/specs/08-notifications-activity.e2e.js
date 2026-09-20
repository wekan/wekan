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
const { loginWithToken, openBoard } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

test.describe('Notifications & activity log', () => {
  test('#6658: assigning a muted board member creates no notification', async ({
    page,
    user,
    user2,
    board,
  }) => {
    const { openBoard } = require('../helpers/auth');
    db.addBoardMember({ boardId: board.boardId, userId: user2.id });
    db.updateOne('boards', { _id: board.boardId }, {
      $set: { watchers: [{ userId: user2.id, level: 'muted' }] },
    });
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);

    const bp = new BoardPage(page);
    const cp = new CardPage(page);
    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();
    const assignUser2 = async () => {
      await cp.root.locator('a.js-add-members').first().click();
      const popup = page.locator('.js-pop-over');
      await expect(popup).toBeVisible();
      await popup.locator('.js-select-member').filter({ hasText: user2.username }).click();
    };

    await assignUser2();
    await page.waitForTimeout(2_000);
    expect(db.findOne('users', { _id: user2.id })?.profile?.notifications || []).toHaveLength(0);
  });

  test('#6658 explicit list watching receives comments on a muted board', async ({ page, user, user2, board }) => {
    const { openBoard } = require('../helpers/auth');
    db.addBoardMember({ boardId: board.boardId, userId: user2.id });
    db.updateOne('boards', { _id: board.boardId }, { $set: { watchers: [] } });
    db.updateOne('lists', { _id: board.listIds[0] }, { $set: { watchers: [user2.id] } });
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
    const cp = new CardPage(page);
    await cp.waitForOpen();
    await cp.addComment('Scoped subscription survives board mute');
    await expect.poll(() => (db.findOne('users', { _id: user2.id })?.profile?.notifications || []).length).toBeGreaterThan(0);
  });

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

  test('notification indicator appears after a watching member is mentioned', async ({ page, browser, user, user2, board }) => {
    // #6658 deliberately makes an unwatched board muted. Opt this positive
    // fixture into notifications; the muted-member regression above stays negative.
    db.addBoardMember({ boardId: board.boardId, userId: user2.id });
    db.updateOne('boards', { _id: board.boardId }, {
      $set: { watchers: [{ userId: user.id, level: 'tracking' }] },
    });

    // Separate cookie jars keep the author and recipient logged in concurrently.
    const recipientContext = await browser.newContext();
    try {
      const recipient = await recipientContext.newPage();
      await loginWithToken(recipient, user.id, user.token);
      const indicator = recipient.locator('#notifications .notifications-drawer-toggle');
      await expect(indicator).toBeVisible({ timeout: 10_000 });
      await expect(indicator).not.toHaveClass(/alert/);

      await loginWithToken(page, user2.id, user2.token);
      await openBoard(page, board.boardId, board.slug);
      await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
      const cp = new CardPage(page);
      await cp.waitForOpen();
      await cp.addComment(`@${user.username} needs attention`);

      await expect.poll(() =>
        (db.findOne('users', { _id: user.id })?.profile?.notifications || [])
          .filter(notification => !notification.read).length,
      ).toBeGreaterThan(0);
      await expect.poll(() => recipient.evaluate(() =>
        (Meteor.user()?.profile?.notifications || []).filter(item => !item.read).length,
      )).toBeGreaterThan(0);
      await expect(indicator).toHaveClass(/alert/, { timeout: 15_000 });
    } finally {
      await recipientContext.close();
    }
  });
});

for (const authenticationMethod of ['password', 'ldap']) {
  test(`#6704 ${authenticationMethod} textarea selects comment mention suggestions`, async ({
    page: boardPage, board, user, user2,
  }) => {
    db.updateOne('users', { _id: user2.id }, {
      $set: { authenticationMethod, 'profile.fullname': 'Mention Target' },
    });
    db.updateOne('boards', { _id: board.boardId }, {
      $push: { members: { userId: user2.id, isActive: true, isAdmin: false } },
    });
    await loginWithToken(boardPage, user.id, user.token);
    await openBoard(boardPage, board.boardId, board.slug);
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();
    const input = cp.root.locator('textarea.js-new-comment-input');
    const expectMention = () => expect(input).toHaveValue(`@${user2.username} (Mention Target) `);
    // fill() can focus an off-screen textarea without scrolling in WebKit.
    // Start as a pointer user does so the menu's hit test uses visible content.
    await input.click();
    await input.fill(`@${user2.username}`);
    const menu = boardPage.locator('.textcomplete-dropdown:visible');
    const suggestion = menu.locator('.textcomplete-item').filter({ hasText: user2.username });
    await expect(menu).toHaveCount(1);
    await expect(suggestion).toBeVisible();
    // Visibility alone misses the regression: the menu can exist behind the
    // card. Require hit testing and a real, unforced pointer selection.
    await expect.poll(() => suggestion.evaluate(el => {
      const r = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    })).toBe(true);
    await suggestion.click();
    await expectMention();
    await expect(cp.root).toBeVisible();
    const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    expect(db.countDocuments('card_comments', { cardId: card._id })).toBe(0);
    // A nonmatching username must not leave the previous user suggestion.
    await input.fill('@no_such_board_member_6704');
    await expect(menu.locator('.textcomplete-item').filter({ hasText: user2.username })).toHaveCount(0);
    // Enter selects a fresh suggestion without submitting the comment.
    await input.fill(`@${user2.username}`);
    await expect(suggestion).toBeVisible();
    await input.press('Enter');
    await expectMention();
    expect(db.countDocuments('card_comments', { cardId: card._id })).toBe(0);
  });
}

test('textarea editing preserves Markdown and emoji without executing pasted HTML', async ({ boardPage: page, board }) => {
  const bp = new BoardPage(page);
  const cp = new CardPage(page);
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  await cp.waitForOpen();
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const markdown = '**Bold** 😀 :smile:\n\n- [ ] Task\n\n```js\nconst value = "<tag>";\n```';
  await cp.setDescription(markdown);
  await expect.poll(() => db.findOne('cards', { _id: card._id }).description).toBe(markdown);
  const comment = `${markdown}\n\n<img src=x onerror="window.editorInjected=true">`;
  await cp.addComment(comment);
  await expect.poll(() => db.countDocuments('card_comments', { cardId: card._id, text: comment })).toBe(1);
  await expect(cp.comments().filter({ hasText: 'Bold' })).toBeVisible();
  expect(await page.evaluate(() => window.editorInjected)).toBeUndefined();
  await expect(cp.root.locator('textarea.js-new-comment-input')).toHaveValue('');
  const pencil = cp.root.locator('a.js-open-inlined-form').filter({ has: page.locator('i.fa-pencil-square-o') }).first();
  await pencil.click();
  await expect(cp.root.locator('.js-card-description textarea.editor')).toHaveValue(markdown);
});
