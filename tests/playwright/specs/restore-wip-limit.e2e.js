'use strict';

// #6772: restoring an archived card whose list has reached a hard WIP limit
// did nothing at all. Now Restore asks which list to restore it to (offering
// only lists with room), and Restore all says how many cards it left out.
//
// Everything is set up through WeKan - the card menu, a new card, the WIP
// limit methods - not by writing to the database: a direct write is not seen
// by the open page or by the server's own copy without change streams.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

async function archive(page, listId, title) {
  const bp = new BoardPage(page);
  const cp = new CardPage(page);
  await bp.clickCard(listId, title);
  await cp.waitForOpen();
  await cp.archiveCard();
  await expect.poll(() => db.findOne('cards', { listId, title }).archived).toBe(true);
}

// Alpha archived from List A, then List A full: one live card, hard limit 1.
async function fillListA(page, board, { soft = false } = {}) {
  const [listA] = board.listIds;
  await archive(page, listA, 'Alpha Card');
  const bp = new BoardPage(page);
  await bp.openAddCardTop(listA);
  await bp.submitNewCard(listA, 'Filler Card');
  await expect.poll(() => db.findOne('cards', { listId: listA, title: 'Filler Card' })).toBeTruthy();
  await page.evaluate(async ([id, softLimit]) => {
    await Meteor.callAsync('applyWipLimit', id, 1);
    await Meteor.callAsync('enableWipLimit', id);
    if (softLimit) await Meteor.callAsync('enableSoftLimit', id);
  }, [listA, soft]);
  await expect.poll(() => db.findOne('lists', { _id: listA }).wipLimit).toMatchObject({ value: 1, enabled: true, soft });
  return { alpha: db.findOne('cards', { listId: listA, title: 'Alpha Card' }), listA };
}

async function openArchive(page) {
  await new BoardPage(page).openSidebar();
  await page.locator('.board-sidebar .js-open-board-menu').click();
  await page.locator('.js-pop-over').waitFor();
  await page.locator('.js-pop-over .js-open-archives').click();
  await page.locator('.board-sidebar .minicard-wrapper, .board-sidebar .no-items-message').first().waitFor({ timeout: 15_000 });
}

test('Restore into a full list asks for another list, and restores there', async ({ boardPage: page, board }) => {
  const { alpha, listA } = await fillListA(page, board);
  const listC = board.listIds[2];
  await openArchive(page);
  await page.locator('.board-sidebar .archived-card-item', { hasText: 'Alpha Card' }).locator('a.js-restore-card').click();

  const popup = page.locator('.js-pop-over');
  await expect(popup.locator('.js-restore-wip-reached')).toContainText('List A');
  // Negative: the full list is not offered.
  const options = await popup.locator('.js-select-restore-target-list option').allTextContents();
  expect(options.join('|')).not.toContain('List A');
  expect(options.join('|')).toContain('List C');

  await popup.locator('.js-select-restore-target-list').selectOption(listC);
  await popup.locator('.js-restore-card-to-list').click();
  await expect.poll(() => db.findOne('cards', { _id: alpha._id })).toMatchObject({ archived: false, listId: listC });
  // Negative: the full list did not receive it.
  expect(db.find('cards', { listId: listA, archived: false }).length).toBe(1);
});

test('Restore all restores what has room and says how many it left out', async ({ boardPage: page, board }) => {
  const listC = board.listIds[2];
  await archive(page, listC, 'Gamma Card');
  const { alpha, listA } = await fillListA(page, board);
  const gamma = db.findOne('cards', { listId: listC, title: 'Gamma Card' });
  await openArchive(page);
  await page.locator('.board-sidebar a.js-restore-all-cards').click();
  await expect(page.locator('.js-pop-over .js-restore-all-skipped')).toContainText('1');
  await expect.poll(() => db.findOne('cards', { _id: gamma._id }).archived).toBe(false);
  // Negative: the card whose list is full stays in the Archive.
  expect(db.findOne('cards', { _id: alpha._id }).archived).toBe(true);
  expect(db.find('cards', { listId: listA, archived: false }).length).toBe(1);
});

test('negative: a soft limit only warns, so Restore restores at once', async ({ boardPage: page, board }) => {
  const { alpha } = await fillListA(page, board, { soft: true });
  await openArchive(page);
  await page.locator('.board-sidebar .archived-card-item', { hasText: 'Alpha Card' }).locator('a.js-restore-card').click();
  await expect.poll(() => db.findOne('cards', { _id: alpha._id }).archived).toBe(false);
  await expect(page.locator('.js-pop-over .js-restore-wip-reached')).toHaveCount(0);
});
