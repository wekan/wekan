'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');
const ExcelJS = require('../../../node_modules/@wekanteam/exceljs');

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

test('cookieless HTML4 card discovery pages show only the signed-in user data', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const username = `html4discover${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  let user;
  let board;
  let outsider;
  let outsiderBoard;
  let templateBoard;
  let archivedBoard;
  let workspaceBoard;
  let importedBoardId;
  let importedFileBoardId;
  let importedExcelBoardId;
  const childIds = {
    checklist: db.uid('checklist'), item: db.uid('item'),
    comment: db.uid('comment'), attachment: db.uid('attachment'),
    foreignChecklist: db.uid('checklist'), foreignComment: db.uid('comment'),
    foreignAttachment: db.uid('attachment'),
  };
  try {
    await page.goto(`${baseURL}/sign-up`);
    await page.locator('input[name="username"]').fill(username);
    await page.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await page.locator('input[name="password"]').fill(password);
    await Promise.all([
      page.waitForNavigation(),
      page.locator('input[type="submit"]').click(),
    ]);
    user = db.findOne('users', { username });
    expect(user && user._id).toBeTruthy();

    board = db.seedBoard({
      ownerId: user._id,
      cardTitlesPerList: [['HTML4 Mine'], ['HTML4 Due'], ['HTML4 Searchable']],
    });
    outsider = db.seedUser();
    outsiderBoard = db.seedBoard({
      ownerId: outsider.id,
      cardTitlesPerList: [['HTML4 Searchable Secret']],
    });
    templateBoard = db.seedBoard({ ownerId: user._id, title: 'HTML4 Template Container', listCount: 1 });
    archivedBoard = db.seedBoard({ ownerId: user._id, title: 'HTML4 Archived Board', listCount: 1 });
    workspaceBoard = db.seedBoard({ ownerId: user._id, title: 'HTML4 Workspace Board', listCount: 1 });
    db.updateOne('boards', { _id: templateBoard.boardId }, { $set: { type: 'template-container' } });
    db.updateOne('boards', { _id: archivedBoard.boardId }, {
      $set: { archived: true, archivedAt: new Date() },
    });
    const cards = db.find('cards', { boardId: board.boardId });
    const due = cards.find(card => card.title === 'HTML4 Due');
    db.updateOne('cards', { _id: due._id }, {
      $set: {
        dueAt: new Date('2030-01-02T12:00:00Z'),
        startAt: new Date('2029-12-31T12:00:00Z'),
        members: [user._id],
        description: 'Semantic HTML4 card description',
      },
    });
    db.updateOne('users', { _id: user._id }, {
      $set: {
        'profile.starredPages': [{ url: '/shortcuts', title: 'Saved shortcuts' }],
        'profile.starredBoards': [board.boardId],
        'profile.defaultBoardId': board.boardId,
        'profile.boardWorkspacesTree': [{ id: 'html4-space', name: 'HTML4 Space', children: [] }],
        'profile.boardWorkspaceAssignments': { [workspaceBoard.boardId]: 'html4-space' },
      },
    });
    db.insertOne('checklists', {
      _id: childIds.checklist, cardId: due._id, boardId: board.boardId,
      title: 'HTML4 checklist', sort: 1,
    });
    db.insertOne('checklistItems', {
      _id: childIds.item, checklistId: childIds.checklist, cardId: due._id,
      boardId: board.boardId, title: 'HTML4 checked item', sort: 1, isFinished: true,
    });
    db.insertOne('card_comments', {
      _id: childIds.comment, cardId: due._id, boardId: board.boardId,
      userId: user._id, text: 'HTML4 visible comment', createdAt: new Date(),
    });
    db.insertOne('attachments', {
      _id: childIds.attachment, name: 'HTML4 report.png', type: 'image/png', size: 123,
      uploadedAt: new Date(), meta: { cardId: due._id, boardId: board.boardId }, versions: {},
    });
    db.insertOne('checklists', {
      _id: childIds.foreignChecklist, cardId: due._id, boardId: outsiderBoard.boardId,
      title: 'FOREIGN CHECKLIST MUST NOT LEAK', sort: 2,
    });
    db.insertOne('card_comments', {
      _id: childIds.foreignComment, cardId: due._id, boardId: outsiderBoard.boardId,
      userId: outsider.id, text: 'FOREIGN COMMENT MUST NOT LEAK', createdAt: new Date(),
    });
    db.insertOne('attachments', {
      _id: childIds.foreignAttachment, name: 'FOREIGN-ATTACHMENT.png', type: 'image/png',
      size: 999, uploadedAt: new Date(),
      meta: { cardId: due._id, boardId: outsiderBoard.boardId }, versions: {},
    });

    if (await page.locator('form[action="/allboards"] input[type="submit"]').count()) {
      await Promise.all([
        page.waitForNavigation(),
        page.locator('form[action="/allboards"] input[type="submit"]').first().click(),
      ]);
    }

    const open = async action => {
      await Promise.all([
        page.waitForNavigation(),
        page.locator(`form[action="${action}"] input[type="submit"]`).first().click(),
      ]);
    };
    await open('/allboards/templates');
    await expect(page.locator('h1')).toContainText('Templates');
    await expect(page.locator('tbody')).toContainText('HTML4 Template Container');
    await expect(page.locator('tbody')).not.toContainText('HTML4 Archived Board');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await page.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-allboards-templates.png`, fullPage: true,
      });
    }
    await open('/allboards/archive');
    await expect(page.locator('h1')).toContainText('Archive');
    await expect(page.locator('tbody')).toContainText('HTML4 Archived Board');
    await expect(page.locator('tbody')).not.toContainText('HTML4 Template Container');
    await open('/allboards/workspaces/html4-space');
    await expect(page.locator('h1')).toContainText('HTML4 Space');
    await expect(page.locator('tbody')).toContainText('HTML4 Workspace Board');
    await expect(page.locator('tbody')).not.toContainText('HTML4 Archived Board');
    await open('/allboards/home');
    await expect(page.locator('tbody')).toContainText(board.boardId);
    await expect(page.locator('tbody')).not.toContainText('HTML4 Workspace Board');
    await open('/import');
    for (const source of ['WeKan', 'Trello', 'CSV / TSV', 'Excel', 'Jira', 'GitHub', 'Asana']) {
      await expect(page.locator('tbody')).toContainText(source);
    }
    await open('/import/trello');
    await expect(page.locator('h1')).toContainText('Trello');
    await expect(page.locator('tbody')).toContainText('[x]');
    await expect(page.locator('tbody')).toContainText('Only the ticked parts are imported');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await page.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-import-trello.png`, fullPage: true,
      });
    }
    const commentsPart = page.locator('form:has(input[name="toggleImportField"][value="comments"])');
    await expect(commentsPart.locator('input[type="hidden"][name="importFields"]'))
      .toHaveValue(/comments/);
    await Promise.all([page.waitForNavigation(), commentsPart.locator('input[type="submit"]').click()]);
    await expect(page.locator('form:has(input[name="toggleImportField"][value="comments"])')
      .locator('input[type="hidden"][name="importFields"]')).not.toHaveValue(/comments/);
    await expect(page.locator('form:has(input[name="toggleImportField"][value="attachments"])')
      .locator('input[type="hidden"][name="importFields"]')).toHaveValue(/attachments/);
    await page.locator('textarea[name="importText"]').fill('{ invalid json');
    await Promise.all([
      page.waitForNavigation(),
      page.locator('form:has(input[name="legacyOperation"][value="import-board-text"]) input[type="submit"]')
        .click(),
    ]);
    await expect(page.locator('tbody')).toContainText('not valid JSON');
    await expect(page.locator('textarea[name="importText"]')).toHaveValue('{ invalid json');

    await open('/import/csv');
    await page.locator('textarea[name="importText"]')
      .fill('title,status\nHTML4 Imported Card,HTML4 Imported List');
    await Promise.all([
      page.waitForNavigation(),
      page.locator('form:has(input[name="legacyOperation"][value="import-board-text"]) input[type="submit"]')
        .click(),
    ]);
    const importedCard = db.findOne('cards', { title: 'HTML4 Imported Card', userId: user._id });
    expect(importedCard && importedCard.boardId).toBeTruthy();
    importedBoardId = importedCard.boardId;
    await expect(page.locator('tbody')).toContainText('Imported:');
    await Promise.all([
      page.waitForNavigation(),
      page.locator(`form[action^="/b/${importedBoardId}/"] input[type="submit"]`).click(),
    ]);
    await expect(page.locator('tbody')).toContainText('HTML4 Imported Card');

    // Return through signed navigation: board pages intentionally expose only
    // their nearest destinations, and the cookieless session is never put in a URL.
    await open('/allboards');
    await open('/import');
    await open('/import/wekan');
    const fileImportTitle = `HTML4 File Import ${suffix}`;
    const exportedAt = '2020-01-01T00:00:00.000Z';
    const fileExport = {
      _format: 'wekan-board-1.0.0', _id: 'html4-source-board', title: fileImportTitle,
      archived: false, color: 'belize', permission: 'private',
      createdAt: exportedAt, modifiedAt: exportedAt,
      members: [], labels: [],
      swimlanes: [{ _id: 'html4-source-swimlane', title: 'Default', archived: false, sort: 0 }],
      lists: [{ _id: 'html4-source-list', title: 'File List', archived: false, sort: 0 }],
      cards: [{
        _id: 'html4-source-card', title: 'HTML4 JSON File Card', archived: false,
        swimlaneId: 'html4-source-swimlane', listId: 'html4-source-list', sort: 0,
        description: '', dateLastActivity: exportedAt, labelIds: [],
      }],
      comments: [], activities: [], checklists: [], checklistItems: [], subtaskItems: [],
      customFields: [], rules: [], triggers: [], actions: [], users: [],
    };
    await page.locator('input[type="file"][name="importFile"]').setInputFiles({
      name: 'wekan-export.json', mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(fileExport)),
    });
    await Promise.all([
      page.waitForNavigation(),
      page.locator('form:has(input[name="legacyOperation"][value="import-board-file"]) input[type="submit"]')
        .click(),
    ]);
    const importedFileBoard = db.findOne('boards', { title: fileImportTitle });
    expect(importedFileBoard && importedFileBoard._id).toBeTruthy();
    importedFileBoardId = importedFileBoard._id;
    await expect(page.locator('tbody')).toContainText(fileImportTitle);

    await open('/import');
    await open('/import/excel');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Board');
    worksheet.addRow(['Title', 'Description', 'Status']);
    worksheet.addRow(['HTML4 Excel File Card', 'uploaded without JavaScript', 'HTML4 Excel List']);
    const excelBuffer = Buffer.from(await workbook.xlsx.writeBuffer());
    await page.locator('input[type="file"][name="importFile"]').setInputFiles({
      name: 'wekan-board.xlsx', mimeType: XLSX_MIME, buffer: excelBuffer,
    });
    await Promise.all([
      page.waitForNavigation(),
      page.locator('form:has(input[name="legacyOperation"][value="import-board-file"]) input[type="submit"]')
        .click(),
    ]);
    const importedExcelCard = db.findOne('cards', { title: 'HTML4 Excel File Card' });
    expect(importedExcelCard && importedExcelCard.boardId).toBeTruthy();
    importedExcelBoardId = importedExcelCard.boardId;
    await expect(page.locator('tbody')).toContainText('Imported:');
    await open('/my-cards');
    await expect(page.locator('h1')).toHaveText('My Cards');
    await expect(page.locator('tbody')).toContainText('HTML4 Due');
    await expect(page.locator('tbody')).not.toContainText('HTML4 Searchable Secret');

    await Promise.all([
      page.waitForNavigation(),
      page.locator(`form[action$="/${due._id}"] input[type="submit"]`).click(),
    ]);
    await expect(page.locator('h1')).toHaveText('HTML4 Due');
    await expect(page.locator('tbody')).toContainText('Semantic HTML4 card description');
    await expect(page.locator('tbody')).toContainText('2030-01-02T12:00:00.000Z');
    await expect(page.locator('tbody')).toContainText(username);
    await expect(page.locator('tbody')).toContainText('HTML4 checklist');
    await expect(page.locator('tbody')).toContainText('[x]');
    await expect(page.locator('tbody')).toContainText('HTML4 checked item');
    await expect(page.locator('tbody')).toContainText('HTML4 report.png');
    await expect(page.locator('tbody')).toContainText('HTML4 visible comment');
    await expect(page.locator('tbody')).not.toContainText('FOREIGN');

    const modernContext = await browser.newContext();
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await modern.goto(`${baseURL}/allboards/templates`);
    await expect(modern.getByRole('heading', { name: 'Templates' })).toBeVisible();
    await expect(modern.locator('body')).toContainText('HTML4 Template Container');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-allboards-templates.png`, fullPage: true,
      });
    }
    await modern.goto(`${baseURL}/import/trello`);
    await expect(modern.getByRole('heading', { name: 'Import from:' })).toBeVisible();
    await expect(modern.locator('body')).toContainText('Trello');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-import-trello.png`, fullPage: true,
      });
    }
    await modern.goto(`${baseURL}/b/${board.boardId}/${board.slug}/${due._id}`);
    await expect(modern.locator('.card-details-title')).toContainText('HTML4 Due');
    await expect(modern.locator('.card-details')).toContainText('Semantic HTML4 card description');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await page.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-card-details.png`, fullPage: true,
      });
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-card-details.png`, fullPage: true,
      });
    }
    await modernContext.close();

    await open('/due-cards');
    await expect(page.locator('h1')).toHaveText('Due Cards');
    await expect(page.locator('tbody')).toContainText('HTML4 Due');
    await expect(page.locator('tbody')).not.toContainText('HTML4 Searchable');

    await open('/bookmarks');
    await expect(page.locator('tbody')).toContainText('Saved shortcuts');

    await open('/global-search');
    await page.locator('input[name="q"]').fill('Searchable');
    await Promise.all([page.waitForNavigation(), page.locator('#legacy-search-query').press('Enter')]);
    await expect(page.locator('tbody')).toContainText('HTML4 Searchable');
    await expect(page.locator('tbody')).not.toContainText('HTML4 Due');
    await expect(page.locator('tbody')).not.toContainText('HTML4 Searchable Secret');
  } finally {
    db.deleteOne('attachments', { _id: childIds.foreignAttachment });
    db.deleteOne('card_comments', { _id: childIds.foreignComment });
    db.deleteOne('checklists', { _id: childIds.foreignChecklist });
    db.deleteOne('attachments', { _id: childIds.attachment });
    db.deleteOne('card_comments', { _id: childIds.comment });
    db.deleteOne('checklistItems', { _id: childIds.item });
    db.deleteOne('checklists', { _id: childIds.checklist });
    if (outsiderBoard) db.cleanup({ boardIds: [outsiderBoard.boardId] });
    if (outsider) db.cleanup({ userIds: [outsider.id] });
    if (templateBoard) db.cleanup({ boardIds: [templateBoard.boardId] });
    if (archivedBoard) db.cleanup({ boardIds: [archivedBoard.boardId] });
    if (workspaceBoard) db.cleanup({ boardIds: [workspaceBoard.boardId] });
    if (importedBoardId) db.cleanup({ boardIds: [importedBoardId] });
    if (importedFileBoardId) db.cleanup({ boardIds: [importedFileBoardId] });
    if (importedExcelBoardId) db.cleanup({ boardIds: [importedExcelBoardId] });
    if (board) db.cleanup({ boardIds: [board.boardId] });
    if (user) db.cleanup({ userIds: [user._id] });
    await context.close();
  }
});
