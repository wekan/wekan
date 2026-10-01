'use strict';

/**
 * Spec 27 — Card dependency "Red Strings" / PI program board (feature #3392)
 *
 * Card-to-card dependencies are visualized as red, arrow-headed SVG connection
 * lines drawn on top of the board. A card's "Dependencies" section (card detail)
 * adds/removes links to other cards on the same board, and each user's own
 * Show Board Dependencies switch in Member Settings renders the overlay (#6732).
 *
 * Covers:
 *  - With a dependency seeded and the board toggle on, a red dependency line is
 *    drawn on top of the board.
 *  - The Member Settings switch hides/shows the overlay for that user only, and
 *    is saved in their profile.
 *  - Adding and removing a dependency from the card detail view persists the
 *    card's cardDependencies to the database.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';
const RED = '#eb144c';

test.describe('Red Strings – card dependency overlay', () => {
  test.use({ storageState: undefined });

  let owner;
  let board;
  let alphaId;
  let betaId;

  test.beforeAll(() => {
    owner = db.seedUser();
    board = db.seedBoard({
      ownerId: owner.id,
      title: 'PI Program Board',
      listCount: 2,
      cardTitlesPerList: [['PI Alpha'], ['PI Beta']],
    });
    alphaId = db.findCardIdByTitle({ boardId: board.boardId, title: 'PI Alpha' });
    betaId = db.findCardIdByTitle({ boardId: board.boardId, title: 'PI Beta' });

    // Alpha depends on Beta; overlay enabled.
    db.setCardDependencies({ cardId: alphaId, dependsOn: [betaId] });
    db.setShowDependencies({ boardId: board.boardId, board: true });
  });

  // Each test gets a new browser page and therefore a new login session. Do
  // not reuse one resume token across all of them: Accounts may invalidate a
  // token when an earlier connection is torn down, which made a later Firefox
  // test fail at login before exercising its dependency badge assertion.
  test.beforeEach(() => {
    owner.token = db.addResumeToken(owner.id);
  });

  test.afterAll(() => {
    db.cleanup({ boardIds: [board.boardId], userIds: [owner.id] });
  });

  test('draws a red dependency line between dependent cards', async ({ page }) => {
    await loginWithToken(page, owner.id, owner.token);
    await openBoard(page, board.boardId, board.slug);

    const line = page.locator('.js-dependency-overlay .dependency-line').first();
    await line.waitFor({ timeout: 15_000 });
    await expect(line).toBeVisible();

    // The string is red and follows an SVG path (M ... C ... curve).
    await expect(line).toHaveAttribute('stroke', RED);
    const d = await line.getAttribute('d');
    expect(d).toMatch(/^M /);

    // Overlay is non-interactive so cards stay clickable.
    const overlay = page.locator('.js-dependency-overlay');
    await expect(overlay).toHaveCSS('pointer-events', 'none');

    await page.screenshot({ path: 'test-results/red-strings-overlay.png', fullPage: true });
  });

  // #6732: the board-header toggle became each user's own Show Board
  // Dependencies, at the top of Member Settings. Turning it off for one user
  // must not touch what anyone else sees.
  test('Member Settings switch hides the overlay for this user only', async ({ page }) => {
    const other = db.seedUser();
    db.addBoardMember({ boardId: board.boardId, userId: other.id });
    db.setShowDependencies({ userIds: [other.id], board: true });
    try {
      await loginWithToken(page, owner.id, owner.token);
      await openBoard(page, board.boardId, board.slug);
      await expect(page.locator('.js-dependency-overlay')).toBeVisible();
      await expect(page.locator('.js-toggle-dependencies')).toHaveCount(0);

      // Member Settings stays open after a switch is clicked.
      const toggle = async () => {
        const item = page.locator('.js-toggle-board-dependencies');
        if (!await item.isVisible()) await page.locator('.js-open-header-member-menu').click();
        await expect(item).toBeVisible();
        await item.click();
      };
      const mine = () => (db.findOne('users', { _id: owner.id }).profile || {}).showBoardDependencies;
      const theirs = () => (db.findOne('users', { _id: other.id }).profile || {}).showBoardDependencies;

      await toggle();
      await expect(page.locator('.js-dependency-overlay')).toHaveCount(0);
      await expect.poll(mine, { timeout: 10_000 }).toBe(false);
      expect(theirs()).toBe(true);
      expect(db.getBoard(board.boardId).showDependencies).not.toBe(false);

      await toggle();
      await expect(page.locator('.js-dependency-overlay')).toBeVisible();
      await expect.poll(mine, { timeout: 10_000 }).toBe(true);
    } finally {
      db.cleanup({ userIds: [other.id] });
    }
  });

  test('add/remove a dependency from the card detail persists to the database', async ({ page }) => {
    // Start clean: Beta has no dependencies.
    db.setCardDependencies({ cardId: betaId, dependsOn: [] });

    await loginWithToken(page, owner.id, owner.token);
    await page.goto(`${BASE_URL}/b/${board.boardId}/${board.slug}/${betaId}`, {
      waitUntil: 'commit',
    });

    // Open the Dependencies picker and choose Alpha.
    await page.locator('.js-add-dependency').waitFor({ timeout: 15_000 });
    await page.locator('.js-add-dependency').click();
    await page.locator(`.js-pick-dependency[data-target-id="${alphaId}"]`).click();

    await expect
      .poll(
        () =>
          (db.getCard(betaId).cardDependencies || []).map(d => d.cardId),
        { timeout: 10_000 },
      )
      .toContain(alphaId);

    // Remove it again.
    await page.locator(`.js-remove-dependency[data-target-id="${alphaId}"]`).click();
    await expect
      .poll(
        () =>
          (db.getCard(betaId).cardDependencies || []).map(d => d.cardId),
        { timeout: 10_000 },
      )
      .not.toContain(alphaId);
  });

  test('typed relation: blocks draws a directed line with an arrowhead', async ({ page }) => {
    db.setCardDependencies({
      cardId: alphaId,
      dependsOn: [{ cardId: betaId, type: 'blocks', color: '#2196f3', icon: 'lock' }],
    });
    db.setShowDependencies({ boardId: board.boardId, board: true });

    await loginWithToken(page, owner.id, owner.token);
    await openBoard(page, board.boardId, board.slug);

    const line = page.locator('.js-dependency-overlay .dependency-line').first();
    await line.waitFor({ timeout: 15_000 });
    await expect(line).toHaveAttribute('stroke', '#2196f3');
    // Directed relation => arrowhead marker is referenced.
    await expect(line).toHaveAttribute('marker-end', /url\(#/);
  });

  test('minicard shows a colored dependency badge with the count', async ({ page }) => {
    db.setCardDependencies({
      cardId: alphaId,
      dependsOn: [{ cardId: betaId, type: 'blocks', color: '#2196f3', icon: 'lock' }],
    });
    await loginWithToken(page, owner.id, owner.token);
    await openBoard(page, board.boardId, board.slug);

    const badge = page.locator('.minicard-dependencies').first();
    await badge.waitFor({ timeout: 15_000 });
    await expect(badge).toContainText('1');
  });

  test('copyCard preserves a same-board dependency (type/color) on the copy', async ({ page }) => {
    db.setCardDependencies({
      cardId: alphaId,
      dependsOn: [{ cardId: betaId, type: 'blocks', color: '#2196f3', icon: 'lock' }],
    });
    await loginWithToken(page, owner.id, owner.token);
    await openBoard(page, board.boardId, board.slug);

    const newCardId = await page.evaluate(
      ({ alphaId, boardId, swimlaneId, listId }) =>
        Meteor.callAsync('copyCard', alphaId, boardId, swimlaneId, listId, false, {
          title: 'PI Alpha Copy',
        }),
      {
        alphaId,
        boardId: board.boardId,
        swimlaneId: board.swimlaneId,
        listId: board.listIds[1],
      },
    );
    expect(newCardId).toBeTruthy();

    const deps = db.getCard(newCardId).cardDependencies || [];
    expect(deps.map(d => d.cardId)).toContain(betaId);
    expect(deps[0]).toMatchObject({ type: 'blocks', color: '#2196f3' });
  });

  test('importBoardDependencies matches cards by number and by title', async ({ page }) => {
    db.setCardDependencies({ cardId: alphaId, dependsOn: [] });
    db.setCardDependencies({ cardId: betaId, dependsOn: [] });
    const alpha = db.getCard(alphaId);
    const beta = db.getCard(betaId);

    await loginWithToken(page, owner.id, owner.token);
    await openBoard(page, board.boardId, board.slug);

    const res = await page.evaluate(
      ({ boardId, lines }) => Meteor.callAsync('importBoardDependencies', boardId, lines),
      {
        boardId: board.boardId,
        lines: [
          // matched by card number
          { fromCardNumber: alpha.cardNumber, toCardNumber: beta.cardNumber, type: 'fixes', color: '#00ff00' },
          // matched by exact title
          { fromTitle: 'PI Beta', toTitle: 'PI Alpha', type: 'related-to' },
          // unmatched (bogus ids/titles)
          { from: 'nope', to: 'nope2', fromTitle: 'x', toTitle: 'y' },
        ],
      },
    );

    expect(res.imported).toBe(2);
    expect(res.unmatched).toBe(1);
    expect((db.getCard(alphaId).cardDependencies || []).map(d => d.cardId)).toContain(betaId);
    expect((db.getCard(betaId).cardDependencies || []).map(d => d.cardId)).toContain(alphaId);
  });

  test('editing an existing dependency type/color/icon from card detail persists (no 403)', async ({ page }) => {
    // Start with one existing dependency to edit (the path that previously threw
    // "Untrusted code may only updateAsync documents by ID").
    db.setCardDependencies({
      cardId: alphaId,
      dependsOn: [{ cardId: betaId, type: 'related-to', color: '#eb144c', icon: 'link' }],
    });

    await loginWithToken(page, owner.id, owner.token);
    await page.goto(`${BASE_URL}/b/${board.boardId}/${board.slug}/${alphaId}`, {
      waitUntil: 'commit',
    });

    // Remove any transient rspack dev-server overlay that could intercept input.
    const dismissDevOverlay = () =>
      page.evaluate(() => {
        document
          .querySelectorAll('iframe[id*="webpack-dev-server"]')
          .forEach(el => el.remove());
      });

    const depOf = () =>
      (db.getCard(alphaId).cardDependencies || []).find(d => d.cardId === betaId);

    // Change the relation type via the per-row dropdown.
    const typeSelect = page.locator(`.js-dependency-type[data-target-id="${betaId}"]`);
    await typeSelect.waitFor({ timeout: 15_000 });
    await dismissDevOverlay();
    await typeSelect.selectOption('blocks');
    await expect.poll(() => depOf() && depOf().type, { timeout: 10_000 }).toBe('blocks');

    // Change the color via the per-row color input (fires a change event).
    await dismissDevOverlay();
    await page.locator(`.js-dependency-color[data-target-id="${betaId}"]`).evaluate(el => {
      el.value = '#00ff00';
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect.poll(() => depOf() && depOf().color, { timeout: 10_000 }).toBe('#00ff00');

    // Pick a different icon from the icon popup.
    await dismissDevOverlay();
    await page.locator(`.js-dependency-icon[data-target-id="${betaId}"]`).click();
    await page.locator('.js-pick-dependency-icon[data-icon="lock"]').click();
    await expect.poll(() => depOf() && depOf().icon, { timeout: 10_000 }).toBe('lock');
  });

  test('drag-to-connect: dragging a card connect-handle onto another card creates a dependency', async ({ page }) => {
    // No dependencies to start; dragging the handle will create one.
    db.setCardDependencies({ cardId: alphaId, dependsOn: [] });
    db.setCardDependencies({ cardId: betaId, dependsOn: [] });
    // The connect handle shows only when the overlay is on.
    db.setShowDependencies({ boardId: board.boardId, board: true });

    await loginWithToken(page, owner.id, owner.token);
    await openBoard(page, board.boardId, board.slug);

    await page.evaluate(() =>
      document
        .querySelectorAll('iframe[id*="webpack-dev-server"]')
        .forEach(el => el.remove()),
    );

    // Reveal the source card's connect handle and drag it onto the target card.
    const aCard = page.locator(`[data-card-id="${alphaId}"]`);
    await aCard.scrollIntoViewIfNeeded();
    await aCard.hover();
    const handle = page.locator(
      `[data-card-id="${alphaId}"] .js-dependency-connect-handle`,
    );
    await handle.waitFor({ timeout: 15_000 });

    const h = await handle.boundingBox();
    const b = await page.locator(`[data-card-id="${betaId}"]`).boundingBox();
    await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 10 });
    await page.mouse.up();

    // Alpha now depends on Beta — and the board's cards stayed clickable (no mode).
    await expect
      .poll(
        () => (db.getCard(alphaId).cardDependencies || []).map(d => d.cardId),
        { timeout: 10_000 },
      )
      .toContain(betaId);
  });
});
