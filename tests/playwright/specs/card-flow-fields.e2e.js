'use strict';

// The Kanban and Scrum flow fields (docs/Features/Cards/Flow-Fields.md):
// off until a board turns them on; set in the opened card, shown on the
// minicard; Expedite keeps its WIP limit of one; and Admin Panel / Features /
// Card fields hides a field on every board.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const FLAGS = ['Blocked', 'ClassOfService', 'Moscow', 'Wsjf'];
const allOn = () => Object.fromEntries(FLAGS.flatMap(name => [[`allows${name}OnCard`, true], [`allows${name}OnMinicard`, true]]));

test.describe('Flow fields', () => {
  test('off until the board turns them on (negative)', async ({ boardPage, board }) => {
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();
    await expect(cp.root.locator('.card-details-item-flow-blocked, .card-details-item-flow-class, '
      + '.card-details-item-flow-moscow, .card-details-item-flow-wsjf')).toHaveCount(0);
  });

  test('a card is blocked with a reason, classed, prioritised and scored', async ({ boardPage, board }) => {
    db.updateOne('boards', { _id: board.boardId }, { $set: allOn() });
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    await bp.clickCard(board.listIds[0], 'Alpha Card');
    await cp.waitForOpen();

    await cp.root.locator('.js-card-flow-blocked').check();
    const reason = cp.root.locator('.js-card-flow-blocked-reason');
    await expect(reason).toBeVisible({ timeout: 15_000 });
    await reason.fill('Waits for the vendor');
    await reason.press('Tab');
    await cp.root.locator('.js-card-flow-class').selectOption('expedite');
    await cp.root.locator('.js-card-flow-moscow').selectOption('must');
    for (const [part, value] of [['businessValue', '8'], ['timeCriticality', '5'], ['riskReduction', '3'], ['jobSize', '2']]) {
      await cp.root.locator(`.js-card-flow-wsjf[data-part="${part}"]`).selectOption(value);
    }
    await expect(cp.root.locator('.card-flow-wsjf-score')).toHaveText('8', { timeout: 15_000 });
    await expect(cp.root.locator('.card-flow-blocked-since')).toBeVisible();

    const alpha = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    expect(alpha.flow.blocked).toBe(true);
    expect(alpha.flow.blockedReason).toBe('Waits for the vendor');
    expect(alpha.flow.blockedBy).toBeTruthy();
    expect(alpha.flow.classOfService).toBe('expedite');

    const mini = bp.minicard(board.listIds[0], 'Alpha Card');
    await expect(mini.locator('.js-minicard-flow-blocked')).toHaveAttribute('title', /Waits for the vendor/);
    await expect(mini.locator('.minicard-flow-class.flow-class-expedite')).toBeVisible();
    await expect(mini.locator('.minicard-flow-moscow.flow-moscow-must')).toBeVisible();
    await expect(mini.locator('.minicard-flow-wsjf')).toContainText('8');
    // Negative: Beta has nothing set, so its minicard shows no flow badge.
    await expect(bp.minicard(board.listIds[1], 'Beta Card').locator('[class*="minicard-flow-"]')).toHaveCount(0);
  });

  test('Expedite has a WIP limit of one, and Admin Panel hides a field everywhere', async ({ boardPage, board }) => {
    db.updateOne('boards', { _id: board.boardId }, { $set: allOn() });
    const alpha = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    db.updateOne('cards', { _id: alpha._id }, { $set: { flow: { classOfService: 'expedite', blocked: true } } });
    const bp = new BoardPage(boardPage);
    const cp = new CardPage(boardPage);
    let message = '';
    boardPage.on('dialog', dialog => { message = dialog.message(); dialog.accept(); });
    await bp.clickCard(board.listIds[1], 'Beta Card');
    await cp.waitForOpen();
    await cp.root.locator('.js-card-flow-class').selectOption('expedite');
    await expect.poll(() => message, { timeout: 15_000 }).toMatch(/Expedite/);
    const beta = db.findOne('cards', { boardId: board.boardId, title: 'Beta Card' });
    expect(beta.flow && beta.flow.classOfService).toBeFalsy();

    const badge = bp.minicard(board.listIds[0], 'Alpha Card').locator('.js-minicard-flow-blocked');
    await expect(badge).toBeVisible({ timeout: 15_000 });
    db.updateOne('settings', {}, { $set: { 'cardFieldStates.blocked': false } });
    await expect(badge).toHaveCount(0, { timeout: 15_000 });
    db.updateOne('settings', {}, { $unset: { 'cardFieldStates.blocked': 1 } });
    await expect(badge).toBeVisible({ timeout: 15_000 });
  });
});
