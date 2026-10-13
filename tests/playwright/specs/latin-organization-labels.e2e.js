'use strict';
const { test, expect } = require('../fixtures');

test('Latin organization admin popup explains the limits of delegated administration', async ({ boardPage: page }) => {
  await page.evaluate(async () => {
    await Meteor.callAsync('setLanguage', 'la');
    Popup.close();
    Popup.open('orgAdmins')({ currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} });
  });
  const pop = page.locator('.js-pop-over');
  await expect(pop).toContainText('eius homines et exemplaria subsidiaria, nihil aliud.');
  await expect(pop).toContainText('Numquam possunt ius administratoris totius situs concedere, neque administratorem situs administrare.');
  await expect(pop).not.toContainText('Latine:');
  await expect(pop.locator('.js-toggle-org-admin')).toHaveCount(0);
});


test('Latin role settings explain global-admin rights and unsaved preview', async ({ page, adminUser }) => {
  const { loginWithToken, navigateInApp } = require('../helpers/auth');
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  await navigateInApp(page, '/admin/people/roles');
  const pane = page.locator('.roles-settings');
  await expect(pane.locator('.roles-description')).toContainText('semper omnia iura habent neque hic restringi possunt.');
  await expect(pane).toContainText('Tantum legitur: sequitur optiones supra electas');
  await expect(pane).toContainText('antequam serves.');
  await expect(pane.locator('.js-roles-save')).toBeVisible();
});


test('Latin shared-template settings explain scopes and nonempty template boards', async ({ page, adminUser }) => {
  const { loginWithToken, navigateInApp } = require('../helpers/auth');
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  await navigateInApp(page, '/admin/people/templates');
  const pane = page.locator('.templates-settings');
  await expect(pane.locator('.templates-description')).toContainText('Elige unum vel plures ambitus infra');
  await expect(pane.locator('.templates-description')).toContainText('Soli usores quorum tabula Exemplarium non est vacua enumerantur.');
  await expect(pane.locator('.templates-description')).not.toContainText('Latine:');
  await expect(pane.locator('.js-toggle-template-scope')).toHaveCount(3);
});
