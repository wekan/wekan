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


test('Southern Sotho OAuth help preserves precedence and secret handling', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'st'));
  await navigateInApp(page, '/admin/people/oauth');
  const hint = page.getByText(strings['oauth-providers-hint'], { exact: true });
  await expect(hint).toBeVisible();
  await expect(hint).toContainText('OAUTH_*_ENABLED');
  await expect(hint).toContainText('bo behilweng mona bo nka sebaka');
  await expect(hint).toContainText('Sephiri se bolokwa ho seva');
  await expect(hint).not.toContainText('seforong');
});

test('Southern Sotho bounce setup identifies the sending address', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'st'));
  await navigateInApp(page, '/admin/people/email');
  const section = page.locator('.email-bounces');
  await expect(section).toContainText(strings['email-bounces-ses-description']);
  await expect(section).toContainText('aterese eo WeKan e romelang ho tloha ho eona');
  await expect(section).not.toContainText('aterese eo WeKan e romelang ho eona');
});


test('Haitian email settings identify the SMTP server and template purposes', async ({ page, adminUser }) => {
  const ht = require('../../../imports/i18n/data/ht.i18n.json');
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'ht'));
  await navigateInApp(page, '/admin/people/email');
  // The SMTP fields are drawn only while "Enable below email settings" is
  // ticked (Nodemailer services, 2026-09-01), which follows the stored
  // mailServer.enabled - left on or off by whichever spec ran before. Tick it
  // here when it is off; ticking alone saves nothing (Save below writes it).
  const enabled = page.locator('#admin-mail-settings-enabled');
  await expect(enabled).toBeVisible();
  if (!(await enabled.evaluate(el => el.classList.contains('is-checked')))) {
    await page.locator('.js-toggle-admin-mail-settings').click();
  }
  // The host is the custom SMTP service's field, not a named service's.
  await page.locator('#mail-service').selectOption('SMTP');
  await expect(page.locator('#mail-server-host')).toBeVisible();
  for (const key of ['smtp-host', 'email-templates-title', 'email-templates-invite-subject', 'email-templates-invite-body', 'email-templates-activity-subject', 'email-templates-activity-body']) {
    await expect(page.getByText(ht[key], { exact: true })).toBeVisible();
  }
  await expect(page.getByText('Lame SMTP', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Envite Imèl Sijè', { exact: true })).toHaveCount(0);
});

test('Haitian bounce help explains configured action thresholds', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'ht'));
  await navigateInApp(page, '/admin/people/email');
  const section = page.locator('.email-bounces');
  await expect(section).toContainText('Chak kalite gen pwòp aksyon pa li');
  await expect(section).toContainText('kantite retou yo rive nan papòt ki fikse a');
  await expect(section).not.toContainText('konbyen fwa sa a');
});
