'use strict';

/**
 * Spec 24 — features added for open issues
 *
 *  - #459  accessible reordering: "Move card up/down" and "Move list left/right"
 *          buttons reorder without drag-and-drop
 *  - #3984 visual card aging: old cards get a fade class when card aging is on,
 *          using the board-configurable day thresholds
 *  - #5157 the board background image is shown on the All Boards list tile
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');

function authHeaders(token, json = false) {
  const h = { Authorization: `Bearer ${token}` };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

function findOne(collection, id) {
  return db.findOne(collection, { _id: id });
}

test.describe('Feature issues', () => {
  test('#459 accessible "move card down" reorders cards without drag-and-drop', async ({ loggedInPage, user }) => {
    const b = db.seedBoard({ ownerId: user.id, cardTitlesPerList: [['Aaa', 'Bbb', 'Ccc']] });
    try {
      await openBoard(loggedInPage, b.boardId, b.slug);
      const bp = new BoardPage(loggedInPage);
      const listId = b.listIds[0];

      // The board view can briefly re-render while its subscription settles; poll
      // for the seeded cards rather than reading once (avoids a transient 0-card read).
      await expect
        .poll(async () =>
          (await bp.cardTitlesInList(listId).allInnerTexts()).map(s => s.trim()).join(','),
        )
        .toBe('Aaa,Bbb,Ccc');

      // The move buttons are visually hidden (sr-only) but in the DOM — force-click.
      await bp.minicard(listId, 'Aaa').locator('.js-card-move-down').click({ force: true });

      await expect.poll(async () =>
        (await bp.cardTitlesInList(listId).allInnerTexts()).map(s => s.trim()).join(','),
      ).toBe('Bbb,Aaa,Ccc');
    } finally {
      db.cleanup({ boardIds: [b.boardId] });
    }
  });

  test('#459 accessible "move list right" reorders lists without drag-and-drop', async ({ loggedInPage, user }) => {
    const b = db.seedBoard({ ownerId: user.id });
    try {
      await openBoard(loggedInPage, b.boardId, b.slug);
      const bp = new BoardPage(loggedInPage);

      // The board can briefly re-render while its subscription settles; poll for
      // the fully-rendered seeded lists before reading the order and clicking, so
      // an early click is not dropped and `before` is not a transient partial read.
      await expect
        .poll(async () => (await bp.listTitles()).map(s => s.trim()).join(','))
        .toBe('List A,List B,List C');

      const before = (await bp.listTitles()).map(s => s.trim());
      expect(before.length).toBeGreaterThanOrEqual(2);

      await bp.list(b.listIds[0]).locator('.js-list-move-right').click({ force: true });

      // moveListBy swaps the two lists' sort values via two updateListSort calls,
      // and the board reorders reactively. Observe the live reorder directly — do
      // NOT reload here: moveListBy fires the two updateListSort calls without
      // awaiting, so an immediate reload races them and can read a half-applied
      // order (this test then saw "List C" first). The board-not-found flicker
      // that used to crash this reorder on Firefox/WebKit is fixed at the source
      // (getBoard stale-while-revalidate in imports/lib/dataCache.js).
      await expect.poll(async () =>
        (await bp.listTitles()).map(s => s.trim())[0],
      ).toBe(before[1]);
    } finally {
      db.cleanup({ boardIds: [b.boardId] });
    }
  });

  test('#3984 old cards fade when card aging is enabled', async ({ loggedInPage, user, request }) => {
    const b = db.seedBoard({ ownerId: user.id, cardTitlesPerList: [['OldCard']] });
    try {
      // Make the card 40 days idle (past the default tier-3 threshold of 28).
      db.updateOne('cards', { boardId: b.boardId, title: 'OldCard' },
        { $set: { dateLastActivity: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) } });
      // Enable card aging via the card-settings REST API.
      const res = await request.put(`/api/boards/${b.boardId}/cardSettings`, {
        headers: authHeaders(user.token, true),
        data: { cardAging: true },
      });
      expect(res.status()).toBe(200);

      await openBoard(loggedInPage, b.boardId, b.slug);
      const bp = new BoardPage(loggedInPage);
      // The card gets the heaviest fade tier.
      await expect(
        bp.list(b.listIds[0]).locator('.minicard.minicard-aging-3'),
      ).toBeVisible({ timeout: 15_000 });
    } finally {
      db.cleanup({ boardIds: [b.boardId] });
    }
  });

  test('#3984 configurable thresholds: a low threshold fades a recent card', async ({ loggedInPage, user, request }) => {
    const b = db.seedBoard({ ownerId: user.id, cardTitlesPerList: [['RecentCard']] });
    try {
      // 3 days idle — below default tiers, but above a custom tier-1 of 1 day.
      db.updateOne('cards', { boardId: b.boardId, title: 'RecentCard' },
        { $set: { dateLastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } });
      const res = await request.put(`/api/boards/${b.boardId}/cardSettings`, {
        headers: authHeaders(user.token, true),
        data: { cardAging: true, cardAgingDays1: 1, cardAgingDays2: 30, cardAgingDays3: 60 },
      });
      expect(res.status()).toBe(200);

      await openBoard(loggedInPage, b.boardId, b.slug);
      const bp = new BoardPage(loggedInPage);
      await expect(
        bp.list(b.listIds[0]).locator('.minicard.minicard-aging-1'),
      ).toBeVisible({ timeout: 15_000 });
    } finally {
      db.cleanup({ boardIds: [b.boardId] });
    }
  });

  test('#4266 deleting a board removes its rules, triggers and actions', async ({ request, user }) => {
    const b = db.seedBoard({ ownerId: user.id });
    let deleted = false;
    try {
      const ruleRes = await request.post(`/api/boards/${b.boardId}/rules`, {
        headers: authHeaders(user.token, true),
        data: {
          title: 'Cleanup rule',
          trigger: { activityType: 'createCard', listName: '*', swimlaneName: '*', cardTitle: '*', userId: '*' },
          action: { actionType: 'archive' },
        },
      });
      expect(ruleRes.status()).toBe(200);
      const { _id, triggerId, actionId } = await ruleRes.json();
      expect(findOne('triggers', triggerId)).not.toBeNull();
      expect(findOne('actions', actionId)).not.toBeNull();

      const delRes = await request.delete(`/api/boards/${b.boardId}`, { headers: authHeaders(user.token) });
      expect(delRes.status()).toBe(200);
      deleted = true;

      // The rule and BOTH its trigger and action are gone (no orphaned actions).
      expect(findOne('rules', _id)).toBeNull();
      expect(findOne('triggers', triggerId)).toBeNull();
      expect(findOne('actions', actionId)).toBeNull();
    } finally {
      if (!deleted) db.cleanup({ boardIds: [b.boardId] });
    }
  });

  test('#5157 board background image appears on the All Boards tile', async ({ loggedInPage, user }) => {
    const b = db.seedBoard({ ownerId: user.id });
    try {
      db.updateOne('boards', { _id: b.boardId },
        { $set: { backgroundImageURL: 'https://example.com/bg.png' } });
      await loggedInPage.goto('/', { waitUntil: 'commit' });
      // The All Boards view defaults to the "Starred" menu; the seeded board is
      // not starred, so switch to "Remaining" where unassigned boards appear.
      await loggedInPage.locator('.js-select-menu[data-type="remaining"]').click();
      const tile = loggedInPage.locator('.board-list-item.has-background-image').first();
      await expect(tile).toBeVisible({ timeout: 20_000 });
      const style = await tile.getAttribute('style');
      expect(style || '').toContain('example.com/bg.png');
    } finally {
      db.cleanup({ boardIds: [b.boardId] });
    }
  });
});
