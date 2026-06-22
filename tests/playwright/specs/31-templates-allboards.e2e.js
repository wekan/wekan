'use strict';

/**
 * Spec 31 — All Boards / Templates redesign (#2339, #5850, commit 6dd360ad).
 *
 * The Templates container board is no longer auto-created at signup; it is
 * created lazily by the `ensureTemplatesBoard` Meteor method right before a
 * template is first saved/copied (server/models/users.js). The All Boards page
 * gained URL-addressable left-menu sub-views (config/router.js):
 *   - /templates (name 'allboards-templates') lists only type:'template-container'
 *     boards,
 *   - /remaining (name 'allboards-remaining') lists only regular boards not
 *     assigned to a workspace.
 *
 * These tests exercise:
 *   1. ensureTemplatesBoard creates the container and is idempotent,
 *   2. /templates shows template-container boards and hides regular boards,
 *   3. /remaining shows regular boards and hides template-container boards,
 *   4. the member-menu "Templates" link navigates to /templates,
 *   5. opening /templates does NOT auto-create an empty Template Container,
 *   6. the "Add Template Container" flow (createBoardWithInitialSwimlanes with
 *      type 'template-container') wires the user's profile pointers so templates
 *      can actually be added, and
 *   7. deleting a Template Container clears those profile pointers.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

function callMethod(page, name, ...args) {
  return page.evaluate(
    ({ name, args }) =>
      new Promise(resolve => {
        Meteor.call(name, ...args, (err, res) =>
          resolve(err ? { error: err.reason || err.error || err.message } : { result: res ?? null }),
        );
      }),
    { name, args },
  );
}

// Read the visible board titles in the All Boards grid. The list renders after
// its subscription settles, so callers wrap this in expect.poll.
async function boardListNames(page) {
  return page.$$eval('li.js-board .board-list-item-name', els =>
    els.map(el => (el.textContent || '').trim()).filter(Boolean),
  );
}

test.describe('#2339 #5850 All Boards / Templates redesign', () => {
  test('ensureTemplatesBoard creates the templates container and is idempotent', async ({ page, user }) => {
    let templatesBoardId;
    try {
      await loginWithToken(page, user.id, user.token);

      // No templates container exists yet for a freshly-seeded user.
      const before = db.findOne('users', { _id: user.id }, { 'profile.templatesBoardId': 1 });
      expect(before.profile && before.profile.templatesBoardId).toBeFalsy();

      const r1 = await callMethod(page, 'ensureTemplatesBoard');
      expect(r1.error).toBeUndefined();
      templatesBoardId = r1.result;
      expect(templatesBoardId).toBeTruthy();

      // The container board now exists and is type 'template-container'.
      const board = db.findOne('boards', { _id: templatesBoardId });
      expect(board).toBeTruthy();
      expect(board.type).toBe('template-container');
      expect(board.members.some(m => m.userId === user.id)).toBe(true);

      // profile.templatesBoardId points at it.
      let u = db.findOne('users', { _id: user.id }, { 'profile.templatesBoardId': 1 });
      expect(u.profile.templatesBoardId).toBe(templatesBoardId);

      // Exactly one template-container board owns by this user.
      const containers = db.find('boards', {
        type: 'template-container',
        'members.userId': user.id,
      });
      expect(containers.length).toBe(1);

      // Idempotent: a second call returns the same id and creates no duplicate.
      const r2 = await callMethod(page, 'ensureTemplatesBoard');
      expect(r2.error).toBeUndefined();
      expect(r2.result).toBe(templatesBoardId);

      u = db.findOne('users', { _id: user.id }, { 'profile.templatesBoardId': 1 });
      expect(u.profile.templatesBoardId).toBe(templatesBoardId);
      expect(
        db.find('boards', { type: 'template-container', 'members.userId': user.id }).length,
      ).toBe(1);
    } finally {
      if (templatesBoardId) {
        db.deleteMany('boards', { _id: templatesBoardId });
        db.deleteMany('swimlanes', { boardId: templatesBoardId });
        db.deleteMany('lists', { boardId: templatesBoardId });
        db.deleteMany('cards', { boardId: templatesBoardId });
      }
      // Catch any container created under this owner even if the method's
      // return value was lost.
      db.deleteMany('boards', { type: 'template-container', 'members.userId': user.id });
    }
  });

  test('/templates shows template-container boards and hides regular boards', async ({ page, user }) => {
    const regularTitle = db.uid('Regular');
    const templateTitle = db.uid('Template');
    const regular = db.seedBoard({ ownerId: user.id, title: regularTitle, listCount: 1 });
    const template = db.seedBoard({ ownerId: user.id, title: templateTitle, listCount: 1 });
    db.updateOne('boards', { _id: template.boardId }, { $set: { type: 'template-container' } });
    try {
      await loginWithToken(page, user.id, user.token);
      await page.goto(`${BASE_URL}/templates`, { waitUntil: 'commit' });

      await expect
        .poll(() => boardListNames(page), { timeout: 15000 })
        .toContain(templateTitle);
      const names = await boardListNames(page);
      expect(names).not.toContain(regularTitle);
    } finally {
      db.cleanup({ boardIds: [regular.boardId, template.boardId] });
    }
  });

  test('/remaining shows regular boards and hides template-container boards', async ({ page, user }) => {
    const regularTitle = db.uid('Regular');
    const templateTitle = db.uid('Template');
    const regular = db.seedBoard({ ownerId: user.id, title: regularTitle, listCount: 1 });
    const template = db.seedBoard({ ownerId: user.id, title: templateTitle, listCount: 1 });
    db.updateOne('boards', { _id: template.boardId }, { $set: { type: 'template-container' } });
    try {
      await loginWithToken(page, user.id, user.token);
      await page.goto(`${BASE_URL}/remaining`, { waitUntil: 'commit' });

      await expect
        .poll(() => boardListNames(page), { timeout: 15000 })
        .toContain(regularTitle);
      const names = await boardListNames(page);
      expect(names).not.toContain(templateTitle);
    } finally {
      db.cleanup({ boardIds: [regular.boardId, template.boardId] });
    }
  });

  test('member-menu Templates link navigates to /templates', async ({ page, user }) => {
    await loginWithToken(page, user.id, user.token);

    // Open the member (user) menu in the header.
    await page.locator('.js-open-header-member-menu').first().click();

    // Click the Templates entry (an anchor whose href is the /templates route).
    await page.locator('.pop-over a[href$="/templates"]').first().click();

    await expect.poll(() => new URL(page.url()).pathname, { timeout: 15000 }).toBe('/templates');
  });

  test('opening /templates does NOT auto-create an empty Template Container', async ({ page, user }) => {
    try {
      // Freshly-seeded user has no templates container.
      const before = db.findOne('users', { _id: user.id }, { 'profile.templatesBoardId': 1 });
      expect(before.profile && before.profile.templatesBoardId).toBeFalsy();

      await loginWithToken(page, user.id, user.token);
      await page.goto(`${BASE_URL}/templates`, { waitUntil: 'commit' });

      // Wait until the All Boards grid has settled (the "Add board" entry is the
      // template-container add button in this sub-view) so any (removed) autorun
      // would have had the chance to fire.
      await expect(page.locator('li.js-add-board')).toBeVisible({ timeout: 15000 });

      // No container board was created for the user just by visiting the view,
      // and the profile pointer stays unset. Poll briefly to defeat any async
      // creation racing behind the render.
      await expect
        .poll(
          () =>
            db.find('boards', { type: 'template-container', 'members.userId': user.id }).length,
          { timeout: 5000 },
        )
        .toBe(0);
      const after = db.findOne('users', { _id: user.id }, { 'profile.templatesBoardId': 1 });
      expect(after.profile && after.profile.templatesBoardId).toBeFalsy();
    } finally {
      db.deleteMany('boards', { type: 'template-container', 'members.userId': user.id });
    }
  });

  test('Add Template Container wires the user\'s templates profile pointers', async ({ page, user }) => {
    let boardId;
    try {
      await loginWithToken(page, user.id, user.token);

      // Mirror the client "Add Template Container" flow (boardHeader.js
      // createBoardSubmit): create a type:'template-container' board with the
      // three role-tagged template swimlanes.
      const r = await callMethod(page, 'createBoardWithInitialSwimlanes', {
        title: 'My Templates',
        slug: 'my-templates',
        permission: 'private',
        type: 'template-container',
        migrationVersion: 1,
        swimlanes: [
          { title: 'Card Templates', sort: 1, type: 'template-container', role: 'card' },
          { title: 'List Templates', sort: 2, type: 'template-container', role: 'list' },
          { title: 'Board Templates', sort: 3, type: 'template-container', role: 'board' },
        ],
      });
      expect(r.error).toBeUndefined();
      boardId = r.result;
      expect(boardId).toBeTruthy();

      const board = db.findOne('boards', { _id: boardId });
      expect(board.type).toBe('template-container');

      // The created swimlanes, keyed by title.
      const swimlanes = db.find('swimlanes', { boardId });
      const byTitle = Object.fromEntries(swimlanes.map(s => [s.title, s._id]));

      // The user's profile now points at this container and each role swimlane,
      // which is what swimlane.isCardTemplatesSwimlane()/... checks so that
      // Card/List/Swimlane/Board templates can be added to it.
      const u = db.findOne('users', { _id: user.id }, {
        'profile.templatesBoardId': 1,
        'profile.cardTemplatesSwimlaneId': 1,
        'profile.listTemplatesSwimlaneId': 1,
        'profile.boardTemplatesSwimlaneId': 1,
      });
      expect(u.profile.templatesBoardId).toBe(boardId);
      expect(u.profile.cardTemplatesSwimlaneId).toBe(byTitle['Card Templates']);
      expect(u.profile.listTemplatesSwimlaneId).toBe(byTitle['List Templates']);
      expect(u.profile.boardTemplatesSwimlaneId).toBe(byTitle['Board Templates']);
    } finally {
      if (boardId) {
        db.deleteMany('swimlanes', { boardId });
        db.deleteOne('boards', { _id: boardId });
      }
      db.deleteMany('boards', { type: 'template-container', 'members.userId': user.id });
    }
  });

  test('deleting a Template Container clears the templates profile pointers', async ({ page, user }) => {
    let boardId;
    try {
      await loginWithToken(page, user.id, user.token);

      const r = await callMethod(page, 'createBoardWithInitialSwimlanes', {
        title: 'My Templates',
        slug: 'my-templates',
        permission: 'private',
        type: 'template-container',
        migrationVersion: 1,
        swimlanes: [
          { title: 'Card Templates', sort: 1, type: 'template-container', role: 'card' },
          { title: 'List Templates', sort: 2, type: 'template-container', role: 'list' },
          { title: 'Board Templates', sort: 3, type: 'template-container', role: 'board' },
        ],
      });
      boardId = r.result;
      expect(boardId).toBeTruthy();
      expect(
        db.findOne('users', { _id: user.id }, { 'profile.templatesBoardId': 1 }).profile.templatesBoardId,
      ).toBe(boardId);

      // Delete the container the same way the board sidebar does. The client
      // calls Boards.remove(id), which over DDP is the '/boards/remove' method;
      // call it directly since collections are not exposed as window globals in
      // this build. It still triggers the server before.remove hook (boardRemover).
      const del = await page.evaluate(
        id =>
          new Promise(resolve => {
            Meteor.call('/boards/remove', { _id: id }, err =>
              resolve(err ? { error: err.reason || err.error || err.message } : { result: 'ok' }),
            );
          }),
        boardId,
      );
      expect(del.error).toBeUndefined();

      // The board is gone and all four template profile pointers were unset.
      await expect.poll(() => db.findOne('boards', { _id: boardId }), { timeout: 5000 }).toBeNull();
      const u = db.findOne('users', { _id: user.id }, {
        'profile.templatesBoardId': 1,
        'profile.cardTemplatesSwimlaneId': 1,
        'profile.listTemplatesSwimlaneId': 1,
        'profile.boardTemplatesSwimlaneId': 1,
      });
      expect(u.profile.templatesBoardId).toBeFalsy();
      expect(u.profile.cardTemplatesSwimlaneId).toBeFalsy();
      expect(u.profile.listTemplatesSwimlaneId).toBeFalsy();
      expect(u.profile.boardTemplatesSwimlaneId).toBeFalsy();
    } finally {
      if (boardId) {
        db.deleteMany('swimlanes', { boardId });
        db.deleteOne('boards', { _id: boardId });
      }
      db.deleteMany('boards', { type: 'template-container', 'members.userId': user.id });
    }
  });
});
