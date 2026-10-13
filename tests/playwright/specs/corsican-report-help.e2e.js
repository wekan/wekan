'use strict';
const { test, expect } = require('../fixtures');
const { loginWithToken, navigateInApp } = require('../helpers/auth');
const strings = require('../../../imports/i18n/data/co.i18n.json');

test('Corsican recovery report explains automatic data protection and repair', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'co'));
  await navigateInApp(page, '/admin/problems/recovery');
  const description = page.getByText(strings['recovery-report-desc'], { exact: true });
  await expect(description).toBeVisible();
  await expect(description).toContainText('copie di salvezza di i dati testuali');
  await expect(description).toContainText('nova migrazione da MongoDB');
  await expect(description).toContainText('riparazione autumatica');
  await expect(description).not.toContainText('ripristino dei dati');
});
