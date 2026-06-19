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
 *   4. the member-menu "Templates" link navigates to /templates.
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
});
