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
  for (const selector of ['.js-list-sync-stuck-refresh', '.js-interrupted-import-refresh']) {
    await expect(page.locator(selector)).toHaveText('Attualizà');
    await expect(page.locator(selector)).not.toHaveText('Aggiorna');
  }
});

test('Corsican problem summary explains reviewing and acknowledging new problems', async ({ page, adminUser }) => {
  const db = require('../helpers/db');
  const id = `corsican-report-${adminUser.id}`;
  const ack = db.findOne('eventlogAcks', { stream: 'tests' });
  const at = new Date(Math.max(Date.now(), new Date(ack?.at || 0).getTime()) + 1);
  db.insertOne('eventlog', { _id: id, stream: 'tests', at, severity: 'medium', category: 'translation-test' });
  try {
    await loginWithToken(page, adminUser.id, adminUser.token);
    await page.evaluate(() => Meteor.callAsync('setLanguage', 'co'));
    await navigateInApp(page, '/admin/problems/summary');
    const help = page.getByText(strings['problems-summary-help'], { exact: true });
    await expect(help).toBeVisible();
    await expect(help).toContainText('zone di prublemi chì avete esaminatu');
    await expect(help).toContainText('Cunfirmà');
    await expect(help).toContainText('rimette à zeru');
    await expect(help).not.toContainText('che hai esaminato');
  } finally {
    db.deleteOne('eventlog', { _id: id });
  }
});
