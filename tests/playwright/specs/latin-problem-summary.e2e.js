'use strict';
const { test, expect } = require('../fixtures');
const { loginWithToken, navigateInApp } = require('../helpers/auth');
const db = require('../helpers/db');

test('Latin problem summary explains reviewing before acknowledging', async ({ page, adminUser }) => {
  const id = `latin-report-${adminUser.id}`;
  const ack = db.findOne('eventlogAcks', { stream: 'tests' });
  const at = new Date(Math.max(Date.now(), new Date(ack?.at || 0).getTime()) + 1);
  db.insertOne('eventlog', { _id: id, stream: 'tests', at, severity: 'medium', category: 'translation-test' });
  try {
    await loginWithToken(page, adminUser.id, adminUser.token);
    await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
    await navigateInApp(page, '/admin/problems/summary');
    const help = page.getByText('Signa partes problematum quas recensuisti, deinde preme Agnosce ut numerus novorum problematum earum ad zerum redeat.', { exact: true });
    await expect(help).toBeVisible();
    await expect(help).not.toContainText('Latine:');
  } finally {
    db.deleteOne('eventlog', { _id: id });
  }
});
