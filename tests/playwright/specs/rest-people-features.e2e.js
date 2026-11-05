'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');
const AdminPage = require('../pages/AdminPage');

for (const [kind, label] of [['org', 'Organization'], ['team', 'Team']]) {
  test.describe(`REST ${label.toLowerCase()} features`, () => {
    let id;
    const fields = ['SharedTemplates', 'PropagateMembersToBoards', 'SyncMembersFromAuth']
      .map(suffix => kind + suffix);
    const endpoint = target => `/api/admin/${kind}s/${encodeURIComponent(target)}/features`;
    const headers = token => ({ Authorization: `Bearer ${token}` });

    test.beforeEach(() => {
      id = db.uid(kind);
      db.insertOne(kind, {
        _id: id, [`${kind}DisplayName`]: id, [`${kind}ShortName`]: id,
        [`${kind}IsActive`]: true, ...Object.fromEntries(fields.map(field => [field, false])),
      });
    });
    test.afterEach(() => db.deleteOne(kind, { _id: id }));

    test('missing records return JSON 404 without changing other records', async ({ request, adminUser }) => {
      const missing = db.uid('missing');
      const before = db.findOne(kind, { _id: id });
      for (const data of [{ [fields[0]]: true }, {}, { unrelated: true }]) {
        const response = await request.put(endpoint(missing), { headers: headers(adminUser.token), data });
        expect(response.status()).toBe(404);
        expect(await response.json()).toEqual({ error: `${label} not found` });
        expect(db.findOne(kind, { _id: id })).toEqual(before);
        expect(db.findOne(kind, { _id: missing })).toBeNull();
      }
    });

    test('existing records still set and clear each feature and accept empty bodies', async ({ request, adminUser }) => {
      for (const field of fields) {
        for (const value of [true, false]) {
          const response = await request.put(endpoint(id), {
            headers: headers(adminUser.token), data: { [field]: value, unrelated: true },
          });
          expect(response.status()).toBe(200);
          expect(await response.json()).toMatchObject({ _id: id, [field]: value });
          const saved = db.findOne(kind, { _id: id });
          expect(saved[field]).toBe(value);
          expect(saved.unrelated).toBeUndefined();
        }
      }
      for (const data of [{}, { unrelated: true }]) {
        const response = await request.put(endpoint(id), { headers: headers(adminUser.token), data });
        expect(response.status()).toBe(200);
        expect(await response.json()).toMatchObject({ _id: id });
      }
    });

    test('non-admin and unauthenticated callers cannot probe or update records', async ({ request, user }) => {
      const before = db.findOne(kind, { _id: id });
      for (const target of [id, db.uid('missing')]) {
        for (const token of [user.token, null]) {
          const response = await request.put(endpoint(target), {
            headers: token ? headers(token) : {}, data: { [fields[0]]: true },
          });
          expect(response.status()).toBe(token ? 403 : 401);
          expect(db.findOne(kind, { _id: id })).toEqual(before);
        }
      }
    });

    test('feature updates appear in the People table while a missing update leaves it unchanged', async ({ page, request, adminUser }) => {
      await loginWithToken(page, adminUser.id, adminUser.token);
      await new AdminPage(page).navigateToPeople();
      await page.locator(`.js-left-menu-item[data-id="${kind}-setting"]`).click();
      const row = page.locator('table tbody tr').filter({ hasText: id });
      const checkbox = row.locator(`input[data-feature="${fields[0]}"]`);
      await expect(checkbox).not.toBeChecked();

      const missing = await request.put(endpoint(db.uid('missing')), {
        headers: headers(adminUser.token), data: { [fields[0]]: true },
      });
      expect(missing.status()).toBe(404);
      expect(await missing.json()).toEqual({ error: `${label} not found` });
      await expect(checkbox).not.toBeChecked();

      for (const value of [true, false]) {
        const response = await request.put(endpoint(id), {
          headers: headers(adminUser.token), data: { [fields[0]]: value },
        });
        expect(response.status()).toBe(200);
        await expect(checkbox).toBeChecked({ checked: value });
        expect(db.findOne(kind, { _id: id })[fields[0]]).toBe(value);
      }
    });
  });
}
