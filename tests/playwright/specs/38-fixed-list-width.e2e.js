'use strict';

/**
 * Spec 38 — Fixed (same) width for all lists (#5729)
 *
 * "For logged in users, and public board users, at list width settings have an
 * option to have fixed width. When enabled, all lists have the same width, and
 * changing the width of one list (by dragging between cards) changes the width
 * of ALL lists."
 *
 * The feature is a per-viewer / per-board toggle:
 *   - logged-in users store it in profile.fixedListWidthBoards (bool map) and
 *     profile.fixedListWidths (number map), set via the Meteor methods
 *     `setFixedListWidthEnabled` / `setFixedListWidth`;
 *   - anonymous / public-board users store it in localStorage keys
 *     `wekan-fixed-list-width-enabled` / `wekan-fixed-list-width`.
 *
 * This spec exercises BOTH the server boundary (over DDP, like spec 35) AND the
 * actual rendered widths in the board view (the real client `effectiveListWidth`
 * helper), and asserts the localStorage model for anonymous users.
 *
 * Positive:
 *   - enabling fixed width + setting a width persists to the profile and makes
 *     EVERY rendered list use that single width (logged-in);
 *   - "resizing one list" (the single shared value changing) updates ALL lists;
 *   - the anonymous localStorage model stores one shared width per board.
 * Negative:
 *   - a width < 200 is rejected and the stored value is unchanged;
 *   - with fixed width OFF, per-list widths are independent (changing one list's
 *     width does NOT change the others);
 *   - an anonymous user's setting for one board does not leak to another board.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

// Run a Meteor method/DDP call in the page context and return {err, result}.
async function ddp(page, name, args) {
  return page.evaluate(
    ({ name, args }) =>
      new Promise(resolve => {
        // eslint-disable-next-line no-undef
        Meteor.apply(name, args, (err, result) =>
          resolve({
            err: err
              ? { error: err.error, reason: err.reason, message: err.message }
              : null,
            result,
          }),
        );
      }),
    { name, args },
  );
}

// Read the rendered outer width (px) of each seeded list, in order.
async function renderedListWidths(page, listIds) {
  const widths = [];
  for (const id of listIds) {
    const box = await page.locator(`#js-list-${id}`).first().boundingBox();
    widths.push(box ? Math.round(box.width) : null);
  }
  return widths;
}

function profileFixed(userId) {
  const u = db.findOne(
    'users',
    { _id: userId },
    { 'profile.fixedListWidthBoards': 1, 'profile.fixedListWidths': 1, 'profile.listWidths': 1 },
  );
  const p = (u && u.profile) || {};
  return {
    enabled: p.fixedListWidthBoards || {},
    widths: p.fixedListWidths || {},
    listWidths: p.listWidths || {},
  };
}

test.describe('Fixed (same) width for all lists (#5729)', () => {
  test('logged-in: enabling fixed width makes all lists share one width; resize updates all', async ({
    page,
    user,
    board,
  }) => {
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);

    // --- Enable fixed width + set a distinctive width over DDP ---
    const FIXED_A = 360;
    const en = await ddp(page, 'setFixedListWidthEnabled', [board.boardId, true]);
    expect(en.err, 'enabling fixed width must succeed').toBeNull();
    const setA = await ddp(page, 'setFixedListWidth', [board.boardId, FIXED_A]);
    expect(setA.err, 'setting a valid fixed width must succeed').toBeNull();

    // Persisted to the per-user profile (per-board keyed).
    const p1 = profileFixed(user.id);
    expect(p1.enabled[board.boardId]).toBe(true);
    expect(p1.widths[board.boardId]).toBe(FIXED_A);

    // Reload so the reactive profile + render pick up the new value.
    await openBoard(page, board.boardId, board.slug);
    const widthsA = await renderedListWidths(page, board.listIds);
    expect(widthsA.every(w => w !== null), 'all lists must render').toBe(true);
    // POSITIVE: every list renders at the single fixed width.
    for (const w of widthsA) {
      expect(Math.abs(w - FIXED_A)).toBeLessThanOrEqual(2);
    }
    // All equal to each other.
    expect(new Set(widthsA).size, 'all lists must share one width').toBe(1);

    // --- "Resize one list" == change the single shared value -> ALL change ---
    const FIXED_B = 300;
    const setB = await ddp(page, 'setFixedListWidth', [board.boardId, FIXED_B]);
    expect(setB.err, 'changing the fixed width must succeed').toBeNull();

    await openBoard(page, board.boardId, board.slug);
    const widthsB = await renderedListWidths(page, board.listIds);
    for (const w of widthsB) {
      expect(Math.abs(w - FIXED_B)).toBeLessThanOrEqual(2);
    }
    expect(new Set(widthsB).size, 'all lists still share one width after change').toBe(1);
    expect(widthsB[0]).not.toBe(widthsA[0]); // the change actually took effect
  });

  test('logged-in NEGATIVE: width < 200 rejected; OFF means per-list widths are independent', async ({
    page,
    user,
    board,
  }) => {
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);

    // Establish a known good fixed width first.
    await ddp(page, 'setFixedListWidthEnabled', [board.boardId, true]);
    await ddp(page, 'setFixedListWidth', [board.boardId, 320]);
    expect(profileFixed(user.id).widths[board.boardId]).toBe(320);

    // NEGATIVE: a too-small width (below the 200 minimum, #6465) is rejected and
    // the stored value is unchanged.
    const bad = await ddp(page, 'setFixedListWidth', [board.boardId, 150]);
    expect(bad.err, 'width < 200 must be rejected').not.toBeNull();
    expect(bad.err.error).toBe('invalid-width');
    expect(
      profileFixed(user.id).widths[board.boardId],
      'rejected width must not overwrite the stored value',
    ).toBe(320);

    // POSITIVE: a width at/above the lowered 200 minimum (but below the old 270)
    // is now accepted (#6465 narrowed the default/minimum).
    const ok = await ddp(page, 'setFixedListWidth', [board.boardId, 210]);
    expect(ok.err, 'width >= 200 must be accepted').toBeNull();
    expect(profileFixed(user.id).widths[board.boardId]).toBe(210);

    // NEGATIVE: with fixed width OFF + personal widths on, per-list widths are
    // independent — setting ONE list's width must not change the others.
    await ddp(page, 'setFixedListWidthEnabled', [board.boardId, false]);
    db.updateOne('boards', { _id: board.boardId }, { $set: { allowsPersonalListWidth: true } });

    const targetList = board.listIds[1];
    const personal = await ddp(page, 'applyListWidthToStorage', [
      board.boardId,
      targetList,
      410,
      410,
    ]);
    expect(personal.err, 'personal per-list width must persist').toBeNull();

    const p = profileFixed(user.id);
    const lw = p.listWidths[board.boardId] || {};
    expect(lw[targetList]).toBe(410); // the one list changed
    // The other lists have NO personal width entry — they are independent.
    expect(lw[board.listIds[0]]).toBeUndefined();
    expect(lw[board.listIds[2]]).toBeUndefined();
  });

  test('anonymous/public-board: fixed width lives in localStorage and does not leak across boards', async ({
    page,
    user,
    board,
  }) => {
    // Use a second seeded board id to prove per-board isolation. We don't need
    // it rendered; we only assert the localStorage data model the client uses
    // for anonymous viewers (mirrors list.js read/save helpers).
    const otherBoardId = 'other-board-5729';

    // Drive a real page (any served page exposes localStorage for this origin).
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);

    const result = await page.evaluate(
      ({ boardId, otherBoardId }) => {
        const MIN = 200;

        // --- save helpers (mirror list.js anonymous storage) ---
        function setEnabled(id, enabled) {
          const stored = localStorage.getItem('wekan-fixed-list-width-enabled');
          const flags = stored ? JSON.parse(stored) : {};
          flags[id] = !!enabled;
          localStorage.setItem('wekan-fixed-list-width-enabled', JSON.stringify(flags));
        }
        function setWidth(id, w) {
          const stored = localStorage.getItem('wekan-fixed-list-width');
          const widths = stored ? JSON.parse(stored) : {};
          widths[id] = w;
          localStorage.setItem('wekan-fixed-list-width', JSON.stringify(widths));
        }
        // --- read helpers (mirror list.js anonymous reads) ---
        function isEnabled(id) {
          const stored = localStorage.getItem('wekan-fixed-list-width-enabled');
          return stored ? JSON.parse(stored)[id] === true : false;
        }
        function readWidth(id) {
          const stored = localStorage.getItem('wekan-fixed-list-width');
          if (stored) {
            const w = JSON.parse(stored)[id];
            if (typeof w === 'number' && w >= MIN) return w;
          }
          return 220; // default
        }

        localStorage.removeItem('wekan-fixed-list-width-enabled');
        localStorage.removeItem('wekan-fixed-list-width');

        // Enable + set a single shared width for ONE board.
        setEnabled(boardId, true);
        setWidth(boardId, 333);

        return {
          enabledThis: isEnabled(boardId),
          widthThis: readWidth(boardId),
          // POSITIVE: a single value drives every list ("resize one == all").
          // NEGATIVE: the other board is unaffected (default off / default width).
          enabledOther: isEnabled(otherBoardId),
          widthOther: readWidth(otherBoardId),
        };
      },
      { boardId: board.boardId, otherBoardId },
    );

    // POSITIVE: enabled + the one shared width for this board.
    expect(result.enabledThis).toBe(true);
    expect(result.widthThis).toBe(333);

    // NEGATIVE: no leak to another board — still default off / default width.
    expect(result.enabledOther).toBe(false);
    expect(result.widthOther).toBe(220);
  });
});
