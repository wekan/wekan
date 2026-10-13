'use strict';
const { test, expect } = require('../fixtures');
const { loginWithToken, navigateInApp } = require('../helpers/auth');
const strings = require('../../../imports/i18n/data/st.i18n.json');

test('Southern Sotho email settings distinguish invitation and activity templates', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'st'));
  await navigateInApp(page, '/admin/people/email');
  for (const key of ['email-templates-title', 'email-templates-invite-subject', 'email-templates-invite-body', 'email-templates-activity-subject', 'email-templates-activity-body']) {
    await expect(page.getByText(strings[key], { exact: true })).toBeVisible();
  }
  await expect(page.getByText('Mema Imeile Sehlooho', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Ketsahalo Imeile Mongolo', { exact: true })).toHaveCount(0);
});
