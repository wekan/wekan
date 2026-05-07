'use strict';

const { test: base } = require('@playwright/test');
const db = require('./helpers/db');
const { loginWithToken, openBoard } = require('./helpers/auth');

/**
 * Extended Playwright test fixture that seeds a fresh user + board for every
 * test and cleans up automatically on teardown.
 *
 * Usage:
 *   const { test } = require('../fixtures');
 *   test('my test', async ({ page, user, board }) => { ... });
 */
const test = base.extend({
  // A freshly-seeded admin user available for every test.
  adminUser: async ({}, use) => {
    const user = db.seedUser({ isAdmin: true });
    await use(user);
    db.cleanup({ userIds: [user.id] });
  },

  // A freshly-seeded non-admin user.
  user: async ({}, use) => {
    const user = db.seedUser();
    await use(user);
    db.cleanup({ userIds: [user.id] });
  },

  // A second non-admin user (for multi-user tests).
  user2: async ({}, use) => {
    const user = db.seedUser();
    await use(user);
    db.cleanup({ userIds: [user.id] });
  },

  // A board owned by `user`, with 3 lists and one card per list.
  board: async ({ user }, use) => {
    const b = db.seedBoard({
      ownerId: user.id,
      cardTitlesPerList: [['Alpha Card'], ['Beta Card'], ['Gamma Card']],
    });
    await use({ ...b, owner: user });
    db.cleanup({ boardIds: [b.boardId] });
  },

  // Convenience: logged-in page as `user`.
  loggedInPage: async ({ page, user }, use) => {
    await loginWithToken(page, user.id, user.token);
    await use(page);
  },

  // Convenience: logged-in page already on the board.
  boardPage: async ({ page, user, board }, use) => {
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    await use(page);
  },
});

const { expect } = base;

module.exports = { test, expect };
