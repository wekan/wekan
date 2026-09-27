'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

for (const enabled of [false, true]) {
  for (const kind of ['calendar', 'board', 'swimlane', 'list', 'card', 'description', 'checklist', 'item', 'subtask', 'comment', 'title', 'copy']) {
    test(`${kind} editor follows submit-on-Enter=${enabled}`, async ({ boardPage: page, board, user }) => {
      db.updateOne('users', { _id: user.id }, { $set: { 'profile.submitOnEnter': enabled } });
      const cardId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' });
      if (kind === 'item') db.insertOne('checklists', { _id: `keys-${board.boardId}`, boardId: board.boardId, cardId, title: 'Keyboard checklist', sort: 0 });
      await page.reload();
      const bp = new BoardPage(page);
      const cp = new CardPage(page);
      const title = `Keyboard ${kind} ${board.boardId}`;
      let input, count;
      if (kind === 'calendar') {
        await bp.switchToView('.js-open-cal-view');
        await page.waitForFunction(() => !!document.getElementById('calendar-view')?._wekanCalendar);
        await page.evaluate(() => document.getElementById('calendar-view')._wekanCalendar.select(new Date()));
        input = page.locator('textarea#card-title-input');
        count = () => db.find('cards', { boardId: board.boardId, title }).length;
      } else if (kind === 'board') {
        await page.locator('#header-new-board-icon').click();
        input = page.locator('.js-new-board-title');
        count = () => db.find('boards', { title }).length;
      } else if (kind === 'swimlane') {
        await bp.switchToSwimlanesView();
        await page.locator('.js-open-add-swimlane-menu').first().click();
        input = page.locator('.swimlane-name-input');
        count = () => db.find('swimlanes', { boardId: board.boardId, title }).length;
      } else if (kind === 'list') {
        await page.locator(`#js-list-${board.listIds[0]} .js-add-list-here`).click();
        input = page.locator('.js-add-list-inline-form textarea.list-name-input');
        count = () => db.find('lists', { boardId: board.boardId, title }).length;
      } else if (kind === 'card') {
        await bp.openAddCardTop(board.listIds[0]);
        input = bp.list(board.listIds[0]).locator('textarea.js-card-title');
        count = () => db.find('cards', { boardId: board.boardId, title }).length;
      } else {
        await bp.clickCard(board.listIds[0], 'Alpha Card');
        await cp.waitForOpen();
        if (kind === 'copy') {
          await cp.root.locator('.js-open-card-details-menu:visible').first().click();
          await page.locator('.js-pop-over .js-copy-card').click();
          input = page.locator('#copy-card-title');
          count = () => db.find('cards', { boardId: board.boardId, title }).length;
        } else if (kind === 'title') {
          await cp.root.locator('.card-details-title-edit-zone').click();
          input = cp.root.locator('textarea.js-edit-card-title');
          count = () => +(db.findOne('cards', { _id: cardId }).title === title);
        } else if (kind === 'subtask') {
          await cp.root.locator('a.js-open-inlined-form[title="Add Subtask"]').click();
          input = cp.root.locator('textarea.js-add-subtask-item');
          count = () => db.find('cards', { parentId: cardId, title }).length;
        } else if (kind === 'description') {
          await cp.root.locator('a.js-open-inlined-form').filter({ has: page.locator('i.fa-pencil-square-o') }).first().click();
          input = cp.root.locator('.js-card-description textarea');
          count = () => +(db.findOne('cards', { _id: cardId }).description === title);
        } else if (kind === 'checklist') {
          await cp.root.locator('a.add-checklist.js-open-inlined-form').last().click();
          input = cp.root.locator('form.js-add-checklist textarea');
          count = () => db.find('checklists', { cardId, title }).length;
        } else if (kind === 'item') {
          await cp.root.locator('.js-checklist a.add-checklist-item.js-open-inlined-form').last().click();
          input = cp.root.locator('textarea.js-add-checklist-item');
          count = () => db.find('checklistItems', { cardId, title }).length;
        } else {
          input = cp.root.locator('form.js-new-comment-form textarea');
          count = () => db.find('card_comments', { cardId, text: title }).length;
        }
      }
      try {
        await input.fill(title);
        await input.press(enabled ? 'Shift+Enter' : 'Enter');
        await expect(input).toHaveValue(`${title}\n`);
        expect(count()).toBe(0);
        // Composing Enter must never save, regardless of the preference.
        await input.dispatchEvent('keydown', { key: 'Enter', keyCode: 13, ctrlKey: true, isComposing: true });
        expect(count()).toBe(0);
        await input.fill(title);
        await input.press(enabled ? 'Enter' : 'Control+Enter');
        await expect.poll(count).toBe(1);
      } finally {
        if (kind === 'board') db.cleanup({ boardIds: db.find('boards', { title }).map(b => b._id) });
      }
    });
  }
}

for (const enabled of [true, false]) {
  test(`Member Settings changes the shortcut to ${enabled} without reloading`, async ({ boardPage: page, board, user }) => {
    db.updateOne('users', { _id: user.id }, { $set: { 'profile.submitOnEnter': !enabled } });
    await page.reload();
    const bp = new BoardPage(page);
    await expect(bp.minicard(board.listIds[0], 'Alpha Card')).toBeVisible();
    await page.locator('.js-open-header-member-menu').first().click();
    await page.locator('.js-change-settings').click();
    await page.locator('.js-toggle-submit-on-enter').click();
    await expect.poll(() => !!db.findOne('users', { _id: user.id }).profile.submitOnEnter).toBe(enabled);
    await page.keyboard.press('Escape');
    await bp.openAddCardTop(board.listIds[0]);
    const input = bp.list(board.listIds[0]).locator('textarea.js-card-title');
    const title = `Live preference ${enabled}`;
    await input.fill(title);
    if (!enabled) {
      await input.press('Enter');
      await expect(input).toHaveValue(`${title}\n`);
      expect(db.find('cards', { boardId: board.boardId, title })).toHaveLength(0);
      await input.fill(title);
    }
    await input.press(enabled ? 'Enter' : 'Control+Enter');
    await expect.poll(() => db.find('cards', { boardId: board.boardId, title }).length).toBe(1);
  });
}
