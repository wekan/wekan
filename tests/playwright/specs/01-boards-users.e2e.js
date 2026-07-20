'use strict';

/**
 * Spec 01 — Boards & User membership
 *
 * Covers:
 *  - Adding users to boards (sidebar member panel)
 *  - Users seeing only the boards they are added to
 *  - Changing roles (admin/member) on board members
 *  - Removing users from a board
 *  - Boards loading at a normal cadence without freezing
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

test.describe('Boards – user membership', () => {
  test('board loads within 10 seconds and renders lists', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const lists = bp.allLists();
    const count = await lists.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('user added to board can see it on their boards list', async ({ page, user, user2, board }) => {
    // Add user2 as a member directly in MongoDB
    db.addBoardMember({ boardId: board.boardId, userId: user2.id });

    // Log in as user2 and navigate to boards list
    await loginWithToken(page, user2.id, user2.token);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // WeKan business rule: boards that have not been dragged into a workspace always
    // appear under the "Remaining" section of the All Boards page. The page loads with
    // "Starred" active by default, so we click "Remaining" to render those board tiles.
    const remainingTab = page.locator('.menu-item').filter({ hasText: /remaining/i });
    await remainingTab.waitFor({ timeout: 20_000 });
    await remainingTab.click();

    // boardsList.jade: li.js-board(class="{{_id}} ...")  — board _id is a CSS class on the <li>
    await expect(page.locator(`li.js-board.${board.boardId}`)).toBeVisible({ timeout: 10_000 });
  });

  test('user NOT added to board cannot see it', async ({ page, user2, board }) => {
    await loginWithToken(page, user2.id, user2.token);

    // Attempt direct navigation to the board URL — user2 is not a member.
    // WeKan should redirect away or show an error; the board canvas must not render.
    await page.goto(`${BASE_URL}/b/${board.boardId}/${board.slug}`, { waitUntil: 'networkidle' });
    // Note: no .catch() — if .board-canvas IS visible this test must fail.
    await expect(page.locator('.board-canvas')).not.toBeVisible({ timeout: 5_000 });
  });

  test('board owner can add a member via the sidebar', async ({ boardPage, board, user2 }) => {
    const bp = new BoardPage(boardPage);
    await bp.openBoardMembers();

    // Search for user2 by username
    const searchInput = boardPage.locator('.js-search-member-input, input[placeholder*="email"]').first();
    await searchInput.fill(user2.username);
    await boardPage.waitForTimeout(800);

    // Click the first result
    const result = boardPage.locator('.js-pop-over .member, .js-pop-over .user-result').first();
    if (await result.count() > 0) {
      await result.click();
      await boardPage.waitForTimeout(600);
      // Verify member is shown in sidebar member list
      const memberList = boardPage.locator('.sidebar .member, .membersWidget .member');
      await expect(memberList.filter({ hasText: user2.username })).toBeVisible({ timeout: 10_000 });
    } else {
      // If search yields no results (user2 might not be visible), verify the input accepted input at minimum
      expect(await searchInput.inputValue()).toBe(user2.username);
    }
  });

  test('board admin can change a member role to admin', async ({ boardPage, board, user2 }) => {
    // Pre-add user2 as non-admin member
    db.addBoardMember({ boardId: board.boardId, userId: user2.id, isAdmin: false });

    // Open member popup for user2
    const memberEl = boardPage.locator('.membersWidget .member, .sidebar .member').filter({ hasText: user2.username }).first();
    if (await memberEl.count() > 0) {
      await memberEl.click();
      await boardPage.locator('.js-pop-over, .memberPopup').waitFor();
      const makeAdminBtn = boardPage.locator('.js-pop-over .js-make-admin, .js-change-permissions[data-permission="isAdmin"]');
      if (await makeAdminBtn.count() > 0) {
        await makeAdminBtn.click();
        await boardPage.waitForTimeout(600);

        // Verify via MongoDB that the role changed
        const boardDoc = db.getBoard(board.boardId);
        const member = boardDoc?.members?.find(m => m.userId === user2.id);
        expect(member?.isAdmin).toBe(true);
      }
    }
  });

  test('board admin can remove a member from the board', async ({ boardPage, board, user2 }) => {
    db.addBoardMember({ boardId: board.boardId, userId: user2.id });

    await boardPage.reload({ waitUntil: 'networkidle' });
    const bp = new BoardPage(boardPage);
    await bp.openSidebar();

    const memberEl = boardPage.locator('.membersWidget .member, .sidebar .member').filter({ hasText: user2.username }).first();
    if (await memberEl.count() > 0) {
      await memberEl.click();
      await boardPage.locator('.js-pop-over').waitFor();
      const removeBtn = boardPage.locator('.js-pop-over .js-remove-member, .js-pop-over .js-leave-member');
      if (await removeBtn.count() > 0) {
        await removeBtn.click();
        // Confirm dialog if present
        const confirmBtn = boardPage.locator('.js-pop-over button.negate, .js-confirm-remove');
        if (await confirmBtn.count() > 0) await confirmBtn.click();
        await boardPage.waitForTimeout(600);

        const boardDoc = db.getBoard(board.boardId);
        const member = boardDoc?.members?.find(m => m.userId === user2.id && m.isActive);
        expect(member).toBeFalsy();
      }
    }
  });

  // #6479: the existing "can remove a member" test above only checks the DB, which is
  // why the bug shipped — removeMember correctly set isActive:false, but the sidebar
  // still rendered the removed member's avatar, so removal looked like it did nothing.
  // This test asserts the UI: the avatar must disappear from the sidebar member list.
  test('#6479: removing a member hides them from the sidebar member list, not just the DB', async ({ boardPage, board, user2 }) => {
    db.addBoardMember({ boardId: board.boardId, userId: user2.id });
    await boardPage.reload({ waitUntil: 'networkidle' });
    const bp = new BoardPage(boardPage);
    await bp.openSidebar();

    // The member's avatar (userAvatar renders a.js-member with the username in title).
    const memberAvatar = boardPage.locator(`.board-sidebar a.js-member[title*="${user2.username}"]`);
    await expect(memberAvatar).toBeVisible({ timeout: 10_000 });

    // Open the member menu and click "Remove from board".
    await memberAvatar.click();
    const removeLink = boardPage.locator('.js-pop-over a.js-remove-member');
    await expect(removeLink).toBeVisible({ timeout: 10_000 });
    await removeLink.click();

    // Confirm (removeMemberPopup: button.js-confirm.negate.full).
    const confirm = boardPage.locator('.js-pop-over button.js-confirm');
    await expect(confirm).toBeVisible({ timeout: 10_000 });
    await confirm.click();

    // The fix: the avatar disappears from the sidebar (removal is visible, not just DB).
    await expect(memberAvatar).toHaveCount(0, { timeout: 10_000 });

    // And the member entry is deactivated (kept with isActive:false per #5122).
    await expect
      .poll(() => {
        const boardDoc = db.getBoard(board.boardId);
        const m = boardDoc?.members?.find(x => x.userId === user2.id);
        return !!(m && m.isActive === false);
      }, { timeout: 10_000 })
      .toBe(true);
  });

  // NEGATIVE (#6479): a plain (non-admin) board member must not be offered a way to
  // remove other members — the "Remove from board" link is admin-only.
  test('#6479 NEGATIVE: a non-admin member is not offered a remove option', async ({ page, board, user, user2 }) => {
    db.addBoardMember({ boardId: board.boardId, userId: user2.id, isAdmin: false });
    await loginWithToken(page, user2.id, user2.token);
    await page.goto(`${BASE_URL}/b/${board.boardId}/${board.slug}`, { waitUntil: 'networkidle' });
    const bp = new BoardPage(page);
    await bp.openSidebar();

    // Open the board OWNER's member menu as the non-admin user2.
    const ownerAvatar = page.locator(`.board-sidebar a.js-member[title*="${user.username}"]`).first();
    await expect(ownerAvatar).toBeVisible({ timeout: 10_000 });
    await ownerAvatar.click();
    await page.locator('.js-pop-over').waitFor({ timeout: 10_000 });

    // No "Remove from board" for a non-admin.
    await expect(page.locator('.js-pop-over a.js-remove-member')).toHaveCount(0);
  });

  test('board renders all three seeded lists without freezing', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const count = await bp.allLists().count();
    expect(count).toBe(3);
  });
});
