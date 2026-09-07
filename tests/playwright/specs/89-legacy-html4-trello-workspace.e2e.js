'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const { strToU8, zipSync } = require('../../../node_modules/fflate');
const db = require('../helpers/db');

test('Legacy HTML4 Trello ZIP import preserves its named workspace', async ({ browser, baseURL }) => {
  test.setTimeout(90_000);
  const suffix = db.uniqueSuffix();
  const username = `html4trellows${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const context = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const page = await context.newPage();
  let user;
  let boardId;
  try {
    await page.goto(`${baseURL}/sign-up`);
    await page.locator('input[name="username"]').fill(username);
    await page.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await page.locator('input[name="password"]').fill(password);
    await Promise.all([page.waitForNavigation(), page.locator('input[type="submit"]').click()]);
    user = db.findOne('users', { username });
    expect(user?._id).toBeTruthy();

    const open = action => Promise.all([
      page.waitForNavigation(),
      page.locator(`form[action="${action}"] input[type="submit"]`).first().click(),
    ]);
    if (await page.locator('form[action="/allboards"] input[type="submit"]').count()) {
      await open('/allboards');
    }
    await open('/import');
    await open('/import/trello');

    const workspaceName = `Trello Workspace ${suffix}`;
    const workspaceInput = page.locator('input[type="text"][name="importWorkspaceName"]');
    await workspaceInput.fill(workspaceName);
    await Promise.all([
      page.waitForNavigation(),
      page.locator('form:has(input[type="text"][name="importWorkspaceName"]) input[type="submit"]')
        .click(),
    ]);
    await expect(page.locator('input[type="text"][name="importWorkspaceName"]'))
      .toHaveValue(workspaceName);

    const boardTitle = `Trello Workspace Board ${suffix}`;
    const archive = Buffer.from(zipSync({
      'trello-board.json': strToU8(JSON.stringify({
        id: `trello-${suffix}`, name: boardTitle, desc: '', closed: false,
        prefs: { background: 'blue', permissionLevel: 'private' },
        lists: [], cards: [], labels: [], members: [], actions: [], checklists: [],
      })),
    }));
    await page.locator('input[type="file"][accept=".zip,application/zip"]').setInputFiles({
      name: 'trello-export.zip', mimeType: 'application/zip', buffer: archive,
    });
    await Promise.all([
      page.waitForNavigation(),
      page.locator('form:has(input[type="file"][accept=".zip,application/zip"]) input[type="submit"]')
        .click(),
    ]);

    const board = db.findOne('boards', { title: boardTitle });
    expect(board?._id).toBeTruthy();
    boardId = board._id;
    const updated = db.findOne('users', { _id: user._id });
    const workspace = updated.profile.boardWorkspacesTree.find(node => node.name === workspaceName);
    expect(workspace?.id).toBeTruthy();
    expect(updated.profile.boardWorkspaceAssignments[boardId]).toBe(workspace.id);
    await expect(page.locator('tbody')).toContainText(boardTitle);

    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await page.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-trello-workspace.png`, fullPage: true,
      });
    }

  } finally {
    await context.close();
    if (boardId) db.cleanup({ boardIds: [boardId] });
    if (user) db.cleanup({ userIds: [user._id] });
  }
});
