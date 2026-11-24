'use strict';
// WP-8 (models/lib/legalAcceptance.js): once a site administrator requires
// acceptance of the terms, a signed-in account sees only the acceptance dialog,
// the server refuses its other methods, and after accepting the app comes back
// with the accepted version recorded on the account. A new version of the
// terms asks again.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

const save = (page, form) => page.evaluate(f => Meteor.callAsync('saveLegalPage', 'terms', f)
  .catch(e => `error: ${e.error} ${e.reason || e.message}`), form);
// Accepting reloads the page; wait until the new one is connected and signed in.
const ready = page => expect.poll(() => page.evaluate(() => typeof Meteor !== 'undefined'
  && Meteor.status().connected && !!Meteor.userId()).catch(() => false), { timeout: 30_000 }).toBe(true);
const callError = (page, name) => page.evaluate(n => Meteor.callAsync(n).then(() => null, e => e.error), name);

test('the terms must be accepted, and each new version again', async ({ page, user }) => {
  db.updateOne('users', { _id: user.id }, { $set: { isAdmin: true }, $unset: { legalAcceptances: 1 } });
  db.deleteMany('legalPages', { _id: 'terms' });
  await loginWithToken(page, user.id, user.token);
  try {
    expect(await save(page, { enabled: true, title: 'Terms', body: 'Version one.', requireAcceptance: true })).toBe(1);

    await page.reload();
    const dialog = page.locator('.legal-acceptance-required');
    await expect(dialog).toBeVisible({ timeout: 20_000 });
    // Negative: until it is accepted, nothing else answers.
    expect(await callError(page, 'getLegalPagesForAdmin')).toBe('legal-acceptance-required');

    const submit = dialog.locator('.js-legal-accept-submit');
    await expect(submit).toBeDisabled();
    await dialog.locator('.js-legal-accept[data-page="terms"]').check();
    await submit.click();
    await expect(dialog).toHaveCount(0, { timeout: 20_000 });
    await expect.poll(() => db.findOne('users', { _id: user.id }).legalAcceptances?.terms?.version).toBe(1);
    await page.waitForLoadState('load');
    await ready(page);
    expect(await callError(page, 'getLegalPagesForAdmin')).toBe(null);

    // A new version of the text is asked for again.
    expect(await save(page, { enabled: true, title: 'Terms', body: 'Version two.', requireAcceptance: true })).toBe(2);
    expect(await callError(page, 'getLegalPagesForAdmin')).toBe('legal-acceptance-required');
    await page.reload();
    await expect(page.locator('.legal-acceptance-required')).toBeVisible({ timeout: 20_000 });
    // Negative: an old version is not accepted for the new one.
    expect(await page.evaluate(() => Meteor.callAsync('acceptLegalPages', [{ page: 'terms', version: 1 }])
      .then(() => null, e => e.error))).toBe('legal-page-changed');

    // Clean up through the server, so its cached requirement ends at once and
    // no later spec meets the dialog: accept, then stop requiring it.
    await page.evaluate(() => Meteor.callAsync('acceptLegalPages', [{ page: 'terms', version: 2 }]));
    await save(page, { enabled: false, title: 'Terms', body: 'Version two.', requireAcceptance: false });
  } finally {
    db.deleteMany('legalPages', { _id: 'terms' });
    db.updateOne('users', { _id: user.id }, { $set: { isAdmin: false }, $unset: { legalAcceptances: 1 } });
  }
});
