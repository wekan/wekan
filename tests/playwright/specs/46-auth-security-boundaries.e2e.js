'use strict';

const { test, expect } = require('../fixtures');
const { loginWithToken, waitForMeteor } = require('../helpers/auth');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

test.describe('Authentication security boundaries', () => {
  test.use({ storageState: undefined });

  test('logged-out metadata probes and recovery floods are denied and visible',
    async ({ page, adminUser }) => {
      await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle' });
      await waitForMeteor(page);

      const probe = await page.evaluate(targetId => new Promise(resolve => {
        const subscription = window.Meteor.subscribe(
          'user-authenticationMethod',
          targetId,
          {
            onReady() {
              let exposed = null;
              try {
                const store = window.Meteor.connection._stores.users;
                exposed = store._getCollection().findOne(targetId) || null;
              } catch (error) {
                exposed = { diagnostic: error.message };
              }
              subscription.stop();
              resolve({ ready: true, exposed });
            },
            onStop(error) {
              if (error) resolve({ ready: false, error: error.message });
            },
          },
        );
      }), adminUser.id);
      expect(probe).toEqual({ ready: true, exposed: null });

      const paginationProbe = await page.evaluate(sessionId =>
        new Promise(resolve => {
          const subscription = window.Meteor.subscribe('nextPage', sessionId, {
            onReady() {
              let exposed = [];
              try {
                const store = window.Meteor.connection._stores.cards;
                exposed = store._getCollection().find().fetch();
              } catch (error) {
                exposed = [{ diagnostic: error.message }];
              }
              subscription.stop();
              resolve({ ready: true, exposed });
            },
            onStop(error) {
              if (error) resolve({ ready: false, error: error.message });
            },
          });
        }), `${adminUser.id}-00000000000000000000000000000000`);
      expect(paginationProbe).toEqual({ ready: true, exposed: [] });

      const recovery = await page.evaluate(async email => {
        const results = [];
        for (let attempt = 0; attempt < 6; attempt += 1) {
          try {
            await window.Meteor.callAsync('forgotPassword', { email });
            results.push({ ok: true });
          } catch (error) {
            results.push({
              ok: false,
              code: error.error,
              message: error.reason || error.message,
            });
          }
        }
        return results;
      }, `missing-${Date.now()}@example.invalid`);
      expect(recovery).toHaveLength(6);
      expect(recovery[5].ok).toBe(false);
      expect(String(recovery[5].message)).toMatch(/too many requests|slow down/i);

      await loginWithToken(page, adminUser.id, adminUser.token);
      await page.goto(`${BASE_URL}/admin/problems/security-report`, {
        waitUntil: 'networkidle',
      });
      await expect(page.locator('body')).toContainText('MembershipBleed', {
        timeout: 15_000,
      });
      await expect(page.locator('body')).toContainText('ResetBleed', {
        timeout: 15_000,
      });
      await expect(page.locator('body')).toContainText('SessionBleed', {
        timeout: 15_000,
      });
    });
});
