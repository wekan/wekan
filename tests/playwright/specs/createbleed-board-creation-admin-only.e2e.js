'use strict';

/**
 * CreateBleed (GHSA-qcfm-2g4w-wqcc), #4475: "Only admins can create boards".
 *
 * The setting was checked only in createBoardWithInitialSwimlanes. This is the
 * report, as the reporter wrote it, against a running WeKan: with the setting
 * on, a non-admin's console Boards.insert, POST /api/boards, POST
 * /api/boards/import, importBoard, copyBoard and createBoardFromCard create no
 * board, each refusal is in Admin Panel -> Problems, the Duplicate button is
 * not offered, and an admin and a board template still work.
 *
 * The setting is one document for every worker, and while it is on another
 * spec cannot create a board as a non-admin through the UI: it is on only for
 * the checks themselves, and back to what it was in `finally`.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, waitForMeteor } = require('../helpers/auth');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';
const SETTING = 'tableVisibilityMode-boardCreationAdminOnly';
const auth = token => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });

function setAdminOnly(on) {
  const prior = db.findOne('tableVisibilityModeSettings', { _id: SETTING });
  if (prior) db.updateOne('tableVisibilityModeSettings', { _id: SETTING }, { $set: { booleanValue: on } });
  else db.insertOne('tableVisibilityModeSettings', { _id: SETTING, booleanValue: on, sort: 0 });
  return () => {
    if (prior) db.updateOne('tableVisibilityModeSettings', { _id: SETTING }, { $set: { booleanValue: prior.booleanValue } });
    else db.deleteOne('tableVisibilityModeSettings', { _id: SETTING });
  };
}

const boardsOf = userId => db.find('boards', { 'members.userId': userId, type: 'board' }).map(b => b._id);
// One row per kind of refusal (models/lib/eventLogSummary.js); `count` grows.
const createBleedCount = () => db.find('eventlog', { stream: 'security', bleed: 'CreateBleed' })
  .reduce((n, row) => n + (row.count || 1), 0);

test.describe('CreateBleed: only admins create boards, on every path', () => {
  test.describe.configure({ mode: 'serial' });

  test('a non-admin creates no board by insert, REST, import, copy or a card; each refusal is recorded', async ({ page, request, user, board }) => {
    await page.goto(`${BASE_URL}/sign-in`);
    await waitForMeteor(page);
    await loginWithToken(page, user.id, user.token);
    const before = boardsOf(user.id);
    const cardId = db.find('cards', { boardId: board.boardId })[0]._id;
    const loggedBefore = createBleedCount();
    const restore = setAdminOnly(true);
    try {
      // The server learns the setting from its observer: wait until the Add
      // Board form is refused, the one path that was already guarded.
      await expect.poll(() => page.evaluate(async () => {
        try { await Meteor.callAsync('createBoardWithInitialSwimlanes', { title: 'probe', slug: 'probe' }); return 'created'; }
        catch (error) { return error.error; }
      }), { timeout: 20_000 }).toBe('not-authorized');

      const errors = await page.evaluate(async ({ boardId, cardId }) => {
        const Boards = Meteor.connection._stores.boards._getCollection();
        const tryIt = async fn => { try { await fn(); return 'created'; } catch (error) { return error.error || String(error); } };
        return {
          // The report's console line.
          insert: await tryIt(() => new Promise((resolve, reject) => {
            Meteor.connection.apply('/boards/insert', [{ _id: Random.id(), title: 'x', permission: 'private' }],
              { returnStubValue: false }, (error, result) => (error ? reject(error) : resolve(result)));
          })),
          importBoard: await tryIt(() => Meteor.callAsync('importBoard', { title: 'i' }, {}, 'wekan', null)),
          copyBoard: await tryIt(() => Meteor.callAsync('copyBoard', boardId, { title: 'c', type: 'board' })),
          createBoardFromCard: await tryIt(() => Meteor.callAsync('createBoardFromCard', cardId, 'from card')),
        };
      }, { boardId: board.boardId, cardId });
      expect(errors.insert).not.toBe('created');
      expect(errors.importBoard).toBe('not-authorized');
      expect(errors.copyBoard).toBe('not-authorized');
      expect(errors.createBoardFromCard).toBe('not-authorized');

      // POST /api/boards and the import route answer 403, not 500.
      const created = await request.post(`${BASE_URL}/api/boards`, { headers: auth(user.token), data: { title: 'rest' } });
      expect(created.status()).toBe(403);
      const imported = await request.post(`${BASE_URL}/api/boards/import`, { headers: auth(user.token), data: { board: { title: 'rest import' } } });
      expect(imported.status(), 'refused before the export is even parsed').toBe(403);

      expect(boardsOf(user.id).sort(), 'no new working board').toEqual(before.sort());
      // Each refusal is one row in Admin Panel -> Problems, CreateBleed.
      // insert, importBoard, copyBoard, createBoardFromCard, the two REST
      // calls - and the probe above, at least once.
      await expect.poll(() => createBleedCount() - loggedBefore, { timeout: 10_000 }).toBeGreaterThanOrEqual(7);
      expect(db.find('eventlog', { stream: 'security', bleed: 'CreateBleed', source: 'ddp:boards.insert' })[0]?.userId)
        .toBe(user.id);

      // The UI does not offer Duplicate to this member.
      await page.goto(`${BASE_URL}/`);
      await waitForMeteor(page);
      await expect(page.locator('.js-duplicate-selected-boards')).toHaveCount(0);
    } finally {
      restore();
      const extra = boardsOf(user.id).filter(id => !before.includes(id));
      if (extra.length) db.cleanup({ boardIds: extra });
    }
  });

  test('negative: an admin, a board template and an instance without the setting still create boards', async ({ page, request, user, adminUser }) => {
    const created = [];
    const restore = setAdminOnly(true);
    try {
      // An admin, over REST, while it is on.
      const res = await request.post(`${BASE_URL}/api/boards`, { headers: auth(adminUser.token), data: { title: 'admin board' } });
      expect(res.status()).toBe(200);
      created.push((await res.json())._id);

      // A member's own board template, the one client insert WeKan makes.
      await page.goto(`${BASE_URL}/sign-in`);
      await waitForMeteor(page);
      await loginWithToken(page, user.id, user.token);
      const templateId = await page.evaluate(() => new Promise((resolve, reject) => {
        const _id = Random.id();
        Meteor.connection.apply('/boards/insert', [{ _id, title: 'my template', slug: 'my-template', permission: 'private', type: 'template-board' }],
          { returnStubValue: false }, error => (error ? reject(error) : resolve(_id)));
      }));
      created.push(templateId);
      expect(db.findOne('boards', { _id: templateId })?.type).toBe('template-board');
    } finally {
      restore();
    }
    try {
      // The setting off: a member creates a board again, once the server's
      // settings observer has seen it (up to ten seconds on a polled MongoDB).
      await expect.poll(async () => {
        const res = await request.post(`${BASE_URL}/api/boards`, { headers: auth(user.token), data: { title: 'member board' } });
        if (res.status() === 200) created.push((await res.json())._id);
        return res.status();
      }, { timeout: 20_000 }).toBe(200);
    } finally {
      db.cleanup({ boardIds: created.filter(Boolean) });
    }
  });
});
