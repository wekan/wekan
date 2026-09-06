'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');
const ExcelJS = require('../../../node_modules/@wekanteam/exceljs');
const { strToU8, zipSync } = require('../../../node_modules/fflate');

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

test('cookieless HTML4 card discovery pages show only the signed-in user data', async ({ browser, baseURL }) => {
  test.setTimeout(90_000);
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
  let permanentDeleteBoard;
  let workspaceBoard;
  let settingsId;
  let originalPermanentDelete;
  let originalPermanentDeletePresent = false;
  let html4CreatedBoardId;
  let html4CopiedBoardId;
  let importedBoardId;
  let importedFileBoardId;
  let importedWekanZipBoardId;
  let importedWekanZipAttachmentId;
  let importedWekanZipImageAttachmentId;
  let importedExcelBoardId;
  let importedTrelloZipBoardId;
  let html4CreatedCommentId;
  let html4ReplyCommentId;
  let html4ChecklistId;
  let html4ChecklistItemId;
  let html4CopiedChecklistId;
  let html4ConvertedCardId;
  const labelId = db.uid('label');
  const foreignLabelId = db.uid('label');
  const nonMemberId = db.uid('user');
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
    db.updateOne('boards', { _id: board.boardId }, {
      $set: { labels: [{ _id: labelId, name: 'HTML4 Label', color: 'green' }] },
      $push: { members: {
        userId: outsider.id, isAdmin: false, isActive: true, isNoComments: false,
        isCommentOnly: false, isWorker: false, isReadOnly: false,
        isReadAssignedOnly: false,
      } },
    });
    db.updateOne('boards', { _id: outsiderBoard.boardId }, {
      $set: { labels: [{ _id: foreignLabelId, name: 'Foreign Label', color: 'red' }] },
    });
    templateBoard = db.seedBoard({ ownerId: user._id, title: 'HTML4 Template Container', listCount: 1 });
    archivedBoard = db.seedBoard({ ownerId: user._id, title: 'HTML4 Archived Board', listCount: 1 });
    permanentDeleteBoard = db.seedBoard({
      ownerId: user._id, title: 'HTML4 Permanently Deleted Board', listCount: 1,
    });
    workspaceBoard = db.seedBoard({ ownerId: user._id, title: 'HTML4 Workspace Board', listCount: 1 });
    db.updateOne('boards', { _id: templateBoard.boardId }, { $set: { type: 'template-container' } });
    db.updateOne('boards', { _id: archivedBoard.boardId }, {
      $set: { archived: true, archivedAt: new Date() },
    });
    db.updateOne('boards', { _id: permanentDeleteBoard.boardId }, {
      $set: { archived: true, archivedAt: new Date() },
    });
    const settingsDoc = db.findOne('settings', {});
    settingsId = settingsDoc?._id;
    originalPermanentDeletePresent = Object.prototype.hasOwnProperty.call(
      settingsDoc || {}, 'enablePermanentDelete',
    );
    originalPermanentDelete = settingsDoc?.enablePermanentDelete;
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
    const boardOperationForm = (operation, boardId) => page.locator(
      `form:has(input[name="legacyOperation"][value="${operation}"])`
      + `:has(input[name="boardId"][value="${boardId}"])`,
    );
    await expect(boardOperationForm(
      'confirm-permanently-delete-board', permanentDeleteBoard.boardId,
    )).toHaveCount(0);
    await Promise.all([
      page.waitForNavigation(),
      boardOperationForm('restore-board', archivedBoard.boardId)
        .locator('input[type="submit"]').click(),
    ]);
    await expect.poll(() => db.findOne('boards', { _id: archivedBoard.boardId })?.archived)
      .toBe(false);
    await expect(page.locator('tbody')).not.toContainText('HTML4 Archived Board');

    await open('/allboards/remaining');
    const createBoardForm = page.locator(
      'form:has(input[name="legacyOperation"][value="create-board"])',
    );
    await expect(createBoardForm.locator('label[for="legacy-board-title-board"]'))
      .toContainText('Title');
    await expect(createBoardForm.locator('label[for="legacy-board-permission-board"]'))
      .toContainText('permissions');
    await createBoardForm.locator('input[name="boardTitle"]')
      .fill(`HTML4 Created Board ${suffix}`);
    await createBoardForm.locator('select[name="boardPermission"]').selectOption('public');
    await Promise.all([
      page.waitForNavigation(), createBoardForm.locator('input[type="submit"]').click(),
    ]);
    const html4CreatedBoard = db.findOne('boards', { title: `HTML4 Created Board ${suffix}` });
    expect(html4CreatedBoard?.permission).toBe('public');
    expect(html4CreatedBoard?.members?.some(member =>
      member.userId === user._id && member.isAdmin === true)).toBe(true);
    html4CreatedBoardId = html4CreatedBoard._id;
    expect(db.countDocuments('swimlanes', { boardId: html4CreatedBoardId })).toBe(1);

    const boardCountBeforeCopy = db.countDocuments('boards', { 'members.userId': user._id });
    await Promise.all([
      page.waitForNavigation(),
      boardOperationForm('confirm-copy-board', html4CreatedBoardId)
        .locator('input[type="submit"]').click(),
    ]);
    expect(db.countDocuments('boards', { 'members.userId': user._id }))
      .toBe(boardCountBeforeCopy);
    await Promise.all([
      page.waitForNavigation(),
      boardOperationForm('copy-board', html4CreatedBoardId).locator('input[type="submit"]').click(),
    ]);
    await expect(page.locator('tbody')).toContainText('StatusSave');
    expect(db.countDocuments('boards', { 'members.userId': user._id }))
      .toBe(boardCountBeforeCopy + 1);
    const copiedCandidates = db.find('boards', {
      'members.userId': user._id, _id: { $nin: [board.boardId, html4CreatedBoardId,
        templateBoard.boardId, archivedBoard.boardId, workspaceBoard.boardId] },
    });
    const html4CopiedBoard = copiedCandidates.find(candidate =>
      candidate.title.startsWith(`HTML4 Created Board ${suffix}`));
    expect(html4CopiedBoard?._id).toBeTruthy();
    html4CopiedBoardId = html4CopiedBoard._id;
    const workspaceForm = boardId => page.locator(
      `form:has(input[name="legacyOperation"][value="set-board-workspace"])`
      + `:has(input[name="boardId"][value="${boardId}"])`,
    );
    await expect(workspaceForm(html4CreatedBoardId).locator('select[name="workspaceId"]'))
      .toHaveValue('');
    await workspaceForm(html4CreatedBoardId).locator('select[name="workspaceId"]')
      .selectOption('html4-space');
    await Promise.all([
      page.waitForNavigation(),
      workspaceForm(html4CreatedBoardId).locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('users', { _id: user._id })
      ?.profile?.boardWorkspaceAssignments?.[html4CreatedBoardId]).toBe('html4-space');
    await open('/allboards/workspaces/html4-space');
    await expect(page.locator('tbody')).toContainText(`HTML4 Created Board ${suffix}`);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await page.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-allboards-workspace-assignment.png`,
        fullPage: true,
      });
    }
    await workspaceForm(html4CreatedBoardId).locator('select[name="workspaceId"]')
      .selectOption('');
    await Promise.all([
      page.waitForNavigation(),
      workspaceForm(html4CreatedBoardId).locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('users', { _id: user._id })
      ?.profile?.boardWorkspaceAssignments?.[html4CreatedBoardId]).toBeUndefined();
    await open('/allboards/remaining');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await page.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-allboards-create-copy.png`,
        fullPage: true,
      });
    }
    // Star and Home are per-user state and can both be toggled back from the
    // same no-JavaScript page without exposing an identifier in the URL.
    await Promise.all([
      page.waitForNavigation(),
      boardOperationForm('toggle-board-star', board.boardId).locator('input[type="submit"]').click(),
    ]);
    await expect.poll(() => db.findOne('users', { _id: user._id })?.profile?.starredBoards || [])
      .not.toContain(board.boardId);
    await Promise.all([
      page.waitForNavigation(),
      boardOperationForm('toggle-board-star', board.boardId).locator('input[type="submit"]').click(),
    ]);
    await expect.poll(() => db.findOne('users', { _id: user._id })?.profile?.starredBoards || [])
      .toContain(board.boardId);
    await Promise.all([
      page.waitForNavigation(),
      boardOperationForm('toggle-default-board', board.boardId)
        .locator('input[type="submit"]').click(),
    ]);
    await expect.poll(() => db.findOne('users', { _id: user._id })?.profile?.defaultBoardId)
      .toBeUndefined();
    await Promise.all([
      page.waitForNavigation(),
      boardOperationForm('toggle-default-board', board.boardId)
        .locator('input[type="submit"]').click(),
    ]);
    await expect.poll(() => db.findOne('users', { _id: user._id })?.profile?.defaultBoardId)
      .toBe(board.boardId);

    await Promise.all([
      page.waitForNavigation(),
      boardOperationForm('confirm-archive-board', archivedBoard.boardId)
        .locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('boards', { _id: archivedBoard.boardId })?.archived).toBe(false);
    await Promise.all([
      page.waitForNavigation(),
      boardOperationForm('archive-board', archivedBoard.boardId)
        .locator('input[type="submit"]').click(),
    ]);
    await expect.poll(() => db.findOne('boards', { _id: archivedBoard.boardId })?.archived)
      .toBe(true);
    await expect(page.locator('tbody')).not.toContainText('HTML4 Archived Board');
    await open('/allboards/workspaces/html4-space');
    await expect(page.locator('h1')).toContainText('HTML4 Space');
    await expect(page.locator('tbody')).toContainText('HTML4 Workspace Board');
    await expect(page.locator('tbody')).not.toContainText('HTML4 Archived Board');
    await open('/allboards/home');
    await expect(page.locator('tbody')).toContainText(board.boardId);
    await expect(page.locator('tbody')).not.toContainText('HTML4 Workspace Board');
    await open(`/b/${board.boardId}/${board.slug}`);
    await expect(page.locator('tbody')).toContainText('HTML4 Mine');
    const createForm = page.locator(
      'form:has(input[name="legacyOperation"][value="create-card"])',
    );
    await createForm.locator('input[name="cardTitle"]').fill('FORGED HTML4 CARD');
    await createForm.locator('input[name="boardId"]').evaluate(
      (input, boardId) => { input.value = boardId; }, outsiderBoard.boardId,
    );
    await Promise.all([
      page.waitForNavigation(),
      createForm.locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('cards', { title: 'FORGED HTML4 CARD' })).toBeNull();
    await expect(page.locator('tbody')).toContainText('Operation failed');

    await page.locator('input[name="cardTitle"]').fill('HTML4 Button Created');
    await Promise.all([
      page.waitForNavigation(),
      page.locator('form:has(input[name="legacyOperation"][value="create-card"]) input[type="submit"]')
        .click(),
    ]);
    const buttonCard = db.findOne('cards', {
      boardId: board.boardId, title: 'HTML4 Button Created',
    });
    expect(buttonCard && buttonCard._id).toBeTruthy();
    const originalCard = db.findOne('cards', { boardId: board.boardId, title: 'HTML4 Mine' });
    expect(buttonCard.sort).toBeGreaterThan(originalCard.sort);
    const moveForm = operation => page.locator(
      `form:has(input[name="legacyOperation"][value="${operation}"])`
      + `:has(input[name="cardId"][value="${buttonCard._id}"]) input[type="submit"]`,
    );
    await Promise.all([page.waitForNavigation(), moveForm('move-card-up').click()]);
    expect(db.findOne('cards', { _id: buttonCard._id }).sort).toBeLessThan(originalCard.sort);
    await Promise.all([page.waitForNavigation(), moveForm('move-card-down').click()]);
    expect(db.findOne('cards', { _id: buttonCard._id }).sort).toBeGreaterThan(originalCard.sort);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await page.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-board-card-actions.png`, fullPage: true,
      });
    }
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
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await page.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-import-wekan.png`, fullPage: true,
      });
    }
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
    await open('/import/wekan');
    const zipBoardTitle = `HTML4 WeKan ZIP ${suffix}`;
    const zipAttachmentId = `zipattachment${suffix}`;
    const zipImageAttachmentId = `zipimage${suffix}`;
    const zipCardId = `zip-card-${suffix}`;
    const zipDocument = {
      ...fileExport,
      _id: `zip-board-${suffix}`,
      title: zipBoardTitle,
      cards: [{
        ...fileExport.cards[0], _id: zipCardId, title: 'HTML4 WeKan ZIP Card',
      }],
      attachments: [{
        _id: zipAttachmentId, cardId: zipCardId, name: 'zip-note.txt',
        type: 'text/plain', size: 21, uploadedAt: exportedAt,
      }, {
        _id: zipImageAttachmentId, cardId: zipCardId, name: 'zip-pixel.png',
        type: 'image/png', size: 68, uploadedAt: exportedAt,
      }],
      activities: [{
        _id: `zip-activity-${suffix}`, activityType: 'addAttachment',
        attachmentId: zipAttachmentId, cardId: zipCardId,
        userId: 'zip-source-user', createdAt: exportedAt,
      }, {
        _id: `zip-image-activity-${suffix}`, activityType: 'addAttachment',
        attachmentId: zipImageAttachmentId, cardId: zipCardId,
        userId: 'zip-source-user', createdAt: exportedAt,
      }],
    };
    const unsafeZip = Buffer.from(zipSync({
      '../wekan.json': strToU8(JSON.stringify({ ...zipDocument,
        title: `UNSAFE ${zipBoardTitle}` })),
    }));
    await page.locator('input[type="file"][accept*=".zip"]').setInputFiles({
      name: 'unsafe-wekan-export.zip', mimeType: 'application/zip', buffer: unsafeZip,
    });
    await Promise.all([
      page.waitForNavigation(),
      page.locator('form:has(input[type="file"][accept*=".zip"]) input[type="submit"]').click(),
    ]);
    await expect(page.locator('tbody')).toContainText('Import failed');
    expect(db.findOne('boards', { title: `UNSAFE ${zipBoardTitle}` })).toBeNull();

    const wekanZip = Buffer.from(zipSync({
      'wekan.json': strToU8(JSON.stringify(zipDocument)),
      [`attachments/${zipAttachmentId}-zip-note.txt`]: strToU8('HTML4 ZIP attachment\n'),
      [`attachments/${zipImageAttachmentId}-zip-pixel.png`]: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        'base64',
      ),
    }));
    await page.locator('input[type="file"][accept*=".zip"]').setInputFiles({
      name: 'wekan-export.zip', mimeType: 'application/zip', buffer: wekanZip,
    });
    await Promise.all([
      page.waitForNavigation({ timeout: 60_000 }),
      page.locator('form:has(input[type="file"][accept*=".zip"]) input[type="submit"]')
        .click({ noWaitAfter: true }),
    ]);
    const importedZipBoard = db.findOne('boards', { title: zipBoardTitle });
    expect(importedZipBoard && importedZipBoard._id).toBeTruthy();
    importedWekanZipBoardId = importedZipBoard._id;
    const importedZipAttachment = db.findOne('attachments', {
      'meta.boardId': importedWekanZipBoardId, name: 'zip-note.txt',
    });
    expect(importedZipAttachment && importedZipAttachment._id).toBeTruthy();
    expect(importedZipAttachment.size).toBe(21);
    importedWekanZipAttachmentId = importedZipAttachment._id;
    const importedZipImageAttachment = db.findOne('attachments', {
      'meta.boardId': importedWekanZipBoardId, name: 'zip-pixel.png',
    });
    expect(importedZipImageAttachment && importedZipImageAttachment._id).toBeTruthy();
    importedWekanZipImageAttachmentId = importedZipImageAttachment._id;
    const disposableAttachmentId = `zipdelete${suffix}`;
    db.insertOne('attachments', {
      _id: disposableAttachmentId, name: 'delete-me.txt', type: 'text/plain', size: 0,
      uploadedAt: new Date(), versions: {},
      meta: { cardId: importedZipImageAttachment.meta.cardId, boardId: importedWekanZipBoardId },
    });
    await expect(page.locator('tbody')).toContainText(zipBoardTitle);

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

    await open('/import');
    await open('/import/trello');
    const trelloZipTitle = `HTML4 Trello ZIP ${suffix}`;
    const trelloZip = Buffer.from(zipSync({
      'trello-board.json': strToU8(JSON.stringify({
        id: `trello-${suffix}`, name: trelloZipTitle, desc: '', closed: false,
        prefs: { background: 'blue', permissionLevel: 'private' },
        lists: [], cards: [], labels: [], members: [], actions: [], checklists: [],
      })),
    }));
    await page.locator('input[type="file"][accept=".zip,application/zip"]').setInputFiles({
      name: 'trello-export.zip', mimeType: 'application/zip', buffer: trelloZip,
    });
    await Promise.all([
      page.waitForNavigation(),
      page.locator('form:has(input[type="file"][accept=".zip,application/zip"]) input[type="submit"]')
        .click(),
    ]);
    const importedTrelloZipBoard = db.findOne('boards', { title: trelloZipTitle });
    expect(importedTrelloZipBoard && importedTrelloZipBoard._id).toBeTruthy();
    importedTrelloZipBoardId = importedTrelloZipBoard._id;
    await expect(page.locator('tbody')).toContainText(trelloZipTitle);
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

    const addChecklistForm = page.locator(
      'form:has(input[name="legacyOperation"][value="add-checklist"])',
    );
    await addChecklistForm.locator('input[name="checklistTitle"]')
      .fill('HTML4 created checklist');
    await Promise.all([
      page.waitForNavigation(), addChecklistForm.locator('input[type="submit"]').click(),
    ]);
    const createdChecklist = db.findOne('checklists', {
      cardId: due._id, title: 'HTML4 created checklist',
    });
    expect(createdChecklist && createdChecklist._id).toBeTruthy();
    html4ChecklistId = createdChecklist._id;
    const moveChecklist = direction => page.locator(
      `form:has(input[name="legacyOperation"][value="move-checklist-${direction}"])`
      + `:has(input[name="checklistId"][value="${html4ChecklistId}"])`,
    );
    await Promise.all([
      page.waitForNavigation(), moveChecklist('up').locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('checklists', { _id: html4ChecklistId }).sort)
      .toBeLessThan(db.findOne('checklists', { _id: childIds.checklist }).sort);
    await Promise.all([
      page.waitForNavigation(), moveChecklist('down').locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('checklists', { _id: html4ChecklistId }).sort)
      .toBeGreaterThan(db.findOne('checklists', { _id: childIds.checklist }).sort);

    const moveSeededChecklist = page.locator(
      'form:has(input[name="legacyOperation"][value="move-checklist-to-card"])'
      + `:has(input[name="checklistId"][value="${childIds.checklist}"])`,
    );
    await moveSeededChecklist.locator('select[name="targetCardRef"]')
      .selectOption(`${board.boardId}|${originalCard._id}`);
    await Promise.all([
      page.waitForNavigation(), moveSeededChecklist.locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('checklists', { _id: childIds.checklist })).toMatchObject({
      cardId: originalCard._id, boardId: board.boardId,
    });
    expect(db.findOne('checklistItems', { _id: childIds.item })).toMatchObject({
      cardId: originalCard._id, boardId: board.boardId,
    });

    const editChecklistForm = () => page.locator(
      'form:has(input[name="legacyOperation"][value="edit-checklist"])'
      + `:has(input[name="checklistId"][value="${html4ChecklistId}"])`,
    );
    await editChecklistForm().locator('input[name="checklistTitle"]')
      .fill('HTML4 edited checklist');
    await Promise.all([
      page.waitForNavigation(), editChecklistForm().locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('checklists', { _id: html4ChecklistId }).title)
      .toBe('HTML4 edited checklist');

    const addChecklistItemForm = () => page.locator(
      'form:has(input[name="legacyOperation"][value="add-checklist-item"])'
      + `:has(input[name="checklistId"][value="${html4ChecklistId}"])`,
    );
    await addChecklistItemForm().locator('input[name="checklistItemTitle"]')
      .fill('FORGED CHECKLIST ITEM');
    await addChecklistItemForm().locator('input[name="checklistId"]').evaluate(
      (input, checklistId) => { input.value = checklistId; }, childIds.foreignChecklist,
    );
    await Promise.all([
      page.waitForNavigation(), page.locator(
        'form:has(input[name="legacyOperation"][value="add-checklist-item"])'
        + `:has(input[name="checklistId"][value="${childIds.foreignChecklist}"]) input[type="submit"]`,
      ).click(),
    ]);
    expect(db.findOne('checklistItems', { title: 'FORGED CHECKLIST ITEM' })).toBeNull();
    await expect(page.locator('tbody')).toContainText('Operation failed');

    await addChecklistItemForm().locator('input[name="checklistItemTitle"]')
      .fill('HTML4 created checklist item');
    await Promise.all([
      page.waitForNavigation(), addChecklistItemForm().locator('input[type="submit"]').click(),
    ]);
    const createdChecklistItem = db.findOne('checklistItems', {
      checklistId: html4ChecklistId, title: 'HTML4 created checklist item',
    });
    expect(createdChecklistItem && createdChecklistItem._id).toBeTruthy();
    html4ChecklistItemId = createdChecklistItem._id;
    await addChecklistItemForm().locator('input[name="checklistItemTitle"]')
      .fill('HTML4 second checklist item');
    await Promise.all([
      page.waitForNavigation(), addChecklistItemForm().locator('input[type="submit"]').click(),
    ]);
    const secondChecklistItem = db.findOne('checklistItems', {
      checklistId: html4ChecklistId, title: 'HTML4 second checklist item',
    });
    expect(secondChecklistItem && secondChecklistItem._id).toBeTruthy();
    const moveSecondItem = direction => page.locator(
      `form:has(input[name="legacyOperation"][value="move-checklist-item-${direction}"])`
      + `:has(input[name="itemId"][value="${secondChecklistItem._id}"])`,
    );
    await Promise.all([
      page.waitForNavigation(), moveSecondItem('up').locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('checklistItems', { _id: secondChecklistItem._id }).sort)
      .toBeLessThan(db.findOne('checklistItems', { _id: html4ChecklistItemId }).sort);
    await Promise.all([
      page.waitForNavigation(), moveSecondItem('down').locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('checklistItems', { _id: secondChecklistItem._id }).sort)
      .toBeGreaterThan(db.findOne('checklistItems', { _id: html4ChecklistItemId }).sort);

    const editChecklistItemForm = () => page.locator(
      'form:has(input[name="legacyOperation"][value="edit-checklist-item"])'
      + `:has(input[name="itemId"][value="${html4ChecklistItemId}"])`,
    );
    await editChecklistItemForm().locator('input[name="checklistItemTitle"]')
      .fill('HTML4 edited checklist item');
    await Promise.all([
      page.waitForNavigation(), editChecklistItemForm().locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('checklistItems', { _id: html4ChecklistItemId }).title)
      .toBe('HTML4 edited checklist item');
    const toggleChecklistItemForm = page.locator(
      'form:has(input[name="legacyOperation"][value="toggle-checklist-item"])'
      + `:has(input[name="itemId"][value="${html4ChecklistItemId}"])`,
    );
    await Promise.all([
      page.waitForNavigation(), toggleChecklistItemForm.locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('checklistItems', { _id: html4ChecklistItemId }).isFinished).toBe(true);
    await expect(page.locator('tbody')).toContainText('[x] HTML4 edited checklist item');

    const checklistExportForm = () => page.locator(
      'form:has(input[name="legacyOperation"][value="export-checklist"])'
      + `:has(input[name="checklistId"][value="${html4ChecklistId}"])`,
    );
    await checklistExportForm().locator('select[name="exportFormat"]').selectOption('json');
    const [checklistDownload] = await Promise.all([
      page.waitForEvent('download'),
      checklistExportForm().locator('input[type="submit"]').click(),
    ]);
    const checklistExportBytes = await fs.promises.readFile(await checklistDownload.path());
    const checklistExportDocument = JSON.parse(checklistExportBytes.toString('utf8'));
    expect(checklistExportDocument.checklists).toHaveLength(1);
    expect(checklistExportDocument.checklists[0]._id).toBe(html4ChecklistId);
    expect(checklistExportDocument.cards).toHaveLength(1);
    expect(checklistExportDocument.cards[0]._id).toBe(due._id);
    expect(checklistExportDocument.checklistItems.map(item => item.checklistId)
      .every(checklistId => checklistId === html4ChecklistId)).toBe(true);

    // A file download consumed its own purpose-bound signature, not the page's
    // action counter: this import form from the SAME response must still work.
    const checklistImportForm = () => page.locator(
      'form:has(input[name="legacyOperation"][value="import-checklist-file"])'
      + `:has(input[name="checklistId"][value="${html4ChecklistId}"])`,
    );
    await checklistImportForm().locator('input[name="importFile"]').setInputFiles({
      name: 'checklist.json', mimeType: 'application/json', buffer: checklistExportBytes,
    });
    await checklistImportForm().locator('input[name="boardId"]').evaluate(
      (input, boardId) => { input.value = boardId; }, outsiderBoard.boardId,
    );
    await Promise.all([
      page.waitForNavigation(), checklistImportForm().locator('input[type="submit"]').click(),
    ]);
    expect(db.countDocuments('checklists', {
      boardId: outsiderBoard.boardId, title: 'HTML4 edited checklist',
    })).toBe(0);
    await expect(page.locator('tbody')).toContainText('Operation failed');

    await checklistImportForm().locator('input[name="importFile"]').setInputFiles({
      name: 'checklist.json', mimeType: 'application/json', buffer: checklistExportBytes,
    });
    await Promise.all([
      page.waitForNavigation(), checklistImportForm().locator('input[type="submit"]').click(),
    ]);
    const importedChecklist = db.find('checklists', {
      boardId: board.boardId, cardId: due._id, title: 'HTML4 edited checklist',
    }).find(candidate => candidate._id !== html4ChecklistId);
    expect(importedChecklist && importedChecklist._id).toBeTruthy();
    expect(importedChecklist.sort)
      .toBeGreaterThan(db.findOne('checklists', { _id: html4ChecklistId }).sort);
    expect(db.find('checklistItems', { checklistId: importedChecklist._id })
      .map(item => item.title).sort()).toEqual([
      'HTML4 edited checklist item', 'HTML4 second checklist item',
    ].sort());
    db.deleteMany('checklistItems', { checklistId: importedChecklist._id });
    db.deleteOne('checklists', { _id: importedChecklist._id });

    const minicardSettingForm = page.locator(
      'form:has(input[name="legacyOperation"][value="toggle-checklist-setting"])'
      + `:has(input[name="checklistId"][value="${html4ChecklistId}"])`
      + ':has(input[name="checklistSetting"][value="showChecklistAtMinicard"])',
    );
    await Promise.all([
      page.waitForNavigation(), minicardSettingForm.locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('checklists', { _id: html4ChecklistId }).showChecklistAtMinicard)
      .toBe(true);

    const outsiderCard = db.findOne('cards', { boardId: outsiderBoard.boardId });
    const forgedMove = page.locator(
      'form:has(input[name="legacyOperation"][value="move-checklist-to-card"])'
      + `:has(input[name="checklistId"][value="${html4ChecklistId}"])`,
    );
    await forgedMove.locator('select[name="targetCardRef"]').evaluate((select, value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
      select.value = value;
    }, `${outsiderBoard.boardId}|${outsiderCard._id}`);
    await Promise.all([
      page.waitForNavigation(), forgedMove.locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('checklists', { _id: html4ChecklistId }).cardId).toBe(due._id);
    await expect(page.locator('tbody')).toContainText('Operation failed');

    const copyChecklist = page.locator(
      'form:has(input[name="legacyOperation"][value="copy-checklist-to-card"])'
      + `:has(input[name="checklistId"][value="${html4ChecklistId}"])`,
    );
    await copyChecklist.locator('select[name="targetCardRef"]')
      .selectOption(`${board.boardId}|${originalCard._id}`);
    await Promise.all([
      page.waitForNavigation(), copyChecklist.locator('input[type="submit"]').click(),
    ]);
    const copiedChecklist = db.findOne('checklists', {
      cardId: originalCard._id, title: 'HTML4 edited checklist',
    });
    expect(copiedChecklist && copiedChecklist._id).toBeTruthy();
    html4CopiedChecklistId = copiedChecklist._id;
    expect(db.find('checklistItems', { checklistId: html4CopiedChecklistId })
      .sort((left, right) => left.sort - right.sort)
      .map(item => [item.title, item.isFinished])).toEqual([
      ['HTML4 edited checklist item', true],
      ['HTML4 second checklist item', false],
    ]);

    const convertItem = page.locator(
      'form:has(input[name="legacyOperation"][value="convert-checklist-item-to-card"])'
      + `:has(input[name="itemId"][value="${html4ChecklistItemId}"])`,
    );
    await convertItem.locator('input[name="convertedCardTitle"]')
      .fill('FORGED CONVERTED CARD');
    await convertItem.locator('select[name="cardDestination"]').evaluate((select, value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
      select.value = value;
    }, `${outsiderBoard.boardId}|${outsiderBoard.swimlaneId}|`
      + `${outsiderBoard.listIds[0]}|${outsiderCard._id}`);
    await Promise.all([
      page.waitForNavigation(), convertItem.locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('cards', { title: 'FORGED CONVERTED CARD' })).toBeNull();
    await expect(page.locator('tbody')).toContainText('Operation failed');

    const validConvertItem = page.locator(
      'form:has(input[name="legacyOperation"][value="convert-checklist-item-to-card"])'
      + `:has(input[name="itemId"][value="${html4ChecklistItemId}"])`,
    );
    await validConvertItem.locator('input[name="convertedCardTitle"]')
      .fill('HTML4 converted checklist item');
    await validConvertItem.locator('select[name="cardDestination"]')
      .selectOption(`${board.boardId}|${originalCard.swimlaneId}|`
        + `${originalCard.listId}|${originalCard._id}`);
    await validConvertItem.locator('select[name="position"]').selectOption('above');
    await Promise.all([
      page.waitForNavigation(), validConvertItem.locator('input[type="submit"]').click(),
    ]);
    const convertedCard = db.findOne('cards', {
      title: 'HTML4 converted checklist item', boardId: board.boardId,
    });
    expect(convertedCard && convertedCard._id).toBeTruthy();
    html4ConvertedCardId = convertedCard._id;
    expect(convertedCard).toMatchObject({
      listId: originalCard.listId, swimlaneId: originalCard.swimlaneId,
    });
    expect(convertedCard.sort).toBeLessThan(originalCard.sort);
    expect(db.findOne('checklistItems', { _id: html4ChecklistItemId })).not.toBeNull();
    expect(db.findOne('users', { _id: user._id }).profile.moveAndCopyDialog[board.boardId])
      .toEqual({
        boardId: board.boardId,
        swimlaneId: originalCard.swimlaneId,
        listId: originalCard.listId,
        cardId: originalCard._id,
      });

    const addCommentForm = page.locator(
      'form:has(input[name="legacyOperation"][value="add-comment"])',
    );
    await addCommentForm.locator('textarea[name="commentText"]')
      .fill('HTML4 created comment');
    await Promise.all([
      page.waitForNavigation(), addCommentForm.locator('input[type="submit"]').click(),
    ]);
    const createdComment = db.findOne('card_comments', {
      cardId: due._id, userId: user._id, text: 'HTML4 created comment',
    });
    expect(createdComment && createdComment._id).toBeTruthy();
    html4CreatedCommentId = createdComment._id;
    await expect.poll(() => db.countDocuments('activities', {
      activityType: 'addComment', commentId: html4CreatedCommentId, userId: user._id,
    })).toBeGreaterThan(0);
    const editCommentForm = () => page.locator(
      `form:has(input[name="legacyOperation"][value="edit-comment"])`
      + `:has(input[name="commentId"][value="${html4CreatedCommentId}"])`,
    );
    await editCommentForm().locator('textarea[name="commentText"]').fill('FORGED COMMENT EDIT');
    await editCommentForm().locator('input[name="commentId"]').evaluate(
      (input, commentId) => { input.value = commentId; }, childIds.foreignComment,
    );
    const forgedEditSubmit = page.locator(
      `form:has(input[name="legacyOperation"][value="edit-comment"])`
      + `:has(input[name="commentId"][value="${childIds.foreignComment}"]) input[type="submit"]`,
    );
    await Promise.all([
      page.waitForNavigation(), forgedEditSubmit.click(),
    ]);
    expect(db.findOne('card_comments', { _id: childIds.foreignComment }).text)
      .toBe('FOREIGN COMMENT MUST NOT LEAK');
    expect(db.findOne('card_comments', { _id: html4CreatedCommentId }).text)
      .toBe('HTML4 created comment');
    await expect(page.locator('tbody')).toContainText('Operation failed');
    await editCommentForm().locator('textarea[name="commentText"]')
      .fill('HTML4 edited comment');
    await Promise.all([
      page.waitForNavigation(), editCommentForm().locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('card_comments', { _id: html4CreatedCommentId }).text)
      .toBe('HTML4 edited comment');
    await expect.poll(() => db.countDocuments('activities', {
      activityType: 'editComment', commentId: html4CreatedCommentId, userId: user._id,
    })).toBeGreaterThan(0);
    const startReplyForm = page.locator(
      `form:has(input[name="legacyOperation"][value="start-comment-reply"])`
      + `:has(input[name="commentId"][value="${html4CreatedCommentId}"])`,
    );
    await Promise.all([
      page.waitForNavigation(), startReplyForm.locator('input[type="submit"]').click(),
    ]);
    const replyForm = page.locator(
      `form:has(input[name="legacyOperation"][value="add-comment"])`
      + `:has(input[name="parentId"][value="${html4CreatedCommentId}"])`,
    );
    await expect(replyForm.locator('label')).toContainText('In reply to: HTML4 edited comment');
    await replyForm.locator('textarea[name="commentText"]').fill('HTML4 reply comment');
    await Promise.all([
      page.waitForNavigation(), replyForm.locator('input[type="submit"]').click(),
    ]);
    const replyComment = db.findOne('card_comments', {
      cardId: due._id, parentId: html4CreatedCommentId, text: 'HTML4 reply comment',
    });
    expect(replyComment && replyComment._id).toBeTruthy();
    html4ReplyCommentId = replyComment._id;
    await expect(page.locator('tbody')).toContainText(
      'In reply to: HTML4 edited comment - HTML4 reply comment',
    );

    const reactionForm = () => page.locator(
      `form:has(input[name="legacyOperation"][value="toggle-comment-reaction"])`
      + `:has(input[name="commentId"][value="${html4CreatedCommentId}"])`
      + ':has(select[name="reactionCodepoint"])',
    );
    // Unknown entities and active markup are not accepted merely because a
    // client adds them to the select control.
    await reactionForm().locator('select[name="reactionCodepoint"]').evaluate(select => {
      const option = document.createElement('option');
      option.value = '<img src=x onerror=alert(1)>';
      option.text = 'forged';
      select.add(option);
      select.value = option.value;
    });
    await Promise.all([
      page.waitForNavigation(), reactionForm().locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('card_comment_reactions', { cardCommentId: html4CreatedCommentId }))
      .toBeNull();
    await expect(page.locator('tbody')).toContainText('Operation failed');

    // A submitted userId is ignored. The server derives the actor from the
    // one-use signed HTML4 session and records only that actor's reaction.
    await reactionForm().evaluate((form, outsiderId) => {
      const forged = document.createElement('input');
      forged.type = 'hidden';
      forged.name = 'userId';
      forged.value = outsiderId;
      form.append(forged);
    }, outsider.id);
    await reactionForm().locator('select[name="reactionCodepoint"]')
      .selectOption('&#128522;');
    await Promise.all([
      page.waitForNavigation(), reactionForm().locator('input[type="submit"]').click(),
    ]);
    const reactionDoc = db.findOne('card_comment_reactions', {
      cardCommentId: html4CreatedCommentId,
    });
    expect(reactionDoc.reactions).toEqual([
      { reactionCodepoint: '&#128522;', userIds: [user._id] },
    ]);
    await expect(page.locator('tbody')).toContainText('[x] smile (1)');
    await expect(page.locator('tbody')).toContainText(username);

    // A valid reaction cannot be redirected to a comment whose denormalized
    // card/board boundary differs from the visible card.
    await reactionForm().locator('input[name="commentId"]').evaluate(
      (input, commentId) => { input.value = commentId; }, childIds.foreignComment,
    );
    await Promise.all([
      page.waitForNavigation(), page.locator(
        `form:has(input[name="legacyOperation"][value="toggle-comment-reaction"])`
        + `:has(input[name="commentId"][value="${childIds.foreignComment}"]) input[type="submit"]`,
      ).click(),
    ]);
    expect(db.findOne('card_comment_reactions', { cardCommentId: childIds.foreignComment }))
      .toBeNull();
    expect(db.findOne('card_comment_reactions', { cardCommentId: html4CreatedCommentId })
      .reactions[0].userIds).toEqual([user._id]);
    await expect(page.locator('tbody')).toContainText('Operation failed');

    const titleForm = () => page.locator(
      'form:has(input[name="legacyOperation"][value="edit-card-title"])',
    );
    await titleForm().locator('input[name="cardTitle"]').fill('FORGED CARD EDIT');
    await titleForm().locator('input[name="boardId"]').evaluate(
      (input, boardId) => { input.value = boardId; }, outsiderBoard.boardId,
    );
    await Promise.all([page.waitForNavigation(), titleForm().locator('input[type="submit"]').click()]);
    expect(db.findOne('cards', { _id: due._id }).title).toBe('HTML4 Due');
    await expect(page.locator('tbody')).toContainText('Operation failed');
    await expect.poll(() => db.countDocuments('eventlog', {
      stream: 'security', userId: user._id,
      source: 'canary:board.write-without-capability',
    })).toBeGreaterThan(0);
    const refusalEvent = db.findOne('eventlog', {
      stream: 'security', userId: user._id,
      source: 'canary:board.write-without-capability',
    });
    expect(refusalEvent.username).toBe(username);
    expect(refusalEvent.ip).toBeTruthy();

    await titleForm().locator('input[name="cardTitle"]').fill('HTML4 Due Edited');
    await Promise.all([page.waitForNavigation(), titleForm().locator('input[type="submit"]').click()]);
    await expect(page.locator('h1')).toHaveText('HTML4 Due Edited');
    const descriptionForm = page.locator(
      'form:has(input[name="legacyOperation"][value="edit-card-description"])',
    );
    await descriptionForm.locator('textarea[name="cardDescription"]')
      .fill('Edited HTML4 card description');
    await Promise.all([
      page.waitForNavigation(), descriptionForm.locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('cards', { _id: due._id }).description)
      .toBe('Edited HTML4 card description');
    const labelForm = () => page.locator(
      `form:has(input[name="legacyOperation"][value="toggle-card-label"])`
      + `:has(input[name="labelId"][value="${labelId}"])`,
    );
    await Promise.all([
      page.waitForNavigation(), labelForm().locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('cards', { _id: due._id }).labelIds).toContain(labelId);
    await labelForm().locator('input[name="labelId"]').evaluate(
      (input, id) => { input.value = id; }, foreignLabelId,
    );
    await Promise.all([
      page.waitForNavigation(), page.locator(
        `form:has(input[name="legacyOperation"][value="toggle-card-label"])`
        + `:has(input[name="labelId"][value="${foreignLabelId}"]) input[type="submit"]`,
      ).click(),
    ]);
    expect(db.findOne('cards', { _id: due._id }).labelIds).toEqual([labelId]);
    await expect(page.locator('tbody')).toContainText('Operation failed');
    const personForm = (field, targetUserId) => page.locator(
      `form:has(input[name="legacyOperation"][value="toggle-card-person"])`
      + `:has(input[name="cardPersonField"][value="${field}"])`
      + `:has(input[name="targetUserId"][value="${targetUserId}"])`,
    );
    const membersBefore = db.findOne('cards', { _id: due._id }).members || [];
    await Promise.all([
      page.waitForNavigation(), personForm('members', outsider.id)
        .locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('cards', { _id: due._id }).members)
      .toEqual([...membersBefore, outsider.id]);
    await Promise.all([
      page.waitForNavigation(), personForm('members', outsider.id)
        .locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('cards', { _id: due._id }).members).toEqual(membersBefore);
    const assigneesBefore = db.findOne('cards', { _id: due._id }).assignees || [];
    await personForm('assignees', user._id).locator('input[name="targetUserId"]')
      .evaluate((input, id) => { input.value = id; }, nonMemberId);
    await Promise.all([
      page.waitForNavigation(), page.locator(
        `form:has(input[name="legacyOperation"][value="toggle-card-person"])`
        + `:has(input[name="targetUserId"][value="${nonMemberId}"]) input[type="submit"]`,
      ).click(),
    ]);
    expect(db.findOne('cards', { _id: due._id }).assignees).toEqual(assigneesBefore);
    await expect(page.locator('tbody')).toContainText('Operation failed');
    await Promise.all([
      page.waitForNavigation(), personForm('assignees', outsider.id)
        .locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('cards', { _id: due._id }).assignees)
      .toEqual([...assigneesBefore, outsider.id]);
    await Promise.all([
      page.waitForNavigation(), personForm('assignees', outsider.id)
        .locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('cards', { _id: due._id }).assignees).toEqual(assigneesBefore);
    const identityTextForm = field => page.locator(
      'form:has(input[name="legacyOperation"][value="edit-card-identity-text"])'
      + `:has(input[name="cardIdentityTextField"][value="${field}"])`,
    );
    await identityTextForm('requestedBy').locator('input[name="cardIdentityText"]')
      .fill('External Requester');
    await Promise.all([
      page.waitForNavigation(), identityTextForm('requestedBy')
        .locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('cards', { _id: due._id }).requestedBy).toBe('External Requester');
    await identityTextForm('assignedBy').locator('input[name="cardIdentityText"]')
      .fill('External Assigner');
    await Promise.all([
      page.waitForNavigation(), identityTextForm('assignedBy')
        .locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('cards', { _id: due._id }).assignedBy).toBe('External Assigner');
    const identityForm = (field, targetUserId) => page.locator(
      'form:has(input[name="legacyOperation"][value="toggle-card-identity"])'
      + `:has(input[name="cardIdentityField"][value="${field}"])`
      + `:has(input[name="targetUserId"][value="${targetUserId}"])`,
    );
    await Promise.all([
      page.waitForNavigation(), identityForm('requesters', outsider.id)
        .locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('cards', { _id: due._id }).requesters).toEqual([outsider.id]);
    await identityForm('assigners', user._id).locator('input[name="targetUserId"]')
      .evaluate((input, id) => { input.value = id; }, nonMemberId);
    await Promise.all([
      page.waitForNavigation(), page.locator(
        'form:has(input[name="legacyOperation"][value="toggle-card-identity"])'
        + `:has(input[name="targetUserId"][value="${nonMemberId}"]) input[type="submit"]`,
      ).click(),
    ]);
    expect(db.findOne('cards', { _id: due._id }).assigners || []).toEqual([]);
    await expect(page.locator('tbody')).toContainText('Operation failed');
    const colorForm = () => page.locator(
      'form:has(input[name="legacyOperation"][value="edit-card-color"])',
    );
    await colorForm().locator('input[name="cardColor"]').fill('#123abc');
    await Promise.all([
      page.waitForNavigation(), colorForm().locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('cards', { _id: due._id }).color).toBe('#123abc');
    await colorForm().locator('input[name="cardColor"]').fill('url(javascript:alert(1))');
    await Promise.all([
      page.waitForNavigation(), colorForm().locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('cards', { _id: due._id }).color).toBe('#123abc');
    await expect(page.locator('tbody')).toContainText('Operation failed');
    await colorForm().locator('input[name="cardColor"]').fill('white');
    await Promise.all([
      page.waitForNavigation(), colorForm().locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('cards', { _id: due._id }).color).toBeNull();
    await colorForm().locator('input[name="cardColor"]').fill('blue');
    await Promise.all([
      page.waitForNavigation(), colorForm().locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('cards', { _id: due._id }).color).toBe('blue');
    const dueDateForm = () => page.locator(
      'form:has(input[name="legacyOperation"][value="edit-card-date"])'
      + ':has(input[name="cardDateField"][value="dueAt"])',
    );
    await dueDateForm().locator('input[name="cardDateValue"]')
      .fill('2027-01-02T03:04:05Z');
    await Promise.all([
      page.waitForNavigation(), dueDateForm().locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('cards', { _id: due._id }).dueAt)
      .toBe('2027-01-02T03:04:05.000Z');
    await dueDateForm().locator('input[name="cardDateValue"]').fill('not-a-date');
    await Promise.all([
      page.waitForNavigation(), dueDateForm().locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('cards', { _id: due._id }).dueAt)
      .toBe('2027-01-02T03:04:05.000Z');
    await expect(page.locator('tbody')).toContainText('Operation failed');
    await dueDateForm().locator('input[name="cardDateValue"]').fill('');
    await Promise.all([
      page.waitForNavigation(), dueDateForm().locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('cards', { _id: due._id }).dueAt).toBeUndefined();
    await dueDateForm().locator('input[name="cardDateValue"]')
      .fill('2027-01-02T03:04:05Z');
    await Promise.all([
      page.waitForNavigation(), dueDateForm().locator('input[type="submit"]').click(),
    ]);
    const listForm = () => page.locator(
      'form:has(input[name="legacyOperation"][value="move-card-to-list"])',
    );
    await listForm().locator('select[name="cardListId"]').evaluate(
      (select, listId) => {
        const option = document.createElement('option');
        option.value = listId;
        option.text = 'Forged foreign list';
        select.add(option);
        select.value = listId;
      }, outsiderBoard.listIds[0],
    );
    await Promise.all([page.waitForNavigation(), listForm().locator('input[type="submit"]').click()]);
    expect(db.findOne('cards', { _id: due._id }).listId).toBe(board.listIds[1]);
    await expect(page.locator('tbody')).toContainText('Operation failed');

    await listForm().locator('select[name="cardListId"]').selectOption(board.listIds[2]);
    await Promise.all([page.waitForNavigation(), listForm().locator('input[type="submit"]').click()]);
    expect(db.findOne('cards', { _id: due._id }).listId).toBe(board.listIds[2]);
    await expect(page.locator('caption')).toContainText('List C');
    await listForm().locator('select[name="cardListId"]').selectOption(board.listIds[1]);
    await Promise.all([page.waitForNavigation(), listForm().locator('input[type="submit"]').click()]);
    expect(db.findOne('cards', { _id: due._id }).listId).toBe(board.listIds[1]);
    await expect(page.locator('caption')).toContainText('List B');
    const archiveForm = operation => page.locator(
      `form:has(input[name="legacyOperation"][value="${operation}"])`,
    );
    await Promise.all([
      page.waitForNavigation(), archiveForm('archive-card').locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('cards', { _id: due._id }).archived).toBe(true);
    await expect(page.locator('tbody')).toContainText('This card is moved to Archive.');
    await Promise.all([
      page.waitForNavigation(), archiveForm('restore-card').locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('cards', { _id: due._id }).archived).toBe(false);

    // The same cookieless card page exposes purpose-bound POST controls for
    // attachment previews and originals. No session secret is copied into an
    // image or download URL, and one binary response does not rotate the other
    // controls on the page.
    await open('/allboards');
    db.updateOne('users', { _id: user._id }, { $set: { isAdmin: true } });
    db.updateOne('settings', { _id: settingsId }, { $set: { enablePermanentDelete: true } });
    await page.waitForTimeout(500);
    await open('/allboards/archive');
    const permanentDeleteForm = operation => boardOperationForm(
      operation, permanentDeleteBoard.boardId,
    );
    await expect(permanentDeleteForm('confirm-permanently-delete-board')).toHaveCount(1);
    await Promise.all([
      page.waitForNavigation(),
      permanentDeleteForm('confirm-permanently-delete-board').locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('boards', { _id: permanentDeleteBoard.boardId })).not.toBeNull();
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await page.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-allboards-permanent-delete.png`,
        fullPage: true,
      });
    }
    await Promise.all([
      page.waitForNavigation(),
      permanentDeleteForm('permanently-delete-board').locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('boards', { _id: permanentDeleteBoard.boardId })).toBeNull();
    await expect.poll(() => db.findOne('recoveryEvents', {
      type: 'board-permanently-deleted', userId: user._id,
      boardIds: permanentDeleteBoard.boardId, done: true,
    })?.username).toBe(username);
    db.updateOne('users', { _id: user._id }, { $set: { isAdmin: false } });
    permanentDeleteBoard = null;
    await open('/allboards/remaining');
    const attachmentBoard = db.findOne('boards', { _id: importedWekanZipBoardId });
    await open(`/b/${attachmentBoard._id}/${attachmentBoard.slug}`);
    const importedZipImage = db.findOne('attachments', { _id: importedWekanZipImageAttachmentId });
    await open(`/b/${attachmentBoard._id}/${attachmentBoard.slug}/${importedZipImage.meta.cardId}`);
    await expect(page.locator('tbody')).toContainText('zip-pixel.png');
    await expect(page.locator('tbody')).toContainText('zip-note.txt');
    await expect(page.locator('tbody')).toContainText('delete-me.txt');

    const renameAttachmentForm = attachmentId => page.locator(
      'form:has(input[name="legacyOperation"][value="rename-attachment"])'
      + `:has(input[name="attachmentId"][value="${attachmentId}"])`,
    );
    await renameAttachmentForm(importedWekanZipAttachmentId)
      .locator('input[name="attachmentName"]').fill('Legacy renamed note.txt');
    await Promise.all([
      page.waitForNavigation(),
      renameAttachmentForm(importedWekanZipAttachmentId).locator('input[type="submit"]').click(),
    ]);
    await expect.poll(() => db.findOne('attachments', { _id: importedWekanZipAttachmentId })?.name)
      .toBe('Legacy renamed note.txt');
    await expect(page.locator('tbody')).toContainText('Legacy renamed note.txt');

    const coverForm = page.locator(
      'form:has(input[name="legacyOperation"][value="set-attachment-cover"])'
      + `:has(input[name="attachmentId"][value="${importedWekanZipImageAttachmentId}"])`,
    );
    await expect(coverForm.locator('input[name="coverState"]')).toHaveValue('on');
    await Promise.all([page.waitForNavigation(), coverForm.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('cards', { _id: importedZipImage.meta.cardId })?.coverId)
      .toBe(importedWekanZipImageAttachmentId);
    await expect(page.locator(
      'form:has(input[name="legacyOperation"][value="set-attachment-cover"])'
      + `:has(input[name="attachmentId"][value="${importedWekanZipImageAttachmentId}"])`
      + ' input[name="coverState"]',
    )).toHaveValue('off');

    const requestDelete = page.locator(
      'form:has(input[name="legacyOperation"][value="confirm-delete-attachment"])'
      + `:has(input[name="attachmentId"][value="${disposableAttachmentId}"])`,
    );
    await Promise.all([
      page.waitForNavigation(), requestDelete.locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('attachments', { _id: disposableAttachmentId })).toBeTruthy();
    const confirmDelete = page.locator(
      'form:has(input[name="legacyOperation"][value="delete-attachment"])'
      + `:has(input[name="attachmentId"][value="${disposableAttachmentId}"])`,
    );
    await Promise.all([
      page.waitForNavigation(), confirmDelete.locator('input[type="submit"]').click(),
    ]);
    await expect.poll(() => db.findOne('attachments', { _id: disposableAttachmentId })).toBeNull();
    await expect(page.locator('tbody')).not.toContainText('delete-me.txt');
    const imagePreviewForm = page.locator(
      'form:has(input[name="legacyOperation"][value="preview-attachment-gif"])'
      + `:has(input[name="attachmentId"][value="${importedWekanZipImageAttachmentId}"])`,
    );
    const [previewPage] = await Promise.all([
      context.waitForEvent('page'), imagePreviewForm.locator('input[type="submit"]').click(),
    ]);
    await previewPage.waitForLoadState();
    expect(await previewPage.evaluate(() => document.contentType)).toBe('image/gif');
    await expect(previewPage.locator('img')).toHaveCount(1);
    await previewPage.close();
    expect(db.findOne('attachments', { _id: importedWekanZipImageAttachmentId })
      .versions.legacyHtml4Gif).toBeTruthy();

    const forgedOriginalForm = page.locator(
      'form:has(input[name="legacyOperation"][value="download-attachment-original"])'
      + `:has(input[name="attachmentId"][value="${importedWekanZipImageAttachmentId}"])`,
    );
    await forgedOriginalForm.locator('input[name="boardId"]').evaluate(
      (input, boardId) => { input.value = boardId; }, outsiderBoard.boardId,
    );
    const [deniedPage] = await Promise.all([
      context.waitForEvent('page'), forgedOriginalForm.locator('input[type="submit"]').click(),
    ]);
    await deniedPage.waitForLoadState();
    await expect(deniedPage.locator('body')).toContainText('Attachment response denied');
    await deniedPage.close();
    await expect.poll(() => db.countDocuments('eventlog', {
      stream: 'security', userId: user._id,
      source: 'canary:authz.legacy-html4-attachment',
    })).toBeGreaterThan(0);

    const noteDownloadForm = page.locator(
      'form:has(input[name="legacyOperation"][value="download-attachment-original"])'
      + `:has(input[name="attachmentId"][value="${importedWekanZipAttachmentId}"])`,
    );
    const [attachmentDownload] = await Promise.all([
      page.waitForEvent('download'), noteDownloadForm.locator('input[type="submit"]').click(),
    ]);
    expect(attachmentDownload.suggestedFilename()).toBe('Legacy renamed note.txt');
    expect(await fs.promises.readFile(await attachmentDownload.path(), 'utf8'))
      .toBe('HTML4 ZIP attachment\n');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await page.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-card-attachments.png`, fullPage: true,
      });
    }

    // A route/attachment mismatch is refused by the same mutation boundary and
    // attributed in Admin Panel / Problems / Security without changing data.
    await renameAttachmentForm(importedWekanZipImageAttachmentId)
      .locator('input[name="attachmentName"]').fill('forged.png');
    await renameAttachmentForm(importedWekanZipImageAttachmentId)
      .locator('input[name="boardId"]').evaluate(
        (input, boardId) => { input.value = boardId; }, outsiderBoard.boardId,
      );
    await Promise.all([
      page.waitForNavigation(),
      renameAttachmentForm(importedWekanZipImageAttachmentId).locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('attachments', { _id: importedWekanZipImageAttachmentId }).name)
      .toBe('zip-pixel.png');
    await expect(page.locator('tbody')).toContainText('Operation failed');
    await expect.poll(() => db.countDocuments('eventlog', {
      stream: 'security', userId: user._id, bleed: 'AttachmentBleed', action: 'detected',
    })).toBeGreaterThan(0);

    await open('/allboards');
    await open('/allboards/remaining');
    await Promise.all([
      page.waitForNavigation(),
      boardOperationForm('confirm-copy-board', board.boardId).locator('input[type="submit"]').click(),
    ]);
    const boardCountBeforeForgedCopy = db.countDocuments('boards', {});
    const forgedBoardForm = boardOperationForm('copy-board', board.boardId);
    await forgedBoardForm.locator('input[name="boardId"]').evaluate(
      (input, boardId) => { input.value = boardId; }, outsiderBoard.boardId,
    );
    const submittedForgedBoardForm = boardOperationForm('copy-board', outsiderBoard.boardId);
    await Promise.all([
      page.waitForNavigation(), submittedForgedBoardForm.locator('input[type="submit"]').click(),
    ]);
    expect(db.countDocuments('boards', {})).toBe(boardCountBeforeForgedCopy);
    await expect(page.locator('tbody')).toContainText('Operation failed');
    await expect.poll(() => db.countDocuments('eventlog', {
      stream: 'security', userId: user._id, bleed: 'BoardBleed', action: 'detected',
    })).toBeGreaterThan(0);
    await open('/my-cards');
    await open(`/b/${board.boardId}/${board.slug}/${due._id}`);

    // The forged cross-board import is a high-severity attributed refusal, so
    // the common Security reporter disables that account. Verify both effects,
    // then emulate the administrator unblocking this synthetic test account so
    // the same fixture can compare the HTML5 representation.
    await expect.poll(() => db.countDocuments('eventlog', {
      stream: 'security', userId: user._id, bleed: 'ImportBleed', action: 'blocked',
    })).toBeGreaterThan(0);
    await expect.poll(() => db.findOne('users', { _id: user._id })?.loginDisabled)
      .toBe(true);
    db.updateOne('users', { _id: user._id }, {
      $set: { loginDisabled: false, isAdmin: true },
      $unset: { 'services.securityBlock': '' },
    });

    const modernContext = await browser.newContext();
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await modern.goto(`${baseURL}/b/${attachmentBoard._id}/${attachmentBoard.slug}/${importedZipImage.meta.cardId}`);
    await expect(modern.locator('.attachment-gallery')).toContainText('zip-pixel.png');
    await expect(modern.locator('.attachment-gallery')).toContainText('Legacy renamed note.txt');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.locator('.attachment-gallery').screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-card-attachments.png`,
      });
    }
    await modern.goto(`${baseURL}/allboards/templates`);
    await expect(modern.getByRole('heading', { name: 'Templates' })).toBeVisible();
    await expect(modern.locator('body')).toContainText('HTML4 Template Container');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-allboards-templates.png`, fullPage: true,
      });
    }
    await modern.goto(`${baseURL}/allboards/archive`);
    await modern.locator('.js-all-boards-sidebar-multiselection').click();
    await modern.locator('.js-board-select-all').click();
    await expect(modern.locator('.js-delete-selected-boards')).toBeVisible();
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-allboards-permanent-delete.png`,
        fullPage: true,
      });
    }
    await modern.locator('.js-multiselection-reset').first().click();
    await modern.goto(`${baseURL}/allboards/remaining`);
    await expect(modern.locator('body')).toContainText(`HTML4 Created Board ${suffix}`);
    await expect(modern.locator('body')).toContainText(html4CopiedBoard.title);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-allboards-create-copy.png`,
        fullPage: true,
      });
    }
    await modern.evaluate(async ({ boardId, workspaceId }) => {
      await Meteor.callAsync('setWorkspacesTree', [
        { id: workspaceId, name: 'HTML4 Space', children: [] },
      ]);
      await Meteor.callAsync('assignBoardToWorkspace', boardId, workspaceId);
    }, { boardId: html4CreatedBoardId, workspaceId: 'html4-space' });
    await expect(modern.locator('body')).toContainText('HTML4 Space');
    await modern.goto(`${baseURL}/allboards/workspaces/html4-space`);
    await expect(modern.locator('.admin-pane-title')).toContainText('HTML4 Space');
    await expect(modern.locator('body')).toContainText(`HTML4 Created Board ${suffix}`);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-allboards-workspace-assignment.png`,
        fullPage: true,
      });
    }
    await modern.evaluate(async boardId => {
      await Meteor.callAsync('unassignBoardFromWorkspace', boardId);
    }, html4CreatedBoardId);
    await modern.goto(`${baseURL}/import/trello`);
    await expect(modern.getByRole('heading', { name: 'Import from:' })).toBeVisible();
    await expect(modern.locator('body')).toContainText('Trello');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-import-trello.png`, fullPage: true,
      });
    }
    await modern.goto(`${baseURL}/import/wekan`);
    await expect(modern.getByRole('heading', { name: 'Import from:' })).toBeVisible();
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-import-wekan.png`, fullPage: true,
      });
    }
    await modern.goto(`${baseURL}/b/${board.boardId}/${board.slug}/${due._id}`);
    await expect(modern.locator('.card-details-title')).toContainText('HTML4 Due Edited');
    await expect(modern.locator('.card-details')).toContainText('Edited HTML4 card description');
    await expect(modern.locator('.card-details')).toContainText('HTML4 edited comment');
    await expect(modern.locator('.card-details')).toContainText('HTML4 reply comment');
    await expect(modern.locator('.card-details')).toContainText('HTML4 edited checklist');
    await expect(modern.locator('.card-details')).toContainText('HTML4 edited checklist item');
    await expect(modern.locator('.comment').filter({ hasText: 'HTML4 edited comment' })
      .locator('.reaction-count')).toHaveText('1');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await page.locator(
        `form:has(input[name="legacyOperation"][value="toggle-comment-reaction"])`
        + `:has(input[name="commentId"][value="${html4CreatedCommentId}"])`
        + `:has(input[name="reactionCodepoint"][value="&#128522;"])`,
      ).screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-comment-reaction.png`,
      });
      await page.locator(
        'form:has(input[name="legacyOperation"][value="toggle-checklist-item"])'
        + `:has(input[name="itemId"][value="${html4ChecklistItemId}"])`,
      ).screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-checklist-controls.png`,
      });
      await page.locator(
        'form:has(input[name="legacyOperation"][value="convert-checklist-item-to-card"])'
        + `:has(input[name="itemId"][value="${html4ChecklistItemId}"])`,
      ).screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-checklist-item-to-card.png`,
      });
      await page.locator(
        'form:has(input[name="legacyOperation"][value="export-checklist"])'
        + `:has(input[name="checklistId"][value="${html4ChecklistId}"])`,
      ).screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-checklist-export.png`,
      });
      await page.locator(
        'form:has(input[name="legacyOperation"][value="import-checklist-file"])'
        + `:has(input[name="checklistId"][value="${html4ChecklistId}"])`,
      ).screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-checklist-import.png`,
      });
      await modern.locator('.comment:has(.reaction-count)').screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-comment-reaction.png`,
      });
      await modern.locator('.js-checklist').filter({ hasText: 'HTML4 edited checklist' })
        .screenshot({
          path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-checklist-controls.png`,
        });
      const modernChecklistForConversion = modern.locator('.js-checklist')
        .filter({ hasText: 'HTML4 edited checklist' });
      await modernChecklistForConversion.locator('.js-open-checklist-details-menu').click();
      await modern.locator('.pop-over:visible .js-export-checklist').click();
      await modern.locator('.pop-over:visible').screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-checklist-export.png`,
      });
      await modern.goto(`${baseURL}/b/${board.boardId}/${board.slug}/${due._id}`);
      await modernChecklistForConversion.locator('.js-open-checklist-details-menu').click();
      await modern.locator('.pop-over:visible .js-import-checklist').click();
      await modern.locator('.pop-over:visible').screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-checklist-import.png`,
      });
      await modern.locator('.pop-over:visible input.js-import-file').setInputFiles({
        name: 'checklist.json', mimeType: 'application/json', buffer: checklistExportBytes,
      });
      await expect.poll(() => db.countDocuments('checklists', {
        boardId: board.boardId, cardId: due._id, title: 'HTML4 edited checklist',
      })).toBe(2);
      const modernImportedChecklist = db.find('checklists', {
        boardId: board.boardId, cardId: due._id, title: 'HTML4 edited checklist',
      }).find(candidate => candidate._id !== html4ChecklistId);
      expect(modernImportedChecklist && modernImportedChecklist._id).toBeTruthy();
      db.deleteMany('checklistItems', { checklistId: modernImportedChecklist._id });
      db.deleteOne('checklists', { _id: modernImportedChecklist._id });
      await modern.goto(`${baseURL}/b/${board.boardId}/${board.slug}/${due._id}`);
      const modernChecklistItem = modernChecklistForConversion
        .locator('.checklist-item').filter({ hasText: 'HTML4 edited checklist item' });
      await modernChecklistItem.locator('.item-title').click();
      await modernChecklistForConversion.locator('.js-convert-checklist-item-to-card').click();
      await modern.locator('.pop-over:visible').screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-checklist-item-to-card.png`,
      });
      await page.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-card-details.png`, fullPage: true,
      });
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-card-details.png`, fullPage: true,
      });
    }
    const confirmAndDeleteComment = async commentId => {
      const requestDeleteCommentForm = page.locator(
        `form:has(input[name="legacyOperation"][value="confirm-delete-comment"])`
        + `:has(input[name="commentId"][value="${commentId}"])`,
      );
      await Promise.all([
        page.waitForNavigation(), requestDeleteCommentForm.locator('input[type="submit"]').click(),
      ]);
      expect(db.findOne('card_comments', { _id: commentId })).not.toBeNull();
      const deleteCommentForm = page.locator(
        `form:has(input[name="legacyOperation"][value="delete-comment"])`
        + `:has(input[name="commentId"][value="${commentId}"])`,
      );
      await Promise.all([
        page.waitForNavigation(), deleteCommentForm.locator('input[type="submit"]').click(),
      ]);
      expect(db.findOne('card_comments', { _id: commentId })).toBeNull();
    };
    const requestItemDelete = page.locator(
      'form:has(input[name="legacyOperation"][value="confirm-delete-checklist-item"])'
      + `:has(input[name="itemId"][value="${html4ChecklistItemId}"])`,
    );
    await Promise.all([
      page.waitForNavigation(), requestItemDelete.locator('input[type="submit"]').click(),
    ]);
    const deleteItem = page.locator(
      'form:has(input[name="legacyOperation"][value="delete-checklist-item"])'
      + `:has(input[name="itemId"][value="${html4ChecklistItemId}"])`,
    );
    await Promise.all([
      page.waitForNavigation(), deleteItem.locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('checklistItems', { _id: html4ChecklistItemId })).toBeNull();
    html4ChecklistItemId = null;
    const requestChecklistDelete = page.locator(
      'form:has(input[name="legacyOperation"][value="confirm-delete-checklist"])'
      + `:has(input[name="checklistId"][value="${html4ChecklistId}"])`,
    );
    await Promise.all([
      page.waitForNavigation(), requestChecklistDelete.locator('input[type="submit"]').click(),
    ]);
    const deleteChecklist = page.locator(
      'form:has(input[name="legacyOperation"][value="delete-checklist"])'
      + `:has(input[name="checklistId"][value="${html4ChecklistId}"])`,
    );
    await Promise.all([
      page.waitForNavigation(), deleteChecklist.locator('input[type="submit"]').click(),
    ]);
    expect(db.findOne('checklists', { _id: html4ChecklistId })).toBeNull();
    expect(db.countDocuments('checklistItems', { checklistId: html4ChecklistId })).toBe(0);
    html4ChecklistId = null;
    await confirmAndDeleteComment(html4ReplyCommentId);
    html4ReplyCommentId = null;
    await confirmAndDeleteComment(html4CreatedCommentId);
    html4CreatedCommentId = null;
    if (importedWekanZipAttachmentId) {
      await modern.evaluate(async attachmentId => {
        await Meteor.callAsync('api.attachment.delete', attachmentId);
      }, importedWekanZipAttachmentId);
      importedWekanZipAttachmentId = null;
    }
    await modern.goto(`${baseURL}/b/${board.boardId}/${board.slug}`);
    await expect(modern.locator('body')).toContainText('HTML4 Button Created');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-board-card-actions.png`, fullPage: true,
      });
    }
    await modernContext.close();

    await open('/due-cards');
    await expect(page.locator('h1')).toHaveText('Due Cards');
    await expect(page.locator('tbody')).toContainText('HTML4 Due Edited');
    await expect(page.locator('tbody')).not.toContainText('HTML4 Searchable');

    await open('/bookmarks');
    await expect(page.locator('tbody')).toContainText('Saved shortcuts');

    await open('/global-search');
    await page.locator('input[name="q"]').fill('Searchable');
    await Promise.all([page.waitForNavigation(), page.locator('#legacy-search-query').press('Enter')]);
    await expect(page.locator('tbody')).toContainText('HTML4 Searchable');
    await expect(page.locator('tbody')).not.toContainText('HTML4 Due Edited');
    await expect(page.locator('tbody')).not.toContainText('HTML4 Searchable Secret');
  } finally {
    if (html4ConvertedCardId) {
      db.deleteMany('activities', { cardId: html4ConvertedCardId });
      db.deleteOne('cards', { _id: html4ConvertedCardId });
    }
    if (html4CopiedChecklistId) {
      db.deleteMany('checklistItems', { checklistId: html4CopiedChecklistId });
      db.deleteOne('checklists', { _id: html4CopiedChecklistId });
    }
    if (html4ChecklistItemId) db.deleteOne('checklistItems', { _id: html4ChecklistItemId });
    if (html4ChecklistId) {
      db.deleteMany('checklistItems', { checklistId: html4ChecklistId });
      db.deleteOne('checklists', { _id: html4ChecklistId });
    }
    if (html4CreatedCommentId) {
      db.deleteMany('card_comment_reactions', { cardCommentId: html4CreatedCommentId });
    }
    db.deleteMany('card_comment_reactions', { cardCommentId: childIds.foreignComment });
    if (html4ReplyCommentId) db.deleteOne('card_comments', { _id: html4ReplyCommentId });
    if (html4CreatedCommentId) db.deleteOne('card_comments', { _id: html4CreatedCommentId });
    if (user) db.deleteMany('eventlog', { userId: user._id });
    if (user) db.deleteMany('recoveryEvents', { userId: user._id });
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
    if (permanentDeleteBoard) db.cleanup({ boardIds: [permanentDeleteBoard.boardId] });
    if (html4CopiedBoardId) db.cleanup({ boardIds: [html4CopiedBoardId] });
    if (html4CreatedBoardId) db.cleanup({ boardIds: [html4CreatedBoardId] });
    if (importedBoardId) db.cleanup({ boardIds: [importedBoardId] });
    if (importedFileBoardId) db.cleanup({ boardIds: [importedFileBoardId] });
    if (importedWekanZipAttachmentId) {
      db.deleteOne('attachments', { _id: importedWekanZipAttachmentId });
    }
    if (importedWekanZipBoardId) db.cleanup({ boardIds: [importedWekanZipBoardId] });
    if (importedExcelBoardId) db.cleanup({ boardIds: [importedExcelBoardId] });
    if (importedTrelloZipBoardId) db.cleanup({ boardIds: [importedTrelloZipBoardId] });
    if (board) db.cleanup({ boardIds: [board.boardId] });
    if (user) db.cleanup({ userIds: [user._id] });
    if (settingsId) db.updateOne('settings', { _id: settingsId }, originalPermanentDeletePresent
      ? { $set: { enablePermanentDelete: originalPermanentDelete } }
      : { $unset: { enablePermanentDelete: '' } });
    await context.close();
  }
});
