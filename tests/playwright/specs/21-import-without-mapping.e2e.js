'use strict';

/**
 * Spec 21 — Import without mapping members
 *
 * Covers the "Import without mapping members (map later)" option, which lets a
 * WeKan / Trello / Jira import skip the member-mapping step and import the board
 * immediately, so members can be mapped afterwards.
 *
 * We exercise the WeKan-export path (a self-contained board JSON) because it does
 * not require external services; the same button/flow drives Trello and Jira.
 */

const { test, expect } = require('../fixtures');

// A minimal but valid WeKan board export (mirrors tests/wekanCreator.import.test.js).
const now = '2020-01-01T00:00:00.000Z';
const wekanExport = {
  _format: 'wekan-board-1.0.0',
  _id: 'imp1',
  title: 'Imported No Map Board',
  archived: false,
  color: 'bgnone',
  permission: 'private',
  createdAt: now,
  modifiedAt: now,
  members: [{ userId: 'user1', wekanId: 'user1', isActive: true, isAdmin: true }],
  labels: [],
  swimlanes: [{ _id: 'swimlane1', title: 'Default', archived: false, sort: 0 }],
  lists: [{ _id: 'list1', title: 'ToDoImported', archived: false, sort: 0 }],
  cards: [
    {
      _id: 'card1',
      title: 'Imported card',
      archived: false,
      swimlaneId: 'swimlane1',
      listId: 'list1',
      sort: 0,
      description: '',
      dateLastActivity: now,
      labelIds: [],
    },
  ],
  comments: [],
  activities: [],
  checklists: [],
  checklistItems: [],
  subtaskItems: [],
  customFields: [],
  rules: [],
  triggers: [],
  actions: [],
  users: [{ _id: 'user1', username: 'admin', profile: { fullname: 'Admin User' } }],
};

test.describe('Import without mapping members', () => {
  test('the import page offers "import without mapping members"', async ({ loggedInPage }) => {
    await loggedInPage.goto('/import/wekan', { waitUntil: 'commit' });
    const skip = loggedInPage.locator('.js-import-without-mapping');
    await expect(skip).toBeVisible({ timeout: 15_000 });
  });

  test('importing a WeKan board without mapping lands on the new board', async ({ loggedInPage }) => {
    await loggedInPage.goto('/import/wekan', { waitUntil: 'commit' });

    await loggedInPage.locator('#import-textarea').fill(JSON.stringify(wekanExport));
    await loggedInPage.locator('.js-import-without-mapping').click();

    // Skips the map-members step entirely and navigates to the new board (/b/...).
    await loggedInPage.waitForURL(/\/b\//, { timeout: 30_000 });

    // The imported list/card is present on the new board.
    await expect(
      loggedInPage.locator('.js-list:not(.js-list-composer)').first(),
    ).toBeVisible({ timeout: 20_000 });
    await expect(loggedInPage.locator('body')).toContainText('Imported card', {
      timeout: 20_000,
    });
  });
});
