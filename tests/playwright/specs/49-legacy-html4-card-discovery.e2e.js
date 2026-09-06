'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');
const ExcelJS = require('../../../node_modules/@wekanteam/exceljs');
const { strToU8, zipSync } = require('../../../node_modules/fflate');

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
  let importedWekanZipBoardId;
  let importedWekanZipAttachmentId;
  let importedExcelBoardId;
  let importedTrelloZipBoardId;
  let html4CreatedCommentId;
  let html4ReplyCommentId;
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
      }],
      activities: [{
        _id: `zip-activity-${suffix}`, activityType: 'addAttachment',
        attachmentId: zipAttachmentId, cardId: zipCardId,
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
      await modern.locator('.comment:has(.reaction-count)').screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-comment-reaction.png`,
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
    if (html4CreatedCommentId) {
      db.deleteMany('card_comment_reactions', { cardCommentId: html4CreatedCommentId });
    }
    db.deleteMany('card_comment_reactions', { cardCommentId: childIds.foreignComment });
    if (html4ReplyCommentId) db.deleteOne('card_comments', { _id: html4ReplyCommentId });
    if (html4CreatedCommentId) db.deleteOne('card_comments', { _id: html4CreatedCommentId });
    if (user) db.deleteMany('eventlog', { userId: user._id });
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
    if (importedWekanZipAttachmentId) {
      db.deleteOne('attachments', { _id: importedWekanZipAttachmentId });
    }
    if (importedWekanZipBoardId) db.cleanup({ boardIds: [importedWekanZipBoardId] });
    if (importedExcelBoardId) db.cleanup({ boardIds: [importedExcelBoardId] });
    if (importedTrelloZipBoardId) db.cleanup({ boardIds: [importedTrelloZipBoardId] });
    if (board) db.cleanup({ boardIds: [board.boardId] });
    if (user) db.cleanup({ userIds: [user._id] });
    await context.close();
  }
});
