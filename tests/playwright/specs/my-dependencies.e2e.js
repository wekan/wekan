'use strict';
// #6732: Board and My Dependencies in Member Settings. A read-only member keeps
// their own My Dependencies (dashed, seen by them only); Import into the board
// is offered only to roles that may edit or move cards, and it combines; Export
// saves either layer.
const fs = require('fs');
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

test.describe('Board and My Dependencies', () => {
  test.use({ storageState: undefined });
  let owner, reader, worker, board, alphaId, betaId, gammaId;

  test.beforeAll(() => {
    owner = db.seedUser();
    reader = db.seedUser();
    worker = db.seedUser();
    board = db.seedBoard({ ownerId: owner.id, title: 'Dependency layers', listCount: 3,
      cardTitlesPerList: [['Layer Alpha'], ['Layer Beta'], ['Layer Gamma']] });
    alphaId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Layer Alpha' });
    betaId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Layer Beta' });
    gammaId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Layer Gamma' });
    db.updateOne('boards', { _id: board.boardId }, { $push: { members: { $each: [
      { userId: reader.id, isAdmin: false, isActive: true, isReadOnly: true },
      { userId: worker.id, isAdmin: false, isActive: true, isWorker: true },
    ] } } });
    db.setCardDependencies({ cardId: alphaId, dependsOn: [{ cardId: betaId, type: 'blocks' }] });
  });
  test.beforeEach(() => {
    for (const user of [owner, reader, worker]) user.token = db.addResumeToken(user.id);
  });
  test.afterAll(() => db.cleanup({ boardIds: [board.boardId], userIds: [owner.id, reader.id, worker.id] }));

  // Member Settings stays open after a switch is clicked; open it only when it
  // is not already showing, and close any sub-popup (Import) first.
  const openMenu = async page => {
    const item = page.locator('.js-toggle-board-dependencies');
    for (let i = 0; i < 3 && await page.locator('.pop-over').count() && !await item.isVisible(); i++) {
      await page.locator('.pop-over .js-close-pop-over, .pop-over .js-back-view').first().click().catch(() => {});
    }
    if (!await item.isVisible()) await page.locator('.js-open-header-member-menu').click();
    await expect(item).toBeVisible();
  };

  test('the four items are at the top of Member Settings, both switches off', async ({ page }) => {
    await loginWithToken(page, reader.id, reader.token);
    await openBoard(page, board.boardId, board.slug);
    await expect(page.locator('.js-dependency-overlay')).toHaveCount(0);
    await openMenu(page);
    const items = page.locator('.pop-over-list li a');
    await expect(items.nth(0)).toHaveClass(/js-toggle-my-dependencies/);
    await expect(items.nth(1)).toHaveClass(/js-toggle-board-dependencies/);
    await expect(items.nth(2)).toHaveClass(/js-import-member-dependencies/);
    await expect(items.nth(3)).toHaveClass(/js-export-member-dependencies/);
    await expect(items.nth(0)).toHaveAttribute('aria-checked', 'false');
    await expect(items.nth(1)).toHaveAttribute('aria-checked', 'false');
  });

  test('a read-only member shows the board lines and keeps My Dependencies only they see', async ({ page }) => {
    db.setShowDependencies({ userIds: [reader.id], board: true, mine: true });
    await loginWithToken(page, reader.id, reader.token);
    await openBoard(page, board.boardId, board.slug);
    // The reported case: a member who cannot edit may still SHOW the lines.
    await expect(page.locator('.js-dependency-overlay .dependency-line:not(.dependency-line-mine)').first()).toBeVisible();

    // Import into My Dependencies; the Board option is not theirs.
    await openMenu(page);
    await page.locator('.js-import-member-dependencies').click();
    await expect(page.locator('input[name="dependency-layer"][value="board"]')).toBeDisabled();
    await expect(page.locator('.js-board-dependencies-edit-required')).toBeVisible();
    await page.locator('.js-import-member-dependencies-text').fill(JSON.stringify({ lines: [
      { fromTitle: 'Layer Beta', toTitle: 'Layer Gamma', type: 'blocks' },
    ] }));
    await page.locator('.js-import-member-dependencies-submit').click();
    await expect(page.locator('.js-import-member-dependencies-result')).toContainText('1');
    await expect.poll(() => (db.findOne('users', { _id: reader.id }).profile.myDependencies || []).length).toBe(1);
    expect(db.getCard(betaId).cardDependencies || []).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(page.locator('.js-dependency-overlay .dependency-line-mine')).toHaveCount(1);
    await expect(page.locator('.js-dependency-overlay .dependency-line-mine')).toHaveAttribute('stroke-dasharray', '6,4');

    // Export My Dependencies as JSON: the same format, re-importable.
    await openMenu(page);
    await page.locator('.js-export-member-dependencies').click();
    const [download] = await Promise.all([page.waitForEvent('download'),
      page.locator('.js-export-my-dependencies-json').click()]);
    expect(download.suggestedFilename()).toBe(`wekan-my-dependencies-${board.boardId}.json`);
    const saved = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    expect(saved.layer).toBe('my');
    expect(saved.lines.map(line => [line.fromTitle, line.toTitle, line.type])).toEqual([['Layer Beta', 'Layer Gamma', 'blocks']]);
  });

  test('the owner does not see another user\'s My Dependencies (negative)', async ({ page }) => {
    db.setShowDependencies({ userIds: [owner.id], board: true, mine: true });
    await loginWithToken(page, owner.id, owner.token);
    await openBoard(page, board.boardId, board.slug);
    await expect(page.locator('.js-dependency-overlay .dependency-line').first()).toBeVisible();
    await expect(page.locator('.js-dependency-overlay .dependency-line-mine')).toHaveCount(0);
  });

  test('a Worker imports Board Dependencies, and the import only adds what is missing', async ({ page }) => {
    await loginWithToken(page, worker.id, worker.token);
    await openBoard(page, board.boardId, board.slug);
    await openMenu(page);
    await page.locator('.js-import-member-dependencies').click();
    await page.locator('input[name="dependency-layer"][value="board"]').check();
    await page.locator('.js-import-member-dependencies-text').fill(JSON.stringify({ lines: [
      { fromTitle: 'Layer Alpha', toTitle: 'Layer Beta', type: 'fixes' },
      { fromTitle: 'Layer Gamma', toTitle: 'Layer Alpha', type: 'related-to' },
    ] }));
    await page.locator('.js-import-member-dependencies-submit').click();
    await expect(page.locator('.js-import-member-dependencies-result')).toContainText('1');
    await expect.poll(() => (db.getCard(gammaId).cardDependencies || []).map(d => d.cardId)).toEqual([alphaId]);
    expect(db.getCard(alphaId).cardDependencies.map(d => d.type)).toEqual(['blocks']);
  });
});

// An instance board is readable by every signed-in user, so a non-member may
// keep My Dependencies on it, as on a public board. The dependency rules
// allowed only public boards and members until they used
// readableWithoutMembership (models/lib/boardPermission.js).
test.describe('My Dependencies on an instance board', () => {
  test.use({ storageState: undefined });
  let owner, outsider, board, betaId;

  test.beforeAll(() => {
    owner = db.seedUser();
    outsider = db.seedUser();
    board = db.seedBoard({ ownerId: owner.id, title: 'Instance dependencies', listCount: 2,
      cardTitlesPerList: [['Instance Alpha'], ['Instance Beta']] });
    betaId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Instance Beta' });
    db.updateOne('boards', { _id: board.boardId }, { $set: { permission: 'instance' } });
  });
  test.beforeEach(() => { outsider.token = db.addResumeToken(outsider.id); });
  test.afterAll(() => db.cleanup({ boardIds: [board.boardId], userIds: [owner.id, outsider.id] }));

  test('a signed-in non-member imports My Dependencies, never the board layer', async ({ page }) => {
    db.setShowDependencies({ userIds: [outsider.id], board: true, mine: true });
    await loginWithToken(page, outsider.id, outsider.token);
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.js-open-header-member-menu').click();
    await page.locator('.js-import-member-dependencies').click();
    // Not a member, so not an editor of the board layer (negative).
    await expect(page.locator('input[name="dependency-layer"][value="board"]')).toBeDisabled();
    await page.locator('.js-import-member-dependencies-text').fill(JSON.stringify({ lines: [
      { fromTitle: 'Instance Alpha', toTitle: 'Instance Beta', type: 'blocks' },
    ] }));
    await page.locator('.js-import-member-dependencies-submit').click();
    await expect(page.locator('.js-import-member-dependencies-result')).toContainText('1');
    await expect.poll(() => (db.findOne('users', { _id: outsider.id }).profile.myDependencies || []).length).toBe(1);
    expect(db.getCard(betaId).cardDependencies || []).toEqual([]);
  });
});
