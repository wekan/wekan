'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

test('HTML4 and HTML5 expose the same parent-card state at the same URL', async ({ browser, baseURL }) => {
  test.setTimeout(90_000);
  const suffix = db.uniqueSuffix();
  const username = `html4parent${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const legacyContext = await browser.newContext({ javaScriptEnabled: false });
  const legacy = await legacyContext.newPage();
  let user;
  let board;
  let subtaskBoardId;
  let modernContext;
  let viewerContext;
  let viewerUser;
  let settingsId;
  let originalHideActivities;
  let originalHideActivitiesPresent = false;
  try {
    const settings = db.findOne('settings', {});
    settingsId = settings?._id;
    originalHideActivitiesPresent = Object.prototype.hasOwnProperty.call(
      settings || {}, 'hideBoardActivitiesOnAllBoards',
    );
    originalHideActivities = settings?.hideBoardActivitiesOnAllBoards;
    if (settingsId) db.updateOne('settings', { _id: settingsId }, {
      $set: { hideBoardActivitiesOnAllBoards: false },
    });
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(password);
    await Promise.all([
      legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click(),
    ]);
    user = db.findOne('users', { username });
    expect(user?._id).toBeTruthy();
    board = db.seedBoard({
      ownerId: user._id,
      title: `Parent parity ${suffix}`,
      cardTitlesPerList: [['Parent target', 'Child card']],
    });
    const parent = db.findOne('cards', { boardId: board.boardId, title: 'Parent target' });
    const child = db.findOne('cards', { boardId: board.boardId, title: 'Child card' });
    db.insertOne('activities', {
      _id: db.uid('activity'), activityType: 'createCard', userId: user._id,
      boardId: board.boardId, cardId: child._id, cardTitle: child.title,
      listId: child.listId, listName: 'List A', createdAt: new Date(), modifiedAt: new Date(),
    });
    const cardUrl = `${baseURL}/b/${board.boardId}/${board.slug}/${child._id}`;
    const openLegacy = async action => {
      await Promise.all([
        legacy.waitForNavigation(),
        legacy.locator(`form[action="${action}"] input[type="submit"]`).first().click(),
      ]);
    };

    await openLegacy('/allboards');
    await openLegacy(`/b/${board.boardId}/${board.slug}`);
    await openLegacy(`/b/${board.boardId}/${board.slug}/${child._id}`);
    const parentForm = legacy.locator(
      'form:has(input[name="legacyOperation"][value="set-card-parent"])',
    );
    await parentForm.locator('select[name="parentCardId"]').selectOption(parent._id);
    await Promise.all([
      legacy.waitForNavigation(), parentForm.locator('input[type="submit"]').click(),
    ]);
    expect(db.getCard(child._id).parentId).toBe(parent._id);
    await expect(parentForm.locator('select[name="parentCardId"]')).toHaveValue(parent._id);
    await expect(legacy.locator('tbody')).toContainText(
      `${db.getBoard(board.boardId).title} / ${parent.title}`,
    );
    const addSubtaskForm = () => legacy.locator(
      'form:has(input[name="legacyOperation"][value="add-subtask"])',
    );
    const addSubtask = async title => {
      await addSubtaskForm().locator('input[name="subtaskTitle"]').fill(title);
      await Promise.all([
        legacy.waitForNavigation(), addSubtaskForm().locator('input[type="submit"]').click(),
      ]);
    };
    await addSubtask('First HTML4 subtask');
    await addSubtask('Second HTML4 subtask');
    const createdSubtasks = db.find('cards', {
      parentId: child._id, archived: false,
    }).sort((a, b) => a.sort - b.sort);
    expect(createdSubtasks).toHaveLength(2);
    const firstSubtask = createdSubtasks[0];
    const secondSubtask = createdSubtasks[1];
    subtaskBoardId = firstSubtask.boardId;
    const secondEditForm = () => legacy.locator(
      'form:has(input[name="legacyOperation"][value="edit-subtask-title"])'
      + `:has(input[name="subtaskId"][value="${secondSubtask._id}"])`,
    );
    await secondEditForm().locator('input[name="subtaskTitle"]').fill('Renamed HTML4 subtask');
    await Promise.all([
      legacy.waitForNavigation(), secondEditForm().locator('input[type="submit"]').click(),
    ]);
    expect(db.getCard(secondSubtask._id).title).toBe('Renamed HTML4 subtask');
    const moveSecondUp = () => legacy.locator(
      'form:has(input[name="legacyOperation"][value="move-subtask-up"])'
      + `:has(input[name="subtaskId"][value="${secondSubtask._id}"])`,
    );
    await Promise.all([
      legacy.waitForNavigation(), moveSecondUp().locator('input[type="submit"]').click(),
    ]);
    const reordered = db.find('cards', {
      parentId: child._id, archived: false,
    }).sort((a, b) => a.sort - b.sort);
    expect(reordered.map(item => item._id)).toEqual([secondSubtask._id, firstSubtask._id]);

    modernContext = await browser.newContext();
    const modern = await modernContext.newPage();
    const browserErrors = [];
    modern.on('pageerror', error => browserErrors.push(error.message));
    modern.on('console', message => {
      if (message.type() === 'error') browserErrors.push(message.text());
    });
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await modern.goto(cardUrl);
    await modern.waitForTimeout(1000);
    if (!(await modern.locator('.card-details-title').count())) {
      throw new Error(`HTML5 card did not render at ${modern.url()}: `
        + `${JSON.stringify(browserErrors)}; body=${await modern.locator('body').innerText()}`);
    }
    await expect(modern.locator('.card-details-title')).toContainText(child.title);
    await modern.locator('.js-open-card-details-menu:visible').first().click();
    await modern.locator('.pop-over:visible .js-more').click();
    const modernParentPopup = modern.locator('.pop-over:visible');
    await expect(modernParentPopup).toContainText("Change card's parent");
    await expect(modernParentPopup.locator('.js-field-parent-card')).toHaveValue(parent._id);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await parentForm.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-card-parent.png`,
      });
      await modernParentPopup.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-card-parent.png`,
      });
    }
    await modern.keyboard.press('Escape');
    await expect(modern.locator('.card-subtasks-items')).toContainText('Renamed HTML4 subtask');
    await expect(modern.locator('.card-subtasks-items')).toContainText('First HTML4 subtask');
    await expect(legacy.locator('tbody')).toContainText('Activities');
    await modern.locator('.js-toggle-card-section[data-section="activities"]').click();
    const modernActivities = modern.locator('.activities .activity');
    await expect(modernActivities.first()).toBeVisible();
    await expect(modernActivities.first()).toHaveAttribute('aria-label', /\S+/);

    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-card-subtasks.png`, fullPage: true,
      });
      await modern.locator('.card-subtasks-items').screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-card-subtasks.png`,
      });
      await modern.locator('.activities').screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-card-activities.png`,
      });
    }
    viewerContext = await browser.newContext({ javaScriptEnabled: false });
    const viewer = await viewerContext.newPage();
    const viewerName = `html4viewer${suffix}`;
    await viewer.goto(`${baseURL}/sign-up`);
    await viewer.locator('input[name="username"]').fill(viewerName);
    await viewer.locator('input[name="email"]').fill(`${viewerName}@wekan-test.invalid`);
    await viewer.locator('input[name="password"]').fill(password);
    await Promise.all([
      viewer.waitForNavigation(), viewer.locator('input[type="submit"]').click(),
    ]);
    viewerUser = db.findOne('users', { username: viewerName });
    db.addBoardMember({ boardId: board.boardId, userId: viewerUser._id });
    const openViewer = async action => Promise.all([
      viewer.waitForNavigation(),
      viewer.locator(`form[action="${action}"] input[type="submit"]`).first().click(),
    ]);
    await openViewer('/allboards');
    await openViewer(`/b/${board.boardId}/${board.slug}`);
    await openViewer(`/b/${board.boardId}/${board.slug}/${child._id}`);
    await expect(viewer.locator('tbody')).not.toContainText('Activities');
    const confirmArchive = () => legacy.locator(
      'form:has(input[name="legacyOperation"][value="confirm-archive-subtask"])'
      + `:has(input[name="subtaskId"][value="${firstSubtask._id}"])`,
    );
    await Promise.all([
      legacy.waitForNavigation(), confirmArchive().locator('input[type="submit"]').click(),
    ]);
    const archiveSubtask = () => legacy.locator(
      'form:has(input[name="legacyOperation"][value="archive-subtask"])'
      + `:has(input[name="subtaskId"][value="${firstSubtask._id}"])`,
    );
    await Promise.all([
      legacy.waitForNavigation(), archiveSubtask().locator('input[type="submit"]').click(),
    ]);
    expect(db.getCard(firstSubtask._id).archived).toBe(true);
  } finally {
    if (modernContext) await modernContext.close();
    if (viewerContext) await viewerContext.close();
    await legacyContext.close();
    if (board?.boardId || user?._id) {
      db.cleanup({
        boardIds: [board?.boardId, subtaskBoardId].filter(Boolean),
        userIds: [user?._id, viewerUser?._id].filter(Boolean),
      });
    }
    if (settingsId) db.updateOne('settings', { _id: settingsId },
      originalHideActivitiesPresent
        ? { $set: { hideBoardActivitiesOnAllBoards: originalHideActivities } }
        : { $unset: { hideBoardActivitiesOnAllBoards: '' } });
  }
});
