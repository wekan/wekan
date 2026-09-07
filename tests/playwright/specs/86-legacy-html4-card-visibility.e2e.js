'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

const hiddenOperations = [
  'toggle-card-label', 'edit-card-description', 'move-card-to-list', 'edit-card-sort',
  'set-card-date-format', 'edit-card-date', 'toggle-card-person', 'toggle-card-identity',
  'add-checklist', 'add-subtask', 'add-comment',
];

test('Card Settings gate the same sections in HTML4 and HTML5', async ({ browser, baseURL }) => {
  const suffix = db.uniqueSuffix();
  const username = `html4gates${suffix}`;
  const output = `${process.cwd()}/../../.tools/html4-card-visibility`;
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  let user; let board; let card; let modernContext;
  try {
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(`Gates-${suffix}!`);
    await Promise.all([
      legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click(),
    ]);
    user = db.findOne('users', { username });
    board = db.seedBoard({ ownerId: user._id, title: `Gates board ${suffix}`,
      listCount: 1, cardTitlesPerList: [['Gates card']] });
    card = db.findOne('cards', { boardId: board.boardId, title: 'Gates card' });
    db.updateOne('boards', { _id: board.boardId }, { $set: {
      labels: [{ _id: `label${suffix}`, name: `Visible label ${suffix}`, color: 'green' }],
    } });
    db.updateOne('cards', { _id: card._id }, { $set: {
      description: `Visible description ${suffix}`, labelIds: [`label${suffix}`],
      members: [user._id], assignees: [user._id], requesters: [user._id],
      assigners: [user._id], receivedAt: new Date(), startAt: new Date(),
      dueAt: new Date(), endAt: new Date(),
    } });

    await Promise.all([
      legacy.waitForNavigation(),
      legacy.locator('form[action="/allboards"] input[type="submit"]').click(),
    ]);
    for (const target of [`/b/${board.boardId}/${board.slug}`,
      `/b/${board.boardId}/${board.slug}/${card._id}`]) {
      await Promise.all([
        legacy.waitForNavigation(),
        legacy.locator(`form[action="${target}"] input[type="submit"]`).first().click(),
      ]);
    }
    for (const operation of hiddenOperations) {
      await expect(legacy.locator(`input[value="${operation}"]`)).not.toHaveCount(0);
    }
    fs.mkdirSync(output, { recursive: true });
    await legacy.screenshot({ path: `${output}/html4-sections-enabled.png`, fullPage: true });

    modernContext = await browser.newContext({ locale: 'en-US' });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await navigateInApp(modern, `/b/${board.boardId}/${board.slug}/${card._id}`);
    await waitForMeteor(modern);
    await expect(modern.locator('.card-details-item-labels')).toBeVisible();
    await expect(modern.locator('.card-details-item-date-format')).toBeVisible();
    await expect(modern.locator('.card-details-item-members')).toBeVisible();
    await modern.screenshot({ path: `${output}/html5-sections-enabled.png`, fullPage: true });

    const disabled = {};
    for (const setting of [
      'allowsLabels', 'allowsMembers', 'allowsAssignee', 'allowsCreator',
      'allowsRequestedBy', 'allowsAssignedBy', 'allowsShowLists',
      'allowsCardSortingByNumber', 'allowsReceivedDate', 'allowsStartDate',
      'allowsDueDate', 'allowsEndDate', 'allowsDescriptionText', 'allowsChecklists',
      'allowsSubtasks', 'allowsAttachments', 'allowsComments', 'allowsActivities',
    ]) disabled[setting] = false;
    db.updateOne('boards', { _id: board.boardId }, { $set: disabled });

    const titleForm = legacy.locator('form:has(input[value="edit-card-title"])');
    await Promise.all([
      legacy.waitForNavigation(), titleForm.locator('input[type="submit"]').click(),
    ]);
    for (const operation of hiddenOperations) {
      await expect(legacy.locator(`input[value="${operation}"]`)).toHaveCount(0);
    }
    await expect(legacy.locator('tbody')).not.toContainText(`Visible description ${suffix}`);
    await expect(legacy.locator('tbody')).not.toContainText(`Visible label ${suffix}`);
    await expect(modern.locator('.card-details-item-labels')).toHaveCount(0);
    await expect(modern.locator('.card-details-item-date-format')).toHaveCount(0);
    await expect(modern.locator('.card-details-item-members')).toHaveCount(0);
    await expect(modern.locator('.card-details-sort-order')).toHaveCount(0);
    await expect(modern.locator('.card-details-show-lists')).toHaveCount(0);
    await expect(modern.locator('.card-description')).toHaveCount(0);
    await expect(modern.locator('.comment-title')).toHaveCount(0);
    await legacy.screenshot({ path: `${output}/html4-sections-disabled.png`, fullPage: true });
    await modern.screenshot({ path: `${output}/html5-sections-disabled.png`, fullPage: true });
  } finally {
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    if (board?.boardId) {
      db.deleteMany('cards', { boardId: board.boardId });
      db.deleteMany('lists', { boardId: board.boardId });
      db.deleteMany('swimlanes', { boardId: board.boardId });
      db.deleteMany('boards', { _id: board.boardId });
    }
    if (user?._id) {
      db.deleteMany('legacyHtml4Sessions', { userId: user._id });
      db.deleteMany('users', { _id: user._id });
    }
  }
});
